"use client";

import type React from "react";
import type { PlanMode } from "@/components/custom/exams/FFCS/components/FFCSGuidedSelector";
import { Wand2, Check, Compass } from "lucide-react";

/** Extracted from FFCSGuidedSelector's `renderSetupModeCard`; markup unchanged. */
export interface SetupModeCardProps {
  isLandscape?: boolean;
  setPlanMode: (value: React.SetStateAction<PlanMode>) => void;
  planMode: "auto" | "custom";
}

export default function SetupModeCard({ isLandscape = false, setPlanMode, planMode }: SetupModeCardProps) {
  return (
    <div
      className={`p-4 sm:p-6 rounded-[16px] bg-surface border-2 border-border-ink shadow-brutal-md space-y-4 text-left flex flex-col justify-center ${
        isLandscape ? "h-[74vh] max-h-[640px] w-full" : ""
      }`}
    >
      <div className="space-y-3">
        {/* Option A: Auto-Generate */}
        <button
          type="button"
          onClick={() => setPlanMode("auto")}
          className={`w-full p-4 sm:p-5 rounded-[12px] border-2 text-left transition-colors cursor-pointer flex items-start gap-4 group relative ${
            planMode === "auto"
              ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
              : "bg-surface border-border-muted text-text-primary hover:border-border-ink"
          }`}
        >
          <div
            className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
              planMode === "auto"
                ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink"
                : "bg-surface-secondary border-2 border-border-muted text-primary"
            }`}
          >
            <Wand2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-label text-xs font-bold text-text-muted">Automatic</span>
              {planMode === "auto" && (
                <span className="text-xs font-bold text-secondary-foreground bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-outfit">Auto-Generate Timetable</h3>
            <p className="text-sm opacity-80 mt-1 leading-relaxed">
              Pick your courses and rules; it builds the clash-free options for you to compare.
            </p>
          </div>
        </button>

        {/* Option B: Build My Own */}
        <button
          type="button"
          onClick={() => setPlanMode("custom")}
          className={`w-full p-4 sm:p-5 rounded-[12px] border-2 text-left transition-colors cursor-pointer flex items-start gap-4 group relative ${
            planMode === "custom"
              ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
              : "bg-surface border-border-muted text-text-primary hover:border-border-ink"
          }`}
        >
          <div
            className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
              planMode === "custom"
                ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink"
                : "bg-surface-secondary border-2 border-border-muted text-primary"
            }`}
          >
            <Compass className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-label text-xs font-bold text-text-muted">Manual</span>
              {planMode === "custom" && (
                <span className="text-xs font-bold text-secondary-foreground bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-outfit">Build My Own Timetable</h3>
            <p className="text-sm opacity-80 mt-1 leading-relaxed">
              Choose each course's slot yourself, with clashes and faculty ratings shown as you go.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
