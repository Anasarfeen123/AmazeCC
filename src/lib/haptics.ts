/**
 * A tiny vibration on Android for actions that change a number on screen
 * (attend / skip in the predictors). iPhones have no web vibration API, so
 * this is a no-op there, and it is skipped for reduced motion.
 */
export function haptic(kind: "tap" | "success" | "warning" = "tap"): void {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(kind === "tap" ? 8 : kind === "success" ? [10, 40, 10] : [20, 60, 20]);
  } catch {
    /* some browsers throw without a user gesture */
  }
}
