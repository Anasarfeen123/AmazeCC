"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAtomValue } from "jotai";
import { attendanceDataAtom, calendarDataAtom, scheduleDataAtom } from "@/store/dataAtoms";
import { settingsAtom } from "@/store/settingsAtoms";
import { demoModeAtom } from "@/store";
import { buildAttendanceDayCardsMap } from "@/lib/attendanceTimetable";
import { holidaysFromCalendar, planReminders, uploadReminders } from "@/lib/reminders";
import { lastInstructionalDay } from "@/lib/ics";

const BELOW_KEY = "amazecc_below_target_seen";

/**
 * Keeps the encrypted class / exam reminders on the server in step with the
 * data on this phone (lib/reminders.ts), and raises a local alert when a sync
 * drops a course below the attendance target ("you dropped below 75% in
 * Networks"). Renders nothing. Skipped in demo mode.
 *
 * Uploads at most every 6 hours unless the timetable, exams or settings
 * changed; the batch replaces what the server had, so nothing goes stale.
 */
export default function ReminderScheduler() {
  const attendance = useAtomValue(attendanceDataAtom) as any;
  const schedule = useAtomValue(scheduleDataAtom) as any;
  const calendar = useAtomValue(calendarDataAtom) as any;
  const settings = useAtomValue(settingsAtom) as any;
  const demo = useAtomValue(demoModeAtom);
  const last = useRef<{ sig: string; at: number } | null>(null);

  const list = attendance?.attendance;
  const classes = settings?.notifyClassReminders !== false;
  const exams = settings?.notifyExamAlerts !== false;
  const target = Number(settings?.targetAttendance || 75);

  const timetable = useMemo(() => (Array.isArray(list) ? buildAttendanceDayCardsMap(list) : {}), [list]);

  // Upload the coming week's reminders.
  useEffect(() => {
    if (demo || !Array.isArray(list)) return;
    const sig = JSON.stringify([Object.keys(timetable).length, list.length, !!schedule, classes, exams]);
    const prev = last.current;
    if (prev && prev.sig === sig && Date.now() - prev.at < 6 * 3_600_000) return;
    const id = window.setTimeout(() => {
      const plan = planReminders({
        timetable: classes ? (timetable as any) : {},
        exams: exams ? schedule?.Schedule || schedule?.schedule : undefined,
        noClassDays: holidaysFromCalendar(calendar?.calendars),
        lastClassDay: lastInstructionalDay(calendar?.calendars),
      });
      void uploadReminders(plan).then((r) => {
        if (r === "sent" || r === "no-subscription") last.current = { sig, at: Date.now() };
      });
    }, 4000);
    return () => window.clearTimeout(id);
  }, [demo, list, timetable, schedule, calendar, classes, exams]);

  // Below-target alert after a sync, once per course until it recovers.
  useEffect(() => {
    if (demo || !Array.isArray(list) || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted" || settings?.notifyAttendanceDrop === false) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(BELOW_KEY) || "[]");
    } catch {}
    const below = list
      .map((c: any) => ({
        code: String(c.courseCode || ""),
        name: String(c.courseTitle || c.courseCode || ""),
        pct: Number(String(c.attendancePercentage ?? "").replace("%", "")),
      }))
      .filter((c: { pct: number }) => Number.isFinite(c.pct) && c.pct < target);
    const fresh = below.filter((c: { code: string }) => !seen.includes(c.code));
    const next = below.map((c: { code: string }) => c.code);
    try {
      localStorage.setItem(BELOW_KEY, JSON.stringify(next));
    } catch {}
    // First run only records the baseline; alerts are for new drops.
    if (!seen.length && !localStorage.getItem(`${BELOW_KEY}_init`)) {
      localStorage.setItem(`${BELOW_KEY}_init`, "1");
      return;
    }
    if (!fresh.length) return;
    void navigator.serviceWorker?.getRegistration().then((reg) => {
      for (const c of fresh as { code: string; name: string; pct: number }[]) {
        const body = `Now ${c.pct.toFixed(1)}%. Attend the next classes to get back above ${target}%.`;
        const opts = { body, tag: `below-${c.code}`, data: { url: "/?tab=tools-attendance-predictor" } };
        if (reg) void reg.showNotification(`Below ${target}% in ${c.name}`, opts);
        else new Notification(`Below ${target}% in ${c.name}`, opts);
      }
    });
  }, [demo, list, target, settings?.notifyAttendanceDrop]);

  return null;
}
