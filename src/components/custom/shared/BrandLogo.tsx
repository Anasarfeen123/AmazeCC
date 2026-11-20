"use client";

import { useCallback, useRef, useState } from "react";

/**
 * The AmazeCC logo, one component for every place it appears.
 *
 * Mark: the full-colour book-"A" app tile, edge to edge (`/brand/icon-app.svg`; icon-primary.svg has a transparent border that made it look small).
 * Wordmark: "Amaze" in Space Mono bold with "CC" set in an ochre block, like a
 * stamped tag; it echoes the orange CC of the official lockup and reads on
 * paper, teal and obsidian alike (ink on ochre ≥ 10:1).
 * Tagline: "Your campus companion".
 *
 * On hover the mark tips like a page being turned (off for reduced motion).
 * Use `variant="mark"` where space is tight (rail, phone header), `"lockup"`
 * in headers/sidebars, `"lockup"` + `tagline` for brand moments (hero, footer).
 */

import LogoMark from "./LogoMark";

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

/**
 * Easter egg: tap the logo 7 times quickly and it wobbles and says something
 * silly; do it again and the brick-breaker opens. Taps on the logo still do
 * whatever the surrounding link does.
 */
const LOGO_LINES = ["ok you found it", "stop poking me", "go attend a class", "75% or bust", "that tickles"];
/** Window event the game sheet listens for (keeps the logo free of jotai). */
export const OPEN_GAME_EVENT = "amazecc:open-game";

function useLogoEgg() {
  const [wobble, setWobble] = useState(false);
  const [line, setLine] = useState("");
  const taps = useRef<number[]>([]);
  const found = useRef(0);
  const tap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length < 7) return;
    taps.current = [];
    found.current += 1;
    if (found.current >= 2) {
      found.current = 0;
      window.dispatchEvent(new Event(OPEN_GAME_EVENT));
      return;
    }
    setWobble(true);
    setLine(LOGO_LINES[Math.floor(Math.random() * LOGO_LINES.length)]);
    window.setTimeout(() => setWobble(false), 700);
    window.setTimeout(() => setLine(""), 2200);
  }, []);
  return { tap, wobble, line };
}

export function BrandLogo({
  variant = "lockup",
  size = "md",
  tagline = false,
  markSrc,
  syncing = false,
  className = "",
  wordClassName = "",
}: {
  variant?: "mark" | "lockup" | "wordmark";
  size?: Size;
  tagline?: boolean;
  /** Override the mark image (e.g. the user's chosen alternate app icon). */
  markSrc?: string;
  /** A sync is running: the star in the mark turns (LogoMark). */
  syncing?: boolean;
  className?: string;
  /** Colour for "Amaze" when the default heading ink is wrong (e.g. on teal). */
  wordClassName?: string;
}) {
  const egg = useLogoEgg();
  const mark = (
    <span className="relative inline-flex shrink-0" onClick={egg.tap}>
      {markSrc ? (
        <img
          src={markSrc}
          alt=""
          aria-hidden="true"
          decoding="async"
          className={`brand-logo-mark ${MARK[size]} shrink-0 rounded-[22%] object-contain shadow-brutal-sm ${egg.wobble ? "logo-wobble" : ""}`}
        />
      ) : (
        // Layered app icon, so the star can turn while syncing (LogoMark).
        <LogoMark
          syncing={syncing}
          className={`brand-logo-mark ${MARK[size]} rounded-[22%] shadow-brutal-sm ${egg.wobble ? "logo-wobble" : ""}`}
        />
      )}
      {egg.line && (
        <span
          role="status"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[8px] border-2 border-border-ink bg-ochre px-2 py-1 font-mono text-xs font-bold text-obsidian shadow-brutal-sm"
        >
          {egg.line}
        </span>
      )}
    </span>
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
