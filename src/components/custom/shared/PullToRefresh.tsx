"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { haptic } from "@/lib/haptics";

const TRIGGER = 72; // px of finger travel that starts a sync
const MAX = 110;

/** The element that scrolls for `el` (the page, or an inner scroller). */
function scrollParent(el: Element | null): Element | null {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}

/**
 * Pull down at the top of the page to sync, as in native apps (owner review:
 * make it feel like a phone app). Touch screens only; a mouse never sees it.
 * The pull only starts when the page is scrolled to the very top and the
 * finger moves mostly downwards, so normal scrolling is untouched.
 */
export default function PullToRefresh({
  onRefresh,
  disabled = false,
}: {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const pullRef = useRef(0);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    if (disabled) return;
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;

    const onStart = (e: TouchEvent) => {
      if (busy || e.touches.length !== 1) return;
      const scroller = scrollParent(e.target as Element);
      const top = scroller ? scroller.scrollTop : window.scrollY;
      if (top > 0) return;
      // Not from inside a sheet, dialog or a horizontal strip.
      if ((e.target as Element).closest?.('[role="dialog"],[data-no-pull]')) return;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: false };
    };
    const onMove = (e: TouchEvent) => {
      const s = start.current;
      if (!s) return;
      const dy = e.touches[0].clientY - s.y;
      const dx = Math.abs(e.touches[0].clientX - s.x);
      if (!s.active) {
        if (dy > 8 && dy > dx * 1.5) s.active = true;
        else if (dy < 0 || dx > 12) {
          start.current = null;
          return;
        }
      }
      if (s.active) {
        // Resistance: the indicator moves slower than the finger.
        const next = Math.min(MAX, dy * 0.5);
        if (pullRef.current < TRIGGER && next >= TRIGGER) haptic("tap");
        pullRef.current = next;
        setPull(next);
      }
    };
    const onEnd = async () => {
      const s = start.current;
      start.current = null;
      if (!s?.active) return;
      const reached = pullRef.current >= TRIGGER;
      pullRef.current = 0;
      setPull(0);
      if (!reached) return;
      setBusy(true);
      try {
        await cb.current();
      } finally {
        setBusy(false);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [disabled, busy]);

  if (!pull && !busy) return null;
  const ready = pull >= TRIGGER;
  const y = busy ? 56 : pull;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center md:hidden"
      style={{ transform: `translateY(calc(env(safe-area-inset-top, 0px) + ${y - 40}px))` }}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-border-ink shadow-brutal-sm ${
          ready || busy ? "bg-highlight text-highlight-foreground" : "bg-surface text-text-heading"
        }`}
      >
        <RefreshCw
          className={`h-4.5 w-4.5 ${busy ? "animate-spin" : ""}`}
          style={busy ? undefined : { transform: `rotate(${pull * 3}deg)` }}
          aria-hidden
        />
        <span className="sr-only">{busy ? "Syncing" : ready ? "Release to sync" : "Pull to sync"}</span>
      </span>
    </div>
  );
}
