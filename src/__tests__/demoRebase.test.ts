import { describe, it, expect } from "vitest";
import { demoShiftWeeks, parseDemoDate, rebaseDemoData } from "@/lib/demoRebase";
import demo from "../data/demoData.json";

const NOW = new Date(2026, 10, 8, 15, 0); // Sun 8 Nov 2026

function allViewLinkDates(data: any): Date[] {
  return (data.attendance.attendance as any[]).flatMap((r) =>
    (r.viewLink ?? []).map((e: any) => parseDemoDate(e.date)!.date),
  );
}

describe("rebaseDemoData", () => {
  it("parses the snapshot's date formats", () => {
    expect(parseDemoDate("20-Dec-2025")?.date.getDate()).toBe(20);
    expect(parseDemoDate("08-11-2025 09:09")?.format(new Date(2026, 0, 2))).toBe("02-01-2026 09:09");
    expect(parseDemoDate("2025-12-20")?.date.getMonth()).toBe(11);
    expect(parseDemoDate("Vibrance 2026")).toBeNull();
  });

  it("moves the newest attendance record into the past week, by whole weeks", () => {
    const before = allViewLinkDates(demo);
    const after = allViewLinkDates(rebaseDemoData(demo, NOW));
    const newest = new Date(Math.max(...after.map((d) => d.getTime())));
    const ageDays = (NOW.getTime() - newest.getTime()) / 86400000;
    expect(ageDays).toBeGreaterThan(0);
    expect(ageDays).toBeLessThanOrEqual(8);
    // Weekdays are preserved for every record.
    after.forEach((d, i) => expect(d.getDay()).toBe(before[i].getDay()));
  });

  it("never puts attendance in the future", () => {
    const after = allViewLinkDates(rebaseDemoData(demo, NOW));
    after.forEach((d) => expect(d.getTime()).toBeLessThan(NOW.getTime()));
  });

  it("regroups the academic calendar into the shifted months", () => {
    const out: any = rebaseDemoData(demo, NOW);
    const months: string[] = out.calender.calendars.map((c: any) => c.month);
    expect(months[0]).toMatch(/2026$/);
    const totalBefore = (demo as any).calender.calendars.reduce((n: number, c: any) => n + c.days.length, 0);
    const totalAfter = out.calender.calendars.reduce((n: number, c: any) => n + c.days.length, 0);
    expect(totalAfter).toBe(totalBefore);
  });

  it("leaves dates far from the semester alone", () => {
    const data = { attendance: { attendance: [{ viewLink: [{ date: "20-Dec-2025" }] }] }, dob: "01-01-2001" };
    const out: any = rebaseDemoData(data, NOW);
    expect(out.dob).toBe("01-01-2001");
  });

  it("is a no-op when the snapshot is already current", () => {
    const anchor = new Date(2026, 10, 6);
    expect(demoShiftWeeks(anchor, NOW)).toBe(0);
  });
});
