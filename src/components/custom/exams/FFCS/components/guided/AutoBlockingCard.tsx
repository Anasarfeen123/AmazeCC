"use client";

import type React from "react";
import { DAYS } from "@/lib/ffcsConstants";
import { getTimetableSchema } from "@/lib/campusSchema";
import { ensureLunchPeriod } from "@/lib/slots";
import { TimetablePeriod } from "@/lib/ffcsTypes";
import { RotateCcw } from "lucide-react";
import VerticalTimetableGrid from "@/components/custom/timetable/VerticalTimetableGrid";

/** Extracted from FFCSGuidedSelector's `renderAutoBlockingCard`; markup unchanged. */
export interface AutoBlockingCardProps {
  isLandscape?: boolean;
  getDaySlots: (dayId: string) => {
    morningTheory: string[];
    eveningTheory: string[];
    morningLab: string[];
    eveningLab: string[];
    morningAll: string[];
    eveningAll: string[];
    dayTheory: string[];
    dayLab: string[];
    morning: string[];
    evening: string[];
    all: string[];
  };
  blockingActiveDay: string;
  effectiveBlockedSlots: Set<string>;
  handleClearAllBlocks: () => void;
  setBlockingActiveDay: (value: React.SetStateAction<string>) => void;
  handleToggleDayBlock: (
    dayId: string,
    type:
      | "morning"
      | "evening"
      | "all"
      | "morning_theory"
      | "morning_lab"
      | "morning_all"
      | "evening_theory"
      | "evening_lab"
      | "evening_all"
      | "day_theory"
      | "day_lab",
  ) => void;
  handleClearDayBlocks: (dayId: string) => void;
  handleToggleBlockSlot: (slot: string) => void;
}

