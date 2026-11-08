/**
 * AmazeCC's attendance status rule, in one place.
 *
 * AmazeUI owns how a status looks (`StatusBadge`); this owns what counts as
 * which status. Below the target is critical, within five points above it is
 * a warning, and comfortably above it is safe. No classes held yet is neutral.
 * Each state is also a valid AmazeUI `StatusBadge` status.
 */
export type AttendanceState = "safe" | "warning" | "critical" | "neutral";

export function attendanceState(pct: number | null | undefined, targetPct: number, held = 1): AttendanceState {
  if (!held || pct == null || Number.isNaN(pct)) return "neutral";
  if (pct < targetPct) return "critical";
  if (pct < targetPct + 5) return "warning";
  return "safe";
}

export function attendanceStateLabel(state: AttendanceState, targetPct: number): string {
  switch (state) {
    case "critical":
      return `Below ${targetPct}%`;
    case "warning":
      return "Close to the line";
    case "safe":
      return "Safe";
    default:
      return "No classes yet";
  }
}
