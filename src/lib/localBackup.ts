import { CREDENTIAL_KEYS } from "./forgetDevice";
import { SENSITIVE_KEYS, SESSION_MARKER_KEY, VAULT_KEY } from "./credentialVault";
import { createScanStore, type ScanStore } from "./scanner/store";
import type { ScanMeta, ScanRecord } from "./scanner/types";
import { KEYS } from "./storage";

const FORMAT = "amazecc-local-backup";
const VERSION = 1;
const EXCLUDED_KEYS = new Set([
  ...CREDENTIAL_KEYS,
  ...SENSITIVE_KEYS,
  KEYS.VTOP_SESSION,
  VAULT_KEY,
  SESSION_MARKER_KEY,
]);
const EXCLUDED_PREFIXES = ["amaze_oidc_", "social_grants_v1_"];
const SECRET_KEY_PATTERN = /password|credential|secret|access.?token|refresh.?token|private.?key|dpop/i;

type StoredScan = {
  meta: ScanMeta;
  pdf: { type: string; base64: string };
  thumbnail?: { type: string; base64: string };
  ocrText?: string;
};

export interface LocalBackupData {
  format: typeof FORMAT;
  version: typeof VERSION;
  createdAt: string;
  localStorage: Record<string, string>;
  scans: StoredScan[];
  excludedCredentialCount: number;
}

export interface ParsedLocalBackup {
  data: LocalBackupData;
  legacy: boolean;
}

export type RestoreMode = "merge" | "replace";
type StorageLike = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function backupableKey(key: string): boolean {
  return (
    !EXCLUDED_KEYS.has(key) &&
    !EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
    !SECRET_KEY_PATTERN.test(key)
  );
}

function storageSnapshot(storage: StorageLike): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !backupableKey(key)) continue;
    const value = storage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return entries;
}

function omittedSecretCount(storage: StorageLike): number {
  let count = 0;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && !backupableKey(key)) count += 1;
  }
  return count;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function isScanMeta(value: unknown): value is ScanMeta {
  if (!isObject(value) || !isObject(value.quality) || !isObject(value.upload)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.createdAt === "number" &&
    typeof value.title === "string" &&
    typeof value.subjectCode === "string" &&
    typeof value.kind === "string" &&
    typeof value.kindConfidence === "number" &&
    typeof value.pageCount === "number" &&
    typeof value.sizeBytes === "number" &&
    typeof value.quality.score === "number" &&
    typeof value.quality.label === "string" &&
    typeof value.upload.status === "string"
  );
}

async function encodeBlob(blob: Blob): Promise<StoredScan["pdf"]> {
  return { type: blob.type, base64: bytesToBase64(new Uint8Array(await blob.arrayBuffer())) };
}

async function encodeScan(record: ScanRecord): Promise<StoredScan> {
  return {
    meta: record.meta,
    pdf: await encodeBlob(record.pdf),
    ...(record.thumbnail ? { thumbnail: await encodeBlob(record.thumbnail) } : {}),
    ...(record.ocrText !== undefined ? { ocrText: record.ocrText } : {}),
  };
}

function parseStoredBlob(value: unknown, label: string): StoredScan["pdf"] {
  if (!isObject(value) || typeof value.type !== "string" || typeof value.base64 !== "string") {
    throw new Error(`Backup contains an invalid ${label}.`);
  }
  try {
    base64ToBytes(value.base64);
    return { type: value.type, base64: value.base64 };
  } catch {
    throw new Error(`Backup contains unreadable ${label} data.`);
  }
}

function parseStoredScan(value: unknown): StoredScan {
  if (!isObject(value) || !isScanMeta(value.meta)) {
    throw new Error("Backup contains an invalid scanner record.");
  }
  return {
    meta: value.meta,
    pdf: parseStoredBlob(value.pdf, "scanner PDF"),
    ...(value.thumbnail !== undefined ? { thumbnail: parseStoredBlob(value.thumbnail, "scanner thumbnail") } : {}),
    ...(typeof value.ocrText === "string" ? { ocrText: value.ocrText } : {}),
  };
}

function decodeScan(record: StoredScan): ScanRecord {
  const decodeBlob = (stored: StoredScan["pdf"]) => {
    const bytes = base64ToBytes(stored.base64);
    const buffer = new Uint8Array(bytes.byteLength);
    buffer.set(bytes);
    return new Blob([buffer.buffer], { type: stored.type });
  };

  return {
    meta: record.meta,
    pdf: decodeBlob(record.pdf),
    ...(record.thumbnail ? { thumbnail: decodeBlob(record.thumbnail) } : {}),
    ...(record.ocrText !== undefined ? { ocrText: record.ocrText } : {}),
  };
}

function parseLocalStorageEntries(value: unknown): Record<string, string> {
  if (!isObject(value)) throw new Error("Backup is missing its local data.");
  const entries: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!backupableKey(key)) throw new Error("Backup contains a login, session, or secret key.");
    if (typeof raw !== "string") throw new Error(`Backup contains invalid data for "${key}".`);
    entries[key] = raw;
  }
  return entries;
}

