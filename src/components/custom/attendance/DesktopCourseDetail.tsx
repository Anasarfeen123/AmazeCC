"use client";

import { TONE_BADGE } from "@/lib/uiTokens";
import { facultyDisplayName } from "@/lib/displayNames";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import EmptyState from "../shared/EmptyState";
import { findOfficialOdWhy } from "@/lib/officialOd";
import { getTargetAttendancePct } from "@/store/settingsAtoms";
import { clickable } from "@/lib/a11y";
import type { NormalizedCourse } from "@/types/course";
import { normalizeCourse } from "@/lib/courseNormalizer";

export interface DesktopCourseDetailProps {
  a?: NormalizedCourse | any;
  course?: NormalizedCourse | any;
  isDayscholarWithBus?: boolean;
  decimalValues?: boolean;
  results?: any;
  dayCardsMap?: any;
  impDates?: any;
  onViewFullPage?: () => void;
  simulatedSkips?: number;
  onSimulateSkipsChange?: (val: number) => void;
  className?: string;
  emptyPlaceholder?: React.ReactNode;
}

export default function DesktopCourseDetail({
  a,
  course,
  isDayscholarWithBus,
  decimalValues,
  results,
  dayCardsMap,
  impDates,
  onViewFullPage,
  simulatedSkips: propSimulatedSkips,
  onSimulateSkipsChange,
  className,
  emptyPlaceholder,
}: DesktopCourseDetailProps) {
  const item = a || course;

  const [internalSkips, setInternalSkips] = useState(0);
  const simulatedSkips = propSimulatedSkips !== undefined ? propSimulatedSkips : internalSkips;

  const handleSimulateSkipsChange = (val: number) => {
    const next = Math.max(0, val);
    if (onSimulateSkipsChange) {
      onSimulateSkipsChange(next);
    } else {
      setInternalSkips(next);
    }
  };

  const [notesTracker, setNotesTracker] = useState<Record<string, Record<string, boolean>>>({});
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("uniCC_notes_tracker")
          : null;
      if (saved) setNotesTracker(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleNotes = (dateStr: string) => {
    const key = item?.courseCode || item?.code;
    if (!key) return;
    setNotesTracker((prev) => {
      const newState = {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [dateStr]: !prev[key]?.[dateStr],
        },
      };
      try {
        localStorage.setItem("uniCC_notes_tracker", JSON.stringify(newState));
      } catch (e) {
        console.error(e);
      }
      return newState;
    });
  };

  const handleViewFullPage = () => {
    if (onViewFullPage) {
      onViewFullPage();
      return;
    }
    const code = item?.courseCode || item?.code;
    if (code && typeof window !== "undefined") {
      localStorage.setItem("course_dashboard_target", code);
      localStorage.setItem("course_dashboard_tab", "attendance");
    }
  };

  const containerClasses =
    className !== undefined ? className : "hidden md:block brutal-card p-5 sticky top-4 mr-1.5 mb-1.5";

  if (!item) {
    return (
      <div className={containerClasses}>
        {emptyPlaceholder || (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
            <p>Select a class on the timeline to view details.</p>
          </div>
        )}
      </div>
    );
  }

  const norm = normalizeCourse(item);
  const codeRaw = item.courseCode || norm.code || item.code || "";
  const lab = Boolean(norm.isLab || codeRaw.endsWith("(L)") || item.courseType?.toLowerCase().includes("lab"));
  const isTheory = Boolean(
    norm.isTheory || codeRaw.endsWith("(T)") || item.courseType?.toLowerCase().includes("theory"),
  );
  const displayCode =
    norm.baseCode || (codeRaw.endsWith("(L)") || codeRaw.endsWith("(T)") ? codeRaw.slice(0, -3) : codeRaw);
  const displayType = lab ? "Lab" : isTheory ? "Theory" : item.courseType || norm.componentType || "Theory";
  const credits = item.credits ?? item.credit ?? (norm.credits !== null ? norm.credits.toFixed(1) : "4.0");

  const thresholdPct = getTargetAttendancePct();
  const rawAttended = norm.attendance?.attendedClasses ?? item.attendedClasses;
  const rawTotal = norm.attendance?.totalClasses ?? item.totalClasses;
  const attended = parseInt(String(rawAttended ?? "0"), 10);
  const total = parseInt(String(rawTotal ?? "0"), 10) + simulatedSkips;
  const originalPercentage =
    norm.attendance?.attendancePercentage ?? parseFloat(String(item.attendancePercentage || "0"));
  const simulatedPercentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : originalPercentage;

  const isSafe = simulatedPercentage >= thresholdPct;
  const canMissVal = isSafe && total > 0 ? Math.floor(attended / (thresholdPct / 100) - total) : 0;
  const canMissClasses = lab ? Math.floor(canMissVal / 2) : canMissVal;

  const neededVal = !isSafe ? Math.ceil(((thresholdPct / 100) * total - attended) / (1 - thresholdPct / 100)) : 0;
  const neededClasses = lab ? Math.ceil(neededVal / 2) : neededVal;

  const historyList =
    norm.attendance?.history && norm.attendance.history.length > 0
      ? norm.attendance.history
      : Array.isArray(item.viewLink)
        ? item.viewLink
        : [];
  const recentHistory = historyList.slice(0, 5);

  const CLASS_WEIGHT = lab ? 2 : 1;
  const nextAttendPct =
    total + CLASS_WEIGHT > 0 ? parseFloat((((attended + CLASS_WEIGHT) / (total + CLASS_WEIGHT)) * 100).toFixed(1)) : 0;
  const nextSkipPct = total + CLASS_WEIGHT > 0 ? parseFloat(((attended / (total + CLASS_WEIGHT)) * 100).toFixed(1)) : 0;

  const attendDiff = parseFloat((nextAttendPct - simulatedPercentage).toFixed(1));
  const skipDiff = parseFloat((nextSkipPct - simulatedPercentage).toFixed(1));

  const attendDiffStr = attendDiff >= 0 ? `+${attendDiff}%` : `${attendDiff}%`;
  const skipDiffStr = skipDiff >= 0 ? `+${skipDiff}%` : `${skipDiff}%`;

  const slotDisplay = item.slotName || norm.slotDisplay || norm.slots.join("+");
  const timeDisplay = item.time ? ` (${item.time})` : "";
  const venueDisplay = item.slotVenue || norm.venue || "TBA";
  const facultyDisplay =
    typeof item.faculty === "object"
      ? item.faculty?.raw || item.faculty?.name || ""
      : item.faculty || norm.faculty?.raw || norm.faculty?.name || "";

  return (
    <div className={containerClasses}>
      <div className="space-y-6">
        {/* Header: title, metadata line, facts in words (no icon tiles). */}
        <div className="space-y-3">
          <div className="space-y-1 pr-12">
            <h2 className="font-title text-2xl font-extrabold leading-tight text-text-heading">
              {norm.title || item.courseTitle || item.title}
            </h2>
            <p className="font-mono text-xs text-text-muted">
              {[displayCode, displayType, `${credits} credits`].filter(Boolean).join(" // ")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            {[
              ["Slot", `${slotDisplay}${timeDisplay}`],
              ["Venue", venueDisplay],
              ...(facultyDisplay ? [["Faculty", facultyDisplayName(String(facultyDisplay))]] : []),
            ].map(([label, value], i) => (
              <div
                key={label}
                className={`min-w-0 rounded-[10px] border-2 border-border-ink bg-surface-secondary px-2.5 py-2 ${i === 2 ? "col-span-2" : ""}`}
              >
                <dt className="font-label text-xs font-semibold text-text-muted">{label}</dt>
                <dd className="mt-0.5 truncate text-sm font-bold text-text-heading">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Premium Stat Boxes */}
        <div className="flex flex-col gap-4">
          {/* Attendance Status Card */}
          <div className="rounded-[14px] border-2 border-border-ink bg-surface-secondary p-4 flex flex-col gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-label text-xs font-semibold text-text-muted mb-1">Attendance</h4>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-[40px] font-bold leading-none text-hero">{simulatedPercentage}%</p>
                {simulatedSkips > 0 && (
                  <span className="text-xs text-text-muted line-through font-bold">{originalPercentage}%</span>
                )}
                <span className="font-mono text-xs text-text-muted">
                  {attended} of {total}
                </span>
              </div>

              {/* Horizontal Progress Bar */}
              {/* Bar with the target line drawn on it ("draw the line"). */}
              <div className="relative mt-3 h-4 w-full rounded-[6px] border-2 border-border-ink bg-surface overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    simulatedPercentage < thresholdPct ? "bg-danger" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, simulatedPercentage)}%` }}
                />
                <div
                  aria-hidden
                  className="absolute inset-y-0 w-0.5 bg-text-primary"
                  style={{ left: `${thresholdPct}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-xs text-text-muted">Line = {thresholdPct}% target</p>

              {/* Status & Buffer metrics */}
              <div className="mt-3 pt-3 border-t-2 border-border-muted flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-label text-text-muted font-bold text-xs">Status</span>
                  <span
                    className={`rounded-[6px] border-2 px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] ${
                      isSafe ? TONE_BADGE.emerald : TONE_BADGE.red
                    }`}
                  >
                    {isSafe ? "Safe" : "Critical"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label text-text-muted font-bold text-xs">
                    {isSafe ? "Safe Buffer" : "Shortage"}
                  </span>
                  <span className={`font-bold ${isSafe ? "text-success-foreground" : "text-danger-foreground"}`}>
                    {isSafe
                      ? canMissClasses === 0
                        ? "No buffer"
                        : `Can skip ${canMissClasses} class${canMissClasses !== 1 ? "es" : ""}`
                      : `Need +${neededClasses} class${neededClasses !== 1 ? "es" : ""}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Inline Skip Predictor Widget for Desktop */}
            <div className="flex items-center justify-between gap-2 rounded-[10px] border-2 border-border-ink bg-surface p-1.5 pl-3">
              <span className="font-label text-xs font-semibold text-text-muted">What if I skip</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSimulateSkipsChange(simulatedSkips - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border-2 border-border-ink bg-surface-secondary hover:bg-surface-hover cursor-pointer"
                  title="One fewer skip"
                  aria-label="One fewer skip"
                >
                  <Minus className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                </button>
                <span
                  {...clickable(() => {
                    if (simulatedSkips !== 0) {
                      handleSimulateSkipsChange(0);
                    }
                  })}
                  className={`font-display text-lg font-bold min-w-6 text-center select-none ${
                    simulatedSkips !== 0
                      ? "cursor-pointer hover:text-danger-foreground hover:scale-110 transition-all text-primary font-bold"
                      : "text-text-primary"
                  }`}
                  title={simulatedSkips !== 0 ? "Click to reset to 0" : ""}
                >
                  {simulatedSkips}
                </span>
                <button
                  onClick={() => handleSimulateSkipsChange(simulatedSkips + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border-2 border-border-ink bg-surface-secondary hover:bg-surface-hover cursor-pointer"
                  title="One more skip"
                  aria-label="One more skip"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-[14px] border-2 border-border-ink bg-surface-secondary p-4 flex flex-col justify-between">
            <h4 className="font-label text-xs font-semibold text-text-muted mb-3">Next Class Impact</h4>
            <div className="flex flex-col h-full justify-between gap-4">
              <p className="text-sm text-text-muted">
                Simulate the outcome of your next scheduled class. Attending will improve your average, while skipping
                will reduce it.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                {/* Attend Card */}
                <div className="rounded-[10px] border-2 border-border-ink bg-success-surface p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label text-xs font-semibold text-success-foreground">If Attend</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="font-display text-[28px] font-bold leading-none text-success-foreground">
                      {nextAttendPct}%
                    </span>
                    <span className="font-mono text-xs font-semibold text-success-foreground w-fit">
                      {attendDiffStr}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">Increases buffer.</p>
                </div>

                {/* Skip Card */}
                <div className="rounded-[10px] border-2 border-border-ink bg-danger-surface p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label text-xs font-semibold text-danger-foreground">If Skip</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="font-display text-[28px] font-bold leading-none text-danger-foreground">
                      {nextSkipPct}%
                    </span>
                    <span className="font-mono text-xs font-semibold text-danger-foreground w-fit">{skipDiffStr}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">Reduces buffer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick History Log */}
        <div className="rounded-[14px] border-2 border-border-ink overflow-hidden">
          <div className="px-4 py-3 bg-surface-secondary border-b-2 border-border-ink flex justify-between items-center">
            <h3 className="font-label text-xs font-bold text-text-muted">Recent Attendance History</h3>
            <span className="text-xs text-text-muted font-medium">{historyList.length} total records</span>
          </div>
          {recentHistory.length === 0 ? (
            <EmptyState title="No attendance history records found" className="p-6" />
          ) : (
            <div className="divide-y-2 divide-border-muted">
              {recentHistory.map((d: any, idx: number) => {
                const status = (d.status || "").toLowerCase();
                const isPresent = status === "present";
                const isAbsent = status === "absent";
                const courseKey = item.courseCode || norm.code || item.code || "";
                const hasNotes = notesTracker[courseKey]?.[d.date] === true;
                const isOD = status === "on duty" || status === "partial od";
                const officialWhy = isOD ? findOfficialOdWhy(d.date) : [];

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-bold text-text-heading">{d.date}</p>
                          <span
                            className={`rounded-[6px] border-2 px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] ${
                              isPresent ? TONE_BADGE.emerald : isAbsent ? TONE_BADGE.red : TONE_BADGE.amber
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        {officialWhy.length > 0 && (
                          <p className="text-xs text-text-muted leading-snug mt-1 break-words">
                            <span className="font-bold">{officialWhy[0].reason}</span>
                            {officialWhy[0].remarks ? ` — ${officialWhy[0].remarks}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isPresent && (
                      <button
                        onClick={() => toggleNotes(d.date)}
                        className={`inline-flex min-h-9 shrink-0 items-center rounded-[8px] border-2 border-border-ink px-2.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                          hasNotes
                            ? "bg-success-surface text-success-foreground"
                            : "bg-surface text-text-primary hover:bg-surface-secondary cursor-pointer"
                        }`}
                      >
                        {hasNotes ? "Notes saved" : "Get notes"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* View Full History Button */}
        <button
          onClick={handleViewFullPage}
          className="w-full min-h-12 inline-flex items-center justify-center rounded-[10px] border-2 border-border-ink bg-primary px-4 font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-sm brutal-press cursor-pointer"
        >
          Full history and heatmap
        </button>
      </div>
    </div>
  );
}

export { DesktopCourseDetail as DesktopCourseDetailPane };
