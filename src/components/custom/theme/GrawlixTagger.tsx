"use client";

import { useEffect } from "react";

/**
 * Gives every hidden value (.crayon-hide / [data-private]) a variant 0-4 so
 * the comic cover shows different symbols and colours (globals.css,
 * "Grawlix variants"). Variant comes from the element's position in the page,
 * not its value, so nothing about the hidden number leaks.
 */
export default function GrawlixTagger() {
  useEffect(() => {
    const tag = () => {
      document.querySelectorAll<HTMLElement>(".crayon-hide, [data-private]").forEach((el, i) => {
        const g = String(i % 5);
        if (el.dataset.g !== g) el.dataset.g = g;
      });
    };
    tag();
    const mo = new MutationObserver(() => tag());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
