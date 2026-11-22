"use client";

import { getAssetPath } from "@/lib/utils";

import { useEffect } from "react";
import { initPwaInstallListeners } from "@/lib/pwaInstall";
import { installDesktopLinkHandler, nativeShell } from "@/lib/nativeShell";

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
  useEffect(() => {
    // Inside the Android or desktop app: the files are on the device already,
    // so no worker and no install prompt; desktop links go to the browser.
    const shell = nativeShell();
    if (shell === "desktop") return installDesktopLinkHandler();
    if (shell) return;
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

  return null;
}
