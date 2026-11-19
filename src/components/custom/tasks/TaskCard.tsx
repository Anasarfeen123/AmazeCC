"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  BookOpen,
  Edit2,
  Trash2,
  Timer,
  Layers,
} from "lucide-react";
import type { Task, TaskKind } from "@/types/tasks";
import { isTaskOverdue } from "@/types/tasks";
import { clickable } from "@/lib/a11y";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusCycle?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export const KIND_CONFIG: Record<TaskKind, { label: string; badgeClass: string; icon: React.ElementType }> = {
  test: {
    label: "Test",
    badgeClass: "bg-danger-surface text-danger-foreground border-border-ink",
    icon: AlertCircle,
  },
  "digital-assignment": {
    label: "Digital Assignment",
    badgeClass: "bg-warning-surface text-warning-foreground border-border-ink",
    icon: BookOpen,
  },
  homework: {
    label: "Homework",
    badgeClass: "bg-secondary text-secondary-foreground border-border-ink",
    icon: Layers,
  },
  study: {
    label: "Study",
    badgeClass: "bg-success-surface text-success-foreground border-border-ink",
    icon: BookOpen,
  },
  reminder: {
    label: "Reminder",
    badgeClass: "bg-secondary text-secondary-foreground border-border-ink",
    icon: Clock,
  },
};

export default function TaskCard({ task, onEdit, onStatusCycle, onDelete, compact = false }: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const kindMeta = KIND_CONFIG[task.kind] || KIND_CONFIG.homework;

  const formatDueDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      {...clickable(() => onEdit(task))}
      className="group relative rounded-2xl card-surface border-2 border-border-ink p-3.5 shadow-2xs hover:shadow-xs hover:border-border-ink transition-all cursor-pointer text-left"
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Cycle status checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusCycle?.(task.id);
          }}
          className="mt-0.5 shrink-0 text-text-muted hover:text-primary transition-colors cursor-pointer"
          title={`Status: ${task.status}. Click to advance.`}
        >
          {task.status === "done" ? (
            <CheckCircle2 className="w-5 h-5 text-success-foreground" />
          ) : task.status === "in_progress" ? (
            <div className="w-5 h-5 rounded-full border-2 border-border-ink border-t-transparent animate-spin-slow flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
          ) : (
            <Circle className="w-5 h-5 text-text-muted group-hover:text-text-muted" />
          )}
        </button>

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {/* Kind badge */}
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md border ${kindMeta.badgeClass}`}>
              {kindMeta.label}
            </span>

            {/* Course Code chip */}
            {task.courseCode && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-surface-secondary text-text-primary border-2 border-border-ink">
                {task.courseCode}
                {task.component !== "both" && (
                  <span className="opacity-70 ml-1 uppercase text-xs">({task.component})</span>
                )}
              </span>
            )}

            {/* Overdue chip */}
            {overdue && (
              <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded-md border border-border-ink bg-danger-surface text-danger-foreground shrink-0">
                Overdue
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className={`text-sm font-bold leading-tight font-outfit text-text-heading break-words ${
              task.status === "done" ? "line-through opacity-60" : ""
            }`}
          >
            {task.title}
          </h4>

          {/* Notes summary if any */}
          {task.notes && !compact && (
            <p className="text-xs text-text-muted line-clamp-1 mt-1 font-medium">{task.notes}</p>
          )}

          {/* Metadata row: due date, chunks, pomodoro */}
          <div className="flex items-center gap-2.5 mt-2 text-xs text-text-muted flex-wrap">
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 font-medium ${overdue ? "text-danger-foreground font-bold" : ""}`}
              >
                <Calendar className="w-3 h-3" />
                {formatDueDate(task.dueDate)}
              </span>
            )}

            {task.schedule && task.schedule.length > 0 && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <Clock className="w-3 h-3" />
                {task.schedule.length} {task.schedule.length === 1 ? "chunk" : "chunks"}
              </span>
            )}

            {task.pomodoro && (
              <span className="flex items-center gap-1 font-medium text-warning-foreground">
                <Timer className="w-3 h-3" />
                {task.pomodoro.rounds}×{task.pomodoro.focusMin}m
              </span>
            )}
          </div>
        </div>

        {/* Action buttons stay visible on touch devices — the previous
            `sm:opacity-0 group-hover:opacity-100` pattern hid them on phones
            and tablets that never hover, making edit/delete unreachable. */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="relative hit-expand p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete task "${task.title}"?`)) {
                  onDelete(task.id);
                }
              }}
              className="relative hit-expand p-1.5 rounded-lg text-text-muted hover:text-danger-foreground dark:hover:text-danger-foreground hover:bg-danger-surface dark:hover:bg-red-950/30 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
