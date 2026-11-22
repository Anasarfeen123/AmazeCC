"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { checkForAppUpdate, type AppUpdate } from "@/lib/appUpdates";

/** Android app: a small notice when a newer APK is on GitHub (once a day). */
export default function NativeUpdateNotice() {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  useEffect(() => {
    let alive = true;
    // A little after start-up, so it never competes with the first sync.
    const t = window.setTimeout(async () => {
      const u = await checkForAppUpdate();
      if (alive) setUpdate(u);
    }, 8000);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);
  if (!update) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-[14px] border-2 border-border-ink bg-surface p-3 shadow-brutal-md"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text-heading">AmazeCC {update.version} is out</p>
        <p className="text-xs text-text-muted">Download and open it to update.</p>
      </div>
      <a
        href={update.apkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setUpdate(null)}
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] border-2 border-border-ink bg-primary px-3 font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm brutal-press"
      >
        <Download className="h-4 w-4" aria-hidden />
        Download
      </a>
      <button
        type="button"
        onClick={() => setUpdate(null)}
        aria-label="Later"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-text-muted hover:bg-surface-secondary cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