function parseLegacySettingsBackup(value: Record<string, unknown>): ParsedLocalBackup | null {
  const legacyKeys = ["settings", "appIcon", "friendlyName"] as const;
  if (!legacyKeys.some((key) => key in value)) return null;

  const localStorage: Record<string, string> = {};
  const fields: Array<[keyof typeof value, string]> = [
    ["settings", KEYS.SETTINGS],
    ["appIcon", KEYS.APP_ICON],
    ["friendlyName", KEYS.FRIENDLY_NAME],
  ];
  for (const [source, target] of fields) {
    const raw = value[source];
    if (raw !== undefined && raw !== null) {
      if (typeof raw !== "string") throw new Error(`Legacy backup contains invalid "${source}" data.`);
      localStorage[target] = raw;
    }
  }

  return {
    legacy: true,
    data: {
      format: FORMAT,
      version: VERSION,
      createdAt: "",
      localStorage,
      scans: [],
      excludedCredentialCount: 0,
    },
  };
}

export async function createLocalBackup(
  storage: StorageLike = window.localStorage,
  scanner?: ScanStore,
): Promise<LocalBackupData> {
  const records = await (scanner ?? (await createScanStore())).snapshot();
  return {
    format: FORMAT,
    version: VERSION,
    createdAt: new Date().toISOString(),
    localStorage: storageSnapshot(storage),
    scans: await Promise.all(records.map(encodeScan)),
    excludedCredentialCount: omittedSecretCount(storage),
  };
}

export function parseLocalBackup(text: string): ParsedLocalBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!isObject(parsed)) throw new Error("This file is not a valid AmazeCC backup.");

  if (parsed.format !== FORMAT) {
    const legacy = parseLegacySettingsBackup(parsed);
    if (legacy) return legacy;
    throw new Error("This file is not an AmazeCC local-data backup.");
  }
  if (parsed.version !== VERSION) {
    throw new Error(`This backup version (${String(parsed.version)}) is not supported by this app.`);
  }
  if (typeof parsed.createdAt !== "string" || !Number.isFinite(Date.parse(parsed.createdAt))) {
    throw new Error("Backup has an invalid creation date.");
  }
  const localStorage = parseLocalStorageEntries(parsed.localStorage);
  if (!Array.isArray(parsed.scans)) throw new Error("Backup has invalid scanner data.");
  const scans = parsed.scans.map(parseStoredScan);
  if (new Set(scans.map((record) => record.meta.id)).size !== scans.length) {
    throw new Error("Backup contains duplicate scanner records.");
  }

  return {
    legacy: false,
    data: {
      format: FORMAT,
      version: VERSION,
      createdAt: parsed.createdAt,
      localStorage,
      scans,
      excludedCredentialCount:
        typeof parsed.excludedCredentialCount === "number" && parsed.excludedCredentialCount >= 0
          ? parsed.excludedCredentialCount
          : 0,
    },
  };
}

export function localBackupPreview(backup: ParsedLocalBackup) {
  const serializedSize = JSON.stringify(backup.data).length;
  return {
    createdAt: backup.data.createdAt,
    localStorageItems: Object.keys(backup.data.localStorage).length,
    scannerRecords: backup.data.scans.length,
    excludedCredentialCount: backup.data.excludedCredentialCount,
    approximateSizeBytes: serializedSize,
    legacy: backup.legacy,
  };
}

function applyStorageEntries(
  storage: StorageLike,
  entries: Record<string, string>,
  mode: RestoreMode,
  removeMissingKeys: boolean,
): void {
  const previous = storageSnapshot(storage);
  try {
    if (removeMissingKeys) {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key && backupableKey(key)) storage.removeItem(key);
      }
    }
    for (const [key, value] of Object.entries(entries)) {
      if (mode === "replace" || storage.getItem(key) === null) storage.setItem(key, value);
    }
  } catch (error) {
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key && backupableKey(key)) storage.removeItem(key);
      }
      for (const [key, value] of Object.entries(previous)) storage.setItem(key, value);
    } catch (rollbackError) {
      throw new Error(
        `Could not restore local data, and the local-storage rollback also failed: ${
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
        }`,
        { cause: error },
      );
    }
    throw new Error(`Could not restore local data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function restoreLocalBackup(
  backup: ParsedLocalBackup,
  mode: RestoreMode,
  storage: StorageLike = window.localStorage,
  scanner?: ScanStore,
): Promise<void> {
  const scanStore = scanner ?? (await createScanStore());
  const previousScans = await scanStore.snapshot();
  let scansChanged = false;
  try {
    if (!backup.legacy) {
      await scanStore.restore(backup.data.scans.map(decodeScan), mode);
      scansChanged = true;
    }
    applyStorageEntries(storage, backup.data.localStorage, mode, mode === "replace" && !backup.legacy);
  } catch (error) {
    if (scansChanged) {
      try {
        await scanStore.restore(previousScans, "replace");
      } catch (rollbackError) {
        throw new Error(
          `Restore failed, and scanner data could not be rolled back: ${
            rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          }`,
          { cause: error },
        );
      }
    }
    throw error;
  }
}
