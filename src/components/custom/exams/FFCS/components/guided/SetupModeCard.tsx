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
      className={`p-5 sm:p-6 rounded-[14px] sm:rounded-[14px] bg-surface border border-border-ink shadow-2xl space-y-4 text-left flex flex-col justify-center ${
        isLandscape ? "h-[74vh] max-h-[640px] w-full" : "min-h-[380px] max-h-[620px]"
      }`}
    >
      <div className="space-y-3">
        {/* Option A: Auto-Generate */}
        <button
          type="button"
          onClick={() => setPlanMode("auto")}
          className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 group relative ${
            planMode === "auto"
              ? "bg-secondary border-border-ink text-white shadow-lg ring-1 ring-border-ink"
              : "bg-surface-secondary border-border-ink text-text-secondary hover:border-border-ink hover:bg-surface-secondary"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              planMode === "auto"
                ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink "
                : "bg-surface border border-border-ink text-primary"
            }`}
          >
            <Wand2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-warning-foreground bg-warning-surface px-2 py-0.5 rounded-md border border-border-ink">
                ✨ Algorithmic Engine
              </span>
              {planMode === "auto" && (
                <span className="text-xs font-bold text-secondary-foreground bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-text-heading font-outfit">Auto-Generate Timetable</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Step-by-step guidance: pick target courses, set pacing rules, align with peers, and inspect recommended
              variants with direct faculty review & schedule views.
            </p>
          </div>
        </button>

        {/* Option B: Build My Own */}
        <button
          type="button"
          onClick={() => setPlanMode("custom")}
          className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 group relative ${
            planMode === "custom"
              ? "bg-secondary border-border-ink text-white shadow-lg ring-1 ring-border-ink"
              : "bg-surface-secondary border-border-ink text-text-secondary hover:border-border-ink hover:bg-surface-secondary"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              planMode === "custom"
                ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink "
                : "bg-surface border border-border-ink text-primary"
            }`}
          >
            <Compass className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-success-foreground bg-success-surface px-2 py-0.5 rounded-md border border-border-ink">
                🧭 Manual Builder
              </span>
              {planMode === "custom" && (
                <span className="text-xs font-bold text-secondary-foreground bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-text-heading font-outfit">Build My Own Timetable</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Select courses and slot offerings one-by-one with real-time conflict checking, faculty ratings, and
              replacement support.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
