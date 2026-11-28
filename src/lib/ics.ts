/**
 * Calendar files (.ics) for Google Calendar, Apple Calendar and Outlook
 * (owner: "export to phone calendar: timetable and exams"). No server: the
 * file is built on the device and handed to the share sheet or downloaded.
 *
 * - Timetable: one weekly repeating event per class slot, from this week to
 *   the semester's last instructional day (or 17 weeks out without a
 *   calendar), with room and faculty.
 * - Exams: one event per paper with venue, seat and reporting time, and two
 *   alarms (the evening before, and an hour before).
 *
 * Times are written in Asia/Kolkata with a VTIMEZONE block, so a phone set to
 * another zone still shows the right local class time.
 */
import { getAttendanceTimeRange } from "./attendanceTimetable";

const TZ = "Asia/Kolkata";
const DAY_INDEX: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
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

const pad = (n: number) => String(n).padStart(2, "0");
/** Local wall-clock time, no zone suffix: used with TZID. */
const local = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

/** RFC 5545 text escaping. */
export function icsText(s: unknown): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets are folded (continuation lines start with a space). */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 73) parts.push((i ? " " : "") + line.slice(i, i + 73));
  return parts.join("\r\n");
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZ}`,
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0530",
  "TZOFFSETTO:+0530",
  "TZNAME:IST",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function wrap(events: string[][], name: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AmazeCC//Calendar export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(name)}`,
    `X-WR-TIMEZONE:${TZ}`,
    ...VTIMEZONE,
    ...events.flat(),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Minutes after midnight -> hours/minutes on `day`. */
function at(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/** The semester's last instructional day from the academic calendar, if any. */
export function lastInstructionalDay(
  calendars?: { month: string; days: { date: number; events: any[] }[] }[],
): Date | null {
  let last: Date | null = null;
  for (const mo of calendars ?? []) {
    const [name, year] = String(mo.month || "")
      .trim()
      .split(/\s+/);
    const mi = MONTHS_LONG.indexOf((name ?? "").toUpperCase());
    if (mi < 0 || !year) continue;
    for (const day of mo.days ?? []) {
      if ((day.events ?? []).some((e) => e?.type === "Instructional Day")) {
        const d = new Date(+year, mi, day.date);
        if (!last || d > last) last = d;
      }
    }
  }
  return last;
}

export interface TimetableClass {
  courseCode?: string;
  courseTitle?: string;
  courseType?: string;
  slotName?: string;
  slotVenue?: string;
  venue?: string;
  faculty?: string;
  time: string;
}

/** Weekly repeating events for every class in a day -> classes map. */
export function buildTimetableIcs(
  map: Record<string, TimetableClass[]>,
  opts: { until?: Date | null; now?: Date; name?: string } = {},
): string {
  const now = opts.now ?? new Date();
  const until = opts.until && opts.until > now ? opts.until : new Date(now.getTime() + 17 * 7 * 86_400_000);
  const untilUtc = utcStamp(new Date(until.getFullYear(), until.getMonth(), until.getDate(), 23, 59));
  const stamp = utcStamp(now);
  const events: string[][] = [];
  for (const [day, classes] of Object.entries(map)) {
    const dow = DAY_INDEX[day];
    if (dow === undefined) continue;
    // First occurrence: this week's day (today counts), else next week.
    const first = new Date(now);
    first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() + ((dow - first.getDay() + 7) % 7));
    for (const cls of classes ?? []) {
      const { start, end } = getAttendanceTimeRange(cls.time);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      const code = String(cls.courseCode || "").replace(/\([LPT]\)$/i, "");
      const room = cls.slotVenue || cls.venue || "";
      events.push(
        [
          "BEGIN:VEVENT",
          `UID:amazecc-class-${icsText(code)}-${day}-${icsText(cls.slotName)}@amazecc.com`,
          `DTSTAMP:${stamp}`,
          `DTSTART;TZID=${TZ}:${local(at(first, start))}`,
          `DTEND;TZID=${TZ}:${local(at(first, end))}`,
          `RRULE:FREQ=WEEKLY;UNTIL=${untilUtc}`,
          `SUMMARY:${icsText(cls.courseTitle || code)}${/lab/i.test(String(cls.courseType || "")) ? " (Lab)" : ""}`,
          room ? `LOCATION:${icsText(room)}` : "",
          `DESCRIPTION:${icsText([code, cls.slotName, cls.faculty].filter(Boolean).join(" · "))}`,
          "END:VEVENT",
        ].filter(Boolean),
      );
    }
  }
  return wrap(events, opts.name ?? "AmazeCC timetable");
}

