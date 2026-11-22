/**
 * Keep the demo account current.
 *
 * demoData.json is a snapshot with fixed dates (exams in late 2025, a
 * December–April academic calendar). As real time moved on, the demo showed
 * "All done · nothing scheduled" for exams and "Nothing scheduled ahead" on
 * the calendar (owner: make the demo full, proper data).
 *
 * On demo entry every date is moved forward by a whole number of weeks, so
 * weekdays (and the timetable that hangs off them) stay right:
 * - academic calendar and hostel leaves: the busiest three weeks of
 *   teaching start this week, so the coming days are instructional days
 *   rather than a vacation (and Home shows classes, not "No classes");
 * - attendance: the latest entry lands in the past week;
 * - exams (CAT1, CAT2, FAT together): FAT starts one to two weeks ahead,
 *   CAT1 and CAT2 are in the past;
 * - registered events: the first one is a few days to a week and a half ahead.
 *
 * The targets depend only on `now`, so applying this to data that was
 * already shifted gives the same result.
 */

import { getTypedStorageItem } from "./storage";

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
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
];

const NUMERIC = /^(\d{2})-(\d{2})-(\d{4})(.*)$/s; // 07-12-2025, 08-11-2025 09:09
const NAMED = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})(.*)$/s; // 15-Dec-2025, 18-DEC-2025 09:00

