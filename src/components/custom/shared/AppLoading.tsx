"use client";

import { useEffect, useState } from "react";
import LogoMark from "./LogoMark";

/**
 * The one loading screen: shown while the app opens (HomeEntryController,
 * Main, AuthenticatedWorkspace). Brand logo, a moving ink bar, and a rotating
 * tip — half app tips, half (mostly) useful campus advice.
 *
 * The tip text appears after mount (the server cannot know the shared tip),
 * changes every 9 s, and fades only when it actually changes.
 */
export const LOADING_TIPS: string[] = [
  "Ctrl+K (⌘K on a Mac) searches the whole app.",
  "Alt+P covers your CGPA when someone is reading over your shoulder.",
  "75% is the floor, not the goal.",
  "Carry an umbrella. Chennai weather has two modes: sun and surprise.",
  "Your timetable works offline. The campus Wi-Fi does not have to.",
  "The mess menu says “special”. Manage your expectations.",
  "FFCS tip: plan three backup slots. Then three more.",
  "Drink water. The stairs in AB1 are a free cardio plan.",
  "Charge your phone before CAT. And yourself.",
  "Old question papers live in Question Bank. Seniors are a backup.",
  "Hostel curfew is real. Plan movie timings around it.",
  "If the bus is late, so is everyone. Breathe.",
  "Pin the screens you use most in Settings → Bottom bar.",
  "Breakfast is a real meal. The 8 AM class agrees.",
  "Library dues grow quietly. Check them before they grow loudly.",
  "Sync on Wi-Fi, scroll on data.",
  "OD hours are not free days. Keep the approvals.",
  "Revision works better when it starts before the night before.",
  "Make one friend in every lab batch. Future you says thanks.",
  "Night theme: for 2 AM assignments you meant to start at 2 PM.",
  "Sit in the front row once. Just to see what it is like.",
  "The attendance predictor can tell you exactly how many classes you can skip. Use it wisely.",
  "Tap the logo a few times. Nothing will happen. Probably.",
  "Free Classrooms shows empty rooms right now. Group study, sorted.",
];

/**
 * One tip shared by every loading screen in this page load. Opening the app
 * passes through several loading screens in a row (entry, app shell,
 * workspace, dashboard), each a new AppLoading; when each picked its own
 * random tip, the tip changed every second or so (user: "changing so fast").
 * Now the first one picks, later ones keep it, and it only advances after
 * TIP_MS on screen.
 */
const TIP_MS = 9000;
// lastShown: the tip a loading screen last put on screen, so the next screen
// showing the same tip does not replay the fade (that read as blinking).
const tipState = { index: -1, since: 0, lastShown: -1 };

function currentTip(): number {
  const now = Date.now();
  if (tipState.index < 0) {
    tipState.index = Math.floor(Math.random() * LOADING_TIPS.length);
    tipState.since = now;
  } else if (now - tipState.since >= TIP_MS) {
    tipState.index = (tipState.index + 1) % LOADING_TIPS.length;
    tipState.since = now;
  }
  return tipState.index;
}

export default function AppLoading({ label = "Opening your workspace" }: { label?: string }) {
  // No tip text until mounted: the server cannot know the shared tip, and
  // rendering tip 0 first then swapping flashed on every loading screen
  // (user: "tips are blinking and buggy"). The box keeps its height.
  const [tip, setTip] = useState<number | null>(null);
  // Fade only when the text actually changes, not when a new loading screen
  // mounts with the tip the previous screen was already showing.
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const show = () => {
      const next = currentTip();
      if (next === tipState.lastShown) {
        setTip((prev) => (prev === next ? prev : next));
        return;
      }
      setFade(tipState.lastShown !== -1);
      tipState.lastShown = next;
      setTip(next);
    };
    show();
    const id = window.setInterval(show, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="page-dots flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-center"
      role="status"
      aria-label={label}
    >
      <div className="app-loading-bob">
        <LogoMark intro className="h-24 w-24 rounded-[22%] shadow-brutal-sm" />
      </div>

      <div className="w-full max-w-[260px] space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-heading">{label}</p>
        <div className="h-4 overflow-hidden rounded-full border-2 border-border-ink bg-surface" aria-hidden>
          <div className="app-loading-bar h-full w-1/3 rounded-full bg-ochre" />
        </div>
      </div>

      <div className="w-full max-w-sm rounded-[14px] border-2 border-border-ink bg-surface p-4 text-left shadow-brutal-sm">
        <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
          Tip
        </span>
        {/* key: re-mounts so the fade runs when the tip changes */}
        <p
          key={tip ?? "none"}
          className={`${fade ? "app-loading-tip " : ""}mt-2 min-h-[2.75rem] text-sm leading-snug text-text-primary`}
        >
          {tip === null ? "\u00a0" : LOADING_TIPS[tip]}
        </p>
      </div>
    </div>
  );
}
