/**
 * Encrypted class and exam reminders ("option B").
 *
 * The phone works out the coming week's reminders, encrypts each one with an
 * AES-GCM key that never leaves this device, and sends the server only
 * `(time, ciphertext)`. At that time the server pushes the ciphertext and the
 * service worker (sw.ts) decrypts it with the same key and shows it. The
 * server never learns course names, rooms or seats.
 *
 * The key lives in IndexedDB as a non-extractable CryptoKey, readable by both
 * the page and the service worker. Clearing site data drops it; the next
 * upload then makes a new key and replaces every pending reminder.
 */
import { getAttendanceTimeRange } from "./attendanceTimetable";

import { encryptReminder, reminderKey, type ReminderContent } from "./reminderCrypto";

export type { ReminderContent };

export interface PlannedReminder {
  at: Date;
  title: string;
  body: string;
  url: string;
  tag: string;
}

// ── planning (pure) ──────────────────────────────────────────────────

const DAY_INDEX: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function clock(s?: string): number | null {
  const m = /(\d{1,2}):(\d{2})\s*([AP]M)?/i.exec(String(s ?? ""));
  if (!m) return null;
  let h = +m[1];
  if (m[3]?.toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3]?.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + +m[2];
}

export interface PlanInput {
  timetable: Record<string, { courseTitle?: string; courseCode?: string; slotVenue?: string; time: string }[]>;
  exams?: Record<
    string,
    {
      courseTitle?: string;
      courseCode?: string;
      examDate?: string;
      examTime?: string;
      reportingTime?: string;
      venue?: string;
      seatNo?: string;
      seatLocation?: string;
    }[]
  >;
  /** Dates with no classes (holidays) as "Y-M-D" keys from `ymd`. */
  noClassDays?: Set<string>;
  now?: Date;
  leadMinutes?: number;
  days?: number;
}

/** The coming reminders, soonest first. Pure: no clock, storage or network. */
export function planReminders(input: PlanInput): PlannedReminder[] {
  const now = input.now ?? new Date();
  const lead = input.leadMinutes ?? 10;
  const days = input.days ?? 7;
  const out: PlannedReminder[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + i);
    if (input.noClassDays?.has(ymd(day))) continue;
    const key = Object.keys(DAY_INDEX).find((k) => DAY_INDEX[k] === day.getDay())!;
    for (const cls of input.timetable[key] ?? []) {
      const { start } = getAttendanceTimeRange(cls.time);
      if (!Number.isFinite(start)) continue;
      const at = new Date(day.getTime() + (start - lead) * 60_000);
      if (at <= now) continue;
      const name = cls.courseTitle || String(cls.courseCode || "").replace(/\([LPT]\)$/i, "");
      out.push({
        at,
        title: `${name} in ${lead} min`,
        body: [cls.time.replace("-", "–"), cls.slotVenue].filter(Boolean).join(" · "),
        url: "/?tab=attendance-calendar",
        tag: `class-${ymd(day)}-${cls.time}`,
      });
    }
  }

  for (const [type, papers] of Object.entries(input.exams ?? {})) {
    for (const p of papers ?? []) {
      const dm = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(String(p.examDate ?? "").trim());
      if (!dm) continue;
      const day = new Date(+dm[3], MONTHS.indexOf(dm[2].toUpperCase()), +dm[1]);
      const start = clock(String(p.examTime ?? "").split("-")[0]) ?? clock(p.reportingTime) ?? 9 * 60;
      const name = p.courseTitle || p.courseCode || "Exam";
      const venue = p.venue && p.venue !== "-" ? p.venue : "";
      const seat = [p.seatLocation, p.seatNo].filter((x) => x && x !== "-").join(" / ");
      const detail = [p.reportingTime ? `Report ${p.reportingTime}` : "", venue, seat ? `Seat ${seat}` : ""]
        .filter(Boolean)
        .join(" · ");
      const eve = new Date(day.getTime() - 5 * 3_600_000); // 7 pm the day before
      const hour = new Date(day.getTime() + (start - 60) * 60_000);
      for (const [at, title, suffix] of [
        [eve, `Tomorrow: ${type} ${name}`, "eve"],
        [hour, `${type} in 1 hour: ${name}`, "1h"],
      ] as const) {
        if (at > now && at.getTime() - now.getTime() < 15 * 86_400_000) {
          out.push({ at, title, body: detail, url: "/?tab=academics-schedule", tag: `exam-${p.courseCode}-${suffix}` });
        }
      }
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 200);
}

/** Holidays from the academic calendar, as `ymd` keys. */
export function holidaysFromCalendar(
  calendars?: { month: string; days: { date: number; events: any[] }[] }[],
): Set<string> {
  const LONG = [
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
  const set = new Set<string>();
  for (const mo of calendars ?? []) {
    const [name, year] = String(mo.month || "")
      .trim()
      .split(/\s+/);
    const mi = LONG.indexOf((name ?? "").toUpperCase());
    if (mi < 0 || !year) continue;
    for (const d of mo.days ?? []) {
      if ((d.events ?? []).some((e) => e?.type === "Holiday")) set.add(ymd(new Date(+year, mi, d.date)));
    }
  }
  return set;
}

// ── upload ───────────────────────────────────────────────────────────

export const REMINDERS_PREF = "amazecc_reminders";

/** On by default once notifications are allowed; "off" from Settings. */
export function remindersWanted(): boolean {
  try {
    return localStorage.getItem(REMINDERS_PREF) !== "off";
  } catch {
    return true;
  }
}

export type UploadResult = "sent" | "no-subscription" | "unsupported" | "off" | "failed";

export async function uploadReminders(plan: PlannedReminder[]): Promise<UploadResult> {
  if (!remindersWanted()) return "off";
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || !crypto?.subtle) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager?.getSubscription();
  const json = sub?.toJSON() as { endpoint?: string; keys?: { auth?: string } } | undefined;
  if (!json?.endpoint || !json.keys?.auth) return "no-subscription";
  const key = await reminderKey();
  const reminders = await Promise.all(
    plan.map(async (r) => ({
      at: r.at.toISOString(),
      c: await encryptReminder(key, { title: r.title, body: r.body, url: r.url, tag: r.tag }),
    })),
  );
  try {
    const { apiRequest } = await import("./sync-engine/request-layer");
    await apiRequest("notifications/reminders", {
      method: "POST",
      body: { endpoint: json.endpoint, auth: json.keys.auth, reminders },
    });
    return "sent";
  } catch (e) {
    // The live API may not have the route yet (it needs a deploy): stay quiet.
    return /404|not found/i.test(String((e as Error)?.message)) ? "unsupported" : "failed";
  }
}
