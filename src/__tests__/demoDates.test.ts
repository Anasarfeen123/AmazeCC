import { describe, expect, it } from "vitest";
import demo from "../data/demoData.json";
import { parseDemoDate, rebaseDemoDates, shiftDemoDate } from "../lib/demoDates";

const NOW = new Date("2026-11-22T06:00:00Z"); // Sunday 22 Nov 2026, IST
const today = parseDemoDate("22-11-2026")!;

describe("shiftDemoDate", () => {
  it("keeps each format and time suffix", () => {
    expect(shiftDemoDate("07-12-2025", 7)).toBe("14-12-2025");
    expect(shiftDemoDate("08-11-2025 09:09", 28)).toBe("06-12-2025 09:09");
    expect(shiftDemoDate("15-Dec-2025", 21)).toBe("05-Jan-2026");
    expect(shiftDemoDate("18-DEC-2025 09:00", 7)).toBe("25-DEC-2025 09:00");
    expect(shiftDemoDate("Instructional Day", 7)).toBe("Instructional Day");
  });
});

describe("rebaseDemoDates", () => {
  const out = rebaseDemoDates(structuredClone(demo) as any, NOW);

  it("puts FAT one to two weeks ahead and CATs in the past", () => {
    const fat = out.schedule.Schedule.FAT.map((e: any) => parseDemoDate(e.examDate)!);
    expect(Math.min(...fat) - today).toBeGreaterThanOrEqual(7);
    expect(Math.min(...fat) - today).toBeLessThan(14);
    for (const k of ["CAT1", "CAT2"]) {
      for (const e of out.schedule.Schedule[k]) expect(parseDemoDate(e.examDate)!).toBeLessThan(today);
    }
  });

  it("ends attendance within the past week and keeps weekdays", () => {
    const dates = out.attendance.attendance.flatMap((a: any) => a.viewLink.map((v: any) => parseDemoDate(v.date)!));
    const last = Math.max(...dates);
    expect(today - last).toBeGreaterThanOrEqual(0);
    expect(today - last).toBeLessThan(7);
    const before = demo.attendance.attendance[0].viewLink[0].date;
    const after = out.attendance.attendance[0].viewLink[0].date;
    expect((((parseDemoDate(after)! - parseDemoDate(before)!) % 7) + 7) % 7).toBe(0);
  });

  it("regroups the calendar into the shifted months, with upcoming days", () => {
    const months = out.calender.calendars.map((m: any) => m.month);
    expect(months[0]).toMatch(/^[A-Z]+ 20\d\d$/);
    expect(new Set(months).size).toBe(months.length);
    const total = (cal: any[]) => cal.reduce((n, m) => n + m.days.length, 0);
    expect(total(out.calender.calendars)).toBe(total(demo.calender.calendars));
  });

  it("makes the coming weeks teaching days, not a vacation", () => {
    const upcoming: number[] = [];
    for (const m of out.calender.calendars) {
      const [name, year] = m.month.split(" ");
      const mi = [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER",
      ].indexOf(name);
      for (const d of m.days) {
        const n = parseDemoDate(`${String(d.date).padStart(2, "0")}-${String(mi + 1).padStart(2, "0")}-${year}`)!;
        if (n >= today && n < today + 14 && d.events.some((e: any) => e.type === "Instructional Day")) upcoming.push(n);
      }
    }
    expect(upcoming.length).toBeGreaterThanOrEqual(8);
  });

  it("puts the first event ahead and is stable when applied twice", () => {
    const ev = out.registeredEvents.map((e: any) => parseDemoDate(e.date)!);
    expect(Math.min(...ev)).toBeGreaterThan(today);
    expect(rebaseDemoDates(out, NOW)).toEqual(out);
  });
});
