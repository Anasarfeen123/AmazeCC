"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { usePwaInstall } from "@/lib/pwaInstall";

const DISMISS_KEY = "pwaInstallCardDismissed";

const isIosDevice = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
/** Firefox for Android installs from its menu and never fires the install prompt. */
const isAndroidFirefox = () =>
  typeof navigator !== "undefined" && /Android/.test(navigator.userAgent) && /Firefox\//.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

const isTouchDevice = () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

/**
 * "Install app" offer for the settings hub.
 *
 * Two surfaces, one dismissable card:
 *  - Browsers that fire `beforeinstallprompt` (Chrome/Edge Android+desktop,
 *    Samsung Internet) get a direct **Install app** button that triggers the
 *    native browser prompt. The prompt is captured once at the app root by
 *    `ServiceWorkerRegistrar`; availability arrives via `usePwaInstall()`.
 *  - iOS Safari never fires `beforeinstallprompt`, so there the card falls
 *    back to the manual "Share → Add to Home Screen" steps instead of
 *    disappearing entirely.
 *
 * The card never renders in an already-installed standalone window, and
 * dismissal persists — hiding the offer must be a choice, not a accident.
 * Styling mirrors the sibling cards in `ProfilePage`.
 */
export default function PwaInstallCard() {
  const { canInstall, promptInstall } = usePwaInstall();
  const [accepted, setAccepted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [client, setClient] = useState(false);

  // Dismissal flag lives in localStorage; read it after mount to avoid an
  // SSR/first-paint mismatch, and only then decide what (if anything) to show.
  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    setClient(true);
  }, []);

  const firefox = isAndroidFirefox();
  const showManualSteps = !canInstall && (isIosDevice() || firefox) && !isStandalone() && isTouchDevice();
  const visible = client && !accepted && !dismissed && (canInstall || showManualSteps);
  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — the flag just won't persist */
    }
    setDismissed(true);
  };

  return (
    <div className="relative bg-surface rounded-[14px] border-2 border-border-ink p-5 space-y-3 shadow-brutal-sm">
      <button
        onClick={dismiss}
        aria-label="Dismiss install offer"
        className="absolute top-3.5 right-3.5 hit-expand flex items-center justify-center rounded-full p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      <h3 className="font-display text-base font-bold uppercase text-text-heading pr-8">Install AmazeCC</h3>
      <p className="text-xs text-text-muted">
        Put AmazeCC on your home screen: it opens full screen, works offline, and its icon shows how many courses and
        exams need attention.
      </p>

      {canInstall ? (
        <button
          onClick={async () => {
            const ok = await promptInstall();
            if (ok) setAccepted(true);
          }}
          className="inline-flex items-center gap-2 bg-primary hover:brightness-110 text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Install app
        </button>
      ) : firefox ? (
        <ol className="space-y-2.5 text-xs font-medium text-text-primary">
          <li className="flex items-start gap-2.5">
            <Download className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              Tap the <strong>⋮</strong> menu in Firefox, then <strong>Install</strong> (or Add to Home screen).
            </span>
          </li>
        </ol>
      ) : (
        <ol className="space-y-2.5 text-xs font-medium text-text-primary">
          <li className="flex items-start gap-2.5">
            <Share className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              Tap the <strong>Share</strong> button in Safari's toolbar.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Plus className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              Choose <strong>Add to Home Screen</strong>, then confirm.
            </span>
          </li>
        </ol>
      )}
    </div>
  );
}
