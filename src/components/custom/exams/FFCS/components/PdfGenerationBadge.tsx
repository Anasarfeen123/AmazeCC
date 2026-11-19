"use client";

import { FileText, Check, AlertCircle, X } from "lucide-react";

export interface PdfGenerationBadgeProps {
  isGenerating: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
  timetableName?: string;
  theme?: "light" | "dark";
  onDismiss?: () => void;
}

export default function PdfGenerationBadge({
  isGenerating,
  successMessage,
  errorMessage,
  timetableName = "Timetable",
  theme = "dark",
  onDismiss,
}: PdfGenerationBadgeProps) {
  const isVisible = isGenerating || Boolean(successMessage) || Boolean(errorMessage);
  if (!isVisible) return null;

  const isSuccess = Boolean(successMessage) && !isGenerating;
  const isError = Boolean(errorMessage) && !isGenerating;

  const strokeRadius = 13;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = strokeCircumference * 0.28; // ~72% fill for the rotating spinner ring

  const borderLeftColor = isError ? "border-l-rose-500" : isSuccess ? "border-l-emerald-500" : "border-l-indigo-600";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] right-4 left-4 sm:left-auto max-w-[calc(100%-2rem)] sm:max-w-[310px] z-50 bg-surface dark:bg-[#0f172a] border border-border-ink shadow-2xl rounded-2xl p-3 pr-2.5 flex items-center gap-3 select-none font-sans border-l-[4px] ${borderLeftColor} animate-in fade-in slide-in-from-bottom-3 duration-200`}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Circular Progress / Rotating Spinner SVG (Sync Engine Collapsed Badge style) */}
        <div className="relative flex items-center justify-center shrink-0 w-8 h-8">
          {isSuccess ? (
            <div className="w-8 h-8 rounded-full bg-success-surface border border-border-ink flex items-center justify-center animate-in zoom-in-75 duration-200">
              <Check className="w-4 h-4 text-success-foreground stroke-[3]" />
            </div>
          ) : isError ? (
            <div className="w-8 h-8 rounded-full bg-danger-surface border border-border-ink flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-danger-foreground" />
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 animate-spin -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r={strokeRadius}
                  className="stroke-slate-200/80 dark:stroke-slate-800"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                <circle
                  cx="16"
                  cy="16"
                  r={strokeRadius}
                  className="stroke-indigo-600 dark:stroke-indigo-400"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={strokeCircumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                />
              </svg>
              <FileText className="w-3.5 h-3.5 text-primary absolute" />
            </>
          )}
        </div>

        {/* Pinned Info Labels */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-text-primary leading-none font-outfit truncate">
              {isSuccess ? "Dossier Downloaded" : isError ? "Dossier Download Failed" : "Preparing Dossier Download"}
            </h4>
            <span
              className={`text-xs font-bold uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                theme === "light"
                  ? "bg-warning-surface text-warning-foreground border-border-ink"
                  : "bg-secondary text-secondary-foreground border-border-ink"
              }`}
            >
              {theme === "light" ? "Light" : "Dark"}
            </span>
          </div>
          <p className="text-xs text-text-muted font-semibold truncate mt-1 leading-tight max-w-[155px]">
            {isSuccess
              ? successMessage || `${timetableName} downloaded`
              : isError
                ? errorMessage || "An error occurred"
                : `Preparing ${timetableName} download...`}
          </p>
        </div>

        {/* Close Button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer shrink-0 relative hit-expand touch-press"
            title="Dismiss notification"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