export default function AutoBlockingCard({
  isLandscape = false,
  getDaySlots,
  blockingActiveDay,
  effectiveBlockedSlots,
  handleClearAllBlocks,
  setBlockingActiveDay,
  handleToggleDayBlock,
  handleClearDayBlocks,
  handleToggleBlockSlot,
}: AutoBlockingCardProps) {
  const daysList = DAYS || [
    { id: "mon", name: "Monday" },
    { id: "tue", name: "Tuesday" },
    { id: "wed", name: "Wednesday" },
    { id: "thu", name: "Thursday" },
    { id: "fri", name: "Friday" },
  ];

  const currentDayData = getDaySlots(blockingActiveDay);
  const morningTheoryBlocked =
    currentDayData.morningTheory.length > 0 && currentDayData.morningTheory.every((s) => effectiveBlockedSlots.has(s));
  const morningLabBlocked =
    currentDayData.morningLab.length > 0 && currentDayData.morningLab.every((s) => effectiveBlockedSlots.has(s));
  const eveningTheoryBlocked =
    currentDayData.eveningTheory.length > 0 && currentDayData.eveningTheory.every((s) => effectiveBlockedSlots.has(s));
  const eveningLabBlocked =
    currentDayData.eveningLab.length > 0 && currentDayData.eveningLab.every((s) => effectiveBlockedSlots.has(s));
  const dayAllBlocked = currentDayData.all.length > 0 && currentDayData.all.every((s) => effectiveBlockedSlots.has(s));

  const schema = getTimetableSchema();
  const theoryPeriods = ensureLunchPeriod(schema.theory as TimetablePeriod[]);
  const labPeriods = ensureLunchPeriod(schema.lab as TimetablePeriod[]);

  return (
    <div
      className={`p-4 sm:p-5 rounded-[14px] sm:rounded-[14px] bg-surface border border-border-ink shadow-2xl space-y-3 text-left flex flex-col justify-between ${
        isLandscape ? "h-[74vh] max-h-[640px] w-full" : "min-h-[480px] max-h-[700px]"
      }`}
    >
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider font-outfit">
              4. Slot &amp; Day Blocking
            </h3>
            <p className="text-xs text-text-muted">
              Rule out whole days or specific periods. Tap any slot in the vertical timetable below to block theory or
              lab independently.
            </p>
          </div>
          {effectiveBlockedSlots.size > 0 && (
            <button
              type="button"
              onClick={handleClearAllBlocks}
              className="text-xs font-bold text-danger-foreground hover:text-danger-foreground transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All ({effectiveBlockedSlots.size})</span>
            </button>
          )}
        </div>

        {/* Day Selector Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {daysList.map((d) => {
            const isSelected = blockingActiveDay === d.id;
            const dayData = getDaySlots(d.id);
            const blockedInDay = dayData.all.filter((s) => effectiveBlockedSlots.has(s)).length;

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setBlockingActiveDay(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink ring-1 ring-border-ink"
                    : "bg-background border border-border-ink text-text-secondary hover:text-text-heading hover:border-border-ink"
                }`}
              >
                <span>{d.name}</span>
                {blockedInDay > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-rose-500/30 text-danger-foreground text-xs font-mono">
                    {blockedInDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Per-Day Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleToggleDayBlock(blockingActiveDay, "morning_theory")}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              morningTheoryBlocked
                ? "bg-coral text-obsidian border-border-ink shadow-xs"
                : "bg-background border-border-ink text-text-secondary hover:border-border-ink"
            }`}
          >
            {morningTheoryBlocked ? "Unblock Morning Theory" : "Block Morning Theory (08:00 - 13:25)"}
          </button>

          <button
            type="button"
            onClick={() => handleToggleDayBlock(blockingActiveDay, "morning_lab")}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              morningLabBlocked
                ? "bg-coral text-obsidian border-border-ink shadow-xs"
                : "bg-background border-border-ink text-text-secondary hover:border-border-ink"
            }`}
          >
            {morningLabBlocked ? "Unblock Morning Lab" : "Block Morning Lab (08:00 - 13:20)"}
          </button>

          <button
            type="button"
            onClick={() => handleToggleDayBlock(blockingActiveDay, "evening_theory")}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              eveningTheoryBlocked
                ? "bg-coral text-obsidian border-border-ink shadow-xs"
                : "bg-background border-border-ink text-text-secondary hover:border-border-ink"
            }`}
          >
            {eveningTheoryBlocked ? "Unblock Afternoon Theory" : "Block Afternoon Theory (14:00 - 19:30)"}
          </button>

          <button
            type="button"
            onClick={() => handleToggleDayBlock(blockingActiveDay, "evening_lab")}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              eveningLabBlocked
                ? "bg-coral text-obsidian border-border-ink shadow-xs"
                : "bg-background border-border-ink text-text-secondary hover:border-border-ink"
            }`}
          >
            {eveningLabBlocked ? "Unblock Afternoon Lab" : "Block Afternoon Lab (14:00 - 19:30)"}
          </button>

          <button
            type="button"
            onClick={() => handleToggleDayBlock(blockingActiveDay, "all")}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              dayAllBlocked
                ? "bg-coral text-obsidian border-border-ink shadow-xs"
                : "bg-background border-border-ink text-text-secondary hover:border-border-ink"
            }`}
          >
            {dayAllBlocked ? "Unblock Full Day" : "Block Entire Day"}
          </button>

          <button
            type="button"
            onClick={() => handleClearDayBlocks(blockingActiveDay)}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-surface border border-border-ink text-text-muted hover:text-text-heading transition-all cursor-pointer"
          >
            Reset Day
          </button>
        </div>
      </div>

      {/* Visual Interactive Vertical Timetable */}
      <div className="flex-1 min-h-[220px] max-h-[360px] overflow-auto rounded-2xl bg-background border border-border-ink p-2 custom-scrollbar">
        <div className="text-xs text-text-muted font-bold mb-1.5 px-1 flex items-center justify-between">
          <span>Tap a cell to block or unblock that slot</span>
          <span className="text-danger-foreground font-mono">{effectiveBlockedSlots.size} slots blocked</span>
        </div>
        <VerticalTimetableGrid
          courses={[]}
          theoryPeriods={theoryPeriods}
          labPeriods={labPeriods}
          days={daysList}
          blockedSlots={effectiveBlockedSlots}
          onToggleBlockSlot={handleToggleBlockSlot}
          compact={true}
          showSlotNames={true}
        />
      </div>
    </div>
  );
}
