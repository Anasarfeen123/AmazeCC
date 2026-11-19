"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Clock, Plus, Trash2, Bell, Sparkles, Timer, AlertCircle, Layers } from "lucide-react";
import BottomSheet from "../shared/BottomSheet";
import { attendanceDataAtom } from "@/store/dataAtoms";
import { settingsAtom } from "@/store/settingsAtoms";
import { ATTENDANCE_DAYS, AttendanceDay } from "@/lib/attendanceTimetable";
import { sanitizeCourseCode, suggestPomodoros } from "@/lib/taskMatch";
import type { Task, TaskComponent, TaskKind, TaskStatus, WeekChunk } from "@/types/tasks";
import { TASK_KINDS } from "@/types/tasks";
import { KIND_CONFIG } from "./TaskCard";
import SelectField from "../shared/primitives/SelectField";

interface TaskEditSheetProps {
  task?: Task | null;
  initialCourseCode?: string;
  initialComponent?: TaskComponent;
  initialTitle?: string;
  initialStatus?: TaskStatus;
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: Partial<Task> & { title: string }) => void;
  onDelete?: (id: string) => void;
}

export default function TaskEditSheet({
  task,
  initialCourseCode = "",
  initialComponent = "both",
  initialTitle = "",
  initialStatus = "pending",
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TaskEditSheetProps) {
  const [attendanceData] = useAtom(attendanceDataAtom);
  const [settings] = useAtom(settingsAtom);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TaskKind>("homework");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [courseCode, setCourseCode] = useState("");
  const [component, setComponent] = useState<TaskComponent>("both");
  const [dueDate, setDueDate] = useState<string>("");
  const [reminders, setReminders] = useState<string[]>([]);
  const [customReminder, setCustomReminder] = useState<string>("");
  const [schedule, setSchedule] = useState<WeekChunk[]>([]);
  const [pomodoro, setPomodoro] = useState<{
    focusMin: number;
    breakMin: number;
    rounds: number;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Derive unique courses from attendance
  const enrolledCourses = React.useMemo(() => {
    const list = attendanceData?.attendance || [];
    const map = new Map<string, { code: string; title: string; slot?: string }>();
    for (const c of list) {
      const code = sanitizeCourseCode(c.courseCode || (c as any).code);
      if (!code) continue;
      if (!map.has(code)) {
        map.set(code, {
          code,
          title: c.courseTitle || (c as any).title || code,
          slot: c.slotName || (c as any).slot,
        });
      }
    }

    return Array.from(map.values());
  }, [attendanceData]);

  // Populate form on open or task change
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setKind(task.kind || "homework");
      setStatus(task.status || "pending");
      setCourseCode(task.courseCode || "");
      setComponent(task.component || "both");
      setDueDate(task.dueDate ? toLocalDatetime(task.dueDate) : "");
      setReminders(task.reminders || []);
      setSchedule(task.schedule || []);
      setPomodoro(task.pomodoro || null);
      setNotes(task.notes || "");
    } else {
      setTitle(initialTitle || "");
      setKind("homework");
      setStatus(initialStatus);
      setCourseCode(initialCourseCode || enrolledCourses[0]?.code || "");
      setComponent(initialComponent || "both");
      setDueDate("");
      setReminders([]);
      setSchedule([]);
      setPomodoro(null);
      setNotes("");
    }
    setError(null);
  }, [task, initialCourseCode, initialComponent, initialTitle, initialStatus, isOpen, enrolledCourses]);

  function toLocalDatetime(iso: string): string {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours(),
      )}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  }

  function toIsoDatetime(localStr: string): string | undefined {
    if (!localStr) return undefined;
    try {
      const d = new Date(localStr);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    } catch {
      return undefined;
    }
  }

  // Quick reminder offsets
  const addLeadReminder = (minutesBefore: number) => {
    if (!dueDate) return;
    const dueTime = new Date(dueDate).getTime();
    if (isNaN(dueTime)) return;
    const remTime = new Date(dueTime - minutesBefore * 60 * 1000).toISOString();
    if (!reminders.includes(remTime)) {
      setReminders([...reminders, remTime].sort());
    }
  };

  const handleAddCustomReminder = () => {
    if (!customReminder) return;
    const iso = toIsoDatetime(customReminder);
    if (iso && !reminders.includes(iso)) {
      setReminders([...reminders, iso].sort());
      setCustomReminder("");
    }
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  // Schedule chunk operations
  const addChunk = () => {
    setSchedule([...schedule, { day: "MON", start: "17:00", end: "18:00" }]);
  };

  const updateChunk = (index: number, patch: Partial<WeekChunk>) => {
    setSchedule(schedule.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeChunk = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleAutoSuggestPomodoro = () => {
    if (schedule.length > 0) {
      // Calculate minutes of first chunk
      const [sh, sm] = schedule[0].start.split(":").map(Number);
      const [eh, em] = schedule[0].end.split(":").map(Number);
      const mins = Math.max(15, eh * 60 + (em || 0) - (sh * 60 + (sm || 0)));
      const suggested = suggestPomodoros(mins, settings?.taskPomodoroFocus || 25, settings?.taskPomodoroBreak || 5);
      setPomodoro(suggested);
    } else {
      setPomodoro({
        focusMin: settings?.taskPomodoroFocus || 25,
        breakMin: settings?.taskPomodoroBreak || 5,
        rounds: settings?.taskPomodoroRounds || 4,
      });
    }
  };

  const handleSave = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Please enter a task title");
      return;
    }

    try {
      const payload: Partial<Task> & { title: string } = {
        title: cleanTitle,
        kind,
        status,
        completedAt: status === "done" ? task?.completedAt || new Date().toISOString() : undefined,
        courseCode: sanitizeCourseCode(courseCode),
        component,
        dueDate: toIsoDatetime(dueDate),
        reminders,
        schedule,
        pomodoro: pomodoro || undefined,
        notes: notes.trim() || undefined,
      };

      if (task?.id) {
        payload.id = task.id;
      }

      onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save task");
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      onClose={onClose}
      overlayId="task-edit-sheet"
      maxWidth="max-w-xl"
      title={task ? "Edit Task" : "New Task"}
      subtitle="Course-linked homework, tests & study items"
      icon={<Layers className="w-5 h-5" />}
      accent="bg-secondary text-secondary-foreground border-border-ink"
      closeLabel={task ? "Close edit task" : "Close new task"}
    >
      <div className="flex flex-col max-h-[85vh] text-left">
        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-danger-surface border border-border-ink text-danger-foreground text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
            >
              Task Title <span className="text-danger-foreground">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete DA 2, Study for CAT 1"
              className="w-full text-sm font-semibold rounded-xl bg-surface-secondary border-2 border-border-ink text-text-heading px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-border-ink"
            />
          </div>

          {/* Kind Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Type / Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TASK_KINDS.map((k) => {
                const isSelected = kind === k;
                const meta = KIND_CONFIG[k];
                const Icon = meta.icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-secondary border-border-ink text-secondary-foreground ring-1 ring-border-ink shadow-2xs"
                        : "bg-surface border-border-ink text-text-primary hover:border-border-ink "
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Status</span>
            <div role="group" aria-label="Status" className="flex gap-2">
              {(["pending", "in_progress", "done"] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  aria-pressed={status === s}
                  className={`flex-1 min-h-11 py-2 px-3 rounded-[10px] border-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                    status === s
                      ? s === "done"
                        ? "bg-success-surface border-border-ink text-success-foreground"
                        : "bg-secondary border-border-ink text-secondary-foreground"
                      : "bg-surface border-border-ink text-text-muted"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Course Linking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Course Link
              </label>
              <div className="relative">
                <SelectField
                  value={courseCode}
                  onChange={(val) => setCourseCode(val)}
                  options={[
                    { value: "", label: "No Course (General)" },
                    ...enrolledCourses.map((c) => ({
                      value: c.code,
                      label: `${c.code} - ${c.title}`,
                    })),
                  ]}
                  searchable
                  stacked
                  role="group"
                  aria-label="Course"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Component
              </label>
              <div className="flex rounded-xl bg-surface-secondary p-1 border-2 border-border-ink">
                {(["theory", "lab", "both"] as TaskComponent[]).map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setComponent(comp)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      component === comp ? "bg-surface text-primary shadow-2xs" : "text-text-muted"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="task-due"
              className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
            >
              Due Date & Time
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl bg-surface-secondary border-2 border-border-ink text-text-heading px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-border-ink"
            />
          </div>

          {/* Reminders section */}
          <div className="p-3.5 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-primary" />
                In-App Reminders
              </span>
              <span className="text-xs text-text-muted">{reminders.length} armed</span>
            </div>

            {dueDate && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-text-muted">Quick:</span>
                <button
                  type="button"
                  onClick={() => addLeadReminder(15)}
                  className="relative hit-expand px-2 py-1 rounded-md text-xs font-bold bg-surface border-2 border-border-ink text-text-primary text-primary cursor-pointer"
                >
                  15m before
                </button>
                <button
                  type="button"
                  onClick={() => addLeadReminder(60)}
                  className="relative hit-expand px-2 py-1 rounded-md text-xs font-bold bg-surface border-2 border-border-ink text-text-primary text-primary cursor-pointer"
                >
                  1h before
                </button>
                <button
                  type="button"
                  onClick={() => addLeadReminder(1440)}
                  className="relative hit-expand px-2 py-1 rounded-md text-xs font-bold bg-surface border-2 border-border-ink text-text-primary text-primary cursor-pointer"
                >
                  1 day before
                </button>
              </div>
            )}

            {/* Armed reminders list */}
            {reminders.length > 0 && (
              <div className="space-y-1.5">
                {reminders.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-surface border-2 border-border-ink"
                  >
                    <span className="font-semibold text-text-primary">
                      {new Date(r).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeReminder(i)}
                      className="text-text-muted hover:text-danger-foreground cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom reminder input */}
            <div className="flex gap-2 pt-1">
              <input
                type="datetime-local"
                value={customReminder}
                onChange={(e) => setCustomReminder(e.target.value)}
                className="flex-1 text-xs rounded-xl bg-surface border-2 border-border-ink px-3 py-1.5 text-text-heading"
              />
              <button
                type="button"
                onClick={handleAddCustomReminder}
                disabled={!customReminder}
                className="px-3 py-1.5 rounded-xl bg-primary disabled:opacity-50 text-primary-foreground text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Weekly Schedule Chunks */}
          <div className="p-3.5 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Weekly Time Slots
                </span>
                <p className="text-xs text-text-muted">Allocates dedicated study chunks on the timetable</p>
              </div>
              <button
                type="button"
                onClick={addChunk}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Slot
              </button>
            </div>

            {schedule.map((chunk, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-surface border-2 border-border-ink">
                <SelectField
                  value={String(chunk.day)}
                  onChange={(val) => updateChunk(idx, { day: val as AttendanceDay })}
                  options={ATTENDANCE_DAYS.map((d) => ({ value: d, label: d }))}
                  searchable={false}
                  size="sm"
                  role="group"
                  aria-label="Day"
                  className="w-auto shrink-0 [&>button:first-child]:rounded-lg [&>button:first-child]:bg-surface-secondary [&>button:first-child]:px-2 [&>button:first-child]:text-xs [&>button:first-child]:uppercase"
                />

                <input
                  type="time"
                  value={chunk.start}
                  onChange={(e) => updateChunk(idx, { start: e.target.value })}
                  className="text-xs font-medium rounded-lg bg-surface-secondary px-2 py-1.5 border border-border-ink text-text-primary"
                />
                <span className="text-xs text-text-muted">–</span>
                <input
                  type="time"
                  value={chunk.end}
                  onChange={(e) => updateChunk(idx, { end: e.target.value })}
                  className="text-xs font-medium rounded-lg bg-surface-secondary px-2 py-1.5 border border-border-ink text-text-primary"
                />

                <button
                  type="button"
                  onClick={() => removeChunk(idx)}
                  className="p-1.5 text-text-muted hover:text-danger-foreground cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Pomodoro Settings */}
          <div className="p-3.5 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-warning-foreground" />
                Pomodoro Focus Plan
              </span>
              <button
                type="button"
                onClick={handleAutoSuggestPomodoro}
                className="inline-flex items-center gap-1 text-xs font-bold text-warning-foreground hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                {pomodoro ? "Recalculate" : "Plan with Pomodoro"}
              </button>
            </div>

            {pomodoro && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label htmlFor="pomodoro-focusMin" className="block text-xs font-bold text-text-muted mb-1">
                    Focus (min)
                  </label>
                  <input
                    type="number"
                    id="pomodoro-focusMin"
                    min="5"
                    max="120"
                    value={pomodoro.focusMin}
                    onChange={(e) => setPomodoro({ ...pomodoro, focusMin: Number(e.target.value) })}
                    className="w-full text-xs font-bold rounded-lg bg-surface border-2 border-border-ink px-2.5 py-1.5 text-text-heading"
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-breakMin" className="block text-xs font-bold text-text-muted mb-1">
                    Break (min)
                  </label>
                  <input
                    type="number"
                    id="pomodoro-breakMin"
                    min="1"
                    max="60"
                    value={pomodoro.breakMin}
                    onChange={(e) => setPomodoro({ ...pomodoro, breakMin: Number(e.target.value) })}
                    className="w-full text-xs font-bold rounded-lg bg-surface border-2 border-border-ink px-2.5 py-1.5 text-text-heading"
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-rounds" className="block text-xs font-bold text-text-muted mb-1">
                    Rounds
                  </label>
                  <input
                    type="number"
                    id="pomodoro-rounds"
                    min="1"
                    max="20"
                    value={pomodoro.rounds}
                    onChange={(e) => setPomodoro({ ...pomodoro, rounds: Number(e.target.value) })}
                    className="w-full text-xs font-bold rounded-lg bg-surface border-2 border-border-ink px-2.5 py-1.5 text-text-heading"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="task-notes"
              className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
            >
              Notes / Instructions
            </label>
            <textarea
              id="task-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, submission portals, formulas..."
              className="w-full text-xs font-medium rounded-xl bg-surface-secondary border-2 border-border-ink text-text-heading p-3 focus:outline-none focus:ring-2 focus:ring-border-ink"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-ink flex items-center justify-between gap-3 bg-surface-secondary">
          {task && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete task "${task.title}"?`)) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="text-xs font-bold text-danger-foreground hover:underline px-2 py-1 cursor-pointer"
            >
              Delete Task
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-surface-hover cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:brightness-110 text-primary-foreground shadow-xs transition-all cursor-pointer"
            >
              {task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
