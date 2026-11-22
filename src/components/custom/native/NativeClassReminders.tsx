"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { attendanceDataAtom, scheduleDataAtom } from "@/store/dataAtoms";
import { settingsAtom } from "@/store/settingsAtoms";
import { storage } from "@/lib/storage";
import { nativeShell } from "@/lib/nativeShell";
import { syncClassReminders, upcomingClasses } from "@/lib/nativeReminders";
import { updateWidget } from "@/lib/nativeAndroid";
import { summariseAttendance } from "@/lib/attendanceSummary";

/**
 * Keeps the Android / desktop class reminders in step with the timetable
 * (src/lib/nativeReminders.ts). Renders nothing; does nothing on the website
 * or in the demo account.
 */
export default function NativeClassReminders() {
  const attendanceData = useAtomValue(attendanceDataAtom) as any;
  const schedule = useAtomValue(scheduleDataAtom);
  const settings = useAtomValue(settingsAtom);
  const enabled = !!settings?.classReminders;
  const minutesBefore = Number(settings?.classReminderMinutes || 10);
  const exams = settings?.examReminders !== false;

  useEffect(() => {
    if (!nativeShell()) return;
    let demo = false;
    try {
      demo = !!storage.demoMode.get();
    } catch {}
    const list = demo ? [] : attendanceData?.attendance || [];
    const target = Number(settings?.targetAttendance || 75);
    const run = () => {
      void syncClassReminders(list, {
        enabled: enabled && !demo,
        minutesBefore,
        schedule: demo ? null : schedule,
        exams,
      });
      if (nativeShell() === "android") void refreshWidget(list, target);
    };
    run();
    // Re-plan when the app comes back (a new day, or tomorrow's classes).
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [attendanceData, schedule, enabled, minutesBefore, exams, settings?.targetAttendance]);

  return null;
}

/** Home-screen widget data: today's and tomorrow's classes, and attendance. */
async function refreshWidget(list: any[], target: number) {
  const today = new Date().toDateString();
  const classes = upcomingClasses(list, new Date(), 2).map((c) => ({
    start: c.startsAt.getTime(),
    title: c.title,
    detail: [c.venue, c.slot].filter(Boolean).join(" · "),
    when: `${c.startsAt.toDateString() === today ? "Next" : "Tomorrow"} · ${c.startsAt.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    })}`,
  }));
  let attendance = "";
  if (list.length) {
    const s: any = summariseAttendance(list, target);
    const below = list.filter((c: any) => Number(c?.attendancePercentage) < target).length;
    if (s?.percentage > 0) {
      attendance = `Attendance ${Math.round(s.percentage)}%${below ? ` · ${below} below ${target}%` : ""}`;
    }
  }
  await updateWidget({ classes, attendance });
}
