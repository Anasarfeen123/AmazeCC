/**
 * Device-only key and AES-GCM encryption for reminders (see reminders.ts).
 * Kept free of other imports so the service worker can use it cheaply.
 */
const DB = "amazecc-reminders";
const STORE = "keys";
const KEY_ID = "aes-gcm-v1";

export interface ReminderContent {
  title: string;
  body: string;
  url: string;
  tag: string;
}

// ── key storage (page + service worker) ──────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function readReminderKey(): Promise<CryptoKey | null> {
  try {
    return ((await idb("readonly", (s) => s.get(KEY_ID))) as CryptoKey | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function reminderKey(): Promise<CryptoKey> {
  const existing = await readReminderKey();
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await idb("readwrite", (s) => s.put(key, KEY_ID));
  return key;
}

// ── encryption ───────────────────────────────────────────────────────

const toB64 = (bytes: Uint8Array) => {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64 = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export async function encryptReminder(key: CryptoKey, content: ReminderContent): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(content))),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toB64(out);
}

/** Used by the service worker. */
export async function decryptReminder(key: CryptoKey, c: string): Promise<ReminderContent> {
  const bytes = fromB64(c);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}
