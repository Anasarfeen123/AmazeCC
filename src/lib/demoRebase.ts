/**
 * Demo mode ships a fixed snapshot of one semester. Shown as-is, its dates
 * drift further from "today" every week (a November 2026 home screen over a
 * December 2025 attendance log), which makes the whole demo look broken.
 *
 * `rebaseDemoData` moves the snapshot so its most recent attendance record
 * falls in the past seven days. It shifts by whole weeks, so every date keeps
 * its weekday and the timetable, day orders and attendance logs still line up.
 * Dates far from the semester (a date of birth, say) are left alone.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_UPPER = [
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
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
/** Only dates within this distance of the anchor move. */
const WINDOW_MS = 400 * DAY_MS;

const pad = (n: number) => String(n).padStart(2, "0");

type Parsed = { date: Date; format: (d: Date) => string };

/** Recognises the date formats VTOP and the demo snapshot use, as whole strings. */
export function parseDemoDate(value: string): Parsed | null {
  let m = /^(\d{2})-([A-Z][a-z]{2})-(\d{4})$/.exec(value); // 20-Dec-2025
  if (m) {
    const month = MONTHS.indexOf(m[2]);
    if (month < 0) return null;
    return {
      date: new Date(Number(m[3]), month, Number(m[1])),
      format: (d) => `${pad(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`,
    };
  }
  m = /^(\d{2})-(\d{2})-(\d{4})( \d{2}:\d{2})?$/.exec(value); // 09-11-2025 or 08-11-2025 09:09
  if (m) {
    const time = m[4] ?? "";
    return {
      date: new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])),
      format: (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}${time}`,
    };
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); // 2025-12-20
  if (m) {
    return {
      date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
      format: (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    };
  }
  return null;
}

function newestAttendanceDate(data: any): Date | null {
  const rows: any[] = data?.attendance?.attendance ?? [];
  let newest: Date | null = null;
  for (const row of rows) {
    for (const entry of row?.viewLink ?? []) {
      const p = typeof entry?.date === "string" ? parseDemoDate(entry.date) : null;
      if (p && (!newest || p.date > newest)) newest = p.date;
    }
  }
  return newest;
}

/** Whole weeks that move `anchor` into the seven days ending at `now`. */
export function demoShiftWeeks(anchor: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Latest whole-week move that keeps the anchor on or before yesterday, so the
  // newest record is recent but never in the future.
  const target = today.getTime() - DAY_MS;
  return Math.floor((target - anchor.getTime()) / WEEK_MS);
}

function shiftDate(d: Date, weeks: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + weeks * 7);
  return out;
}

function shiftStrings(value: any, weeks: number, anchor: Date): any {
  if (typeof value === "string") {
    const p = parseDemoDate(value);
    if (!p || Math.abs(p.date.getTime() - anchor.getTime()) > WINDOW_MS) return value;
    return p.format(shiftDate(p.date, weeks));
  }
  if (Array.isArray(value)) return value.map((v) => shiftStrings(v, weeks, anchor));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = shiftStrings(v, weeks, anchor);
    return out;
  }
  return value;
}

/** Moves every day of the academic calendar and regroups the days into months. */
function shiftCalendars(calendars: any[], weeks: number): any[] {
  const byMonth = new Map<string, { year: number; month: number; days: any[] }>();
  for (const cal of calendars) {
    const m = /^([A-Z]+)\s+(\d{4})$/.exec(
      String(cal?.month ?? "")
        .trim()
        .toUpperCase(),
    );
    if (!m) return calendars; // unknown shape: leave the calendar as it was
    const month = MONTHS_UPPER.indexOf(m[1]);
    if (month < 0) return calendars;
    for (const day of cal.days ?? []) {
      const d = shiftDate(new Date(Number(m[2]), month, Number(day?.date)), weeks);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, { year: d.getFullYear(), month: d.getMonth(), days: [] });
      byMonth.get(key)!.days.push({ ...day, date: d.getDate() });
    }
  }
  return [...byMonth.values()]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((g) => ({ month: `${MONTHS_UPPER[g.month]} ${g.year}`, days: g.days.sort((a, b) => a.date - b.date) }));
}

export function rebaseDemoData<T>(data: T, now: Date = new Date()): T {
  const anchor = newestAttendanceDate(data);
  if (!anchor) return data;
  const weeks = demoShiftWeeks(anchor, now);
  if (weeks === 0) return data;
  const shifted: any = shiftStrings(data, weeks, anchor);
  const calendars = (data as any)?.calender?.calendars;
  if (Array.isArray(calendars)) {
    shifted.calender = { ...shifted.calender, calendars: shiftCalendars(calendars, weeks) };
  }
  return shifted;
}

/** The one way to load demo data: fetched once per call and rebased to today. */
export async function loadDemoData(now: Date = new Date()): Promise<any> {
  const raw = await (await fetch("/data/demoData.json")).json();
  return rebaseDemoData(raw, now);
}
