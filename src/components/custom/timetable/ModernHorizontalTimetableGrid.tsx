"use client";

import { type AddedCourse, type GapDetail, type TimetablePeriod } from "@amazecontinuityprojects/amazeui";
import type { NormalizedCourse } from "@/types/course";
import { cn } from "@/lib/utils";
import { COLOR_HEX_MAP } from "@/lib/ffcsConstants";
import { ensureLunchPeriod, expandSlotSpellings, hasSlot, ownSlotSpelling, timeToMinutes } from "@/lib/slots";
import { clickable } from "@/lib/a11y";

const DEFAULT_DAYS: { id: string; name: string }[] = [
  { id: "mon", name: "Monday" },
  { id: "tue", name: "Tuesday" },
  { id: "wed", name: "Wednesday" },
  { id: "thu", name: "Thursday" },
  { id: "fri", name: "Friday" },
];

export interface ModernHorizontalTimetableGridProps {
  courses: (AddedCourse | NormalizedCourse | any)[];
  theoryPeriods: TimetablePeriod[];
  labPeriods: TimetablePeriod[];
  days?: { id: string; name: string }[];
  blockedSlots?: Set<string>;
  onToggleBlockSlot?: (slot: string) => void;
  selectedGapDetails?: GapDetail[] | null;
  title?: string;
  showLegend?: boolean;
  className?: string;
}

