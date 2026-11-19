"use client";

import { useState, useMemo } from "react";
import { useAtom } from "jotai";
import { CheckCircle2, Clock, History, ArrowRight } from "lucide-react";
import { pomodoroSessionsAtom } from "@/store/dataAtoms";
import { getTodayAttendanceDay } from "@/lib/attendanceTimetable";
import type { Task } from "@/types/tasks";
import PomodoroTimer from "./PomodoroTimer";
import SelectField from "../shared/primitives/SelectField";
import { clickable } from "@/lib/a11y";

interface FocusPageProps {
  tasks: Task[];
  onCycleStatus: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export default function FocusPage({ tasks, onCycleStatus, onEditTask }: FocusPageProps) {
  const [sessions] = useAtom(pomodoroSessionsAtom);
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || "");

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  // Today's scheduled chunks
  const today = getTodayAttendanceDay();
  const todayUpcomingChunks = useMemo(() => {
    const list: { task: Task; start: string; end: string }[] = [];
    activeTasks.forEach((t) => {
      (t.schedule || []).forEach((c) => {
        if (c.day === today) {
          list.push({ task: t, start: c.start, end: c.end });
        }
      });
    });
    return list.sort((a, b) => a.start.localeCompare(b.start));
  }, [activeTasks, today]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      {/* Task Selector & Hero Card */}
      <div className="rounded-[14px] card-surface border-2 border-border-ink p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-outfit">
              Distraction-Free Focus
            </span>
            <h3 className="text-lg font-bold text-text-heading font-outfit">
              {selectedTask ? selectedTask.title : "Standalone Focus Mode"}
            </h3>
          </div>

          {/* Quick task picker dropdown */}
          <div className="min-w-48">
            <SelectField
              value={selectedTaskId}
              onChange={(val) => setSelectedTaskId(val)}
              options={[
                { value: "", label: "Standalone (No task bound)" },
                ...activeTasks.map((t) => ({
                  value: t.id,
                  label: `${t.title}${t.courseCode ? ` (${t.courseCode})` : ""}`,
                })),
              ]}
              searchable
              stacked
              role="group"
              aria-label="Task to focus on"
            />
          </div>
        </div>

        {/* Selected Task Details Pill */}
        {selectedTask && (
          <div className="mb-4 p-3 rounded-2xl bg-surface-secondary border-2 border-border-ink flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {selectedTask.courseCode && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface border-2 border-border-ink text-text-primary shrink-0">
                  {selectedTask.courseCode}
                </span>
              )}
              <span className="text-xs text-text-muted truncate">{selectedTask.notes || "No notes"}</span>
            </div>

            <button
              type="button"
              onClick={() => onCycleStatus(selectedTask.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-surface hover:bg-success-surface text-success-foreground text-xs font-bold transition-all cursor-pointer shrink-0 border border-border-ink"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
          </div>
        )}

        {/* Pomodoro Timer */}
        <PomodoroTimer task={selectedTask} onSessionComplete={() => {}} />
      </div>

      {/* Up Next From Today's Chunks */}
      {todayUpcomingChunks.length > 0 && (
        <div className="rounded-2xl bg-surface border-2 border-border-ink p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Up Next Today ({today})
            </span>
            <span className="text-xs text-text-muted">{todayUpcomingChunks.length} scheduled slots</span>
          </div>

          <div className="space-y-2">
            {todayUpcomingChunks.map(({ task, start, end }, idx) => (
              <div
                key={idx}
                {...clickable(() => setSelectedTaskId(task.id))}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                  selectedTaskId === task.id
                    ? "bg-secondary border-border-ink text-secondary-foreground dark:text-primary"
                    : "bg-surface border-border-ink text-text-primary hover:border-border-ink"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-text-muted shrink-0">
                    {start} – {end}
                  </span>
                  <span className="font-bold truncate">{task.title}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {sessions && sessions.length > 0 && (
        <div className="rounded-2xl bg-surface border-2 border-border-ink p-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5 mb-2">
            <History className="w-3.5 h-3.5 text-text-muted" />
            Recent Focus Sessions
          </span>
          <div className="divide-y divide-border-muted dark:divide-border-muted text-xs">
            {sessions
              .slice(-3)
              .reverse()
              .map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary">
                      {s.roundsDone} rounds ({s.roundsDone * s.focusMin}m focus)
                    </span>
                    <p className="text-xs text-text-muted">
                      {new Date(s.startedAt).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-success-foreground bg-success-surface px-2 py-0.5 rounded-md border border-border-ink">
                    Completed
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
