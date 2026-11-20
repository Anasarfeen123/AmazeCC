"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { X } from "lucide-react";
import { isGameOpenAtom } from "@/store/uiAtoms";
import { useFocusTrap } from "@/lib/useFocusTrap";
import BrickBreak from "./BrickBreak";
import { OPEN_GAME_EVENT } from "@/components/custom/shared/BrandLogo";

/**
 * The offline brick-breaker, in its own pop-up: a bottom sheet on phones and
 * a centred window from tablet width up. (It used BrandSheet, which is
 * phone-only (md:hidden), so on a laptop the game opened invisibly; user:
 * "i cant play the game".)
 *
 * Opened from the offline banner, the command palette, the Konami code and
 * the logo easter egg. The game only runs while this is open.
 */
export default function GameSheet() {
  const [open, setOpen] = useAtom(isGameOpenAtom);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  // Easter egg: the Konami code (up up down down left right left right b a)
  // opens the game from anywhere. Ignored while typing in a field.
  useEffect(() => {
    const code = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = key === code[i] ? i + 1 : key === code[0] ? 1 : 0;
      if (i === code.length) {
        i = 0;
        setOpen(true);
      }
    };
    // The logo easter egg (BrandLogo) asks for the game with a window event.
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_GAME_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_GAME_EVENT, onOpen);
    };
  }, [setOpen]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center md:items-center md:p-6" role="presentation">
      <div
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--shadow-ink)_55%,transparent)]"
        onClick={close}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Break some bricks"
        className="relative w-full max-w-lg rounded-t-[20px] border-x-[3px] border-t-[3px] border-border-ink bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:rounded-[20px] md:border-[3px] md:shadow-brutal-lg"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-text-heading">Bored?</h2>
            <p className="font-mono text-xs text-text-muted">Break some bricks</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close game"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-heading shadow-brutal-sm cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <BrickBreak onClose={close} />
        <p className="mt-2 text-xs text-text-muted">
          Drag or move to steer, tap to launch. Arrow keys and Space work too. Esc closes.
        </p>
      </div>
    </div>
  );
}
