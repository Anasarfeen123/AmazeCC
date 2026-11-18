"use client";

import { useEffect } from "react";

/**
 * Vars the old accent-palette picker wrote inline on `<html>`. The picker and
 * the "Card look" toggle were removed with the brand redesign (one look, light
 * and dark only; tokens in `src/app/brand.css`). A saved non-default
 * `settings.colorPalette` from before the redesign is simply ignored, and this
 * list exists only so a page that was already painted by the old code in this
 * session (or a stale service-worker bundle) is cleaned back to the brand.
 */
const LEGACY_PALETTE_VARS = [
  "--theme-accent",
  "--background",
  "--foreground",
  "--text-heading",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--surface",
  "--surface-raised",
  "--surface-secondary",
  "--surface-tertiary",
  "--surface-hover",
  "--border-muted",
  "--border-strong",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--info",
  "--info-foreground",
  "--info-surface",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
];

export function useAppAppearance(settings: any, _theme?: unknown) {
  // Privacy mode: CSS in globals.css blurs every [data-private] value.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("privacy-mode", Boolean(settings?.privacyMode));
  }, [settings?.privacyMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    LEGACY_PALETTE_VARS.forEach((name) => root.style.removeProperty(name));
    delete root.dataset.colorPalette;
    delete root.dataset.cardSurface;
  }, []);
}
