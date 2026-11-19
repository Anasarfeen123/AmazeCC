"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * The "Night" theme (ROADMAP R7) is stored by next-themes as `night` and
 * mapped to the `dark` class (layout.tsx `value`), so every dark: style
 * applies. This adds the extra `night` class that swaps the page/card tokens
 * (brand.css `.dark.night`). The inline script in layout.tsx sets it before
 * first paint; this keeps it in sync when the theme changes.
 */
/** Page colour per theme, for the browser / installed-app status bar. */
const STATUS_BAR: Record<string, string> = { light: "#F7F1E6", dark: "#001E1D", night: "#000000" };

export default function NightThemeSync() {
  const { theme, resolvedTheme } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("night", theme === "night");
  }, [theme]);

  // layout.tsx's theme-color tags follow the OS setting; the status bar
  // should follow the theme picked in the app (Night on a light-mode phone
  // showed a cream bar over a black app). Both tags get the same colour so
  // whichever media query matches shows the right one.
  useEffect(() => {
    const key = theme === "night" ? "night" : resolvedTheme === "dark" ? "dark" : "light";
    const color = STATUS_BAR[key];
    const tags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (tags.length === 0) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = color;
      document.head.appendChild(meta);
    } else {
      tags.forEach((t) => (t.content = color));
    }
  }, [theme, resolvedTheme]);
  return null;
}
