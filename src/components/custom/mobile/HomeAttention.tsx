"use client";

import { useMemo, useState } from "react";
import { attendanceBudget, CourseDot } from "@amazecontinuityprojects/amazeui";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { Task } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface AttendanceCourse {
  courseCode?: string;
  courseTitle?: string;
  slotName?: string;
  attendedClasses?: string | number;
  totalClasses?: string | number;
}

interface ExamRowLike {
  key: string;
  examType: string;
  raw: any;
  date: Date | null;
  startAt?: Date | null;
}

type Item = {
  id: string;
  /** Lower sorts first. */
  rank: number;
  tone: "danger" | "warn";
  course?: string;
  title: string;
  badge: string;
  detail: string;
  onOpen?: () => void;
};

const DAY = 24 * 60 * 60 * 1000;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : word.endsWith("s") ? "es" : "s"}`;
}

function when(d: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((that - today) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * "Needs your attention": the few things on Home that should not wait.
 *
 * Attendance below the line comes first, each with the exact recovery step;
 * then exams in the next seven days; then tasks that are overdue or due
 * today. At most four rows show, with a link to the rest. When nothing is
 * pressing it says so in one quiet line instead of disappearing, so the
 * absence of a warning is itself information.
 */
export default function HomeAttention({
  courses,
  targetPct,
  exams,
  tasks,
  now,
  onOpenCourse,
  onOpenExams,
  onOpenTasks,
  className,
}: {
  courses: AttendanceCourse[] | undefined;
  targetPct: number;
  exams: ExamRowLike[];
  tasks: Task[] | undefined;
  now: Date;
  onOpenCourse?: (code: string) => void;
  onOpenExams?: () => void;
  onOpenTasks?: () => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const threshold = Math.min(0.99, Math.max(0.01, targetPct / 100));

    for (const c of courses ?? []) {
      const total = Number(c.totalClasses) || 0;
      const code = String(c.courseCode || "").trim();
      const slot = String(c.slotName || "").trim();
      if (!code || total <= 0 || /NIL|NULL/i.test(slot)) continue;
      const attended = Math.min(Number(c.attendedClasses) || 0, total);
      const b = attendanceBudget(attended, total, threshold);
      if (b.status !== "short") continue;
      const isLab = slot.toUpperCase().startsWith("L");
      const per = isLab ? 2 : 1;
      const need = Math.ceil(b.mustAttend / per);
      const pct = b.percent ?? 0;
      out.push({
        id: `att-${code}-${slot}`,
        rank: 0 + pct / 1000,
        tone: "danger",
        course: code,
        title: String(c.courseTitle || code),
        badge: `${pct.toFixed(1)}%`,
        detail: `Attend the next ${plural(need, isLab ? "lab" : "class")} to get back to ${targetPct}%.`,
        onOpen: () => onOpenCourse?.(code.replace(/\((T|L|P)\)$/, "")),
      });
    }

    const horizon = now.getTime() + 7 * DAY;
    for (const e of exams) {
      const at = e.startAt ?? e.date;
      if (!at) continue;
      const t = at.getTime();
      const endOfDay = new Date(at.getFullYear(), at.getMonth(), at.getDate(), 23, 59).getTime();
      if (endOfDay < now.getTime() || t > horizon) continue;
      const time = e.startAt ? ` · ${hhmm(e.startAt)}` : "";
      const venue = e.raw?.venue || e.raw?.examVenue || e.raw?.roomNo;
      out.push({
        id: `exam-${e.key}`,
        rank: 1 + t / 1e15,
        tone: "warn",
        course: String(e.raw?.courseCode || e.examType),
        title: `${e.examType} · ${e.raw?.courseTitle || e.raw?.courseCode || "Exam"}`,
        badge: when(at, now),
        detail: `${when(at, now)}${time}${venue ? ` · ${venue}` : ""}`,
        onOpen: onOpenExams,
      });
    }

    const soon = now.getTime() + DAY;
    for (const t of tasks ?? []) {
      if (t.status === "done" || !t.dueDate) continue;
      const due = new Date(t.dueDate as string);
      if (Number.isNaN(due.getTime()) || due.getTime() > soon) continue;
      const overdue = due.getTime() < now.getTime();
      out.push({
        id: `task-${t.id}`,
        rank: (overdue ? 0.5 : 2) + due.getTime() / 1e15,
        tone: overdue ? "danger" : "warn",
        course: t.courseCode || t.title,
        title: t.title,
        badge: overdue ? "Overdue" : when(due, now),
        detail: `${overdue ? "Was due" : "Due"} ${when(due, now).toLowerCase()} · ${hhmm(due)}${
          t.courseTitleSnapshot ? ` · ${t.courseTitleSnapshot}` : ""
        }`,
        onOpen: onOpenTasks,
      });
    }

    return out.sort((a, b) => a.rank - b.rank);
  }, [courses, targetPct, exams, tasks, now, onOpenCourse, onOpenExams, onOpenTasks]);

  if (items.length === 0) {
    return (
      <section aria-label="Needs your attention" className={cn("text-left", className)}>
        <div className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-4 py-3 text-[13.5px] text-ink-2">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-ok" strokeWidth={2} />
          All clear: no attendance shortfalls, exams this week or tasks due today.
        </div>
      </section>
    );
  }

  const shown = expanded ? items : items.slice(0, 4);
  const hidden = items.length - shown.length;

  return (
    <section aria-label="Needs your attention" className={cn("text-left", className)}>
      <div className="flex items-baseline justify-between px-0.5 pb-2">
        <h2 className="text-[15px] font-semibold text-ink">Needs your attention</h2>
        <span className="font-mono text-[12px] text-muted">{items.length}</span>
      </div>
      <ul className="divide-y divide-line-2 overflow-hidden rounded-md border border-line bg-surface">
        {shown.map((it) => (
          <li key={it.id} className="relative">
            <span
              aria-hidden="true"
              className={cn("absolute inset-y-0 left-0 w-[3px]", it.tone === "danger" ? "bg-danger" : "bg-warn")}
            />
            <button
              type="button"
              onClick={it.onOpen}
              className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 py-3 pl-4 pr-3 text-left transition-colors duration-[120ms] hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <CourseDot course={it.course || it.title} />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-medium text-ink">{it.title}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[13px] leading-snug",
                    it.tone === "danger" ? "text-danger" : "text-ink-2",
                  )}
                >
                  {it.detail}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 font-mono text-[12px] font-semibold",
                  it.tone === "danger" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn",
                )}
              >
                {it.badge}
              </span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted" />
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 px-0.5 text-[13px] text-accent hover:underline"
        >
          Show {hidden} more
        </button>
      )}
    </section>
  );
}
