import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeAttention from "@/components/custom/mobile/HomeAttention";

const NOW = new Date(2026, 10, 8, 10, 0); // Sun 8 Nov 2026, 10:00

const course = (code: string, title: string, slot: string, attended: number, total: number) => ({
  courseCode: code,
  courseTitle: title,
  slotName: slot,
  attendedClasses: attended,
  totalClasses: total,
});

describe("HomeAttention", () => {
  it("says all clear when nothing is pressing", () => {
    render(
      <HomeAttention
        courses={[course("BCSE202L", "Data Structures", "A1+TA1", 30, 32)]}
        targetPct={75}
        exams={[]}
        tasks={[]}
        now={NOW}
      />,
    );
    expect(screen.getByText(/All clear/)).toBeTruthy();
  });

  it("lists a course below the line with its recovery step, counting labs in labs", () => {
    const onOpenCourse = vi.fn();
    render(
      <HomeAttention
        courses={[course("BCSE203E(L)", "Web Programming", "L31+L32", 7, 12)]}
        targetPct={75}
        exams={[]}
        tasks={[]}
        now={NOW}
        onOpenCourse={onOpenCourse}
      />,
    );
    expect(screen.getByText("Needs your attention")).toBeTruthy();
    expect(screen.getByText("Attend the next 4 labs to get back to 75%.")).toBeTruthy();
    fireEvent.click(screen.getByText("Web Programming"));
    expect(onOpenCourse).toHaveBeenCalledWith("BCSE203E");
  });

  it("includes exams in the next week but not later ones, and puts attendance first", () => {
    const exams = [
      {
        key: "a",
        examType: "CAT2",
        raw: { courseCode: "BMAT201L", courseTitle: "Complex Variables" },
        date: new Date(2026, 10, 10),
        startAt: new Date(2026, 10, 10, 9, 30),
      },
      {
        key: "b",
        examType: "FAT",
        raw: { courseCode: "BPHY101L", courseTitle: "Physics" },
        date: new Date(2026, 10, 30),
        startAt: null,
      },
    ];
    render(
      <HomeAttention
        courses={[course("BPHY101L", "Engineering Physics", "C1+TC1", 26, 35)]}
        targetPct={75}
        exams={exams}
        tasks={[]}
        now={NOW}
      />,
    );
    const titles = screen.getAllByRole("button").map((b) => b.textContent ?? "");
    expect(titles[0]).toContain("Engineering Physics");
    expect(titles.some((t) => t.includes("CAT2 · Complex Variables") && t.includes("09:30"))).toBe(true);
    expect(titles.some((t) => t.includes("FAT · Physics"))).toBe(false);
    expect(screen.getByText(/Attend the next 1 class to get back/)).toBeTruthy();
  });

  it("pluralises class as classes", () => {
    render(
      <HomeAttention
        courses={[course("BCSE205L", "Computer Architecture", "E2+TE2", 14, 20)]}
        targetPct={75}
        exams={[]}
        tasks={[]}
        now={NOW}
      />,
    );
    expect(screen.getByText("Attend the next 4 classes to get back to 75%.")).toBeTruthy();
  });

  it("shows overdue tasks and caps the list at four with a show-more link", () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i}`,
      title: `Task ${i}`,
      status: "todo",
      dueDate: new Date(2026, 10, 7, 12 + i).toISOString(),
    })) as any;
    render(<HomeAttention courses={[]} targetPct={75} exams={[]} tasks={tasks} now={NOW} />);
    expect(screen.getAllByText("Overdue").length).toBe(4);
    fireEvent.click(screen.getByText("Show 1 more"));
    expect(screen.getAllByText("Overdue").length).toBe(5);
  });
});
