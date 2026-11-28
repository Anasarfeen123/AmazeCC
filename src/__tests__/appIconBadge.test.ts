import { describe, expect, it } from "vitest";
import { attentionCount } from "../components/custom/app/AppIconBadge";

const NOW = new Date(2026, 10, 23, 10, 0, 0);

describe("attentionCount", () => {
  it("counts courses below target and exams in the next 24 h", () => {
    const attendance = [
      { attendancePercentage: "70", totalClasses: 20 },
      { attendancePercentage: "80", totalClasses: 20 },
      { attendancePercentage: "74.9", totalClasses: 10 },
    ];
    const schedule = {
      FAT: [
        { courseCode: "A", examDate: "24-Nov-2026", examTime: "09:30 AM - 12:30 PM" },
        { courseCode: "B", examDate: "30-Nov-2026", examTime: "09:30 AM - 12:30 PM" },
      ],
    };
    expect(attentionCount(attendance, schedule, 75, NOW)).toBe(3);
  });

  it("is zero when nothing needs attention", () => {
    expect(attentionCount([{ attendancePercentage: "90", totalClasses: 5 }], {}, 75, NOW)).toBe(0);
  });
});
