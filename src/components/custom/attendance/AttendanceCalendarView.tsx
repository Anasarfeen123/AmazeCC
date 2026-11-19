import { useState, useMemo } from "react";
import { getDay } from "date-fns";
import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2, FileText } from "lucide-react";
import BottomSheet from "../shared/BottomSheet";
import { clickable } from "@/lib/a11y";
import type { CourseAttendanceHistoryEntry } from "@/types/course";

export interface AttendanceCalendarViewProps {
  analyzeCalendars?: any[];
  historyList: (CourseAttendanceHistoryEntry | any)[];
  notesTracker?: Record<string, Record<string, boolean>>;
  toggleNotes?: (...args: any[]) => void;
  courseCode?: string;
  isOverall?: boolean;
  toggleIndividualNote?: (...args: any[]) => void;
  isODTracker?: boolean;
  compact?: boolean;
}

export default function AttendanceCalendarView({
  analyzeCalendars,
  historyList,
  notesTracker,
  toggleNotes,
  courseCode,
  isOverall,
  toggleIndividualNote,
  isODTracker = false,
  compact = false,
}: AttendanceCalendarViewProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOverallDate, setSelectedOverallDate] = useState(null);

  const safeCalendars = useMemo(() => {
    if (!analyzeCalendars || !Array.isArray(analyzeCalendars)) return [];
    return analyzeCalendars;
  }, [analyzeCalendars]);

  const activeMonth = safeCalendars[activeIdx];
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const monthData = useMemo(() => {
    if (!activeMonth) return null;

    const monthStr = activeMonth.month?.toLowerCase() || "";
    const mIndex = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].findIndex((m) => monthStr.includes(m));
    const year = activeMonth.year || new Date().getFullYear();

    if (mIndex === -1) return null;

    const firstDayOfMonth = new Date(year, mIndex, 1);
    let firstDay = getDay(firstDayOfMonth); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Adjust for Mon-Sun week
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const blanksCount = firstDay;
    const blanks = Array.from({ length: blanksCount }, (_, i) => i);

    // We use activeMonth.days to render exactly the days available, or generate standard days
    // Assuming activeMonth.days is an array of { date: number, type: string, events: [] }
    const daysInMonth = activeMonth.days || [];

    // Let's create a map for history dates
    const historyMap = {};
    historyList.forEach((d) => {
      const dateObj = new Date(d.date);
      if (dateObj.getFullYear() === year && dateObj.getMonth() === mIndex) {
        historyMap[dateObj.getDate()] = {
          status: isOverall ? d.overallStatus : d.status.toLowerCase(),
          entry: d,
        };
      }
    });

    return { blanks, daysInMonth, historyMap, mIndex, year };
  }, [activeMonth, historyList]);

  if (safeCalendars.length === 0 || !monthData) {
    return <div className="p-8 text-center text-text-muted">No calendar data available for this semester.</div>;
  }

  // Compact mode: edge-to-edge squircle date grid. Dates carry their own
  // coloured circle + mild neon tint — no status words, no per-day actions.
  const statusTint = (status: string | undefined) => {
    if (isODTracker) {
      if (status === "valid od")
        return {
          bg: "bg-success-surface",
          dot: "bg-emerald-500",
        };
      if (status === "wasted od") return { bg: "bg-danger-surface", dot: "bg-red-500" };
      if (status === "partial wasted od")
        return {
          bg: "bg-warning-surface",
          dot: "bg-amber-500",
        };
      return { bg: "", dot: "" };
    }
    if (status === "present")
      return {
        bg: "bg-success-surface",
        dot: "bg-emerald-500",
      };
    if (status === "absent") return { bg: "bg-danger-surface", dot: "bg-red-500" };
    if (status === "on duty" || status === "partial od") return { bg: "bg-warning-surface", dot: "bg-amber-500" };
    if (status && status.includes("half-day"))
      return {
        bg: "bg-orange-500/15 dark:bg-orange-500/15",
        dot: "bg-orange-500",
      };
    if (status === "partially absent") return { bg: "bg-danger-surface", dot: "bg-rose-500" };
    return { bg: "", dot: "" };
  };

  // Present: dot. Absent: diamond. On duty: square. Partial or half-day: short bar.
  const dotShape = (status: string | undefined) => {
    if (!status) return "w-1.5 h-1.5 rounded-full";
    if (status === "absent" || status === "wasted od") return "w-1.5 h-1.5 rotate-45 rounded-[1px]";
    if (status === "on duty" || status === "partial od" || status === "valid od") return "w-1.5 h-1.5 rounded-[1px]";
    if (status.includes("partial") || status.includes("half-day")) return "w-2.5 h-1 rounded-full";
    return "w-1.5 h-1.5 rounded-full";
  };

  if (compact) {
    return (
      <div className="w-full min-w-0 flex flex-col">
        {/* Month Selector */}
        <div className="w-full flex gap-1.5 pb-3 overflow-x-auto hide-scrollbar">
          {safeCalendars.map((cal, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                idx === activeIdx
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface-secondary text-text-muted"
              }`}
            >
              {cal.month}
            </button>
          ))}
        </div>

        {/* Compact date grid */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <m.div
              key={activeIdx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full grid grid-cols-7 gap-1 text-center"
            >
              {weekdays.map((day) => (
                <div key={day} className="text-xs font-bold uppercase tracking-wider text-text-muted py-1">
                  {day.slice(0, 2)}
                </div>
              ))}

              {monthData.blanks.map((_, i) => (
                <div key={`blank-${i}`} className="aspect-square" />
              ))}

              {monthData.daysInMonth.map((dayInfo, i) => {
                const date = Number(dayInfo.date);
                const dataObj = monthData.historyMap[date];
                const tint = statusTint(dataObj?.status);
                return (
                  <div
                    key={date}
                    title={dataObj?.status ? `${date}: ${dataObj.status}` : undefined}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${tint.bg}`}
                  >
                    <span
                      className={`text-xs font-bold font-outfit leading-none ${dataObj ? "text-text-heading" : "text-text-muted"}`}
                    >
                      {date}
                    </span>
                    {tint.dot ? (
                      // Shape as well as colour, so present/absent is
                      // readable without telling red from green.
                      <span aria-hidden="true" className={`${dotShape(dataObj?.status)} ${tint.dot}`} />
                    ) : (
                      <span className="w-1.5 h-1.5" />
                    )}
                    {dataObj?.status ? <span className="sr-only">{dataObj.status}</span> : null}
                  </div>
                );
              })}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Individual Notes Sheet for Overall Mode */}
        <AnimatePresence>
          {selectedOverallDate && (
            <BottomSheet
              onClose={() => setSelectedOverallDate(null)}
              overlayId="attendance-date-notes-compact"
              maxWidth="max-w-sm"
              title={selectedOverallDate.date}
              closeLabel="Close date notes"
            >
              <div className="space-y-3 pt-1">
                {selectedOverallDate.missedClasses.map((c, idx) => {
                  const isSecured = notesTracker[c.courseCode]?.[selectedOverallDate.date] === true;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 bg-surface-secondary p-3 rounded-xl border border-border-ink"
                    >
                      <div>
                        <p className="text-sm font-bold text-text-heading">{c.courseTitle}</p>
                        <p className="text-xs text-text-muted uppercase tracking-wider">
                          {c.courseCode} • {c.status}
                        </p>
                      </div>
                      <button
                        onClick={(e) => toggleIndividualNote(selectedOverallDate.date, c.courseCode, e)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 ${
                          isSecured
                            ? "bg-emerald-100 text-success-foreground dark:text-success-foreground"
                            : "bg-surface border border-border-ink text-text-muted hover:bg-surface-secondary "
                        }`}
                      >
                        {isSecured ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                        {isSecured ? "Secured" : "Get Notes"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </BottomSheet>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 md:p-6 p-3 flex flex-col items-center">
      {/* Month Selector */}
      <div className="w-full max-w-5xl flex flex-wrap justify-center gap-2 pb-4 px-1">
        {safeCalendars.map((cal, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              idx === activeIdx
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-secondary text-text-muted hover:bg-surface-hover"
            }`}
          >
            {cal.month}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="w-full overflow-hidden rounded-xl border border-border-ink bg-surface shadow-sm">
        <AnimatePresence mode="wait">
          <m.div
            key={activeIdx}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-x-auto hide-scrollbar"
          >
            <div className="min-w-0 w-full grid grid-cols-7 text-center border-collapse">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="font-bold py-2 border-b border-border-ink text-xs tracking-wider uppercase text-text-muted bg-gray-55/50"
                >
                  {day}
                </div>
              ))}

              {monthData.blanks.map((_, i) => (
                <div key={`blank-${i}`} className="h-14 sm:h-18 border-b border-r border-border-ink" />
              ))}

              {monthData.daysInMonth.map((dayInfo, i) => {
                const date = Number(dayInfo.date);
                const dataObj = monthData.historyMap[date];
                const status = dataObj?.status;
                const entry = dataObj?.entry;

                let bgClass = "bg-transparent hover:bg-surface-hover";
                let dotColor = "";

                if (isODTracker) {
                  if (status === "valid od") {
                    bgClass = "bg-emerald-50/50 dark:bg-success-surface";
                    dotColor = "bg-emerald-500";
                  } else if (status === "wasted od") {
                    bgClass = "bg-red-50/50 dark:bg-danger-surface";
                    dotColor = "bg-red-500";
                  } else if (status === "partial wasted od") {
                    bgClass = "bg-amber-50/50 dark:bg-warning-surface";
                    dotColor = "bg-amber-500";
                  }
                } else {
                  if (status === "present") {
                    bgClass = "bg-emerald-50/50 dark:bg-success-surface";
                    dotColor = "bg-emerald-500";
                  } else if (status === "absent") {
                    bgClass = "bg-red-50/50 dark:bg-danger-surface";
                    dotColor = "bg-red-500";
                  } else if (status === "on duty" || status === "partial od") {
                    bgClass = "bg-yellow-50/50 dark:bg-warning-surface";
                    dotColor = "bg-yellow-500";
                  } else if (status && status.includes("half-day")) {
                    bgClass = "bg-orange-50/50  dark:bg-orange-500/10";
                    dotColor = "bg-orange-500";
                  } else if (status === "partially absent") {
                    bgClass = "bg-rose-50/50 dark:bg-danger-surface";
                    dotColor = "bg-rose-500";
                  }
                }

                const isLastCol = (monthData.blanks.length + i + 1) % 7 === 0;

                const exactDateStr = entry ? entry.date : null;

                let hasNotes = false;
                const isMissed = isOverall
                  ? entry?.missedClasses?.length > 0
                  : status === "absent" || status === "on duty";

                if (isOverall && isMissed && exactDateStr) {
                  hasNotes = entry.missedClasses.every((c) => notesTracker[c.courseCode]?.[exactDateStr] === true);
                } else if (!isOverall && exactDateStr) {
                  hasNotes = notesTracker[courseCode]?.[exactDateStr] === true;
                }

                return (
                  <div
                    key={date}
                    {...clickable(() => {
                      if (isOverall && isMissed) setSelectedOverallDate(entry);
                    })}
                    className={`relative flex flex-col p-1.5 h-16 sm:h-20 border-b border-border-ink transition-all ${bgClass} ${isLastCol ? "" : "border-r"} ${isOverall && isMissed ? "cursor-pointer hover:shadow-inner" : ""}`}
                  >
                    <div className="w-full flex justify-between items-start">
                      <span
                        className={`text-xs sm:text-xs font-semibold ${status ? "text-text-heading " : "text-text-muted "}`}
                      >
                        {date}
                      </span>
                      {dotColor && <div className={`w-2 h-2 rounded-full mt-1 ${dotColor}`} />}
                    </div>
                    {status && (
                      <div className="mt-auto text-left flex flex-col gap-1.5">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isODTracker
                              ? status === "valid od"
                                ? "text-success-foreground"
                                : status === "wasted od"
                                  ? "text-danger-foreground"
                                  : "text-warning-foreground"
                              : status === "present"
                                ? "text-success-foreground"
                                : status === "absent"
                                  ? "text-danger-foreground"
                                  : status.includes("half-day")
                                    ? "text-warning-foreground"
                                    : status.includes("partially absent")
                                      ? "text-danger-foreground"
                                      : "text-warning-foreground"
                          }`}
                        >
                          {status}
                        </span>

                        {isMissed && exactDateStr && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isOverall) toggleNotes(exactDateStr, entry.missedClasses, e);
                              else toggleNotes(exactDateStr);
                            }}
                            className={`relative hit-expand flex items-center justify-center gap-1 p-1 sm:px-2 sm:py-1 rounded-md border text-xs sm:text-xs font-semibold transition-all shrink-0 mt-auto ${
                              hasNotes
                                ? "bg-success-surface border border-border-ink text-success-foreground dark:border-emerald-800/50 dark:text-success-foreground"
                                : "bg-surface border border-border-ink text-text-muted hover:bg-surface-secondary "
                            }`}
                          >
                            {hasNotes ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                            <span className="truncate">{hasNotes ? "Secured" : "Notes"}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Individual Notes Sheet for Overall Mode */}
      <AnimatePresence>
        {selectedOverallDate && (
          <BottomSheet
            onClose={() => setSelectedOverallDate(null)}
            overlayId="attendance-date-notes-wide"
            maxWidth="max-w-sm"
            title={selectedOverallDate.date}
            closeLabel="Close date notes"
          >
            <div className="space-y-3 pt-1">
              {selectedOverallDate.missedClasses.map((c, idx) => {
                const isSecured = notesTracker[c.courseCode]?.[selectedOverallDate.date] === true;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 bg-surface-secondary p-3 rounded-xl border border-border-ink"
                  >
                    <div>
                      <p className="text-sm font-bold text-text-heading">{c.courseTitle}</p>
                      <p className="text-xs text-text-muted uppercase tracking-wider">
                        {c.courseCode} • {c.status}
                      </p>
                    </div>
                    <button
                      onClick={(e) => toggleIndividualNote(selectedOverallDate.date, c.courseCode, e)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 ${
                        isSecured
                          ? "bg-emerald-100 text-success-foreground dark:text-success-foreground"
                          : "bg-surface border border-border-ink text-text-muted hover:bg-surface-secondary "
                      }`}
                    >
                      {isSecured ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                      {isSecured ? "Secured" : "Get Notes"}
                    </button>
                  </div>
                );
              })}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
