"use client";

import { useDragControls, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type React from "react";

/**
 * Drag-to-dismiss for bottom sheets (BottomSheet, BrandSheet), on
 * framer-motion's drag so the sheet follows the finger, springs back when
 * let go short, and closes on a long pull *or* a quick flick.
 *
 * It replaced a hand-rolled pointer handler (user: "improve the animations
 * of pulling up/dragging down … make it proper") that:
 * - jumped back with no animation when released short,
 * - ignored speed, so a flick did nothing unless it passed 120px,
 * - wrote its own transform over framer's, so a drag-close jumped back to
 *   the top before the exit slide ran.
 *
 * The drag starts only from `startDrag` (grabber and header), so the content
 * keeps native scrolling. The sheet's `y` is one motion value, used by the
 * enter/exit slide and by the drag, so a close continues from where the
 * finger let go. `scrimOpacity` fades the backdrop as the sheet is pulled.
 */
const CLOSE_DISTANCE = 110; // px pulled down
// Measured in Chrome: framer reports a real 800px/s flick as ~340 (it
// averages over ~100ms) and a slow 60-90px pull as 110-135.
const CLOSE_VELOCITY = 260; // px/s downward flick
const INTERACTIVE = "button, a, input, textarea, select, label, [role='button'], [data-no-sheet-drag]";

export function useSheetDrag(onDismiss: () => void, enabled = true) {
  const controls = useDragControls();
  const y = useMotionValue<number | string>("100%");
  // Percent values only occur during the enter/exit slide; the backdrop has
  // its own fade then, so this only reacts to a drag (px numbers).
  const scrimOpacity = useTransform(y, (v) => (typeof v === "number" ? Math.max(0.25, 1 - v / 420) : 1));

  const startDrag = (e: React.PointerEvent) => {
    if (!enabled) return;
    // Presses on buttons, links and fields keep their click.
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    controls.start(e);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const pulled = info.offset.y;
    if (pulled > CLOSE_DISTANCE || (info.velocity.y > CLOSE_VELOCITY && pulled > 24)) onDismiss();
  };

  const dragProps = enabled
    ? ({
        drag: "y",
        dragControls: controls,
        dragListener: false,
        // Pinned at its resting place: pulling down stretches 1:1, pulling up
        // barely moves (it is already fully open), and letting go springs
        // back unless onDragEnd closes it.
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0.04, bottom: 1 },
        dragMomentum: false,
        dragTransition: { bounceStiffness: 520, bounceDamping: 38 },
        onDragEnd,
      } as const)
    : ({} as const);

  return { y, scrimOpacity, startDrag, dragProps };
}

/** Slide in on a near-critically-damped spring, out on a short ease-in. */
export const SHEET_ENTER = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;
export const SHEET_EXIT = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const;
