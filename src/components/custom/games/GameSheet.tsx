"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { BrandSheet } from "@/components/custom/shared/primitives/BrandSheet";
import { isGameOpenAtom } from "@/store/uiAtoms";
import BrickBreak from "./BrickBreak";

/**
 * The offline brick-breaker in a bottom sheet. Opened from the offline banner ("Play while
 * you wait"), the command palette ("Break some bricks") and the Konami code.
 * Mounted once in Main; the game only runs while the sheet is open.
 */
export default function GameSheet() {
  const [open, setOpen] = useAtom(isGameOpenAtom);

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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
  return (
    <BrandSheet
      open={open}
      onClose={() => setOpen(false)}
      title="Bunk Runner"
      subtitle="Jump the books, grab the stars"
    >
      {open && (
        <div className="space-y-3 p-1">
          <BrickBreak onClose={() => setOpen(false)} />
          <p className="text-xs text-text-muted">
            Drag to steer, tap to launch. Arrow keys and Space work too. Esc closes.
          </p>
        </div>
      )}
    </BrandSheet>
  );
}