export default function ModernHorizontalTimetableGrid({
  courses,
  theoryPeriods,
  labPeriods,
  days = DEFAULT_DAYS,
  blockedSlots,
  onToggleBlockSlot,
  selectedGapDetails,
  title = "Unified Schedule",
  showLegend = true,
  className,
}: ModernHorizontalTimetableGridProps) {
  const effectiveTheory = ensureLunchPeriod(theoryPeriods);
  const effectiveLab = ensureLunchPeriod(labPeriods);
  const numPeriods = Math.max(effectiveTheory.length, effectiveLab.length);
  const expandedBlocked = blockedSlots ? expandSlotSpellings(blockedSlots) : null;
  const lunchIdx = effectiveTheory.findIndex((p) => p?.lunch);

  return (
    <div
      className={cn(
        "rounded-[14px] border-2 border-border-ink bg-surface shadow-brutal-md overflow-hidden mb-6 transition-colors",
        className,
      )}
    >
      {/* Header bar */}
      {(title || showLegend) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-secondary border-b border-border-ink">
          {title ? (
            <h3 className="text-base font-bold text-text-heading flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              {title}
            </h3>
          ) : (
            <div />
          )}

          {showLegend && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-secondary dark:bg-secondary border border-border-ink dark:border-border-ink" />
                <span className="text-text-primary">Theory (Top)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-secondary dark:bg-secondary border border-border-ink dark:border-border-ink border-dashed" />
                <span className="text-text-primary">Lab (Bottom)</span>
              </div>
              {onToggleBlockSlot && (
                <span className="text-xs text-text-muted hidden sm:inline">• Click any slot to toggle block</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Responsive scrollable table container */}
      <div className="overflow-x-auto momentum-scroll scrollbar-thin scrollbar-thumb-border-ink touch-pan-x">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-surface-secondary border-b border-border-ink">
              <th className="p-3 border-r border-border-ink text-xs font-bold text-text-primary w-20 text-center sticky left-0 z-30 bg-surface-secondary shadow-[2px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                DAY
              </th>
              {Array.from({ length: numPeriods }).map((_, pIdx) => {
                const tp = effectiveTheory[pIdx];
                if (tp?.lunch) {
                  return (
                    <th
                      key={pIdx}
                      className="p-1 border-x border-border-ink border-b text-center bg-warning-surface w-10 min-w-[36px] max-w-[42px] select-none align-middle"
                      title="Lunch Break: 1:20 PM - 2:00 PM"
                    >
                      <div className="flex flex-col items-center justify-center leading-tight py-1 select-none">
                        <span className="text-xs font-bold text-warning-foreground tracking-wider">LUNCH</span>
                        <span className="text-xs font-bold text-warning-foreground mt-0.5">1:20-2:00</span>
                      </div>
                    </th>
                  );
                }

                const pNum = lunchIdx !== -1 && pIdx > lunchIdx ? pIdx : pIdx + 1;

                return (
                  <th
                    key={pIdx}
                    className="p-2 border-r border-border-ink text-center text-xs font-bold text-primary bg-surface-secondary min-w-[102px]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="tracking-wide">P{pNum}</span>
                      <span className="text-xs text-text-muted font-medium tracking-normal mt-0.5">
                        {tp?.start || ""}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-muted/80 dark:divide-border-muted/50">
            {days.map((day, dayIdx) => (
              <tr
                key={day.id}
                className="border-b border-border-muted/80 dark:border-border-muted/50 hover:bg-surface-hover transition-colors group"
              >
                {/* Sticky Day Column */}
                <td className="p-3 border-r border-border-ink text-center font-bold text-xs text-text-primary bg-surface-secondary sticky left-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_10px_rgba(0,0,0,0.5)] uppercase tracking-wider select-none">
                  {day.name.slice(0, 3).toUpperCase()}
                </td>

                {/* Period Columns */}
                {Array.from({ length: numPeriods }).map((_, pIdx) => {
                  const tp = effectiveTheory[pIdx];
                  const lp = effectiveLab[pIdx];

                  if (tp?.lunch) {
                    if (dayIdx === 0) {
                      return (
                        <td
                          key={pIdx}
                          rowSpan={days.length}
                          className="border-x border-border-ink bg-warning-surface text-center w-10 min-w-[36px] max-w-[42px] align-middle select-none p-1"
                        >
                          <div className="h-full w-full flex flex-col items-center justify-center py-6 select-none">
                            <span className="text-[12px] font-bold text-warning-foreground leading-tight tracking-widest drop-shadow-xs">
                              L
                            </span>
                            <span className="text-[12px] font-bold text-warning-foreground leading-tight tracking-widest drop-shadow-xs">
                              U
                            </span>
                            <span className="text-[12px] font-bold text-warning-foreground leading-tight tracking-widest drop-shadow-xs">
                              N
                            </span>
                            <span className="text-[12px] font-bold text-warning-foreground leading-tight tracking-widest drop-shadow-xs">
                              C
                            </span>
                            <span className="text-[12px] font-bold text-warning-foreground leading-tight tracking-widest drop-shadow-xs">
                              H
                            </span>
                            <div className="w-4 h-[1px] bg-amber-500/30 dark:bg-amber-500/40 my-2" />
                            <span className="text-xs font-bold text-warning-foreground leading-tight">1:20</span>
                            <span className="text-[7px] text-warning-foreground leading-tight">-</span>
                            <span className="text-xs font-bold text-warning-foreground leading-tight">2:00</span>
                          </div>
                        </td>
                      );
                    }
                    return null;
                  }

                  const rawTheorySlot = tp?.days?.[day.id];
                  const rawLabSlot = lp?.days?.[day.id];

                  if (!rawTheorySlot && !rawLabSlot) {
                    return (
                      <td
                        key={pIdx}
                        className="border-r border-border-ink bg-surface-secondary p-1 min-w-[102px] h-[84px]"
                      />
                    );
                  }

                  // Respell for law school aliases if a course occupies it
                  const theorySlot = rawTheorySlot ? ownSlotSpelling(courses, rawTheorySlot) : undefined;
                  const labSlot = rawLabSlot ? ownSlotSpelling(courses, rawLabSlot) : undefined;

                  const tCourse = theorySlot ? courses.find((c) => hasSlot(c.slots, theorySlot)) : null;
                  const lCourse = labSlot ? courses.find((c) => hasSlot(c.slots, labSlot)) : null;

                  const isTBlocked = Boolean(
                    theorySlot &&
                    (expandedBlocked?.has(theorySlot) || (rawTheorySlot && expandedBlocked?.has(rawTheorySlot))),
                  );
                  const isLBlocked = Boolean(
                    labSlot && (expandedBlocked?.has(labSlot) || (rawLabSlot && expandedBlocked?.has(rawLabSlot))),
                  );

                  const theoryStartMin = timeToMinutes(tp?.start ?? "");
                  const labStartMin = timeToMinutes(lp?.start ?? "");
                  const isTInGap =
                    theoryStartMin !== null &&
                    Boolean(
                      selectedGapDetails?.some(
                        (g) => g.day === day.id && theoryStartMin >= g.startMin && theoryStartMin < g.endMin,
                      ),
                    );
                  const isLInGap =
                    labStartMin !== null &&
                    Boolean(
                      selectedGapDetails?.some(
                        (g) => g.day === day.id && labStartMin >= g.startMin && labStartMin < g.endMin,
                      ),
                    );

                  const renderSlotHalf = (
                    slotName?: string,
                    course?: (AddedCourse | NormalizedCourse | any) | null,
                    isBlocked?: boolean,
                    inGap?: boolean,
                    isLab?: boolean,
                  ) => {
                    if (!slotName) {
                      return <div className="h-[38px] rounded-md bg-transparent" />;
                    }

                    if (isBlocked) {
                      return (
                        <div
                          {...clickable(() => onToggleBlockSlot?.(slotName))}
                          title={`Blocked slot (${slotName}). Click to unblock.`}
                          className={cn(
                            "h-[38px] p-1 rounded-md flex flex-col items-center justify-center relative transition-all duration-200 border border-border-ink",
                            "bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(239,68,68,0.12)_3px,rgba(239,68,68,0.12)_6px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(239,68,68,0.25)_3px,rgba(239,68,68,0.25)_6px)]",
                            "bg-danger-surface text-danger-foreground shadow-inner",
                            onToggleBlockSlot && "cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40",
                          )}
                        >
                          <span className="text-xs font-bold tracking-wide">Blocked</span>
                          <span className="text-xs font-semibold opacity-75">{slotName}</span>
                        </div>
                      );
                    }

                    if (course) {
                      const colorHex =
                        COLOR_HEX_MAP[course.color] || (course.color?.startsWith("#") ? course.color : "#2563eb");
                      const facultyStr =
                        typeof course.faculty === "object"
                          ? course.faculty?.raw || course.faculty?.name || ""
                          : course.faculty || "";
                      return (
                        <div
                          {...clickable(() => onToggleBlockSlot?.(slotName))}
                          className={cn(
                            "h-[38px] p-1.5 rounded-md flex flex-col justify-between relative transition-all duration-200 group/tile",
                            onToggleBlockSlot && "cursor-pointer",
                          )}
                          style={{
                            backgroundColor: `${colorHex}25`,
                            border: `1px solid ${colorHex}77`,
                            boxShadow: `0 1px 4px ${colorHex}15`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 leading-none">
                            <span className="text-xs font-bold text-text-heading tracking-tight leading-none drop-shadow-xs">
                              {course.code}
                            </span>
                            <span className="text-xs font-bold text-text-primary bg-white/70 border border-border-ink px-1 py-0.5 rounded leading-none">
                              {slotName}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-text-muted truncate leading-none mt-0.5">
                            {course.venue || "TBA"}
                          </div>

                          {/* Hover tooltip */}
                          <div className="absolute opacity-0 group-hover/tile:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[220px] bg-surface text-white text-xs rounded-xl p-2.5 shadow-2xl z-50 pointer-events-none border border-border-ink text-center">
                            <p className="font-bold text-text-primary">{course.title}</p>
                            {facultyStr && <p className="text-text-muted text-xs mt-0.5">{facultyStr}</p>}
                            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-primary font-semibold">
                              <span>Slot: {slotName}</span>
                              <span>•</span>
                              <span>Venue: {course.venue || "TBA"}</span>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface rotate-45 border-r border-b border-border-ink" />
                          </div>
                        </div>
                      );
                    }

                    if (inGap) {
                      return (
                        <div
                          {...clickable(() => onToggleBlockSlot?.(slotName))}
                          className={cn(
                            "h-[38px] p-1 rounded-md flex items-center justify-center border border-border-ink bg-warning-surface text-warning-foreground animate-pulse text-xs font-bold",
                            onToggleBlockSlot && "cursor-pointer",
                          )}
                        >
                          {slotName}
                        </div>
                      );
                    }

                    return (
                      <div
                        {...clickable(() => onToggleBlockSlot?.(slotName))}
                        title={onToggleBlockSlot ? `Slot ${slotName}. Click to rule out.` : `Slot ${slotName}`}
                        className={cn(
                          "h-[38px] p-1 rounded-md flex items-center justify-center border border-dashed border-border-ink transition-all duration-200",
                          "text-text-muted hover:text-primary hover:border-border-ink hover:bg-secondary",
                          onToggleBlockSlot && "cursor-pointer",
                        )}
                      >
                        <span className="text-xs font-semibold tracking-wider">{slotName}</span>
                      </div>
                    );
                  };

                  return (
                    <td
                      key={pIdx}
                      className="border-r border-border-ink p-1 min-w-[102px] h-[84px] align-top bg-surface"
                    >
                      <div className="flex flex-col gap-1 h-full">
                        {renderSlotHalf(theorySlot, tCourse, isTBlocked, isTInGap, false)}
                        {renderSlotHalf(labSlot, lCourse, isLBlocked, isLInGap, true)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
