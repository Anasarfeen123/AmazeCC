"use client";

import React from "react";
import { Layers } from "lucide-react";
import type { ClassTaskSummary } from "@/lib/taskMatch";
import { KIND_CONFIG } from "./TaskCard";
import { clickable } from "@/lib/a11y";

interface TaskBadgeProps {
  summary: ClassTaskSummary;
  onClick?: (e: React.SyntheticEvent) => void;
  className?: string;
  /** Shorten labels ("DA today") for cramped cards */
  compact?: boolean;
}

/**
 * Session-scoped badge for a timetable class card.
 * - A test/DA chunked to *this* session, or due on this calendar date, claims
 *   "<Kind> today"; test wins over digital assignment.
 * - Anything else linked to the course stays generic: "Task pending".
 * `summary.today` is zeroed for non-current days, so browsing another weekday
 * can never show a "today" claim.
 */
export default function TaskBadge({ summary, onClick, className = "", compact = false }: TaskBadgeProps) {
  if (!summary || summary.total === 0) return null;

  const today = summary.today;
  let text: string;
  let count: number;
  let colorClass: string;
  let Icon: React.ElementType;

  if (today.total > 0 && today.tests > 0) {
    text = "Test today";
    count = today.tests;
    colorClass = "text-danger-foreground bg-danger-surface border-border-ink";
    Icon = KIND_CONFIG.test.icon;
  } else if (today.total > 0 && today.das > 0) {
    text = compact ? "DA today" : "Digital assignment today";
    count = today.das;
    colorClass = "text-warning-foreground bg-warning-surface border-border-ink";
    Icon = KIND_CONFIG["digital-assignment"].icon;
  } else {
    text = "Task pending";
    count = summary.total;
    colorClass = "text-warning-foreground bg-amber-50/70 border-border-ink";
    Icon = Layers;
  }

  const label = count > 1 ? `${text} · ${count}` : text;

  return (
    <span
      {...clickable((e) => {
        e.stopPropagation();
        onClick?.(e);
      })}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 transition-all ${colorClass} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
