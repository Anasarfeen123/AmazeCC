/**
 * Class reminders for the Android and desktop apps (native/README.md).
 *
 * Built from the same weekly timetable Home uses (attendance course slots x
 * config.json slot times), for today and tomorrow, `minutesBefore` each class.
 * Re-run whenever the app opens or the timetable syncs, so a changed
 * timetable or a new semester simply replaces the old set.
 *
 * - Android: real scheduled notifications (Capacitor Local Notifications);
 *   they fire with the app closed.
 * - Desktop: timers while the app is running (it stays in the tray when the
 *   window is closed), shown with the Tauri notification plugin.
 *
 * Both plugins are reached through the globals the shells inject, so the web
 * app needs no native packages.
 */
import { buildAttendanceDayCardsMap, getAttendanceTimeRange } from "./attendanceTimetable";
import { nativeShell } from "./nativeShell";

export type ClassReminder = { id: number; at: Date; title: string; body: string };

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
/** Android notification ids reserved for class reminders. */
const ID_BASE = 71000;
const ID_SPAN = 900;

function clean(s: unknown): string {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function upcomingClassReminders(
  attendance: any[],
  now = new Date(),
  minutesBefore = 10,
  days = 2,
): ClassReminder[] {
  if (!Array.isArray(attendance) || attendance.length === 0) return [];
  const map = buildAttendanceDayCardsMap(attendance) as Record<string, any[]>;
  const out: ClassReminder[] = [];
  for (let d = 0; d < days; d++) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + d);
    const cards = map[DAY_CODES[day.getDay()]] || [];
    for (const card of cards) {
      const { start } = getAttendanceTimeRange(String(card.time || ""));
      if (!Number.isFinite(start)) continue;
      const startsAt = new Date(day.getTime() + start * 60_000);
      const at = new Date(startsAt.getTime() - minutesBefore * 60_000);
      if (at.getTime() <= now.getTime()) continue;
      const title = clean(card.courseTitle) || clean(card.courseCode) || "Class";
      const venue = clean(card.slotVenue || card.venue);
      const hh = startsAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      out.push({
        id: ID_BASE + (out.length % ID_SPAN),
        at,
        title: `${title} in ${minutesBefore} min`,
        body: [hh, venue, clean(card.slotName)].filter(Boolean).join(" · "),
      });
    }
  }
  return out;
}

/* ── Android (Capacitor) ─────────────────────────────────────────────── */

function capNotifications(): any | null {
  return (window as any).Capacitor?.Plugins?.LocalNotifications ?? null;
}

async function androidPermission(request: boolean): Promise<boolean> {
  const ln = capNotifications();
  if (!ln) return false;
  try {
    let p = await ln.checkPermissions();
    if (p?.display !== "granted" && request) p = await ln.requestPermissions();
    return p?.display === "granted";
  } catch {
    return false;
  }
}

async function androidCancelOurs() {
  const ln = capNotifications();
  if (!ln) return;
  try {
    const pending = await ln.getPending();
    const ours = (pending?.notifications || []).filter((n: any) => n.id >= ID_BASE && n.id < ID_BASE + ID_SPAN);
    if (ours.length) await ln.cancel({ notifications: ours.map((n: any) => ({ id: n.id })) });
  } catch {
    /* nothing scheduled */
  }
}

/* ── Desktop (Tauri) ──────────────────────────────────────────────────── */

function tauriInvoke(): ((cmd: string, args?: any) => Promise<any>) | null {
  return (window as any).__TAURI__?.core?.invoke ?? null;
}

let desktopTimers: number[] = [];

async function desktopPermission(request: boolean): Promise<boolean> {
  const invoke = tauriInvoke();
  if (!invoke) return false;
  try {
    if (await invoke("plugin:notification|is_permission_granted")) return true;
    if (!request) return false;
    return (await invoke("plugin:notification|request_permission")) === "granted";
  } catch {
    return false;
  }
}

export async function desktopNotify(title: string, body: string) {
  const invoke = tauriInvoke();
  if (!invoke) return;
  try {
    await invoke("plugin:notification|notify", { options: { title, body } });
  } catch {
    /* notifications unavailable */
  }
}

/* ── Shared entry points ──────────────────────────────────────────────── */

/** Ask for notification permission (call from a user action, e.g. the toggle). */
export async function requestReminderPermission(): Promise<boolean> {
  const shell = nativeShell();
  if (shell === "android") return androidPermission(true);
  if (shell === "desktop") return desktopPermission(true);
  return false;
}

/** Replace all scheduled class reminders. Returns how many were set. */
export async function syncClassReminders(
  attendance: any[],
  { enabled, minutesBefore }: { enabled: boolean; minutesBefore: number },
): Promise<number> {
  const shell = nativeShell();
  if (!shell) return 0;
  desktopTimers.forEach((t) => window.clearTimeout(t));
  desktopTimers = [];
  if (shell === "android") await androidCancelOurs();
  if (!enabled) return 0;

  const reminders = upcomingClassReminders(attendance, new Date(), minutesBefore);
  if (reminders.length === 0) return 0;

  if (shell === "android") {
    if (!(await androidPermission(false))) return 0;
    try {
      await capNotifications().schedule({
        notifications: reminders.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          schedule: { at: r.at, allowWhileIdle: true },
        })),
      });
      return reminders.length;
    } catch {
      return 0;
    }
  }

  if (!(await desktopPermission(false))) return 0;
  const now = Date.now();
  for (const r of reminders) {
    const wait = r.at.getTime() - now;
    // setTimeout tops out at ~24.8 days; tomorrow is well inside that.
    desktopTimers.push(window.setTimeout(() => void desktopNotify(r.title, r.body), wait));
  }
  return reminders.length;
}
