"use client";

import { getAssetPath } from "@/lib/utils";

import { useEffect, useState } from "react";
import { initPwaInstallListeners } from "@/lib/pwaInstall";

/**
 * Root-level PWA plumbing.
 *
 * The service worker used to be registered only from surfaces that care about
 * push notifications (ProfilePage, PushPromptModal, onboarding), so a plain
 * first visit — the most common one — never got the offline fallback. This
 * registers once at the app root. It is idempotent with those call sites:
 * repeated `register("/sw.js")` calls resolve to the same registration.
 *
 * It also owns the global `beforeinstallprompt` capture for the whole app;
 * components consume it via `usePwaInstall()` from `@/lib/pwaInstall`.
 */
export default function ServiceWorkerRegistrar() {
  // A new version took over this page (the worker skips waiting): offer a
  // reload rather than running old code against new files.
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" || !("serviceWorker" in navigator)) return;
    // Only an *update* counts: on a first visit there was no controller yet.
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => {
      if (hadController) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    // Look for a new version when the app comes back to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker
          .getRegistration()
          .then((r) => r?.update())
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    // Serwist is disabled in next.config.mjs during development, so there is
    // no worker to register until a production build is running.
    if (process.env.NODE_ENV !== "development" && "serviceWorker" in navigator) {
      // `updateViaCache: "none"` keeps Safari from serving a stale sw.js out
      // of its HTTP cache — on iOS a cached worker script is the classic way
      // offline support "stops working" after a deploy.
      navigator.serviceWorker.register(getAssetPath("/sw.js"), { updateViaCache: "none" }).catch((err) => {
        console.warn("Service worker registration error:", err);
      });
    }
    return initPwaInstallListeners();
  }, []);

  if (!updated) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] z-[70] mx-auto flex max-w-md items-center gap-3 rounded-[14px] border-2 border-border-ink bg-surface p-3 shadow-brutal-md md:bottom-6"
    >
      <p className="min-w-0 flex-1 text-sm text-text-primary">
        <span className="font-bold text-text-heading">AmazeCC was updated.</span> Reload to use the new version.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-10 shrink-0 items-center rounded-[10px] border-2 border-border-ink bg-primary px-3 font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm brutal-press cursor-pointer"
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => setUpdated(false)}
        className="inline-flex min-h-10 shrink-0 items-center rounded-[10px] px-2 font-mono text-xs font-bold uppercase text-text-muted hover:text-text-heading cursor-pointer"
      >
        Later
      </button>
    </div>
  );
}
