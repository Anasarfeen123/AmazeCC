"use client";

import { ArrowLeft } from "lucide-react";

/**
 * The page-header back button, brand spec: ochre fill, 2px ink edge, hard
 * shadow, mono uppercase label naming where it goes ("Back" when the caller
 * does not know).
 *
 * Replaces AmazeUI 1.6's `BackButton` (a grey circle with no label or
 * accessible name) while AmazeUI cannot be published. Same `onClick` /
 * `className` props, so moving it into AmazeUI later is a drop-in swap.
 *
 * On phones the label hides below 360px wide so a long destination never
 * pushes the header's icon buttons off screen; the accessible name stays.
 */
export function BrandBackButton({
  onClick,
  label = "Back",
  className = "",
}: {
  onClick: () => void;
  /** Destination, e.g. "Academics". Shown in uppercase mono. */
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === "Back" ? "Go back" : `Back to ${label}`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border-2 border-border-ink bg-highlight px-3 text-highlight-foreground shadow-brutal-sm brutal-press cursor-pointer ${className}`.trim()}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
      <span className="max-[359px]:sr-only max-w-[40vw] truncate font-label text-[13px] font-semibold">{label}</span>
    </button>
  );
}

export default BrandBackButton;
