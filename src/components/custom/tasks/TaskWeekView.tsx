"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { ATTENDANCE_DAYS, AttendanceDay } from "@/lib/attendanceTimetable";
import { detectChunkOverlaps } from "@/lib/taskMatch";
import type { Task, WeekChunk } from "@/types/tasks";
import { KIND_CONFIG } from "./TaskCard";
import { clickable } from "@/lib/a11y";

interface TaskWeekViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: (day?: AttendanceDay) => void;
}

export default function TaskWeekView({ tasks, onEdit, onNewTask }: TaskWeekViewProps) {
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);
  const overlaps = useMemo(() => detectChunkOverlaps(tasks), [tasks]);

  // Map tasks by day
  const dayScheduleMap = useMemo(() => {
    const map: Record<AttendanceDay, { chunk: WeekChunk; task: Task }[]> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
    };

    activeTasks.forEach((task) => {
      (task.schedule || []).forEach((chunk) => {
        if (map[chunk.day]) {
          map[chunk.day].push({ chunk, task });
        }
      });
    });

    // Sort chunks within each day by start time
    Object.keys(map).forEach((d) => {
      map[d as AttendanceDay].sort((a, b) => a.chunk.start.localeCompare(b.chunk.start));
    });

    return map;
  }, [activeTasks]);

  return (
    <div className="space-y-4 text-left">
      {/* Overlap warnings banner */}
      {overlaps.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-warning-surface border border-border-ink text-warning-foreground text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-warning-foreground" />
            <span>
              {overlaps.length} schedule conflict{overlaps.length === 1 ? "" : "s"} detected across tasks.
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider bg-warning-surface px-2 py-0.5 rounded-md">
            Overlapping chunks
          </span>
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {ATTENDANCE_DAYS.map((day) => {
          const items = dayScheduleMap[day];

          return (
            <div
              key={day}
              className="flex flex-col rounded-2xl bg-surface-secondary border-2 border-border-ink p-3 min-h-[220px]"
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border-ink mb-2">
                <span className="font-label text-xs font-bold text-text-primary">{day}</span>
                <span className="text-xs font-bold px-1.5 py-0.2 rounded-[10px] bg-surface text-text-muted border-2 border-border-ink min-h-9">
                  {items.length}
                </span>
              </div>

              {/* Day Chunks */}
              <div className="space-y-2 flex-1">
                {items.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-center">
                    <button
                      type="button"
                      onClick={() => onNewTask(day)}
                      className="text-xs font-bold text-text-muted hover:text-primary cursor-pointer"
                    >
                      + Schedule
                    </button>
                  </div>
                ) : (
                  items.map(({ chunk, task }, idx) => {
                    const meta = KIND_CONFIG[task.kind] || KIND_CONFIG.homework;
                    const hasConflict = overlaps.some(
                      (o) =>
                        (o.taskA.id === task.id && o.chunkA === chunk) ||
                        (o.taskB.id === task.id && o.chunkB === chunk),
                    );

                    return (
                      <div
                        key={`${task.id}-${idx}`}
                        {...clickable(() => onEdit(task))}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] bg-surface shadow-2xs ${
                          hasConflict ? "border-border-ink ring-1 ring-amber-500/20" : "border-border-ink"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-text-muted mb-1">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-2.5 h-2.5 text-primary" />
                            {chunk.start} – {chunk.end}
                          </span>
                          {hasConflict && <span className="text-warning-foreground font-bold">!</span>}
                        </div>

                        <h5 className="text-xs font-bold text-text-heading truncate font-outfit">{task.title}</h5>

                        <div className="flex items-center gap-1 mt-1.5">
                          <span
                            className={`text-xs font-bold uppercase px-1.5 py-0.2 rounded border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          {task.courseCode && (
                            <span className="text-xs font-bold text-text-muted bg-surface-secondary px-1 py-0.2 rounded truncate">
                              {task.courseCode}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
