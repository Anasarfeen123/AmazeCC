"use client";

import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";

/**
 * The one loading screen: shown while the app opens (HomeEntryController,
 * Main, AuthenticatedWorkspace). Brand logo, a moving ink bar, and a rotating
 * tip — half app tips, half (mostly) useful campus advice.
 *
 * The first tip is fixed so the server HTML and the first client render
 * match; a random one takes over after mount, then rotates every 4.5 s.
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

export default function AppLoading({ label = "Opening your workspace" }: { label?: string }) {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    setTip(Math.floor(Math.random() * LOADING_TIPS.length));
    const id = window.setInterval(() => setTip((t) => (t + 1) % LOADING_TIPS.length), 4500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="page-dots flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-center"
      role="status"
      aria-label={label}
    >
      <div className="app-loading-bob">
        <BrandLogo variant="mark" size="xl" />
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
        {/* key: re-mounts so the fade runs on each new tip */}
        <p key={tip} className="app-loading-tip mt-2 min-h-[2.75rem] text-sm leading-snug text-text-primary">
          {LOADING_TIPS[tip]}
        </p>
      </div>
    </div>
  );
}
