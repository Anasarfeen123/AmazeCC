"use client";

/**
 * Sidebar footer theme switch: Light / Dark / Black (R7). Replaces AmazeUI's
 * two-option SidebarThemeControl until the brand layer moves into AmazeUI
 * (ROADMAP R9). Lives inside `.brand-sidebar`, so it uses that panel's
 * tokens; the current choice is an ochre chip.
 */
import { Moon, MoonStar, Sun } from "lucide-react";

const OPTIONS = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["black", "Black"],
] as const;

export default function SidebarThemeSwitch({
  theme,
  onThemeChange,
  compact = false,
  className = "",
}: {
  theme?: string;
  onThemeChange: (theme: string, e?: React.MouseEvent<HTMLElement>) => void;
  /** Collapsed rail: one button that cycles Light -> Dark -> Black. */
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    const i = Math.max(
      0,
      OPTIONS.findIndex(([v]) => v === (theme ?? "dark")),
    );
    const [, label] = OPTIONS[i];
    const [nextValue, nextLabel] = OPTIONS[(i + 1) % OPTIONS.length];
    const Icon = i === 0 ? Sun : i === 1 ? Moon : MoonStar;
    return (
      <button
        type="button"
        onClick={(e) => onThemeChange(nextValue, e)}
        aria-label={`Theme: ${label}. Switch to ${nextLabel}`}
        title={`Theme: ${label} (switch to ${nextLabel})`}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press ${className}`.trim()}
      >
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" className={`flex items-center gap-1 ${className}`.trim()}>
      <span className="mr-auto font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">Theme</span>
      {OPTIONS.map(([value, label]) => {
        const on = (theme ?? "dark") === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={(e) => !on && onThemeChange(value, e)}
            className={`min-h-8 rounded-[6px] border-2 px-1.5 font-mono text-xs font-bold uppercase tracking-[0.04em] transition-colors ${
              on
                ? "border-obsidian bg-ochre text-obsidian"
                : "border-transparent text-text-primary hover:border-border-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
