"use client";

import { useEffect } from "react";

type BadgeNavigator = Navigator & {
  setAppBadge?: (n?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * Show a number on the installed app's icon (Badging API: Android Chrome,
 * desktop Chrome/Edge, iOS 16.4+ home-screen apps). 0 or less clears it.
 * A no-op where the API is missing (plain browser tabs, most desktops).
 */
export function useAppBadge(count: number): void {
  useEffect(() => {
    const nav = (typeof navigator !== "undefined" ? navigator : undefined) as BadgeNavigator | undefined;
    if (!nav?.setAppBadge || !nav.clearAppBadge) return;
    (count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge()).catch(() => {});
  }, [count]);
}
