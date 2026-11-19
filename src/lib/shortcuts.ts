/**
 * Keyboard shortcuts: one table for the key handler (useGlobalShortcuts) and
 * the help sheet, so the two cannot drift apart.
 *
 * One consistent scheme (user: make the shortcuts consistent):
 *  - Go to a screen: "g" then a letter (g a = attendance), like GitHub/Gmail.
 *    No modifier, so it works the same on every keyboard layout and OS.
 *  - Actions: Alt/Option + letter (ACTION_SHORTCUTS). Matched on
 *    `event.code` (the physical key) because on macOS Option+P types "π".
 *  - Search: Ctrl/Cmd + K or "/". Help: "?".
 * Alt + letter used to also navigate for 7 of the 11 screens, and two of
 * those letters collided with actions; navigation is now "g" only.
 */
export type NavTarget =
  | { tab: string }
  | { tab: "academics"; academicsSub: string }
  | { tab: "attendance"; attendanceSub: string }
  | { tab: "profile"; profileSub: string };

export interface NavShortcut {
  key: string;
  desc: string;
  target: NavTarget;
}

export const NAV_SHORTCUTS: readonly NavShortcut[] = [
  { key: "h", desc: "Home", target: { tab: "home" } },
  { key: "a", desc: "Attendance & timetable", target: { tab: "attendance" } },
  { key: "c", desc: "Academics (courses & marks)", target: { tab: "academics" } },
  { key: "g", desc: "Grades", target: { tab: "academics", academicsSub: "grades" } },
  { key: "o", desc: "On-duty (OD) hours", target: { tab: "attendance", attendanceSub: "od" } },
  { key: "e", desc: "Event Hub", target: { tab: "events" } },
  { key: "l", desc: "Library", target: { tab: "libraries" } },
  { key: "p", desc: "Payments", target: { tab: "payments" } },
  { key: "t", desc: "Tools & tasks", target: { tab: "tools" } },
  { key: "f", desc: "Free classrooms", target: { tab: "free-class" } },
  { key: "s", desc: "Settings", target: { tab: "profile", profileSub: "settings" } },
];

export type ShortcutAction = "privacy" | "theme" | "cgpa" | "sidebar";

/** Window event the sidebar listens for (it owns the collapse/Modules state). */
export const TOGGLE_SIDEBAR_EVENT = "amazecc:toggle-sidebar";

/** Alt/Option + key actions. Keys must not be reused by anything else. */
export const ACTION_SHORTCUTS: readonly { key: string; desc: string; action: ShortcutAction }[] = [
  { key: "p", desc: "Privacy mode on / off", action: "privacy" },
  { key: "b", desc: "Hide or show CGPA", action: "cgpa" },
  { key: "t", desc: "Theme: light, dark, night", action: "theme" },
  { key: "s", desc: "Collapse or expand the sidebar (opens Modules on phones)", action: "sidebar" },
];

/** Next theme in the Alt+T cycle. */
export function nextTheme(theme?: string): "light" | "dark" | "night" {
  return theme === "light" ? "dark" : theme === "dark" ? "night" : "light";
}

/** How long after "g" the second key still counts. */
export const SEQUENCE_TIMEOUT_MS = 1500;

/** The letter a key event stands for, independent of Option/Alt dead keys. */
export function letterOf(e: Pick<KeyboardEvent, "code" | "key">): string {
  if (e.code && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
  return (e.key || "").toLowerCase();
}

export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.getAttribute("contenteditable") === "true" ||
    (el as HTMLElement).isContentEditable === true
  );
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const p =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    "";
  return /mac|iphone|ipad/i.test(p);
}

/**
 * Tracks the "g" prefix. `feed` returns the shortcut a key completes, or
 * null; it consumes the "g" itself.
 */
export function createSequenceTracker(now: () => number = Date.now) {
  let pendingAt: number | null = null;
  return {
    feed(letter: string): NavShortcut | "pending" | null {
      if (pendingAt !== null && now() - pendingAt <= SEQUENCE_TIMEOUT_MS) {
        pendingAt = null;
        return NAV_SHORTCUTS.find((s) => s.key === letter) ?? null;
      }
      pendingAt = null;
      if (letter === "g") {
        pendingAt = now();
        return "pending";
      }
      return null;
    },
    reset() {
      pendingAt = null;
    },
  };
}