/** Days since the epoch for a UTC calendar date. */
const dayNumber = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m, d) / DAY);
const toParts = (n: number) => {
  const dt = new Date(n * DAY);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
};
const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar day of `now` in India (the app's timezone), as a day number. */
function today(now: Date) {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return dayNumber(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
}

/** Day number of a demo date string, or null if it is not one. */
export function parseDemoDate(s: string): number | null {
  let m = NUMERIC.exec(s);
  if (m) return dayNumber(+m[3], +m[2] - 1, +m[1]);
  m = NAMED.exec(s);
  if (m) {
    const month = MONTHS.findIndex((x) => x.toLowerCase() === m![2].toLowerCase());
    if (month >= 0) return dayNumber(+m[3], month, +m[1]);
  }
  return null;
}

/** The same string with its date moved by `days`, keeping its format. */
export function shiftDemoDate(s: string, days: number): string {
  if (!days) return s;
  let m = NUMERIC.exec(s);
  if (m) {
    const p = toParts(dayNumber(+m[3], +m[2] - 1, +m[1]) + days);
    return `${pad(p.d)}-${pad(p.m + 1)}-${p.y}${m[4]}`;
  }
  m = NAMED.exec(s);
  if (m) {
    const month = MONTHS.findIndex((x) => x.toLowerCase() === m![2].toLowerCase());
    if (month < 0) return s;
    const p = toParts(dayNumber(+m[3], month, +m[1]) + days);
    const name = m[2] === m[2].toUpperCase() ? MONTHS[p.m].toUpperCase() : MONTHS[p.m];
    const day = m[1].length === 2 ? pad(p.d) : String(p.d);
    return `${day}-${name}-${p.y}${m[4]}`;
  }
  return s;
}

/** Shift every date string inside `value` (objects and arrays, in place copy). */
function shiftTree<T>(value: T, days: number): T {
  if (!days) return value;
  if (typeof value === "string") return shiftDemoDate(value, days) as T;
  if (Array.isArray(value)) return value.map((v) => shiftTree(v, days)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = shiftTree(v, days);
    return out as T;
  }
  return value;
}

/** Collect the day numbers of every date string inside `value`. */
function datesIn(value: unknown, out: number[] = []): number[] {
  if (typeof value === "string") {
    const n = parseDemoDate(value);
    if (n !== null) out.push(n);
  } else if (Array.isArray(value)) value.forEach((v) => datesIn(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => datesIn(v, out));
  return out;
}

/** Whole weeks that move `from` to the latest day on or before `to`. */
const weeksUpTo = (from: number, to: number) => Math.floor((to - from) / 7) * 7;
/** Whole weeks that move `from` to the first day on or after `to`. */
const weeksFrom = (from: number, to: number) => Math.ceil((to - from) / 7) * 7;

type CalendarMonth = { month: string; days: { date: number; events: unknown[] }[] };

/** Move an academic calendar (months of day entries) by `days`, regrouping months. */
function shiftCalendar(months: CalendarMonth[], days: number): CalendarMonth[] {
  if (!days) return months;
  const byMonth = new Map<string, { key: number; month: CalendarMonth }>();
  for (const mo of months) {
    const [name, year] = mo.month.trim().split(/\s+/);
    const mi = MONTHS_LONG.indexOf((name ?? "").toUpperCase());
    if (mi < 0 || !year) continue;
    for (const day of mo.days ?? []) {
      const p = toParts(dayNumber(+year, mi, day.date) + days);
      const label = `${MONTHS_LONG[p.m]} ${p.y}`;
      const key = p.y * 12 + p.m;
      if (!byMonth.has(label)) byMonth.set(label, { key, month: { ...mo, month: label, days: [] } });
      byMonth.get(label)!.month.days.push({ ...day, date: p.d });
    }
  }
  return [...byMonth.values()].sort((a, b) => a.key - b.key).map((x) => x.month);
}

/** The instructional day that starts the 21-day window with the most instructional days. */
function busiestTeachingDay(months: CalendarMonth[]): number | null {
  const teaching: number[] = [];
  for (const mo of months) {
    const [name, year] = mo.month.trim().split(/\s+/);
    const mi = MONTHS_LONG.indexOf((name ?? "").toUpperCase());
    if (mi < 0 || !year) continue;
    for (const day of mo.days ?? []) {
      if ((day.events as any[]).some((e) => e?.type === "Instructional Day"))
        teaching.push(dayNumber(+year, mi, day.date));
    }
  }
  teaching.sort((a, b) => a - b);
  let best: number | null = null;
  let bestCount = -1;
  for (const x of teaching) {
    const count = teaching.filter((d) => d >= x && d < x + 21).length;
    if (count > bestCount) [best, bestCount] = [x, count];
  }
  return best;
}

export function rebaseDemoDates<T extends Record<string, any>>(data: T, now: Date = new Date()): T {
  const t = today(now);
  const out: Record<string, any> = { ...data };

  // Attendance: latest entry within the past week.
  const attended = datesIn(data.attendance?.attendance?.map((a: any) => [a.attendanceDate, a.viewLink]));
  if (attended.length) out.attendance = shiftTree(data.attendance, weeksUpTo(Math.max(...attended), t));

  // Calendar (and hostel leaves, which follow its vacations): the busiest
  // three weeks of teaching start this week.
  const busiest = busiestTeachingDay(data.calender?.calendars ?? []);
  if (busiest !== null) {
    const shift = Math.round((t - busiest) / 7) * 7;
    out.calender = { ...data.calender, calendars: shiftCalendar(data.calender.calendars, shift) };
    if (data.hostel) out.hostel = shiftTree(data.hostel, shift);
  }

  // Exams: FAT starts 7-13 days from today; CAT1/CAT2 move with it.
  const sched = data.schedule?.Schedule;
  const fat = datesIn(sched?.FAT?.map((e: any) => e.examDate));
  if (sched && fat.length) {
    out.schedule = { ...data.schedule, Schedule: shiftTree(sched, weeksFrom(Math.min(...fat), t + 7)) };
  }

  // Events: the first registered event 5-11 days ahead.
  const ev = datesIn(data.registeredEvents?.map((e: any) => e.date));
  if (ev.length) out.registeredEvents = shiftTree(data.registeredEvents, weeksFrom(Math.min(...ev), t + 5));

  return out as T;
}

/**
 * True for the demo account. Pages that load on mount can run before the
 * saved IDs are back in memory, so this also checks the flag saved on entry.
 */
export function isDemoSession(ids?: { VtopUsername?: string } | null): boolean {
  if (ids?.VtopUsername === "demo") return true;
  try {
    const v = getTypedStorageItem("demoMode" as any) as unknown;
    return v === true || v === "true";
  } catch {
    return false;
  }
}
