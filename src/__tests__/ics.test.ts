import { describe, expect, it } from "vitest";
import { buildExamIcs, buildTimetableIcs, icsText, lastInstructionalDay } from "../lib/ics";

const NOW = new Date(2026, 10, 24, 10, 0); // Tue 24 Nov 2026

describe("buildTimetableIcs", () => {
  const ics = buildTimetableIcs(
    {
      MON: [
        {
          courseCode: "BCSE302L(T)",
          courseTitle: "Database Systems",
          slotName: "A2",
          slotVenue: "AB3-204",
          faculty: "PRIYA MENON",
          time: "2:00-2:50",
        },
      ],
      WED: [
        {
          courseCode: "BCSE308P(L)",
          courseTitle: "Computer Networks Lab",
          courseType: "Lab Only",
          slotName: "L1",
          time: "8:00-8:50",
        },
      ],
    },
    { now: NOW, until: new Date(2027, 3, 17) },
  );

  it("writes one weekly event per class in IST with the room", () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=20270417T");
    // Monday after Tue 24 Nov is 30 Nov; 2:00 is 14:00.
    expect(ics).toContain("DTSTART;TZID=Asia/Kolkata:20261130T140000");
    expect(ics).toContain("LOCATION:AB3-204");
    expect(ics).toContain("SUMMARY:Computer Networks Lab (Lab)");
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("buildExamIcs", () => {
  it("adds venue, seat and two reminders per paper", () => {
    const ics = buildExamIcs(
      {
        FAT: [
          {
            courseCode: "BMAT201L",
            courseTitle: "Complex Variables",
            examDate: "02-Dec-2026",
            examTime: "09:30 AM - 12:30 PM",
            reportingTime: "09:15 AM",
            venue: "AB3-402",
            seatNo: "18",
          },
        ],
      },
      { now: NOW },
    );
    expect(ics).toContain("DTSTART;TZID=Asia/Kolkata:20261202T093000");
    expect(ics).toContain("DTEND;TZID=Asia/Kolkata:20261202T123000");
    expect(ics).toContain("Seat 18");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });
});

describe("helpers", () => {
  it("escapes text and finds the last instructional day", () => {
    expect(icsText("a, b; c\nd")).toBe("a\\, b\\; c\\nd");
    const d = lastInstructionalDay([
      {
        month: "APRIL 2027",
        days: [
          { date: 16, events: [{ type: "Instructional Day" }] },
          { date: 20, events: [{ type: "Holiday" }] },
        ],
      },
    ]);
    expect(d?.getDate()).toBe(16);
  });
});
