import { describe, it, expect } from "vitest";
import { buildEnrichedCalendars } from "@/lib/calendarDay";

const day = (date: number) => ({
  date,
  events: [{ text: "Instructional Day", type: "Instructional Day", color: "green", category: "General" }],
});

describe("calendar month order", () => {
  it("keeps a semester that crosses New Year in date order", () => {
    const months = buildEnrichedCalendars({
      calendars: [
        { month: "JANUARY 2026", days: [day(5)] },
        { month: "DECEMBER 2025", days: [day(8)] },
        { month: "APRIL 2026", days: [day(6)] },
      ],
    } as any);
    expect(months.map((m) => `${m.year}-${m.monthIndex}`)).toEqual(["2025-11", "2026-0", "2026-3"]);
  });
});
