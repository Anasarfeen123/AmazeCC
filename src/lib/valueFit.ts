import type { ReactNode } from "react";

/**
 * Size and wrapping for a stat value (StatTile, InsightCarousel), so a value
 * fits its card at every width without breaking mid-word.
 *
 * Why: a course code like "BCSE302L" at 40px in a half-width phone card
 * either truncated ("BCSE30…") or, once values were allowed to wrap for 200%
 * zoom, split mid-word ("BCSE302 / L"). Now short values stay big, longer
 * ones step down; single words never wrap (truncate only as a last resort),
 * phrases wrap at spaces, at most two lines.
 */
export function valueFitClass(value: ReactNode, size: "sm" | "lg" = "sm"): string {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const len = text.length;
  const big = size === "lg" ? "text-[40px] sm:text-[56px]" : "text-[32px] sm:text-[40px]";
  const sizeClass = !text || len <= 6 ? big : len <= 9 ? "text-[26px] sm:text-[32px]" : "text-[20px] sm:text-[26px]";
  const wrap = /\s/.test(text.trim())
    ? "line-clamp-2 break-normal leading-tight"
    : "whitespace-nowrap truncate leading-none";
  return `${sizeClass} ${wrap}`;
}
