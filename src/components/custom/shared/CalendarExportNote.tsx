"use client";

import { CalendarCheck, X } from "lucide-react";

/**
 * Shown after a calendar file was saved on Android, where there is no
 * one-tap import: how to get it into the calendar.
 */
export default function CalendarExportNote({ file, onClose }: { file: string; onClose: () => void }) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-[12px] border-2 border-border-ink bg-success-surface p-3 text-sm text-success-foreground"
    >
      <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold">Saved {file} to Downloads</p>
        <ol className="list-decimal space-y-0.5 pl-4 text-text-primary">
          <li>Open it from the notification or your Files app and pick your calendar app.</li>
          <li>
            Using Google Calendar? Open <span className="font-semibold">calendar.google.com</span> on a computer, then
            Settings › Import and choose the file.
          </li>
        </ol>
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="h-8 w-8 shrink-0 cursor-pointer">
        <X className="mx-auto h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
