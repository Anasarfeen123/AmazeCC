"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Download, FileUp, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@amazecontinuityprojects/amazeui";
import { TILE_CARD } from "@/lib/uiTokens";
import {
  createLocalBackup,
  localBackupPreview,
  parseLocalBackup,
  restoreLocalBackup,
  type ParsedLocalBackup,
  type RestoreMode,
} from "@/lib/localBackup";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LocalDataBackupCard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<ParsedLocalBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadRequired, setReloadRequired] = useState(false);

  const exportBackup = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await createLocalBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `amazecc-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      const preview = localBackupPreview({ data, legacy: false });
      setMessage(
        `Backup saved: ${preview.localStorageItems} local items and ${preview.scannerRecords} scanner records (${formatBytes(blob.size)}).`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a local backup.");
    } finally {
      setBusy(false);
    }
  };

  const readBackup = async (file?: File) => {
    if (!file) return;
    setError("");
    setMessage("");
    try {
      setBackup(parseLocalBackup(await file.text()));
    } catch (cause) {
      setBackup(null);
      setError(cause instanceof Error ? cause.message : "Could not read this backup file.");
    }
  };

  const restore = async (mode: RestoreMode) => {
    if (!backup) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await restoreLocalBackup(backup, mode);
      setBackup(null);
      setReloadRequired(true);
      setMessage(
        backup.legacy
          ? "Settings restored. Reload the app to apply them."
          : `Local data restored using ${mode === "merge" ? "merge" : "replace"}. Reload the app to apply it.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restore this backup.");
    } finally {
      setBusy(false);
    }
  };

  const preview = backup ? localBackupPreview(backup) : null;

  return (
    <section className={`${TILE_CARD} space-y-3`} aria-labelledby="local-backup-title">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border-2 border-border-ink bg-secondary text-secondary-foreground">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="local-backup-title" className="font-display text-sm font-bold text-text-heading">
            Local data backup
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Save settings, plans, tasks, social lists and scanner files to a file on this device.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={exportBackup}
          disabled={busy}
          className="min-h-11 flex-1"
          icon={
            busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )
          }
        >
          Create backup
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="min-h-11 flex-1"
          icon={<FileUp className="h-4 w-4" aria-hidden="true" />}
        >
          Review backup file
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Choose an AmazeCC backup file"
          onChange={(event) => {
            void readBackup(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <p className="flex items-start gap-2 rounded-[10px] border-2 border-border-ink bg-highlight px-3 py-2 text-xs leading-relaxed text-highlight-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Backup files are readable JSON and may contain academic records, social lists and scanned papers. Keep them
        private. Login credentials, session tokens and cryptographic keys are never included.
      </p>

      {preview && (
        <div
          className="space-y-3 rounded-[10px] border-2 border-border-ink bg-surface-secondary p-3"
          aria-live="polite"
        >
          <h4 className="font-display text-xs font-bold uppercase tracking-wide text-text-heading">
            Review before restoring
          </h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-text-muted">Saved local items</dt>
              <dd className="font-mono font-bold text-text-heading">{preview.localStorageItems}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Scanner records</dt>
              <dd className="font-mono font-bold text-text-heading">{preview.scannerRecords}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Approx. file size</dt>
              <dd className="font-mono font-bold text-text-heading">{formatBytes(preview.approximateSizeBytes)}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Created</dt>
              <dd className="font-mono font-bold text-text-heading">
                {preview.createdAt ? new Date(preview.createdAt).toLocaleDateString("en-GB") : "Older settings file"}
              </dd>
            </div>
          </dl>
          {preview.excludedCredentialCount > 0 && (
            <p className="text-xs text-text-muted">
              {preview.excludedCredentialCount} login, session or secret item(s) were excluded from the backup.
            </p>
          )}
          {backup.legacy ? (
            <>
              <p className="text-xs leading-relaxed text-text-muted">
                This older file only contains settings. It will update those settings and leave other data untouched.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void restore("replace")}
                disabled={busy}
                className="min-h-11 w-full"
              >
                Restore these settings
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-text-muted">
                Merge adds missing items and keeps this device&apos;s existing values. Replace overwrites saved local
                data and scanner records, but leaves sign-in information untouched.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void restore("merge")}
                  disabled={busy}
                  className="min-h-11 flex-1"
                >
                  Merge with this device
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void restore("replace")}
                  disabled={busy}
                  className="min-h-11 flex-1"
                >
                  Replace local data
                </Button>
              </div>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setBackup(null)}
            disabled={busy}
            className="min-h-11 w-full"
          >
            Cancel restore
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-semibold text-danger-foreground">
          {error}
        </p>
      )}
      {message && (
        <div
          role="status"
          className="flex flex-col gap-2 text-xs font-semibold text-success-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{message}</p>
          {reloadRequired && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
              className="min-h-11"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Reload app
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
