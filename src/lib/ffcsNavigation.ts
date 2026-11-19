import { getAssetPath } from "@/lib/utils";

/** Canonical standalone FFCS planner route. */
export const FFCS_PLANNER_PATH = "/ffcs/";

/**
 * Open the standalone FFCS planner.
 *
 * In a new tab (user feedback: opening it in place left no way back to the
 * app). Falls back to the same tab if the browser blocks the new window, and
 * stays in place when already inside an installed app window, where tabs do
 * not exist.
 */
export function navigateToFFCSPlanner(): void {
  if (typeof window === "undefined") return;
  const url = getAssetPath(FFCS_PLANNER_PATH);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  if (!standalone) {
    // Not "noopener": with it window.open returns null even on success, so a
    // blocked pop-up could not be told apart. Cut the opener link by hand.
    const win = window.open(url, "_blank");
    if (win) {
      try {
        win.opener = null;
      } catch {}
      return;
    }
  }
  window.location.assign(url);
}
