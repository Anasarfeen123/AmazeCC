"use client";

import { useState, useEffect, useMemo } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Plus, Download, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { tasksAtom } from "@/store/dataAtoms";
import { tasksQuickAddRequestAtom } from "@/store/uiAtoms";
import {
  getTasks,
  createTask,
  updateTask,
  cycleTaskStatus,
  deleteTask,
  migrateCustomHomework,
} from "@/lib/tasksStorage";
import { subscribeReminders } from "@/lib/taskReminders";
import { isDueOnDay } from "@/lib/taskMatch";
import { getTodayAttendanceDay } from "@/lib/attendanceTimetable";
import type { Task, TaskStatus } from "@/types/tasks";
import { isTaskOverdue } from "@/types/tasks";
import posthog from "posthog-js";
import {
  ChipTabs,
  InsightCarousel,
  PageShell,
  SegmentedControl,
  useCarousel,
  type InsightSlide,
} from "../shared/primitives";
import Button from "../shared/Button";
import { TILE } from "@/lib/uiTokens";
import KanbanView from "./KanbanView";
import TaskListView from "./TaskListView";
import TaskWeekView from "./TaskWeekView";
import FocusPage from "./FocusPage";
import TaskEditSheet from "./TaskEditSheet";
import MoodleImportModal from "./MoodleImportModal";

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);
const posthogTaskLogger = posthog.logger;

export type TasksViewMode = "kanban" | "list" | "week" | "focus";

interface TasksTabProps {
  initialView?: TasksViewMode;
  initialCourseCode?: string;
  onBack?: () => void;
}

// Tone tokens mirror the course pages (CourseDetailSubpage STATUS_/TONE_ maps)
const TONE_TEXT: Record<string, string> = {
  red: "text-danger-foreground",
  amber: "text-warning-foreground",
  emerald: "text-success-foreground",
  indigo: "text-primary",
  zinc: "text-text-muted",
};

const TONE_BADGE: Record<string, string> = {
  red: "bg-danger-surface text-danger-foreground border-border-ink",
  amber: "bg-warning-surface text-warning-foreground border-border-ink",
  emerald: "bg-success-surface text-success-foreground border-border-ink",
  indigo: "bg-secondary text-secondary-foreground border-border-ink",
  zinc: "bg-surface-secondary text-text-muted border-border-muted",
};

const CARD_BASE = `${TILE} min-h-36 sm:min-h-40`;

const VIEW_META: Record<TasksViewMode, { label: string; section: string }> = {
  kanban: { label: "Board", section: "Board" },
  list: { label: "List", section: "Timeline" },
  week: { label: "Week", section: "Week plan" },
  focus: { label: "Focus", section: "Focus" },
};

