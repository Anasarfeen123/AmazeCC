"use client";

import { getAssetPath } from "@/lib/utils";
import { rebaseDemoDates } from "@/lib/demoDates";

import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import {
  allGradesDataAtom,
  calendarDataAtom,
  credentialsAtom,
  demoModeAtom,
  gradesDataAtom,
  isLoggedInAtom,
  marksDataAtom,
  marksStatsAtom,
  moodleDataAtom,
  officialOdDataAtom,
  registeredEventsAtom,
  scheduleDataAtom,
  showIntroAtom,
  tasksAtom,
  vitolDataAtom,
  hostelDataAtom,
} from "@/store";
import { migrateCustomHomework } from "@/lib/tasksStorage";
import { storage, getTypedStorageItem } from "@/lib/storage";
import { hasStoredVtopCredentials } from "./readBootstrapSnapshot";
import { useAttendanceState } from "./useAttendanceState";

/**
 * Restores browser-persisted state once when the authenticated app mounts.
 * Guest mode only reads the small credential/settings keys; academic caches are
 * parsed only when a saved user or demo session will actually use them.
 */
export function useAppBootstrap() {
  const [appHydrated, setAppHydrated] = useState(false);
  const setAttendanceAndOD = useAttendanceState();

  const setIDs = useSetAtom(credentialsAtom);
  const setMarksData = useSetAtom(marksDataAtom);
  const setMarksStats = useSetAtom(marksStatsAtom);
  const setGradesData = useSetAtom(gradesDataAtom);
  const setAllGradesData = useSetAtom(allGradesDataAtom);
  const setScheduleData = useSetAtom(scheduleDataAtom);
  const setHostelData = useSetAtom(hostelDataAtom);
  const setCalendarData = useSetAtom(calendarDataAtom);
  const setMoodleData = useSetAtom(moodleDataAtom);
  const setVitolData = useSetAtom(vitolDataAtom);
  const setRegisteredEvents = useSetAtom(registeredEventsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const setOfficialOdData = useSetAtom(officialOdDataAtom);
  const setShowIntro = useSetAtom(showIntroAtom);
  const setDemoMode = useSetAtom(demoModeAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  useEffect(() => {
    const storedUsername = storage.username.get();
    const storedPassword = storage.password.get();
    const settingsRaw = storage.settings.get();
    const idsRaw = storage.ids.get();
    const isDemoStored = storage.demoMode.get();
    const hasVtop = hasStoredVtopCredentials(idsRaw, storedUsername, storedPassword);

    setIDs({
      VtopUsername: storedUsername || "",
      VtopPassword: storedPassword || "",
      MoodleUsername: storage.moodleUsername.get() || "",
      MoodlePassword: storage.moodlePassword.get() || "",
      ...(idsRaw || {}),
    });
    setShowIntro(!getTypedStorageItem("introDone"));
    setDemoMode(Boolean(isDemoStored));
    setIsLoggedIn(Boolean(isDemoStored || hasVtop));

    // The public landing page does not need cached academic records. Avoid
    // parsing potentially large attendance/grade/calendar payloads for guests.
    if (!isDemoStored && !hasVtop) {
      setAppHydrated(true);
      return;
    }

    const storedAttendance = storage.attendance.get();
    const storedMarks = storage.marks.get();
    const storedMarksStats = storage.marksStats.get();
    const storedGrades = storage.grades.get();
    const storedAllGrades = storage.allGrades.get();
    const storedSchedule = storage.schedule.get();
    const storedHostel = storage.hostel.get();
    const calendar = storage.calendar.get();
    const moodleData = storage.moodleData.get();
    const vitolData = storage.vitolData.get();
    const storedRegisteredEvents = storage.registeredEvents.get();

    if (storedAttendance?.attendance) setAttendanceAndOD(storedAttendance);

    // Demo data is set straight into atoms when the demo starts and is never
    // written to storage, so a reload used to come back empty ("0 of 0
    // attended", blank Attendance). Reload it from the demo file instead.
    if (isDemoStored && !storedAttendance?.attendance) {
      void fetch(getAssetPath("/data/demoData.json"))
        .then((res) => (res.ok ? res.json() : null))
        .then((raw: any) => {
          if (!raw) return;
          const demo = rebaseDemoDates(raw);
          if (demo.attendance) setAttendanceAndOD(demo.attendance);
          if (demo.marks) setMarksData(demo.marks);
          if (demo.grades) setGradesData(demo.grades);
          if (demo.allGrades) setAllGradesData(demo.allGrades);
          if (demo.schedule) setScheduleData(demo.schedule);
          if (demo.hostel) setHostelData(demo.hostel);
          if (demo.calender) setCalendarData(demo.calender);
          if (demo.registeredEvents) setRegisteredEvents(demo.registeredEvents);
        })
        .catch(() => {});
    }
    if (storedMarks) setMarksData(storedMarks as object);
    if (storedMarksStats) setMarksStats(storedMarksStats as Record<string, unknown>);
    if (storedSchedule) setScheduleData(storedSchedule as object);
    if (storedGrades) setGradesData(storedGrades as object);
    if (storedAllGrades) setAllGradesData(storedAllGrades);
    if (storedHostel) setHostelData(storedHostel as object);
    if (calendar) setCalendarData(calendar as object);
    if (moodleData) setMoodleData(moodleData as never[]);
    if (vitolData) setVitolData(vitolData as never[]);
    if (storedRegisteredEvents) setRegisteredEvents(storedRegisteredEvents);

    try {
      setTasks(migrateCustomHomework());
    } catch {}

    try {
      const bootSemester = (settingsRaw as any)?.currSemesterID as string | undefined;
      if (bootSemester) {
        const storedOd = storage.officialOd.get(bootSemester);
        if (storedOd) setOfficialOdData(storedOd);
      }
    } catch {}

    setAppHydrated(true);
  }, [
    setAllGradesData,
    setAttendanceAndOD,
    setCalendarData,
    setDemoMode,
    setGradesData,
    setHostelData,
    setIDs,
    setIsLoggedIn,
    setMarksData,
    setMarksStats,
    setMoodleData,
    setOfficialOdData,
    setRegisteredEvents,
    setScheduleData,
    setShowIntro,
    setTasks,
    setVitolData,
  ]);

  return { appHydrated, setAttendanceAndOD };
}
