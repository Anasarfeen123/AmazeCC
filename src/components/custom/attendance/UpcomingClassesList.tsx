"use client";

import { useState, useMemo } from "react";
import { getTargetAttendancePct } from "@/store/settingsAtoms";
import { normalize, getEffectiveState } from "@/lib/attendanceRemainingClasses";
import { clickable } from "@/lib/a11y";

export interface UpcomingClassesListProps {
  classes: any[];
  attendedClasses?: number;
  totalClasses?: number;
  isLab?: boolean;
  impDates?: any;
  isDayscholarWithBus?: boolean;
}

export default function UpcomingClassesList({
  classes,
  attendedClasses = 0,
  totalClasses = 0,
  isLab = false,
  impDates,
  isDayscholarWithBus,
}: UpcomingClassesListProps) {
  const [dayStates, setDayStates] = useState<Record<number, number>>({});
  const CLASS_WEIGHT = isLab ? 2 : 1;

  if (!classes || classes.length === 0) {
    return <p className="text-text-muted text-xs text-center py-4">No upcoming classes 🎉</p>;
  }

  const lockDates = useMemo(() => {
    const locked = new Set<number>();
    if (!classes || classes.length === 0) return locked;

    const isThuOrFri = (d: Date) => {
      const day = d.getDay();
      return day === 4 || day === 5;
    };

    const lastTwo = classes.slice(-2);

    lastTwo.forEach((day) => {
      const d = day.fullDate;
      if (isThuOrFri(d) && impDates?.lidLabDate && (impDates.lidLabDate as any) - (d as any) > 7) {
        locked.add(normalize(d));
      }
    });

    return locked;
  }, [classes, impDates]);

  const toggleAttendance = (time: number) => {
    setDayStates((prev) => {
      const effectiveState = getEffectiveState(time, prev, lockDates);
      const nextState = (effectiveState + 1) % 3;
      return { ...prev, [time]: nextState };
    });
  };

  let attending = 0;
  let missed = 0;

  classes.forEach((day) => {
    const time = normalize(day.fullDate);
    const state = getEffectiveState(time, dayStates, lockDates);

    if (state === 0) attending += CLASS_WEIGHT;
    if (state === 1) missed += CLASS_WEIGHT;
  });

  const upcomingCount = attending + missed;
  const predictedAttended = attendedClasses + attending;
  const predictedTotal = totalClasses + upcomingCount;
  const predictedPercent: number =
    predictedTotal > 0 ? parseFloat(((predictedAttended / predictedTotal) * 100).toFixed(1)) : 0;

  const thresholdPct = getTargetAttendancePct();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium bg-surface-secondary p-4 rounded-xl border border-border-ink">
        <div className="flex gap-4">
          <span className="text-success-foreground">
            Attending: <strong>{attending}</strong>
          </span>
          <span className="text-danger-foreground">
            Skipping: <strong>{missed}</strong>
          </span>
        </div>
        <div
          className={`px-3 py-1 rounded-[10px] border ${
            predictedPercent >= thresholdPct
              ? "bg-emerald-100 text-success-foreground border-border-ink dark:text-success-foreground dark:border-emerald-800/50"
              : "bg-red-100 text-danger-foreground border-border-ink dark:text-danger-foreground dark:border-red-800/50"
          } min-h-9`}
        >
          Predicted: {predictedPercent}%
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 text-xs">
        {classes.map((day, i) => {
          const time = normalize(day.fullDate);
          const state = getEffectiveState(time, dayStates, lockDates);
          const d = new Date(day.fullDate);
          const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          const weekday = d.toLocaleDateString("en-IN", { weekday: "short" });

          const isSkipped = state === 1;
          const isIgnored = state === 2;

          return (
            <div
              key={i}
              {...clickable(() => toggleAttendance(time))}
              className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center cursor-pointer select-none transition-all duration-150 ${
                isSkipped
                  ? "bg-red-50/50 border-border-ink text-danger-foreground dark:text-danger-foreground"
                  : isIgnored
                    ? "bg-surface-secondary border-border-ink text-text-muted opacity-50"
                    : "bg-surface border-border-ink text-text-primary hover:border-border-ink dark:hover:border-border-ink"
              }`}
            >
              <span className={`font-bold text-xs ${isSkipped ? "text-danger-foreground" : "text-text-primary"}`}>
                {dateStr}
              </span>
              <span
                className={`text-xs uppercase font-bold tracking-wider mt-0.5 opacity-60 ${
                  isSkipped ? "text-danger-foreground" : "text-text-muted"
                }`}
              >
                {weekday}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export { UpcomingClassesList };
