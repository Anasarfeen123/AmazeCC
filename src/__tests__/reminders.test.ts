import { describe, expect, it } from "vitest";
import { holidaysFromCalendar, planReminders } from "../lib/reminders";

const NOW = new Date(2026, 10, 24, 10, 0); // Tue 24 Nov 2026, 10:00

describe("planReminders", () => {
  const timetable = {
    TUE: [
      { courseTitle: "Database Systems", slotVenue: "AB3-204", time: "8:00-8:50" }, // already past
      { courseTitle: "Computer Networks", slotVenue: "AB3-104", time: "2:00-2:50" },
    ],
    WED: [{ courseTitle: "Web Programming", slotVenue: "AB1-614", time: "9:50-11:30" }],
  };

  it("reminds 10 minutes before each upcoming class, skipping past ones", () => {
    const plan = planReminders({ timetable, now: NOW, days: 2 });
    expect(plan.map((p) => p.title)).toEqual(["Computer Networks in 10 min", "Web Programming in 10 min"]);
    expect(plan[0].at).toEqual(new Date(2026, 10, 24, 13, 50));
    expect(plan[0].body).toContain("AB3-104");
  });

  it("skips holidays", () => {
    const noClassDays = holidaysFromCalendar([
      { month: "NOVEMBER 2026", days: [{ date: 25, events: [{ type: "Holiday" }] }] },
    ]);
    const plan = planReminders({ timetable, now: NOW, days: 2, noClassDays });
    expect(plan.map((p) => p.title)).toEqual(["Computer Networks in 10 min"]);
  });

  it("adds the evening before and an hour before each exam, with venue and seat", () => {
    const plan = planReminders({
      timetable: {},
      now: NOW,
      exams: {
        FAT: [
          {
            courseTitle: "Complex Variables",
            examDate: "27-Nov-2026",
            examTime: "09:30 AM - 12:30 PM",
            venue: "AB3-402",
            seatNo: "18",
          },
        ],
      },
    });
    expect(plan.map((p) => p.title)).toEqual(["Tomorrow: FAT Complex Variables", "FAT in 1 hour: Complex Variables"]);
    expect(plan[0].at).toEqual(new Date(2026, 10, 26, 19, 0));
    expect(plan[1].at).toEqual(new Date(2026, 10, 27, 8, 30));
    expect(plan[1].body).toContain("Seat 18");
  });
});

describe("reminder encryption", () => {
  it("round-trips and never contains the plain text", async () => {
    const { encryptReminder, decryptReminder } = await import("../lib/reminderCrypto");
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const content = { title: "Computer Networks in 10 min", body: "2:00–2:50 · AB3-104", url: "/", tag: "t" };
    const c = await encryptReminder(key, content);
    expect(c).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(c).not.toContain("Networks");
    expect(await decryptReminder(key, c)).toEqual(content);
  });
});
