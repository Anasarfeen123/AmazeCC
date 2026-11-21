"use client";

import type React from "react";
import { Clock } from "lucide-react";

/** Extracted from FFCSGuidedSelector's `renderAutoTimingsCard`; markup unchanged. */
export interface AutoTimingsCardProps {
  isLandscape?: boolean;
  autoMinStartTime: string;
  autoMaxEndTime: string;
  setAutoMinStartTime: (value: React.SetStateAction<string>) => void;
  setAutoMaxEndTime: (value: React.SetStateAction<string>) => void;
  autoBlockOutsideSlots: (start: string, end: string) => void;
  timeBlockedSlots: Set<string>;
}

export default function AutoTimingsCard({
  isLandscape = false,
  autoMinStartTime,
  autoMaxEndTime,
  setAutoMinStartTime,
  setAutoMaxEndTime,
  autoBlockOutsideSlots,
  timeBlockedSlots,
}: AutoTimingsCardProps) {
  const startEdgePresets = [
    { time: "08:00", label: "08:00 AM", desc: "Period 1 (A1 / L1)" },
    { time: "08:55", label: "08:55 AM", desc: "Period 2 (F1 / L3)" },
    { time: "09:50", label: "09:50 AM", desc: "Period 3 (D1 / L5)" },
    { time: "10:45", label: "10:45 AM", desc: "Period 4 (TB1 / L7)" },
    { time: "11:40", label: "11:40 AM", desc: "Period 5 (TG1 / L9)" },
    { time: "14:00", label: "02:00 PM", desc: "Afternoon Start (A2 / L31)" },
  ];

  const endEdgePresets = [
    { time: "12:30", label: "12:30 PM", desc: "Period 5 End" },
    { time: "13:25", label: "01:25 PM", desc: "Lunch Break (Morning End)" },
    { time: "16:40", label: "04:40 PM", desc: "Period 9 End (D2 / L35)" },
    { time: "17:35", label: "05:35 PM", desc: "Period 10 End (TB2 / L37)" },
    { time: "18:30", label: "06:30 PM", desc: "Period 11 End (TG2 / L39)" },
    { time: "19:30", label: "07:30 PM", desc: "Day Wrap (Full Day End)" },
  ];

  const quickDaySchedules = [
    { start: "08:00", end: "19:30", title: "Full Campus Day", badge: "08:00 - 19:30" },
    { start: "08:00", end: "13:25", title: "Morning Only", badge: "08:00 - 13:25" },
    { start: "14:00", end: "19:30", title: "Afternoon Only", badge: "14:00 - 19:30" },
    { start: "08:55", end: "17:35", title: "Balanced Hours", badge: "08:55 - 17:35" },
  ];

  return (
    <div
      className={`p-4 sm:p-6 rounded-[14px] sm:rounded-[14px] bg-surface border border-border-ink shadow-2xl space-y-4 text-left flex flex-col justify-between ${
        isLandscape ? "h-[74vh] max-h-[640px] w-full" : "min-h-[460px] max-h-[680px]"
      } overflow-y-auto custom-scrollbar`}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider font-outfit">
            3. Day Start &amp; End Timings
          </h3>
          <p className="text-xs text-text-muted">
            Set earliest permitted class starts and latest wrap times. Slot-based edge chips align with VIT periods.
          </p>
        </div>

        {/* Quick Schedule Presets */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Quick Timing Presets</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickDaySchedules.map((sched) => {
              const isActive = autoMinStartTime === sched.start && autoMaxEndTime === sched.end;
              return (
                <button
                  key={sched.title}
                  type="button"
                  onClick={() => {
                    setAutoMinStartTime(sched.start);
                    setAutoMaxEndTime(sched.end);
                    autoBlockOutsideSlots(sched.start, sched.end);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground border-border-ink shadow-sm ring-1 ring-border-ink"
                      : "bg-background border-border-ink text-text-secondary hover:border-border-ink"
                  }`}
                >
                  <div className="font-bold text-xs font-outfit truncate">{sched.title}</div>
                  <div className="text-xs opacity-80 font-mono mt-0.5">{sched.badge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-blocking Status Feedback */}
        {timeBlockedSlots.size > 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-warning-surface border border-border-ink text-warning-foreground text-xs font-medium">
            <Clock className="w-4 h-4 shrink-0 text-warning-foreground" />
            <span>
              <strong>{timeBlockedSlots.size} slots</strong> outside {autoMinStartTime} – {autoMaxEndTime} are
              automatically blocked for generation.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-secondary border border-border-ink text-text-muted text-xs">
            <Clock className="w-4 h-4 shrink-0 text-text-muted" />
            <span>Full campus schedule open (08:00 – 19:30). No slots are automatically ruled out by time.</span>
          </div>
        )}

        {/* Start Time Section */}
        <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-ink space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-heading uppercase tracking-wider font-outfit block">
                Earliest Start Time (No classes before)
              </span>
              <span className="text-xs text-text-muted">Classes starting earlier than this time will be excluded.</span>
            </div>
            <input
              type="time"
              aria-label="Earliest class start time"
              value={autoMinStartTime}
              onChange={(e) => {
                const val = e.target.value;
                setAutoMinStartTime(val);
                if (val) autoBlockOutsideSlots(val, autoMaxEndTime);
              }}
              className="px-2.5 py-1 rounded-xl bg-surface border border-border-ink text-text-heading text-xs font-mono font-bold"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {startEdgePresets.map((preset) => {
              const isSelected = autoMinStartTime === preset.time;
              return (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => {
                    setAutoMinStartTime(preset.time);
                    autoBlockOutsideSlots(preset.time, autoMaxEndTime);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col text-left ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-border-ink shadow-xs"
                      : "bg-surface border-border-ink text-text-secondary hover:border-border-ink"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-xs opacity-75 font-normal">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* End Time Section */}
        <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-ink space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-heading uppercase tracking-wider font-outfit block">
                Latest Wrap Time (No classes after)
              </span>
              <span className="text-xs text-text-muted">Classes ending later than this time will be excluded.</span>
            </div>
            <input
              type="time"
              aria-label="Latest class end time"
              value={autoMaxEndTime}
              onChange={(e) => {
                const val = e.target.value;
                setAutoMaxEndTime(val);
                if (val) autoBlockOutsideSlots(autoMinStartTime, val);
              }}
              className="px-2.5 py-1 rounded-xl bg-surface border border-border-ink text-text-heading text-xs font-mono font-bold"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {endEdgePresets.map((preset) => {
              const isSelected = autoMaxEndTime === preset.time;
              return (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => {
                    setAutoMaxEndTime(preset.time);
                    autoBlockOutsideSlots(autoMinStartTime, preset.time);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col text-left ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-border-ink shadow-xs"
                      : "bg-surface border-border-ink text-text-secondary hover:border-border-ink"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-xs opacity-75 font-normal">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
