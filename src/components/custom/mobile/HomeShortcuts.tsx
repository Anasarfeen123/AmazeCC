"use client";

import { useEffect, useState, type ElementType } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import { TONE_ICON_TILE } from "@/lib/uiTokens";

export interface HomeShortcut {
  key: string;
  label: string;
  Icon: ElementType;
  onClick: () => void;
}

const STORE = "amazecc_home_shortcuts";
export const DEFAULT_SHORTCUTS = ["timetable", "exams", "predictor", "rooms", "od", "classmates"];
const MAX = 8;

function readChosen(all: HomeShortcut[]): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "null");
    if (Array.isArray(raw)) {
      const keys = raw.filter((k): k is string => typeof k === "string" && all.some((s) => s.key === k));
      if (keys.length) return keys;
    }
  } catch {}
  return DEFAULT_SHORTCUTS.filter((k) => all.some((s) => s.key === k));
}

/**
 * Home shortcuts the student picks (owner: important buttons at the top, and
 * "add option to edit"). Phones: wrapping pills at the bottom of Home (owner:
 * move it to the bottom). Wide screens: a grid inside the "Your day" panel.
 * Edit turns the set into toggles (up to eight); the choice is saved on this
 * device.
 */
export default function HomeShortcuts({ all, variant }: { all: HomeShortcut[]; variant: "row" | "panel" }) {
  const [chosen, setChosen] = useState<string[]>(DEFAULT_SHORTCUTS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setChosen(readChosen(all));
    // `all` is rebuilt every render; the keys are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.map((s) => s.key).join(",")]);

  const toggle = (key: string) => {
    setChosen((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= MAX ? prev : [...prev, key];
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const shown = editing ? all : chosen.map((k) => all.find((s) => s.key === k)!).filter(Boolean);
  const editButton = (
    <button
      type="button"
      onClick={() => setEditing((e) => !e)}
      aria-pressed={editing}
      className={`inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 border-border-ink px-3 text-sm font-semibold brutal-press ${
        editing ? "bg-highlight text-highlight-foreground shadow-brutal-sm" : "bg-surface text-text-muted"
      }`}
    >
      {editing ? <Check className="h-4 w-4" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
      {editing ? "Done" : "Edit"}
    </button>
  );

  if (variant === "panel") {
    return (
      <section aria-label="Shortcuts" className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-title text-[15px] font-bold text-text-heading">Shortcuts</h3>
          {editButton}
        </div>
        {editing ? <p className="text-xs text-text-muted">Tap to add or remove. Up to {MAX}.</p> : null}
        <div className="grid grid-cols-2 gap-2">
          {shown.map(({ key, label, Icon, onClick }) => {
            const on = chosen.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={editing ? () => toggle(key) : onClick}
                aria-pressed={editing ? on : undefined}
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[12px] border-2 px-2.5 text-left brutal-press ${
                  editing && !on
                    ? "border-dashed border-border-ink bg-transparent text-text-muted"
                    : "border-border-ink bg-surface text-text-heading shadow-brutal-sm"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${TONE_ICON_TILE.indigo}`}
                >
                  {editing ? (
                    on ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden />
                    )
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 text-sm font-semibold leading-tight line-clamp-2">{label}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <nav aria-label="Shortcuts" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="font-title text-[15px] font-bold text-text-heading">Shortcuts</h2>
        {editButton}
      </div>
      {editing ? <p className="px-1 text-xs text-text-muted">Tap to add or remove. Up to {MAX}.</p> : null}
      <ul className="flex flex-wrap gap-2">
        {shown.map(({ key, label, Icon, onClick }) => {
          const on = chosen.includes(key);
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                onClick={editing ? () => toggle(key) : onClick}
                aria-pressed={editing ? on : undefined}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-border-ink px-3.5 text-sm font-semibold brutal-press ${
                  editing && !on
                    ? "border-dashed bg-transparent text-text-muted"
                    : "bg-surface text-text-heading shadow-brutal-sm"
                }`}
              >
                {editing ? (
                  on ? (
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden />
                  )
                ) : (
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                )}
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
