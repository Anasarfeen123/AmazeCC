"use client";

import type { ReactNode } from "react";
import { cn } from "@amazecontinuityprojects/amazeui";
import { ICON_BUTTON, GHOST_BUTTON, SEG_ACTIVE, SEG_IDLE } from "@/lib/uiTokens";

/**
 * Icon-only action for page headers. `title` doubles as the accessible name
 * so the rendered button is never unlabelled.
 */
export function IconButton({
  onClick,
  title,
  children,
  disabled,
  className = "",
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`${ICON_BUTTON} disabled:opacity-50 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

/**
 * Icon-only action that navigates. Same surface as `IconButton`, rendered as an
 * anchor so it keeps link affordances: middle-click, open-in-new-tab, and the
 * status-bar URL on hover all keep working, which a `button` with an onClick
 * silently breaks.
 *
 * `aria-label` is separate from `title` because the two say different things —
 * the visible tooltip is "Open in Moodle", the accessible name is "Open <course>
 * in Moodle" — and the row it sits in has no other text to derive from.
 */
export function IconLink({
  href,
  title,
  ariaLabel,
  children,
  className = "",
}: {
  href: string;
  title: string;
  /** Required: an icon-only link inside a list row has no other text to name it. */
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      aria-label={ariaLabel}
      className={`${ICON_BUTTON} ${className}`.trim()}
    >
      {children}
    </a>
  );
}

/** Low-emphasis inline action (refresh, try again, add to calendar). */
export function GhostButton({
  onClick,
  children,
  title,
  className = "",
}: {
  onClick: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title} className={`${GHOST_BUTTON} ${className}`.trim()}>
      {children}
    </button>
  );
}

/**
 * Segmented filter.
 *
 * Three shapes exist in the app and all three are this control:
 *  - default: text segments that wrap when there are many
 *  - `grow`: equal-width segments that scroll horizontally on overflow
 *  - `icon`: icon + label segments
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  grow = false,
  scroll = false,
  className = "",
}: {
  options: readonly { value: T; label: string; icon?: ReactNode; title?: string }[];
  value: T;
  // NoInfer keeps T pinned to the option values, so a plain
  // `useState` setter (whose parameter is a wider SetStateAction) is accepted.
  onChange: (value: NoInfer<T>) => void;
  /** Equal-width segments (`flex-1`) — pair with `scroll` for long lists. */
  grow?: boolean;
  /** Scroll horizontally instead of wrapping, for many segments on phones. */
  scroll?: boolean;
  className?: string;
}) {
  const container = grow ? "flex items-center gap-1" : "flex flex-wrap items-center max-w-full";
  const overflow = scroll ? " overflow-x-auto hide-scrollbar" : "";

  return (
    <div
      className={`${container} gap-1 p-1 bg-surface rounded-[10px] border-2 border-border-ink font-mono text-xs font-semibold uppercase tracking-[0.06em]${overflow} ${className}`.trim()}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          title={opt.title}
          aria-label={opt.title ?? (opt.icon ? opt.label : undefined)}
          // cn/twMerge so the accent colour reliably overrides the segment's
          // idle colour instead of leaving both to the cascade.
          className={cn(
            "rounded-[8px] transition-colors cursor-pointer whitespace-nowrap min-h-9",
            grow ? "flex-1 px-2.5 py-1.5" : "px-2.5 py-1",
            opt.icon && "flex items-center justify-center gap-1",
            value === opt.value ? SEG_ACTIVE : SEG_IDLE,
          )}
        >
          {opt.icon ? <span className="shrink-0 flex items-center">{opt.icon}</span> : null}
          {opt.label ? <span className={opt.icon ? "hidden xs:inline" : ""}>{opt.label}</span> : null}
        </button>
      ))}
    </div>
  );
}

/**
 * Horizontal choice pills.
 *
 * `SegmentedControl` is a filter for values you can all see at once; this is a
 * picker for an ordered set that may run off the screen (months, categories,
 * years). Four copies of this strip existed before it was named: the old
 * calendar page and both modes of `AttendanceCalendarView`.
 *
 * Scrolls horizontally on overflow rather than wrapping, because an ordered
 * picker that reflows into two rows stops reading as a sequence. `options` is
 * `{ value, label }` and nothing else — the caller only supplies text.
 */
export function ChipTabs<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
}: {
  options: readonly { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizing = size === "sm" ? "text-xs px-2.5 py-1 min-h-9" : "text-[13px] px-3 py-1.5 min-h-11";

  return (
    <div
      role="tablist"
      className={`flex w-full items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pr-1 ${className}`.trim()}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[10px] border-2 border-border-ink font-mono font-semibold uppercase tracking-[0.06em] transition-colors cursor-pointer",
              sizing,
              active
                ? "bg-secondary text-secondary-foreground shadow-brutal-sm"
                : "bg-surface text-text-primary hover:bg-surface-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Vertical radio group with each option on its own line.
 *
 * Each option is rendered as a clean card row with an accessible radio
 * indicator, title, and optional description.
 */
export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  name,
  className = "",
}: {
  options: readonly {
    value: T;
    label: ReactNode;
    description?: ReactNode;
    title?: string;
    icon?: ReactNode;
  }[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  name?: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("flex flex-col gap-2 w-full", className)}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <label
            key={opt.value}
            title={opt.title}
            className={cn(
              "flex items-start gap-3 p-3 min-h-11 rounded-[10px] border-2 border-border-ink transition-colors cursor-pointer select-none text-left",
              isSelected
                ? "bg-secondary text-secondary-foreground shadow-brutal-sm"
                : "bg-surface hover:bg-surface-secondary",
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border-ink transition-colors",
                isSelected ? "bg-text-primary" : "bg-surface",
              )}
              aria-hidden="true"
            >
              {isSelected ? <span className="h-2 w-2 rounded-full bg-surface" /> : null}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
                <span
                  className={cn(
                    "text-xs sm:text-sm font-bold tracking-tight block truncate",
                    isSelected ? "text-secondary-foreground" : "text-text-heading",
                  )}
                >
                  {opt.label}
                </span>
              </div>
              {opt.description ? (
                <p
                  className={cn(
                    "text-xs leading-relaxed mt-0.5",
                    isSelected ? "text-secondary-foreground" : "text-text-muted",
                  )}
                >
                  {opt.description}
                </p>
              ) : null}
            </div>
          </label>
        );
      })}
    </div>
  );
}
