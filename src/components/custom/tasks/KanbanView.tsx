"use client";

import React from "react";
import { Plus, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import type { Task, TaskStatus } from "@/types/tasks";
import TaskCard from "./TaskCard";

interface KanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusCycle: (id: string) => void;
  onDelete: (id: string) => void;
  onNewTask: (status?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; icon: React.ElementType; color: string }[] = [
  {
    id: "pending",
    title: "Pending",
    icon: Clock,
    color: "border-border-ink text-text-primary",
  },
  {
    id: "in_progress",
    title: "In Progress",
    icon: PlayCircle,
    color: "border-border-ink text-primary",
  },
  {
    id: "done",
    title: "Done",
    icon: CheckCircle2,
    color: "border-border-ink text-success-foreground",
  },
];

export default function KanbanView({ tasks, onEdit, onStatusCycle, onDelete, onNewTask }: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-[14px] bg-surface-secondary border-2 border-border-ink p-3 sm:p-4 min-h-[300px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h3 className="font-outfit font-bold text-sm text-text-heading">{col.title}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-[6px] bg-surface text-text-muted border-2 border-border-ink">
                  {colTasks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNewTask(col.id)}
                className="p-1 rounded-lg hover:bg-surface text-text-muted transition-colors cursor-pointer"
                title={`Add ${col.title} task`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Column */}
            <div className="space-y-2.5 flex-1">
              {colTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-ink text-center p-4">
                  <p className="text-xs font-semibold text-text-muted">No {col.title.toLowerCase()} tasks</p>
                  <button
                    type="button"
                    onClick={() => onNewTask(col.id)}
                    className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    + Add Task
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onStatusCycle={onStatusCycle}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
