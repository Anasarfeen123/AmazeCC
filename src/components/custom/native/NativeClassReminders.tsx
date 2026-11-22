"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { attendanceDataAtom } from "@/store/dataAtoms";
import { settingsAtom } from "@/store/settingsAtoms";
import { storage } from "@/lib/storage";
import { nativeShell } from "@/lib/nativeShell";
import { syncClassReminders } from "@/lib/nativeReminders";

/**
 * Keeps the Android / desktop class reminders in step with the timetable
 * (src/lib/nativeReminders.ts). Renders nothing; does nothing on the website
 * or in the demo account.
 */
export default function NativeClassReminders() {
  const attendanceData = useAtomValue(attendanceDataAtom) as any;
  const settings = useAtomValue(settingsAtom);
  const enabled = !!settings?.classReminders;
  const minutesBefore = Number(settings?.classReminderMinutes || 10);

  useEffect(() => {
    if (!nativeShell()) return;
    let demo = false;
    try {
      demo = !!storage.demoMode.get();
    } catch {}
    const list = demo ? [] : attendanceData?.attendance || [];
    const run = () => void syncClassReminders(list, { enabled: enabled && !demo, minutesBefore });
    run();
    // Re-plan when the app comes back (a new day, or tomorrow's classes).
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [attendanceData, enabled, minutesBefore]);

  return null;
}
