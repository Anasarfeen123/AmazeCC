"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { attendanceDataAtom, scheduleDataAtom } from "@/store/dataAtoms";
import { settingsAtom } from "@/store/settingsAtoms";
import { demoModeAtom } from "@/store";
import { buildExamRows } from "@/lib/examSchedule";

/**
 * Number on the installed app's icon (Badging API: Android and desktop
 * Chrome/Edge; ignored elsewhere): courses below the attendance target plus
 * exams in the next 24 hours. Cleared when nothing needs attention, and in
 * the demo account. Renders nothing.
 */
export function attentionCount(attendance: any[], schedule: unknown, target: number, now = new Date()): number {
  const below = (attendance || []).filter((c: any) => {
    const pct = Number(c?.attendancePercentage);
    return Number.isFinite(pct) && Number(c?.totalClasses ?? 1) > 0 && pct < target;
  }).length;
  const soon = buildExamRows(schedule, now).filter((r) => {
    const at = (r.startAt ?? r.date)?.getTime();
    return at !== undefined && at > now.getTime() && at - now.getTime() <= 86_400_000;
  }).length;
  return below + soon;
}

export default function AppIconBadge() {
  const attendanceData = useAtomValue(attendanceDataAtom) as any;
  const schedule = useAtomValue(scheduleDataAtom);
  const settings = useAtomValue(settingsAtom);
  const demo = useAtomValue(demoModeAtom);

  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (!nav.setAppBadge) return;
    const n = demo
      ? 0
      : attentionCount(attendanceData?.attendance || [], schedule, Number(settings?.targetAttendance || 75));
    (n > 0 ? nav.setAppBadge(n) : nav.clearAppBadge?.())?.catch?.(() => {});
  }, [attendanceData, schedule, settings?.targetAttendance, demo]);

  return null;
}
