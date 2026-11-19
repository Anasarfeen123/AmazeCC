"use client";

import { useRef } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Bottom sheet for phones (the Modules / App Library sheet and friends).
 *
 * Brand version of AmazeUI 1.6's `AppLibrary`, same props, so swapping back
 * once AmazeUI is updated is a one-line import change. Differences:
 * - paper/charcoal surface with a 3px ink top edge, no glass or blur,
 * - a quick slide (180ms ease) instead of a soft spring,
 * - display-type title, 44px labelled close and back buttons,
 * - a brand search field with a 44px clear button,
 * - the scrim is ink at 55% and dismisses on tap.
 */
export interface BrandSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
}

export function BrandSheet({
  open,
  onClose,
  title,
  subtitle,
  showBack,
  onBack,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search modules",
  children,
  headerRight,
  className = "",
}: BrandSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);
  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 z-[55] bg-[color-mix(in_oklab,var(--shadow-ink)_55%,transparent)] md:hidden"
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className={`fixed bottom-0 left-0 right-0 z-[60] flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[20px] border-x-[3px] border-t-[3px] border-border-ink bg-background md:hidden ${className}`.trim()}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex w-full shrink-0 justify-center pt-2.5" aria-hidden>
              <div className="h-1.5 w-12 rounded-full bg-border-muted" />
            </div>

            <div className="shrink-0 border-b-2 border-border-ink px-4 pb-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {showBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      aria-label="Back"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-2 border-border-ink bg-highlight text-highlight-foreground"
                    >
                      <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                    </button>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl font-bold uppercase leading-none text-text-heading">
                      {title}
                    </h2>
                    {subtitle && <p className="mt-1 font-mono text-xs text-text-muted">{subtitle}</p>}
                  </div>
                </div>
                {headerRight}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            {onSearchChange && (
              <div className="shrink-0 border-b-2 border-border-muted px-4 py-3">
                <label className="flex min-h-11 items-center gap-2 rounded-[10px] border-2 border-border-ink bg-surface pl-3 pr-1">
                  <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    value={searchQuery || ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text-primary outline-none focus-visible:outline-none placeholder:text-text-muted"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange("")}
                      aria-label="Clear search"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </label>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 pb-36">{children}</div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BrandSheet;