export default function TasksTab({ initialView = "kanban", initialCourseCode, onBack }: TasksTabProps) {
  const [tasks, setTasks] = useAtom(tasksAtom);
  const quickAddRequest = useAtomValue(tasksQuickAddRequestAtom);
  const setQuickAddRequest = useSetAtom(tasksQuickAddRequestAtom);
  const [viewMode, setViewMode] = useState<TasksViewMode>(initialView);
  const [, setActiveNotification] = useState<string | null>(null);

  // Edit sheet state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [prefilledCourseCode, setPrefilledCourseCode] = useState<string | undefined>(initialCourseCode);
  const [prefilledTitle, setPrefilledTitle] = useState<string>("");
  const [prefilledStatus, setPrefilledStatus] = useState<TaskStatus>("pending");

  // Moodle modal state
  const [isMoodleModalOpen, setIsMoodleModalOpen] = useState(false);

  // Filter state
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  // Carousel state

  // Initial load & migrate (Main hydrates at boot; this is a safety net so the
  // hub is never empty after a fresh mount)
  useEffect(() => {
    if (tasks.length > 0) return;
    const migrated = migrateCustomHomework();
    const stored = getTasks();
    setTasks(stored.length > 0 ? stored : migrated);
  }, [tasks.length, setTasks]);

  // Reminder fires are owned by Main (see useTaskReminderScheduler); the hub
  // just surfaces them in a banner.
  useEffect(() => {
    return subscribeReminders((reminder) => {
      setActiveNotification(`Reminder: ${reminder.taskTitle}${reminder.kind === "due_lead" ? " — due soon" : ""}`);
    });
  }, []);

  // Command palette quick-add: open the create sheet, prefill, then consume
  useEffect(() => {
    if (!quickAddRequest) return;
    setEditingTask(null);
    setPrefilledTitle(quickAddRequest.title || "");
    setPrefilledStatus("pending");
    setPrefilledCourseCode(undefined);
    setIsEditSheetOpen(true);
    setQuickAddRequest(null);
  }, [quickAddRequest, setQuickAddRequest]);

  // Handlers
  const taskProperties = (task: Partial<Task>) => ({
    task_kind: task.kind,
    status: task.status,
    has_due_date: Boolean(task.dueDate),
    reminder_count: task.reminders?.length ?? 0,
    scheduled_chunk_count: task.schedule?.length ?? 0,
    has_pomodoro_plan: Boolean(task.pomodoro),
  });

  const handleCreateTask = (draft: Partial<Task> & { title: string }) => {
    const updated = createTask(draft);
    setTasks(updated);
    if (posthogConfigured) {
      posthog.capture("task_created", taskProperties(draft));
      posthogTaskLogger.info("task created", taskProperties(draft));
    }
  };

  const handleUpdateTask = (draft: Partial<Task> & { title: string }) => {
    if (!draft.id) return;
    const updated = updateTask(draft.id, draft);
    setTasks(updated);
    if (posthogConfigured) {
      posthog.capture("task_updated", taskProperties(draft));
      posthogTaskLogger.info("task updated", taskProperties(draft));
    }
  };

  const handleStatusCycle = (id: string) => {
    const updated = cycleTaskStatus(id);
    setTasks(updated);
    const task = updated.find((candidate) => candidate.id === id);
    if (task && posthogConfigured) {
      posthog.capture("task_status_changed", { status: task.status });
      posthogTaskLogger.info("task status changed", { status: task.status });
    }
  };

  const handleDeleteTask = (id: string) => {
    const updated = deleteTask(id);
    setTasks(updated);
    if (posthogConfigured) {
      posthog.capture("task_deleted");
      posthogTaskLogger.info("task deleted");
    }
  };

  const handleOpenNewTask = (status: TaskStatus = "pending") => {
    setEditingTask(null);
    setPrefilledTitle("");
    setPrefilledStatus(status);
    setPrefilledCourseCode(initialCourseCode);
    setIsEditSheetOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditSheetOpen(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedCourseFilter === "all") return true;
    return t.courseCode === selectedCourseFilter;
  });

  const uniqueCourseCodes = Array.from(new Set(tasks.map((t) => t.courseCode).filter(Boolean)));

  // ── Page-level stats (unfiltered, like the course page heroes) ──
  const now = new Date();
  const todayCode = getTodayAttendanceDay(now);
  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdueTasks = openTasks.filter((t) => isTaskOverdue(t, now.getTime()));
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const dueThisWeek = openTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate).getTime();
    return due >= now.getTime() && due <= now.getTime() + 7 * 24 * 60 * 60 * 1000;
  }).length;
  const todayTasks = openTasks.filter(
    (t) => (t.schedule || []).some((c) => c.day === todayCode) || isDueOnDay(t.dueDate, now),
  ).length;
  const scheduledChunks = openTasks.reduce((sum, t) => sum + (t.schedule || []).length, 0);

  // ── Rotating insight carousel (mirrors the course-overview stat cards) ──
  const slides = useMemo(
    () => [
      {
        id: "today",
        title: "Today",
        headline: String(todayTasks),
        subline: todayTasks > 0 ? "Due or scheduled" : "Nothing scheduled",
        badge: "Today",
        tone: todayTasks > 0 ? "red" : "zinc",
        onClick: () => setViewMode("week"),
      },
      {
        id: "overdue",
        title: "Overdue",
        headline: String(overdueTasks.length),
        subline: overdueTasks.length > 0 ? "Still open" : "None overdue",
        badge: overdueTasks.length > 0 ? "Overdue" : "Clear",
        tone: overdueTasks.length > 0 ? "red" : "emerald",
        onClick: () => setViewMode("list"),
      },
      {
        id: "focus",
        title: "Focus",
        headline: String(scheduledChunks),
        subline: scheduledChunks > 0 ? "Sessions planned" : "No sessions planned",
        badge: "Focus",
        tone: "indigo",
        onClick: () => setViewMode("focus"),
      },
      {
        id: "done",
        title: "Completed",
        headline: String(doneCount),
        subline: doneCount > 0 ? "Tasks finished" : "None finished yet",
        badge: "Done",
        tone: doneCount > 0 ? "emerald" : "zinc",
        onClick: () => setViewMode("kanban"),
      },
    ],
    [todayTasks, overdueTasks.length, scheduledChunks, doneCount],
  );

  const carousel = useCarousel(slides.length);
  const insightSlides = useMemo<InsightSlide[]>(
    () =>
      slides.map((s) => ({
        id: s.id,
        label: s.title,
        value: s.headline,
        sub: s.subline,
        badge: s.badge,
        tone: s.tone,
        onClick: s.onClick,
      })),
    [slides],
  );
  const openTone = overdueTasks.length > 0 ? "red" : openTasks.length > 0 ? "indigo" : "zinc";

  return (
    <PageShell
      eyebrow="Tools · Tasks"
      title="Tasks & Schedule"
      subtitle="Timetable-linked study sessions, homework & digital assignments"
      onBack={onBack}
    >
      {/* ── ACTIONS ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => handleOpenNewTask()} icon={<Plus className="w-4 h-4" aria-hidden="true" />}>
          New task
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsMoodleModalOpen(true)}
          icon={<Download className="w-4 h-4" aria-hidden="true" />}
        >
          Import LMS
        </Button>
      </div>

      {/* ── STAT CARDS (static hero + rotating carousel) ── */}
      <div className="summary-row grid grid-cols-2 gap-3 sm:gap-4">
        {/* CARD 1: OPEN TASKS */}
        <div className={CARD_BASE}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-xs font-bold uppercase tracking-wider text-text-muted font-outfit truncate">
              Open tasks
            </span>
            <span
              className={`text-xs font-bold uppercase px-1 py-0 sm:px-2 sm:py-0.5 rounded-md shrink-0 border ${
                TONE_BADGE[overdueTasks.length > 0 ? "red" : "emerald"]
              }`}
            >
              {overdueTasks.length > 0 ? "Overdue" : "On track"}
            </span>
          </div>
          <div className="my-auto py-1">
            <span
              className={`text-3xl sm:text-4xl font-bold font-outfit tracking-tight leading-none block ${TONE_TEXT[openTone]}`}
            >
              {openTasks.length}
            </span>
          </div>
          <p className="text-xs sm:text-xs text-text-muted font-medium">
            {dueThisWeek} due this week · {doneCount} done
          </p>
        </div>

        {/* CARD 2: ROTATING INSIGHT CAROUSEL */}
        <InsightCarousel
          slides={insightSlides}
          carousel={carousel}
          headlineSize="lg"
          height="min-h-36 sm:min-h-40"
          interactiveDots
        />
      </div>

      {/* ── VIEW SEGMENTS + COURSE FILTER ── */}
      <div className="space-y-3">
        <SegmentedControl
          options={(Object.keys(VIEW_META) as TasksViewMode[]).map((mode) => ({
            value: mode,
            label: VIEW_META[mode].label,
          }))}
          value={viewMode}
          onChange={setViewMode}
          className="w-fit"
        />

        {uniqueCourseCodes.length > 0 && (
          <ChipTabs
            options={[
              { value: "all", label: "All courses" },
              ...uniqueCourseCodes.map((c) => ({ value: c, label: c })),
            ]}
            value={selectedCourseFilter}
            onChange={setSelectedCourseFilter}
          />
        )}
      </div>

      {/* ── SECTION HEADER + MAIN VIEW ROUTER ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-heading font-outfit tracking-tight">
              {VIEW_META[viewMode].section}
            </h2>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-surface-secondary text-text-muted border-2 border-border-ink">
              {filteredTasks.length}
            </span>
          </div>

          {/* Slide shortcuts mirror the carousel headline colours */}
          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded-md border ${TONE_BADGE.red}`}
              >
                <AlertCircle className="w-3 h-3" />
                {overdueTasks.length} overdue
              </span>
            )}
            {todayTasks > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded-md border ${TONE_BADGE.indigo}`}
              >
                <Clock className="w-3 h-3" />
                {todayTasks} today
              </span>
            )}
            {doneCount > 0 && (
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded-md border ${TONE_BADGE.emerald}`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {doneCount} done
              </span>
            )}
          </div>
        </div>

        {viewMode === "kanban" && (
          <KanbanView
            tasks={filteredTasks}
            onEdit={handleOpenEdit}
            onStatusCycle={handleStatusCycle}
            onDelete={handleDeleteTask}
            onNewTask={handleOpenNewTask}
          />
        )}

        {viewMode === "list" && (
          <TaskListView
            tasks={filteredTasks}
            onEdit={handleOpenEdit}
            onStatusCycle={handleStatusCycle}
            onDelete={handleDeleteTask}
            onNewTask={handleOpenNewTask}
          />
        )}

        {viewMode === "week" && (
          <TaskWeekView tasks={filteredTasks} onEdit={handleOpenEdit} onNewTask={() => handleOpenNewTask()} />
        )}

        {viewMode === "focus" && (
          <FocusPage tasks={filteredTasks} onCycleStatus={handleStatusCycle} onEditTask={handleOpenEdit} />
        )}
      </div>

      {/* Task Edit Sheet */}
      <TaskEditSheet
        task={editingTask}
        initialTitle={prefilledTitle}
        initialStatus={prefilledStatus}
        initialCourseCode={prefilledCourseCode}
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setEditingTask(null);
          setPrefilledTitle("");
        }}
        onSave={(draft) => {
          if (editingTask) {
            handleUpdateTask(draft);
          } else {
            handleCreateTask(draft);
          }
        }}
        onDelete={handleDeleteTask}
      />

      {/* Moodle Import Modal */}
      <MoodleImportModal
        isOpen={isMoodleModalOpen}
        onClose={() => setIsMoodleModalOpen(false)}
        onImportComplete={() => {}}
      />
    </PageShell>
  );
}
