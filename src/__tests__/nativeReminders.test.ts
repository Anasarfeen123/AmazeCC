import { describe, expect, it } from "vitest";
import { upcomingClassReminders } from "../lib/nativeReminders";

// Monday 23 Nov 2026, 07:00 local.
const MONDAY_7AM = new Date(2026, 10, 23, 7, 0, 0);

const attendance = [
  {
    courseCode: "BCSE302L",
    courseTitle: "Database Systems",
    slotName: "A1",
    slotVenue: "AB1-402",
    attendancePercentage: "80",
  },
  { courseCode: "BCSE306L", courseTitle: "Networks", slotName: "B1", slotVenue: "AB2-101", attendancePercentage: "70" },
];

describe("upcomingClassReminders", () => {
  it("reminds before Monday's A1 class (8:00) with the room", () => {
    const r = upcomingClassReminders(attendance, MONDAY_7AM, 10, 1);
    expect(r).toHaveLength(1);
    expect(r[0].title).toBe("Database Systems in 10 min");
    expect(r[0].at.getHours()).toBe(7);
    expect(r[0].at.getMinutes()).toBe(50);
    expect(r[0].body).toContain("AB1-402");
  });

  it("includes tomorrow (Tuesday's B1) when asked for two days", () => {
    const r = upcomingClassReminders(attendance, MONDAY_7AM, 10, 2);
    expect(r.map((x) => x.title)).toEqual(["Database Systems in 10 min", "Networks in 10 min"]);
    expect(r[1].at.getDate()).toBe(24);
  });

  it("skips classes whose reminder time has passed", () => {
    const late = new Date(2026, 10, 23, 7, 55, 0);
    expect(upcomingClassReminders(attendance, late, 10, 1)).toHaveLength(0);
  });

  it("gives every reminder a distinct id", () => {
    const r = upcomingClassReminders(attendance, MONDAY_7AM, 5, 2);
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
  });

  it("returns nothing without a timetable", () => {
    expect(upcomingClassReminders([], MONDAY_7AM)).toEqual([]);
  });
});

import { upcomingExamReminders } from "../lib/nativeReminders";
import { isNewer } from "../lib/appUpdates";

describe("upcomingExamReminders", () => {
  it("reminds at 8 pm the evening before and an hour before", () => {
    // Exam Thursday 26 Nov 2026 09:30; now Monday 23 Nov, 07:00.
    const schedule = {
      FAT: [
        {
          courseCode: "BCSE302L",
          courseTitle: "Database Systems",
          examDate: "26-Nov-2026",
          examTime: "09:30 AM - 12:30 PM",
          venue: "AB1-402",
        },
      ],
    };
    const r = upcomingExamReminders(schedule, MONDAY_7AM);
    expect(r.length).toBe(2);
    const eve = r.find((x) => x.title.includes("tomorrow"));
    expect(eve?.at.getHours()).toBe(20);
    expect(eve?.at.getDate()).toBe(25);
    expect(r.some((x) => x.title.includes("in 1 hour"))).toBe(true);
  });
});

describe("isNewer", () => {
  it("compares versions numerically", () => {
    expect(isNewer("0.2.0", "0.1.9")).toBe(true);
    expect(isNewer("0.10.0", "0.9.0")).toBe(true);
    expect(isNewer("0.1.3", "0.1.3")).toBe(false);
    expect(isNewer("0.1.2", "0.1.10")).toBe(false);
  });
});
