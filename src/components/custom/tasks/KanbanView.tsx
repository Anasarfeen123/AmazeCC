"use client";

import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/types/tasks";
import TaskCard from "./TaskCard";

interface KanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusCycle: (id: string) => void;
  onDelete: (id: string) => void;
  onNewTask: (status?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  {
    id: "pending",
    title: "Pending",
  },
  {
    id: "in_progress",
    title: "In Progress",
  },
  {
    id: "done",
    title: "Done",
  },
];

export default function KanbanView({ tasks, onEdit, onStatusCycle, onDelete, onNewTask }: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-[14px] bg-surface-secondary border-2 border-border-ink p-3 sm:p-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-bold text-sm text-text-heading">{col.title}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-[6px] bg-surface text-text-muted border-2 border-border-ink">
                  {colTasks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNewTask(col.id)}
                className="h-11 w-11 inline-flex items-center justify-center rounded-[10px] hover:bg-surface text-text-muted transition-colors cursor-pointer"
                title={`Add ${col.title} task`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Column */}
            <div className="space-y-2.5 flex-1">
              {colTasks.length === 0 ? (
                <div className="min-h-24 flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border-ink text-center p-3">
                  <p className="text-xs font-semibold text-text-muted">No {col.title.toLowerCase()} tasks</p>
                  <button
                    type="button"
                    onClick={() => onNewTask(col.id)}
                    className="min-h-11 px-3 text-xs font-bold text-primary hover:underline cursor-pointer"
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
