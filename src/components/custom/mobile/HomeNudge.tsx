"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePwaInstall } from "@/lib/pwaInstall";
import { formatSemesterName } from "@/lib/formatSemesterName";

/**
 * One small, dismissible notice at the top of Home (user: "small
 * notifications … if dismissed, remain dismissed for some days"):
 *
 * - semester: viewing a semester other than the current one -> Switch.
 * - install: the browser offers "add to home screen" (or iPhone Safari,
 *   which never offers it) -> Install / how-to.
 *
 * At most one shows, in that order. Dismissing hides that notice for its
 * number of days (localStorage, this device only).
 */
type NudgeId = "semester" | "install";
const SNOOZE_DAYS: Record<NudgeId, number> = { semester: 3, install: 14 };
const key = (id: NudgeId) => `amazecc.nudge.${id}`;

function snoozed(id: NudgeId): boolean {
  try {
    const until = Number(localStorage.getItem(key(id)));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function snooze(id: NudgeId) {
  try {
    localStorage.setItem(key(id), String(Date.now() + SNOOZE_DAYS[id] * 86_400_000));
  } catch {}
}

function isStandalone(): boolean {
  try {
    return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  } catch {
    return false;
  }
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export default function HomeNudge({
  currentSemesterId,
  viewingSemesterId,
  onSwitchSemester,
}: {
  currentSemesterId: string | null;
  viewingSemesterId: string | null;
  onSwitchSemester: (id: string) => void;
}) {
  const { canInstall, promptInstall } = usePwaInstall();
  // Client-only checks; decided after mount so the server HTML matches.
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState<Record<NudgeId, boolean>>({ semester: true, install: true });
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setHidden({ semester: snoozed("semester"), install: snoozed("install") || isStandalone() });
    setIos(isIosSafari());
    setReady(true);
  }, []);
  if (!ready) return null;

  const dismiss = (id: NudgeId) => {
    snooze(id);
    setHidden((h) => ({ ...h, [id]: true }));
  };

  let id: NudgeId | null = null;
  if (!hidden.semester && currentSemesterId && viewingSemesterId && viewingSemesterId !== currentSemesterId)
    id = "semester";
  else if (!hidden.install && (canInstall || ios)) id = "install";
  if (!id) return null;

  const text =
    id === "semester"
      ? `You're viewing ${formatSemesterName(viewingSemesterId!)}.`
      : canInstall
        ? "Add AmazeCC to your home screen."
        : "Add to Home Screen: tap Share, then Add to Home Screen.";
  const action =
    id === "semester" ? (
      <button
        type="button"
        onClick={() => {
          dismiss("semester");
          onSwitchSemester(currentSemesterId!);
        }}
        className="shrink-0 rounded-[8px] border-2 border-border-ink bg-primary px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.06em] text-primary-foreground cursor-pointer"
      >
        Switch to {formatSemesterName(currentSemesterId!)}
      </button>
    ) : canInstall ? (
      <button
        type="button"
        onClick={async () => {
          const ok = await promptInstall();
          if (ok) dismiss("install");
        }}
        className="shrink-0 rounded-[8px] border-2 border-border-ink bg-primary px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.06em] text-primary-foreground cursor-pointer"
      >
        Install
      </button>
    ) : null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-[12px] border-2 border-border-ink bg-surface px-3 py-2 shadow-brutal-sm"
    >
      <p className="min-w-0 flex-1 text-sm text-text-primary">{text}</p>
      {action}
      <button
        type="button"
        onClick={() => dismiss(id!)}
        aria-label={`Dismiss for ${SNOOZE_DAYS[id]} days`}
        title={`Hide for ${SNOOZE_DAYS[id]} days`}
        className="relative hit-expand inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-text-muted hover:bg-surface-secondary cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
