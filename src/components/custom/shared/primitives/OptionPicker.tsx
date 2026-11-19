"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@amazecontinuityprojects/amazeui";
import { useFocusTrap } from "@/lib/useFocusTrap";

/**
 * The option picker, owned by this repo.
 *
 * This is amazeui's `OptionPicker` re-homed, not redesigned: same props, same trigger,
 * same list, same search. It exists because two defects live in the amazeui internals
 * and that package is a published dependency this repo must never patch:
 *
 * 1. **Stacking.** The popup portal paints at `z-50`. Anything above it — the
 *    `BottomSheet` shell (`z-55`/`z-60`), fullscreen modals, and (until it was
 *    lowered) the mobile bottom nav (`z-55`) — buries the popup *and* its backdrop.
 *    A picker inside a sheet opened underneath its own host: invisible list,
 *    untappable backdrop. This version paints at `z-[70]`: above every sheet, and no
 *    picker currently lives inside anything higher. If one ever lands inside a
 *    `z-100`+ modal, that call site needs a non-overlay control (`SegmentedControl`,
 *    `ChipTabs`), not a bigger number here — see the note on `SelectField`.
 * 2. **Mobile dismiss.** Under 768px amazeui renders a bottom-sheet-style modal whose
 *    dim layer carries no tap handler, so outside-tap never dismisses there — only
 *    Escape and option-select do. Both variants here dismiss on backdrop tap *and*
 *    Escape.
 *
 * Deliberately *not* changed from the original, so the ~25 call sites behave
 * identically: the trigger keeps its hard-coded chrome (callers restyle through the
 * wrapper, see `OPTION_PICKER_TRIGGER`), options stay `<button>`s, the search filter
 * still matches label and value case-insensitively, and `disabled` gates the whole
 * field. Visual classes are untouched too —
 * this migration is about the overlay mechanics, not a retint.
 */

export interface OptionPickerOption {
  value: string;
  label: string;
}

interface OptionPickerProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionPickerOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

/** Overlay chrome shared by both width variants. */
const OVERLAY_Z = "z-[70]";

const OptionPicker = forwardRef<HTMLDivElement, OptionPickerProps>(function OptionPicker(
  {
    className,
    value,
    onChange,
    options,
    placeholder = "Select...",
    searchable = true,
    disabled = false,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open && isMobile, triggerRef);
  // null until measured: the panel is never painted at (0, 0). It used to
  // start there and jump to the trigger a frame later, which read as the
  // dropdown flying in from the top-left corner.
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    above: boolean;
  } | null>(null);
  const [mobilePopupHeight, setMobilePopupHeight] = useState(600);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  const measure = useCallback(() => {
    if (isMobile) {
      setMobilePopupHeight(Math.min(640, window.innerHeight * 0.85));
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const margin = 12;
    const below = Math.max(80, window.innerHeight - rect.bottom - margin - gap);
    const above = Math.max(80, rect.top - margin - gap);
    const wanted = Math.min(320, options.length * 48 + (searchable ? 56 : 0) + 12);
    const openAbove = below < wanted && above > below;
    const maxHeight = Math.min(320, openAbove ? above : below);
    const width = Math.max(rect.width, 240);
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
    setPosition({
      top: openAbove ? rect.top - gap : rect.bottom + gap,
      left,
      width,
      maxHeight,
      above: openAbove,
    });
  }, [isMobile, options.length, searchable]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Escape dismisses on both variants. amazeui only had it on the mobile modal
  // (via `onRequestClose`); the desktop portal had no key handling at all.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  const handleSelect = (opt: OptionPickerOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const listContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {searchable && (
        <div className="relative shrink-0 border-b-2 border-border-ink bg-surface-secondary">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search options"
            aria-label="Search options"
            autoFocus
            className="w-full bg-transparent pl-10 pr-11 py-3.5 text-sm text-text-primary outline-none focus-visible:outline-none placeholder:text-text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-text-muted hover:text-text-primary hover:bg-surface"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 space-y-1 touch-pan-y"
        role="listbox"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-text-muted">Nothing matches that.</p>
          </div>
        ) : (
          filtered.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "flex w-full flex-row items-center gap-3 px-3 py-2.5 min-h-11 rounded-[10px] border-2 text-left cursor-pointer transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground border-border-ink font-semibold"
                    : "border-transparent text-text-primary hover:bg-surface-secondary",
                )}
              >
                <span className={cn("text-sm flex-1", active ? "font-semibold" : "font-medium")}>{opt.label}</span>
                {active && <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-label="Selected" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          "flex flex-row items-center justify-between gap-2 h-11 w-full rounded-[10px] border-2 border-border-ink bg-surface px-3 py-1 text-sm text-text-primary",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-surface-secondary",
          !selected && "text-text-muted",
        )}
      >
        <span className="truncate text-sm">{selected ? selected.label : placeholder}</span>
        {/* Sized in em so it follows the trigger's text size (xs pickers are
            24px tall; a fixed 32px box overflowed them). */}
        <ChevronDown
          aria-hidden
          strokeWidth={2.5}
          className={`h-[1.1em] w-[1.1em] shrink-0 text-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        !isMobile &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Dismiss options"
              onClick={() => setOpen(false)}
              className={`fixed inset-0 ${OVERLAY_Z} cursor-default bg-transparent border-none p-0`}
            />
            <div
              className={cn(
                `fixed ${OVERLAY_Z} flex flex-col bg-popover border-2 border-border-ink rounded-[14px] shadow-brutal-md overflow-hidden`,
                "animate-in fade-in duration-150",
                position.above ? "slide-in-from-bottom-1" : "slide-in-from-top-1",
              )}
              style={{
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
                ...(position.above ? { bottom: window.innerHeight - position.top } : { top: position.top }),
              }}
            >
              {listContent}
            </div>
          </>,
          document.body,
        )}

      {open &&
        isMobile &&
        typeof document !== "undefined" &&
        createPortal(
          <div className={`fixed inset-0 ${OVERLAY_Z} flex items-end justify-center`}>
            {/* The dim layer dismisses — amazeui's mobile modal had no tap handler
                here, so outside-tap did nothing on phones. */}
            <button
              type="button"
              aria-label="Dismiss options"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[color-mix(in_oklab,var(--shadow-ink)_55%,transparent)] border-none p-0 cursor-default"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Choose an option"
              className="relative flex w-full max-w-md min-h-0 flex-col bg-background rounded-t-[20px] border-[3px] border-b-0 border-border-ink overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 pb-[env(safe-area-inset-bottom,0px)]"
              style={{ height: mobilePopupHeight, maxHeight: "85dvh" }}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-border-ink px-4 py-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                  Choose one
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-text-primary hover:bg-surface-secondary"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1">{listContent}</div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
});

OptionPicker.displayName = "OptionPicker";

export default OptionPicker;
