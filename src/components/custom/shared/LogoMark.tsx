"use client";

import { useEffect, useRef, useState } from "react";
import { getAssetPath } from "@/lib/utils";

/**
 * The app icon as five stacked layers (brand/anim/*.png: tile, the two
 * pages, the A, the star), so its parts can move on their own. Stacked
 * without animation it is pixel-for-pixel the app icon.
 *
 * - intro: the "book opens" entrance (tile pops, A drops in, pages swing
 *   open from the spine, star twinkles), about 0.95 s. Plays once per
 *   browser session; later loads and reduced-motion users get the still
 *   logo. Used by the loading screen.
 * - syncing: the star turns slowly while a sync runs; when it ends the
 *   pages give one small flutter.
 *
 * No jotai here on purpose: callers pass `syncing` (tests mock jotai).
 */
const INTRO_KEY = "amazecc.logoIntroPlayed";
const LAYERS = ["tile", "page-l", "page-r", "a", "star"] as const;

function introAlreadyPlayed(): boolean {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    if (window.sessionStorage.getItem(INTRO_KEY) === "1") return true;
    window.sessionStorage.setItem(INTRO_KEY, "1");
    return false;
  } catch {
    return false;
  }
}

export default function LogoMark({
  className = "h-20 w-20",
  intro = false,
  syncing = false,
}: {
  className?: string;
  intro?: boolean;
  syncing?: boolean;
}) {
  // Decided after mount (sessionStorage / media query are client-only), so
  // the server HTML is the still logo and hydration matches.
  const [playIntro, setPlayIntro] = useState(false);
  useEffect(() => {
    if (intro && !introAlreadyPlayed()) setPlayIntro(true);
  }, [intro]);

  // One flutter when a sync finishes.
  const [flutter, setFlutter] = useState(false);
  const wasSyncing = useRef(syncing);
  useEffect(() => {
    if (wasSyncing.current && !syncing) {
      setFlutter(true);
      const t = window.setTimeout(() => setFlutter(false), 900);
      wasSyncing.current = syncing;
      return () => window.clearTimeout(t);
    }
    wasSyncing.current = syncing;
  }, [syncing]);

  const state = [playIntro ? "is-intro" : "", syncing ? "is-syncing" : "", flutter ? "is-flutter" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span role="img" aria-label="AmazeCC" className={`logo-mark relative inline-block shrink-0 ${className} ${state}`}>
      {LAYERS.map((layer) => (
        <img
          key={layer}
          src={getAssetPath(`/brand/anim/${layer}.png`)}
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          className={`logo-layer logo-${layer} absolute inset-0 h-full w-full select-none`}
        />
      ))}
    </span>
  );
}
