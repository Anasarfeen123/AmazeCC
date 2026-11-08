"use client";

import { useMemo } from "react";
import { courseColor } from "@amazecontinuityprojects/amazeui";
import { cn } from "@/lib/utils";

/** count: 0 no class · 1 present · 2 absent · 3 on duty (the old heatmap's encoding). */
interface Point {
  date: string;
  count: number;
}

const ROWS = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
  { dow: 0, label: "Sun" },
];

function key(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Calm Notebook attendance heatmap: weeks run left to right, days top to
 * bottom, every class day filled in the course's own colour, absences in
 * danger red and on-duty in amber. Weekend rows only appear when a class
 * actually met on them, and sit quieter than the teaching week. It always fits
 * the card width: cells are fractions of the row, never a fixed pixel size.
 */
export default function AttendanceHeatmap({
  data,
  start,
  end,
  course,
  className,
}: {
  data: Point[];
  start: Date;
  end: Date;
  course: string;
  className?: string;
}) {
  const model = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const p of data) {
      const d = new Date(p.date);
      if (!Number.isNaN(d.getTime())) byDate.set(key(d), p.count);
    }
    // Trim the range to the weeks that actually hold classes, plus today.
    const dates = [...byDate.keys()].map((k) => new Date(k)).sort((a, b) => a.getTime() - b.getTime());
    const today = new Date();
    const from = new Date(dates[0] ?? start);
    // Run to today only while today is still close to the record; an old
    // record (a past semester, the demo) ends at its last class instead.
    const last = (dates[dates.length - 1] ?? end).getTime();
    const twoWeeks = 14 * 24 * 3600 * 1000;
    const to = new Date(today.getTime() - last <= twoWeeks ? Math.min(today.getTime(), end.getTime()) : last);
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7)); // back to Monday
    const weeks: Date[] = [];
    for (let w = new Date(from); w <= to; w.setDate(w.getDate() + 7)) weeks.push(new Date(w));
    const usedDow = new Set<number>();
    for (const d of dates) usedDow.add(d.getDay());
    const rows = ROWS.filter((r) => (r.dow >= 1 && r.dow <= 5 ? true : usedDow.has(r.dow)));
    const counts = { present: 0, absent: 0, od: 0 };
    for (const v of byDate.values()) {
      if (v === 1) counts.present++;
      else if (v === 2) counts.absent++;
      else if (v === 3) counts.od++;
    }
    return { byDate, weeks, rows, counts, today: key(today) };
  }, [data, start, end]);

  if (model.weeks.length === 0) return null;
  const hue = courseColor(course || "x");
  let lastMonth = -1;

  return (
    <div className={cn("w-full text-left", className)}>
      <div
        className="grid items-center gap-[3px]"
        style={{ gridTemplateColumns: `2rem repeat(${model.weeks.length}, minmax(0, 22px))` }}
      >
        <span />
        {model.weeks.map((w) => {
          const m = w.getMonth();
          const show = m !== lastMonth;
          lastMonth = m;
          return (
            <span
              key={`m-${key(w)}`}
              className="h-4 overflow-visible whitespace-nowrap font-mono text-[10.5px] text-muted"
            >
              {show ? w.toLocaleDateString("en-GB", { month: "short" }) : ""}
            </span>
          );
        })}
        {model.rows.map((r) => {
          const weekend = r.dow === 0 || r.dow === 6;
          return [
            <span
              key={`l-${r.dow}`}
              className={cn("font-mono text-[10.5px]", weekend ? "text-muted/70" : "text-muted")}
            >
              {r.label}
            </span>,
            ...model.weeks.map((w) => {
              const d = new Date(w);
              d.setDate(d.getDate() + ((r.dow + 6) % 7));
              const k = key(d);
              const v = model.byDate.get(k) ?? 0;
              const status = v === 1 ? "Present" : v === 2 ? "Absent" : v === 3 ? "On duty" : "No class";
              return (
                <span
                  key={k}
                  title={`${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${status}`}
                  className={cn(
                    "aspect-square w-full rounded-[3px]",
                    v === 0 && "bg-surface-2",
                    v === 0 && weekend && "opacity-50",
                    v === 2 && "bg-danger",
                    v === 3 && "bg-warn",
                    k === model.today && "ring-1 ring-ink ring-offset-1 ring-offset-surface",
                  )}
                  style={v === 1 ? { background: hue } : undefined}
                />
              );
            }),
          ];
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: hue }} /> Present {model.counts.present}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-danger" /> Absent {model.counts.absent}
        </span>
        {model.counts.od > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-warn" /> On duty {model.counts.od}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-surface-2" /> No class
        </span>
      </div>
    </div>
  );
}
