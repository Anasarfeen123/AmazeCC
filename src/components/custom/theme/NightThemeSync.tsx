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
export default function NightThemeSync() {
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("night", theme === "night");
  }, [theme]);
  return null;
}
