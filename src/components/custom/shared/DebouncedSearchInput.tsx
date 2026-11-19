"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * A search field that keeps its own text and reports it to the parent only
 * after the user pauses (default 150ms).
 *
 * Why: in the FFCS planner the query state lived in a 4,700-line component, so
 * every keystroke re-rendered the whole planner and redrew up to 100 results;
 * typing "BCSE" froze the page for ~460ms in dev (150–180ms per key). With this
 * the parent re-renders once per pause, not once per letter.
 */
export default function DebouncedSearchInput({
  value,
  onChange,
  placeholder = "Search",
  delay = 150,
  autoFocus,
  className = "",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  delay?: number;
  autoFocus?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<number | null>(null);
  const last = useRef(value);

  // Follow outside resets (e.g. the parent clears the query).
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => () => (timer.current ? window.clearTimeout(timer.current) : undefined), []);

  const push = (next: string, now = false) => {
    if (timer.current) window.clearTimeout(timer.current);
    const fire = () => {
      last.current = next;
      onChange(next);
    };
    if (now) fire();
    else timer.current = window.setTimeout(fire, delay);
  };

  return (
    <label
      className={`flex min-h-11 items-center gap-2 rounded-[10px] border-2 border-border-ink bg-surface pl-3 pr-1 ${className}`.trim()}
    >
      <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
      <input
        type="text"
        value={text}
        autoFocus={autoFocus}
        aria-label={ariaLabel ?? placeholder}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          push(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") push(text, true);
        }}
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-primary outline-none placeholder:text-text-muted focus-visible:outline-none sm:text-sm"
      />
      {text ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            push("", true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-text-muted hover:bg-surface-secondary hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
