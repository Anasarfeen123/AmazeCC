"use client";

import type React from "react";
import type { CourseStrategy } from "@/components/custom/exams/FFCS/components/FFCSGuidedSelector";
import { Lock, Check, BookOpen, Compass } from "lucide-react";

/** Extracted from FFCSGuidedSelector's `renderSetupStrategyCard`; markup unchanged. */
export interface SetupStrategyCardProps {
  isLandscape?: boolean;
  setCourseStrategy: (value: React.SetStateAction<CourseStrategy>) => void;
  courseStrategy: "lock_advance" | "one_by_one";
  planMode: "auto" | "custom";
}

export default function SetupStrategyCard({
  isLandscape = false,
  setCourseStrategy,
  courseStrategy,
  planMode,
}: SetupStrategyCardProps) {
  return (
    <div
      className={`p-5 sm:p-6 rounded-[14px] sm:rounded-[14px] bg-surface border border-border-ink shadow-2xl space-y-4 text-left flex flex-col justify-center ${
        isLandscape ? "h-[74vh] max-h-[640px] w-full" : "min-h-[380px] max-h-[620px]"
      }`}
    >
      <div className="space-y-3">
        {/* Option 1: Lock Target Courses */}
        <button
          type="button"
          onClick={() => setCourseStrategy("lock_advance")}
          className={`w-full p-4 sm:p-5 rounded-[14px] border-2 border-border-ink text-left cursor-pointer flex items-start gap-4 group relative brutal-press ${
            courseStrategy === "lock_advance"
              ? "bg-secondary text-secondary-foreground shadow-brutal-md"
              : "bg-surface text-text-primary shadow-brutal-sm"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-[12px] border-2 border-border-ink flex items-center justify-center shrink-0 ${
              courseStrategy === "lock_advance"
                ? "bg-primary text-primary-foreground"
                : "bg-surface-secondary text-text-heading"
            }`}
          >
            <Lock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.06em] opacity-80">Locked first</span>
              {courseStrategy === "lock_advance" && (
                <span className="text-xs font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-outfit">Lock target courses first</h3>
            <p className="text-sm opacity-80 mt-1 leading-snug">
              {planMode === "auto"
                ? "Fix your must-take courses, and optionally their slots or faculty, before generating."
                : "Fix your must-take courses and preferred faculty or slots, then plan the rest."}
            </p>
          </div>
        </button>

        {/* Option 2: Choose courses normally / manual adder */}
        <button
          type="button"
          onClick={() => setCourseStrategy("one_by_one")}
          className={`w-full p-4 sm:p-5 rounded-[14px] border-2 border-border-ink text-left cursor-pointer flex items-start gap-4 group relative brutal-press ${
            courseStrategy === "one_by_one"
              ? "bg-secondary text-secondary-foreground shadow-brutal-md"
              : "bg-surface text-text-primary shadow-brutal-sm"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-[12px] border-2 border-border-ink flex items-center justify-center shrink-0 ${
              courseStrategy === "one_by_one"
                ? "bg-primary text-primary-foreground"
                : "bg-surface-secondary text-text-heading"
            }`}
          >
            {planMode === "auto" ? <BookOpen className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.06em] opacity-80">
                {planMode === "auto" ? "Open list" : "One by one"}
              </span>
              {courseStrategy === "one_by_one" && (
                <span className="text-xs font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-outfit">
              {planMode === "auto" ? "Just pick courses" : "Choose courses one by one"}
            </h3>
            <p className="text-sm opacity-80 mt-1 leading-snug">
              {planMode === "auto"
                ? "Select target courses normally from the course list without locking slot or faculty constraints, giving the solver full flexibility."
                : "Directly enter the manual course selector and pick slot offerings dynamically as you build."}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
