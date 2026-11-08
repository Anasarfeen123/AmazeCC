"use client";

import { useMemo } from "react";
import { courseColor } from "@amazecontinuityprojects/amazeui";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { getAttendanceTimeRange } from "@/lib/attendanceTimetable";
import { cn } from "@/lib/utils";

interface Card {
  courseCode?: string;
  courseTitle?: string;
  slotName?: string;
  time?: string;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LABEL: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

function hh(min: number) {
  return String(Math.floor(min / 60)).padStart(2, "0");
}

/**
 * A responsive week viewer: a vertical, day-by-day agenda on phones and a
 * weekly slot matrix on desktop. Course hues identify each session, while the
 * current class is outlined and earlier sessions today fade back.
 */
export default function WeekSlotMap({
  map,
  today,
  now,
  selectedDay,
  onSelectDay,
  onOpenCourse,
  onExpand,
  className,
}: {
  map: Partial<Record<string, Card[]>>;
  today: string;
  now: Date;
  selectedDay?: string;
  onSelectDay?: (day: string) => void;
  onOpenCourse?: (courseCode: string) => void;
  onExpand?: () => void;
  className?: string;
}) {
  const grid = useMemo(() => {
    const rows = DAYS.map((d) => ({
      day: d,
      blocks: (map[d] || [])
        .map((c) => ({ c, ...getAttendanceTimeRange(c.time || "") }))
        .filter((b) => b.end > b.start),
    })).filter((r) => r.blocks.length > 0 || !["SAT", "SUN"].includes(r.day));
    const starts = new Set<number>();
    for (const r of rows) for (const b of r.blocks) starts.add(b.start);
    // A lab's second period starts ~50 min in; make sure it gets its own column.
    for (const r of rows)
      for (const b of r.blocks) if (b.end - b.start > 70) starts.add(b.start + Math.round((b.end - b.start) / 2));
    const cols = [...starts].sort((a, b) => a - b).filter((m, i, arr) => i === 0 || m - arr[i - 1] >= 30);
    const totalMin = rows.reduce((acc, r) => acc + r.blocks.reduce((a, b) => a + (b.end - b.start), 0), 0);
    const count = rows.reduce((acc, r) => acc + r.blocks.length, 0);
    return { rows, cols, totalMin, count };
  }, [map]);

  if (grid.count === 0 || grid.cols.length === 0) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  // Hour labels under the grid: only where the hour changes, so they never crowd.
  let lastHour = "";

  return (
    <section aria-label="This week" className={cn("text-left", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pb-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <Clock3 aria-hidden="true" className="h-3 w-3" />
            Weekly rhythm
          </div>
          <h2 className="text-lg font-semibold leading-tight tracking-tight text-ink">This week</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5">
            <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">{grid.count}</span>
            <span className="text-[11px] text-muted">classes</span>
            <span className="h-4 w-px bg-line" />
            <span className="font-mono text-[12px] font-medium tabular-nums text-ink-2">
              {Math.round(grid.totalMin / 60)}h
            </span>
          </div>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12px] font-semibold text-surface transition-colors duration-[120ms] hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Expand timetable"
              title="Open the full weekly timetable"
            >
              <span>Full view</span>
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
        <div className="overflow-x-auto overscroll-x-contain p-3 sm:p-4">
          <div
            className="grid items-center gap-x-1.5 gap-y-2.5"
            style={{
              gridTemplateColumns: `3.5rem repeat(${grid.cols.length}, minmax(78px, 1fr))`,
              minWidth: `${56 + grid.cols.length * 84}px`,
            }}
          >
            {grid.rows.map((r) => {
              const isToday = r.day === today;
              const isWeekend = r.day === "SAT" || r.day === "SUN";
              const isSelected = selectedDay === r.day;
              return [
                <button
                  key={`${r.day}-label`}
                  type="button"
                  onClick={() => onSelectDay?.(r.day)}
                  aria-label={`${DAY_LABEL[r.day]}${isToday ? ", today" : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex h-12 items-center gap-1.5 rounded-lg px-1.5 text-left font-mono text-[11px] transition-colors duration-[120ms]",
                    isSelected || isToday
                      ? "bg-accent/10 font-semibold text-ink"
                      : isWeekend
                        ? "bg-surface-2 font-semibold text-ink-2"
                        : "text-muted",
                  )}
                  title={isToday ? "Today" : DAY_LABEL[r.day]}
                >
                  {isToday && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  {DAY_LABEL[r.day]}
                </button>,
                ...grid.cols.map((col) => {
                  const b = r.blocks.find((x) => col >= x.start && col < x.end);
                  if (!b) {
                    return (
                      <span
                        key={`${r.day}-${col}`}
                        aria-hidden="true"
                        className={cn(
                          "h-12 rounded-lg border border-line/70 bg-surface-2/55",
                          isWeekend && "border-line bg-surface-2",
                        )}
                      />
                    );
                  }
                  const code = String(b.c.courseCode || b.c.slotName || "x");
                  const live = isToday && mins >= b.start && mins < b.end;
                  const past = isToday && mins >= b.end;
                  return (
                    <button
                      key={`${r.day}-${col}`}
                      type="button"
                      onClick={() => {
                        onSelectDay?.(r.day);
                        if (b.c.courseCode) onOpenCourse?.(b.c.courseCode);
                      }}
                      title={`${DAY_LABEL[r.day]} ${hh(b.start)}:${String(b.start % 60).padStart(2, "0")} · ${b.c.courseTitle || code}${b.c.slotName ? ` · ${b.c.slotName}` : ""}`}
                      aria-label={`${DAY_LABEL[r.day]}, ${b.c.courseTitle || code}, open course details`}
                      className={cn(
                        "flex h-12 min-w-0 items-center justify-center overflow-hidden rounded-lg border border-white/35 px-1.5 text-[11px] font-bold tracking-tight text-white shadow-sm transition duration-150 hover:brightness-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:text-xs",
                        past && "opacity-45",
                        live && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
                      )}
                      style={{ background: courseColor(code) }}
                    >
                      {col === b.start ? <span className="truncate drop-shadow-sm">{code}</span> : null}
                    </button>
                  );
                }),
              ];
            })}
            <span />
            {grid.cols.map((col) => {
              const h = hh(col);
              const show = h !== lastHour;
              lastHour = h;
              return (
                <span key={`h-${col}`} className="pt-0.5 font-mono text-[10px] font-medium text-muted">
                  {show ? `${h}:00` : ""}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-[10px] text-muted sm:px-4">
          <span>Tap a day to open its timetable</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Today
          </span>
        </div>
      </div>
    </section>
  );
}
