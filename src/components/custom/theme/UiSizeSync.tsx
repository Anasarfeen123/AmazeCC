"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { settingsAtom } from "@/store/settingsAtoms";

/**
 * Display size (Settings -> Appearance). Sets `data-ui-size` on <html>;
 * brand.css maps it to the root font-size, and since sizes are rem-based
 * text, spacing and controls scale together. layout.tsx sets the same
 * attribute before first paint so there is no jump.
 */
export default function UiSizeSync() {
  const size = useAtomValue(settingsAtom)?.uiSize;
  useEffect(() => {
    const html = document.documentElement;
    if (size === "compact" || size === "large") html.setAttribute("data-ui-size", size);
    else html.removeAttribute("data-ui-size");
  }, [size]);
  return null;
}