export interface ExamPaper {
  courseCode?: string;
  courseTitle?: string;
  examDate?: string; // "19-Nov-2026"
  examTime?: string; // "09:30 AM - 12:30 PM"
  reportingTime?: string;
  venue?: string;
  seatLocation?: string;
  seatNo?: string;
}

/** "09:30 AM" -> minutes after midnight. */
function clock(s?: string): number | null {
  const m = /(\d{1,2}):(\d{2})\s*([AP]M)?/i.exec(String(s ?? ""));
  if (!m) return null;
  let h = +m[1];
  if (m[3]?.toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3]?.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + +m[2];
}

/** One event per paper, with alarms the evening before and an hour before. */
export function buildExamIcs(series: Record<string, ExamPaper[]>, opts: { now?: Date; name?: string } = {}): string {
  const stamp = utcStamp(opts.now ?? new Date());
  const events: string[][] = [];
  for (const [type, papers] of Object.entries(series)) {
    for (const p of papers ?? []) {
      const dm = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(String(p.examDate ?? "").trim());
      if (!dm) continue;
      const day = new Date(+dm[3], MONTHS.indexOf(dm[2].toUpperCase()), +dm[1]);
      const [startRaw, endRaw] = String(p.examTime ?? "").split("-");
      const startMin = clock(startRaw) ?? clock(p.reportingTime) ?? 9 * 60;
      const endMin = clock(endRaw) ?? startMin + (/FAT/i.test(type) ? 180 : 90);
      const venue = p.venue && p.venue !== "-" ? p.venue : "";
      const seat = [p.seatLocation, p.seatNo].filter((x) => x && x !== "-").join(" / ");
      events.push(
        [
          "BEGIN:VEVENT",
          `UID:amazecc-exam-${icsText(type)}-${icsText(p.courseCode)}-${local(day)}@amazecc.com`,
          `DTSTAMP:${stamp}`,
          `DTSTART;TZID=${TZ}:${local(at(day, startMin))}`,
          `DTEND;TZID=${TZ}:${local(at(day, endMin))}`,
          `SUMMARY:${icsText(`${type}: ${p.courseTitle || p.courseCode}`)}`,
          venue ? `LOCATION:${icsText(venue)}` : "",
          `DESCRIPTION:${icsText(
            [
              p.courseCode,
              p.reportingTime ? `Report by ${p.reportingTime}` : "",
              venue ? `Venue ${venue}` : "",
              seat ? `Seat ${seat}` : "",
            ]
              .filter(Boolean)
              .join(" · "),
          )}`,
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${icsText(`Tomorrow: ${type} ${p.courseTitle || p.courseCode}`)}`,
          "TRIGGER:-PT15H",
          "END:VALARM",
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${icsText(`${type} in 1 hour${venue ? ` at ${venue}` : ""}`)}`,
          "TRIGGER:-PT1H",
          "END:VALARM",
          "END:VEVENT",
        ].filter(Boolean),
      );
    }
  }
  return wrap(events, opts.name ?? "AmazeCC exams");
}

export type IcsSaveResult = "opened" | "downloaded";

/** True on Android, where a downloaded .ics needs a short "how to open" note. */
export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/**
 * Hand the file to the phone's calendar.
 *
 * - iPhone / iPad: open the file itself; Safari shows Apple Calendar's
 *   "Add all" screen. (A download link only saves it to Files.)
 * - Everywhere else: download it. Android's share sheet does not accept
 *   calendar files, so the caller shows how to open it (owner: "I can't open
 *   this on mobile").
 */
export async function saveIcs(filename: string, ics: string): Promise<IcsSaveResult> {
  if (typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    return "opened";
  }
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}
