"use client";

import type { ElementType, ReactNode } from "react";
import { TILE, LIST_SHELL, SECTION_CHIP, TONE_BADGE, TONE_TEXT } from "@/lib/uiTokens";

/**
 * Section header: an indigo icon, a heavy title, an optional count chip and an
 * optional right-hand slot (deep link, filter, action). Copy-pasted in four
 * places before this existed.
 */
export function SectionHeader({
  icon: Icon,
  leading,
  title,
  count,
  right,
  className = "",
}: {
  icon?: ElementType;
  /** Custom marker before the title (e.g. a tone dot). Wins over `icon`. */
  leading?: ReactNode;
  title: ReactNode;
  count?: number;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 px-1 ${className}`.trim()}>
      <div className="flex items-center gap-2 min-w-0">
        {leading ?? (Icon ? <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden /> : null)}
        <h2 className="font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-text-heading truncate">
          {title}
        </h2>
        {typeof count === "number" ? <span className={`${SECTION_CHIP} shrink-0`}>{count}</span> : null}
      </div>
      {right ? <div className="flex items-center gap-2 shrink-0">{right}</div> : null}
    </div>
  );
}

/**
 * Hero stat tile.
 *
 * `height` is pinned rather than a min-height on purpose: with three stacked
 * lines a min-height lets the content grow into the tile's own padding and
 * collide. The default matches the other pages' 32/36 rhythm.
 *
 * Constant by design — a tile is a measurement that does not change under the
 * reader. A set of values worth rotating through is an `InsightCarousel`, and
 * something that navigates belongs in a section header as an action, not here.
 * The calendar page tried all three in one row and none of them read.
 */
export function StatTile({
  label,
  value,
  sub,
  badge,
  icon,
  tone = "emerald",
  variant = "default",
  height = "h-32 sm:h-36",
  className = "",
}: {
  /**
   * Brand stat-card variants: `default` = surface card; `highlight` = solid
   * ochre card with ink text (the one loud card in a row); `primary` = teal
   * card with paper text and an ochre number.
   */
  variant?: "default" | "highlight" | "primary";
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  /** Optional top-right pill, e.g. "2 today". */
  badge?: ReactNode;
  /**
   * Optional top-right icon, for a tile that identifies itself by glyph rather
   * than by a number. Mutually exclusive in practice with `badge` — a tile wants
   * one marker, and `badge` wins if both are passed because it is the stronger
   * signal.
   */
  icon?: ReactNode;
  /** Tints `value`, and the badge when one is given. `neutral` = heading ink. */
  tone?: string;
  height?: string;
  className?: string;
}) {
  // "neutral"/"default" means "no tint" — plain heading ink rather than a
  // toned-down grey, so an uncoloured tile does not look disabled.
  const loud = variant !== "default";
  const valueTone =
    variant === "highlight"
      ? "text-highlight-foreground"
      : variant === "primary"
        ? "text-highlight"
        : !tone || tone === "neutral" || tone === "default"
          ? "text-hero"
          : (TONE_TEXT[tone] ?? "text-hero");
  const surface =
    variant === "highlight"
      ? "!bg-highlight text-highlight-foreground"
      : variant === "primary"
        ? "!bg-teal text-cream dark:!bg-surface-tertiary dark:text-text-primary"
        : "";
  const labelTone = loud ? "opacity-80" : "text-text-muted";
  const subTone = loud ? "opacity-80" : "text-text-muted";

  return (
    <div className={`${TILE} ${surface} ${height} ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span
          className={`font-mono text-xs font-semibold uppercase tracking-[0.06em] ${labelTone} min-w-0 break-words`}
        >
          {label}
        </span>
        {badge ? (
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-[6px] border-2 shrink-0 ${
              loud ? "bg-text-primary text-background border-border-ink" : (TONE_BADGE[tone] ?? TONE_BADGE.zinc)
            }`}
          >
            {badge}
          </span>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
      </div>

      <div className="my-auto min-w-0">
        <p
          data-private
          className={`font-display text-[32px] sm:text-[40px] font-bold tracking-tight leading-none truncate block ${valueTone}`}
        >
          {value}
        </p>
      </div>

      {sub ? (
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className={`font-mono text-xs ${subTone} line-clamp-2`}>{sub}</div>
        </div>
      ) : null}
    </div>
  );
}

/** Grouped list container — the workhorse for "N rows that look like one card". */
export function ListShell({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${LIST_SHELL} ${className}`.trim()}>{children}</div>;
}

const ROW_TITLE = "font-bold text-sm text-text-heading truncate font-outfit leading-tight";
const ROW_SUBTITLE_BASE = "text-[11px] text-text-secondary dark:text-text-muted font-medium mt-0.5";
const ROW_SUBTITLE = `${ROW_SUBTITLE_BASE} truncate`;
const ROW_SUBTITLE_WRAP = `${ROW_SUBTITLE_BASE} whitespace-normal break-words`;

/**
 * The title + muted subtitle block that sits inside a list row.
 *
 * Twenty-odd rows across the app had this exact pair of class strings and an
 * identical `min-w-0 flex-1` wrapper, so it is written once here. `right` is a
 * slot rather than baked in because what trails a row title is the thing that
 * actually varies — a chip, a tone badge, a chevron, a price.
 */
export function ListRowText({
  title,
  subtitle,
  titleTag: Tag = "p",
  titleTooltip,
  wrapSubtitle = false,
  right,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Sites disagree between `<p>` and `<h3>`; pass the heading when there is one. */
  titleTag?: "p" | "h3" | "h4" | "span";
  /** Native tooltip, for titles that truncate to something unreadable. */
  titleTooltip?: string;
  /** Keep longer explanatory copy visible instead of truncating to one line. */
  wrapSubtitle?: boolean;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 flex-1 ${className}`.trim()}>
      <div className="flex items-center gap-2 min-w-0">
        <Tag className={ROW_TITLE} title={titleTooltip}>
          {title}
        </Tag>
        {right ? <div className="flex items-center gap-2 shrink-0">{right}</div> : null}
      </div>
      {subtitle ? <p className={wrapSubtitle ? ROW_SUBTITLE_WRAP : ROW_SUBTITLE}>{subtitle}</p> : null}
    </div>
  );
}

/**
 * A one-line proportion bar.
 *
 * "How much of the credit basket is earned", "how common is this grade", "this
 * term's GPA out of ten" — all the same object. It was a local in the curriculum
 * page until the grade history wanted a second one, and two local copies of a
 * six-line div is exactly the retyping `uiTokens` exists to stop.
 *
 * `tone` is a bare background class, not a tone name, because the caller is
 * choosing a hue against something the component cannot see (earned vs ongoing,
 * an `S` against a `C`).
 */
export function MiniBar({
  pct,
  tone,
  className = "",
}: {
  /** 0-100. Clamped, so a bad number renders an empty bar rather than an overflow. */
  pct: number;
  tone: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-2.5 rounded-full border-2 border-border-ink bg-surface-secondary overflow-hidden ${className}`.trim()}
    >
      <div
        className={`h-full rounded-full transition-all ${tone}`}
        style={{ width: `${Math.max(0, Math.min(pct, 100))}%` }}
      />
    </div>
  );
}

/**
 * Small label-over-value cell for a 2-up facts grid.
 *
 * The label is uppercase micro-type and the value is bold ink, which is the
 * convention wherever a page shows "Label / Value" in a grid.
 */
export function KeyValue({
  label,
  value,
  valueClassName = "",
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  /** Recolour the value (status text) or lay it out inline (icon + text). */
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`p-3 rounded-[10px] bg-surface-secondary border-2 border-border-ink ${className}`.trim()}>
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted block mb-0.5">
        {label}
      </span>
      <span className={`font-bold text-text-heading ${valueClassName}`.trim()}>{value}</span>
    </div>
  );
}
