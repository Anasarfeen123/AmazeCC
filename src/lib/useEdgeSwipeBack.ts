"use client";

import { useEffect } from "react";

/**
 * Swipe right from the left edge to go back, in the installed iPhone app
 * (owner review: make it feel like a phone app). Android has its own system
 * back gesture, and Safari in a browser tab already does this, so it only
 * runs in iOS standalone mode, where there is no back gesture at all. Back
 * goes through history, which the app's overlay stack already listens to.
 */
export function useEdgeSwipeBack(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone =
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia?.("(display-mode: standalone)").matches;
    if (!ios || !standalone) return;

    let start: { x: number; y: number; t: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = e.touches.length === 1 && t.clientX <= 24 ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = Math.abs(t.clientY - start.y);
      const quick = Date.now() - start.t < 600;
      start = null;
      if (dx > 70 && dy < 50 && quick) window.history.back();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [enabled]);
}
