import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import SimplifiedMobileHome from "../components/custom/mobile/SimplifiedMobileHome";

// The home screen names each course twice: in the attendance list and on its
// timetable card. These tests are about the timetable card, which comes last.
const timetableCard = (title: string) => {
  const all = screen.getAllByText(title);
  return all[all.length - 1];
};

const TODAY = new Date(2026, 8, 29, 10, 0, 0); // Tuesday, 10am local

const course1 = {
  courseCode: "CSE1001",
  courseTitle: "Problem Solving and Programming",
  slotName: "B1",
  attendancePercentage: "92",
  attendedClasses: "23",
  totalClasses: "25",
  courseType: "Theory",
  faculty: "Prof. Ada",
  slotVenue: "SJT 101",
  time: "8:00-8:50",
};

const course2 = {
  courseCode: "CSE1002",
  courseTitle: "Data Structures and Algorithms",
  slotName: "B2",
  attendancePercentage: "84",
  attendedClasses: "21",
  totalClasses: "25",
  courseType: "Theory",
  faculty: "Prof. Alan",
  slotVenue: "SJT 202",
  time: "2:00-2:50",
};

function defaultProps(over: Record<string, unknown> = {}) {
  return {
    attendanceData: { attendance: [course1, course2] },
    marksData: {
      cgpa: { cgpa: "9.15", creditsEarned: "78" },
    },
    hostelData: {},
    moodleData: [],
    calendarData: {
      calendars: [
        {
          calendarType: "General Semester",
          month: "Sept 2026",
          days: [],
        },
      ],
    },
    ScheduleData: { Schedule: {} },
    settings: {
      showGpa: true,
      decimalValues: false,
    },
    setSettings: vi.fn(),
    IDs: {},
    setActiveTab: vi.fn(),
    setActiveSubTab: vi.fn(),
    setActiveAttendanceSubTab: vi.fn(),
    handleReloadRequest: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    ...over,
  } as any;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(TODAY);
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1200 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SimplifiedMobileHome Desktop Layout & Course Pane", () => {
  it("aligns content to the left on desktop with lg:max-w-none and lg:mx-0", () => {
    const { container } = render(<SimplifiedMobileHome {...defaultProps()} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("lg:max-w-none");
    expect(root.className).toContain("lg:mx-0");
  });

  it("does not render the desktop course detail pane initially until a class is clicked", () => {
    render(<SimplifiedMobileHome {...defaultProps()} />);
    // No aside rendered yet before user click
    expect(document.querySelector("aside")).toBeNull();
  });

  it("shows desktop course details without adding a side column or shrinking Home", () => {
    render(<SimplifiedMobileHome {...defaultProps()} />);

    const course1Card = timetableCard("Problem Solving and Programming");
    fireEvent.click(course1Card);

    expect(screen.getByText("Prof. Ada")).toBeDefined();
    expect(screen.getByText("SJT 101")).toBeDefined();
    expect(document.querySelector("aside")).toBeNull();
  });

  it("provides an explicit close action for desktop course details", () => {
    render(<SimplifiedMobileHome {...defaultProps()} />);

    fireEvent.click(timetableCard("Problem Solving and Programming"));
    expect(screen.getByText("Prof. Ada")).toBeDefined();
    expect(screen.getByRole("button", { name: "Close course details" })).toBeDefined();
  });

  it("navigates to the course dashboard from the desktop detail sheet", () => {
    const setActiveTab = vi.fn();
    const setActiveSubTab = vi.fn();
    render(<SimplifiedMobileHome {...defaultProps({ setActiveTab, setActiveSubTab })} />);

    const course1Card = timetableCard("Problem Solving and Programming");

    fireEvent.click(course1Card);
    expect(setActiveTab).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("View Full History & Heatmap"));
    expect(setActiveTab).toHaveBeenCalledWith("academics");
    expect(setActiveSubTab).toHaveBeenCalledWith("course-dashboard");
  });

  it("navigates immediately on mobile mode (< 1024px)", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    const setActiveTab = vi.fn();
    const setActiveSubTab = vi.fn();
    render(<SimplifiedMobileHome {...defaultProps({ setActiveTab, setActiveSubTab })} />);

    const course1Card = timetableCard("Problem Solving and Programming");
    fireEvent.click(course1Card);

    // Immediately navigates on mobile without opening side pane
    expect(setActiveTab).toHaveBeenCalledWith("academics");
    expect(setActiveSubTab).toHaveBeenCalledWith("course-dashboard");
    expect(document.querySelector("aside")).toBeNull();
  });

  it("renders stat cards in the main desktop content", () => {
    render(<SimplifiedMobileHome {...defaultProps()} />);

    expect(screen.getByRole("button", { name: /Your week/ })).toBeDefined();
    expect(screen.getAllByText("92%").length).toBeGreaterThanOrEqual(1);

    const stats = screen.getByRole("region", { name: "Home stats and controls" });
    expect(within(stats).getByText("9.15")).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Sync Data from VTOP" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "2-Line Compact Pill View" }).length).toBeGreaterThan(0);
  });

  it("keeps the first view focused and reveals week and attendance details on demand", () => {
    const setActiveTab = vi.fn();
    const setActiveToolsSubTab = vi.fn();
    render(<SimplifiedMobileHome {...defaultProps({ setActiveTab, setActiveToolsSubTab })} />);

    expect(screen.getByRole("region", { name: "Next class" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Due this week" })).toBeDefined();
    expect(screen.queryByRole("region", { name: "This week" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Attendance" })).toBeNull();
    expect(screen.getByText("Nothing due in the next 7 days.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Your week/ }));
    expect(screen.getByRole("button", { name: /Your week/ }).getAttribute("aria-expanded")).toBe("true");

    const week = screen.getByRole("region", { name: "This week" });
    expect(week).toBeDefined();
    expect(within(week).getByText("Weekly rhythm")).toBeDefined();
    expect(within(week).getAllByText("CSE1001").length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Attendance" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Expand timetable" }));
    expect(screen.getByText("Full Weekly Timetable")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Open tasks" }));
    expect(setActiveTab).toHaveBeenCalledWith("tools");
    expect(setActiveToolsSubTab).toHaveBeenCalledWith("tasks");
  });

  it("opens course details when a class block in the week viewer is clicked", () => {
    render(<SimplifiedMobileHome {...defaultProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /Your week/ }));
    const week = screen.getByRole("region", { name: "This week" });
    const classSlot = within(week).getAllByRole("button", {
      name: /Data Structures and Algorithms, open course details/i,
    })[0];

    fireEvent.click(classSlot);

    expect(screen.getAllByText("Prof. Alan").length).toBeGreaterThan(1);
  });

  it("uses the expanded timetable's vertical grid for mobile week details", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    render(<SimplifiedMobileHome {...defaultProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /Your week/ }));

    expect(screen.getByText("Class Schedule")).toBeDefined();
    expect(screen.getByText(/showing the vertical view on this phone/i)).toBeDefined();
  });

  it("shows a clear today state when no timed classes are scheduled", () => {
    render(<SimplifiedMobileHome {...defaultProps({ attendanceData: { attendance: [] } })} />);

    expect(screen.getByRole("region", { name: "Today" })).toBeDefined();
    expect(screen.getByText("No classes scheduled today")).toBeDefined();
  });
});
