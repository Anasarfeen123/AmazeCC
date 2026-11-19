"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * The "Black" theme (ROADMAP R7) is stored by next-themes as `black` and
 * mapped to the `dark` class (layout.tsx `value`), so every dark: style
 * applies. This adds the extra `black` class that swaps the page/card tokens
 * (brand.css `.dark.black`). The inline script in layout.tsx sets it before
 * first paint; this keeps it in sync when the theme changes.
 */
export default function BlackThemeSync() {
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("black", theme === "black");
  }, [theme]);
  return null;
}
