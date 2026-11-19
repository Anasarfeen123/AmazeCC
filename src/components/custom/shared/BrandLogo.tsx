"use client";

/**
 * The AmazeCC logo, one component for every place it appears.
 *
 * Mark: the full-colour book-"A" app tile (`/brand/icon-primary.svg`).
 * Wordmark: "Amaze" in Space Mono bold with "CC" set in an ochre block, like a
 * stamped tag; it echoes the orange CC of the official lockup and reads on
 * paper, teal and obsidian alike (ink on ochre ≥ 10:1).
 * Tagline: "Your campus companion".
 *
 * On hover the mark tips like a page being turned (off for reduced motion).
 * Use `variant="mark"` where space is tight (rail, phone header), `"lockup"`
 * in headers/sidebars, `"lockup"` + `tagline` for brand moments (hero, footer).
 */

import { getAssetPath } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const MARK: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};
const WORD: Record<Size, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-[34px]",
};
const TAG: Record<Size, string> = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
};

export function BrandLogo({
  variant = "lockup",
  size = "md",
  tagline = false,
  markSrc,
  className = "",
  wordClassName = "",
}: {
  variant?: "mark" | "lockup" | "wordmark";
  size?: Size;
  tagline?: boolean;
  /** Override the mark image (e.g. the user's chosen alternate app icon). */
  markSrc?: string;
  className?: string;
  /** Colour for "Amaze" when the default heading ink is wrong (e.g. on teal). */
  wordClassName?: string;
}) {
  const mark = (
    <img
      src={markSrc ?? getAssetPath("/brand/icon-primary.svg")}
      alt=""
      aria-hidden="true"
      decoding="async"
      className={`brand-logo-mark ${MARK[size]} shrink-0 object-contain`}
    />
  );
  if (variant === "mark") {
    return (
      <span className={`group/logo inline-flex ${className}`.trim()} role="img" aria-label="AmazeCC">
        {mark}
      </span>
    );
  }
  return (
    <span className={`group/logo inline-flex min-w-0 items-center gap-2.5 ${className}`.trim()}>
      {variant === "lockup" ? mark : null}
      <span className="min-w-0 leading-none">
        <span
          className={`flex items-center font-display font-bold tracking-tight ${WORD[size]} ${wordClassName || "text-text-heading"}`}
        >
          Amaze
          <span className="ml-0.5 rounded-[5px] border-2 border-border-ink bg-ochre px-1 text-obsidian">CC</span>
        </span>
        {tagline ? (
          <span className={`mt-1.5 block font-mono uppercase tracking-[0.06em] text-text-muted ${TAG[size]}`}>
            Your campus companion
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default BrandLogo;
