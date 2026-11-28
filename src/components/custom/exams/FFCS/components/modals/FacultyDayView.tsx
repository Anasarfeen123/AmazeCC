"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import type { AddedCourse, TimetablePeriod } from "@/lib/ffcsTypes";

/**
 * A faculty's week, one day at a time (teammate review, 2026-11-28: on a phone
 * the time x day grid scrolled both ways and the four-line time labels wasted
 * space). Day chips across the top, then that day's classes as a plain
 * vertical list in time order: "8:00–8:50 · A1 · CSE4068 · AB3-210".
 * Back-to-back lab periods of one course are joined into one entry.
 */

const DAY_CHIPS = [
  { id: "mon", short: "Mon", name: "Monday" },
  { id: "tue", short: "Tue", name: "Tuesday" },
  { id: "wed", short: "Wed", name: "Wednesday" },
  { id: "thu", short: "Thu", name: "Thursday" },
  { id: "fri", short: "Fri", name: "Friday" },
] as const;

/** "08:00 AM" / "8:00 AM" -> minutes after midnight. */
function minutes(t: string): number {
  const m = /(\d{1,2}):(\d{2})\s*([AP]M)?/i.exec(t);
  if (!m) return 0;
  let h = +m[1];
  if (m[3]?.toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3]?.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + +m[2];
}
const clock = (min: number) => `${((Math.floor(min / 60) + 11) % 12) + 1}:${String(min % 60).padStart(2, "0")}`;

interface Entry {
  start: number;
  end: number;
  slots: string[];
  course: AddedCourse;
}

export function entriesForDay(
  day: string,
  courses: AddedCourse[],
  periods: { theory: TimetablePeriod[]; lab: TimetablePeriod[] },
): Entry[] {
  const raw: Entry[] = [];
  for (const p of [...periods.theory, ...periods.lab]) {
    const slot = (p as unknown as { days?: Record<string, string> }).days?.[day];
    if (!slot) continue;
    const start = minutes(String((p as unknown as { start: string }).start));
    const end = minutes(String((p as unknown as { end: string }).end));
    for (const c of courses) {
      if ((c.slots ?? []).includes(slot)) raw.push({ start, end, slots: [slot], course: c });
    }
  }
  raw.sort((a, b) => a.start - b.start);
  // Join consecutive periods of the same course (L1 + L2 -> one lab block).
  const out: Entry[] = [];
  for (const e of raw) {
    const prev = out[out.length - 1];
    if (prev && prev.course.id === e.course.id && e.start - prev.end <= 10) {
      prev.end = Math.max(prev.end, e.end);
      prev.slots.push(...e.slots);
    } else out.push({ ...e, slots: [...e.slots] });
  }
  return out;
}

export default function FacultyDayView({
  courses,
  periods,
}: {
  courses: AddedCourse[];
  periods: { theory: TimetablePeriod[]; lab: TimetablePeriod[] };
}) {
  const byDay = useMemo(
    () => Object.fromEntries(DAY_CHIPS.map((d) => [d.id, entriesForDay(d.id, courses, periods)])),
    [courses, periods],
  ) as Record<string, Entry[]>;

  const [day, setDay] = useState<string>(() => {
    const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
    if (byDay[today]?.length) return today;
    return DAY_CHIPS.find((d) => byDay[d.id]?.length)?.id ?? "mon";
  });
  const list = byDay[day] ?? [];
  const dayName = DAY_CHIPS.find((d) => d.id === day)?.name ?? "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Day">
        {DAY_CHIPS.map((d) => {
          const on = d.id === day;
          const count = byDay[d.id]?.length ?? 0;
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setDay(d.id)}
              className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 text-xs font-semibold transition-colors ${
                on
                  ? "border-border-ink bg-text-primary text-background"
                  : "border-border-muted bg-surface text-text-heading hover:bg-surface-secondary"
              }`}
            >
              {d.short}
              <span className={`text-[12px] font-normal ${on ? "opacity-80" : "text-text-muted"}`}>
                {count ? `${count} class${count === 1 ? "" : "es"}` : "Free"}
              </span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-[12px] border-2 border-dashed border-border-muted p-4 text-center text-sm text-text-muted">
          No classes on {dayName}.
        </p>
      ) : (
        <ol className="space-y-2">
          {list.map((e, i) => (
            <li
              key={`${e.course.id}-${e.start}-${i}`}
              className="flex items-center gap-3 rounded-[12px] border-2 border-border-muted bg-surface px-3 py-2.5"
            >
              <div className="w-[4.5rem] shrink-0 text-xs font-bold leading-tight text-text-heading">
                <Clock className="mb-0.5 h-3.5 w-3.5 text-primary" aria-hidden />
                {clock(e.start)}–{clock(e.end)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-heading">{e.course.title || e.course.code}</p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
                  <span className="font-mono font-bold text-text-primary">{e.slots.join("+")}</span>
                  <span aria-hidden>·</span>
                  <span>{e.course.code}</span>
                  {e.course.venue && e.course.venue !== "TBA" ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {e.course.venue}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
