import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const activeTraps: symbol[] = [];

/**
 * Keeps keyboard focus inside an open dialog/sheet (ROADMAP R11).
 *
 * On open: remembers what had focus and moves focus into the panel (unless
 * something inside already has it, e.g. an autofocused search field).
 * While open: Tab / Shift+Tab wrap around inside the panel.
 * On close: focus goes back to the element that opened it.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  restoreRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const panel = ref.current;
    if (!panel) return;
    const previous = restoreRef?.current ?? (document.activeElement as HTMLElement | null);
    const token = Symbol("focus-trap");
    activeTraps.push(token);

    const items = () =>
      [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);

    if (!panel.contains(document.activeElement)) {
      const first = items()[0];
      if (first) first.focus({ preventScroll: true });
      else {
        panel.setAttribute("tabindex", "-1");
        panel.focus({ preventScroll: true });
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || activeTraps[activeTraps.length - 1] !== token) return;
      const list = items();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !panel.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !panel.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const index = activeTraps.indexOf(token);
      const wasTop = index === activeTraps.length - 1;
      if (index !== -1) activeTraps.splice(index, 1);
      if (wasTop && previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [ref, active, restoreRef]);
}
