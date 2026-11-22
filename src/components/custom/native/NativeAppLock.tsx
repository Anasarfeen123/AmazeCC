"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Fingerprint } from "lucide-react";
import { settingsAtom } from "@/store/settingsAtoms";
import { nativeShell } from "@/lib/nativeShell";
import { authenticate } from "@/lib/nativeAndroid";
import LogoMark from "../shared/LogoMark";

/** Time away after which the app locks again. */
const RELOCK_MS = 30_000;

/**
 * Android app lock (Settings → Android app → Fingerprint lock): covers the
 * app at launch and after 30 s in the background until the fingerprint,
 * face or screen lock prompt succeeds. Nothing on the website or desktop.
 */
export default function NativeAppLock() {
  const settings = useAtomValue(settingsAtom);
  const enabled = !!settings?.appLock;
  const [android, setAndroid] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    const isAndroid = nativeShell() === "android";
    setAndroid(isAndroid);
    if (isAndroid && enabled) setLocked(true);
    // Only on first mount: switching the setting on in Settings must not lock
    // the person out of the screen they are on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const ok = await authenticate("Unlock AmazeCC", "Use your fingerprint or screen lock");
    setBusy(false);
    if (ok) setLocked(false);
  }, [busy]);

  // Lock again after time away.
  useEffect(() => {
    if (!android || !enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current >= RELOCK_MS) setLocked(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [android, enabled]);

  // Ask straight away when it locks.
  useEffect(() => {
    if (locked && android && enabled) void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  if (!android || !enabled || !locked) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AmazeCC is locked"
      className="page-dots fixed inset-0 z-[500] flex flex-col items-center justify-center gap-6 bg-background px-6 text-center"
    >
      <LogoMark className="h-20 w-20 rounded-[22%] shadow-brutal-sm" />
      <div className="space-y-1">
        <p className="font-display text-xl font-bold uppercase text-text-heading">AmazeCC is locked</p>
        <p className="text-sm text-text-muted">Unlock with your fingerprint or screen lock.</p>
      </div>
      <button
        type="button"
        onClick={() => void unlock()}
        disabled={busy}
        className="inline-flex min-h-12 items-center gap-2 rounded-[12px] border-2 border-border-ink bg-primary px-6 font-mono text-sm font-bold uppercase tracking-[0.04em] text-primary-foreground shadow-brutal-sm brutal-press cursor-pointer disabled:opacity-60"
      >
        <Fingerprint className="h-5 w-5" aria-hidden />
        Unlock
      </button>
    </div>
  );
}
