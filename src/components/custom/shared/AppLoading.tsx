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
  "Swipe up on the bottom bar to open all modules.",
  "Double-tap a bottom-bar tab to jump back to that section's home.",
  "Pin your most-used screens: Settings → Bottom bar.",
  "The Skip predictor counts labs double. Plan those carefully.",
  "Pick a target in Skip predictor (75, 80, 85%) to see how many classes you can miss.",
  "Exam schedule shows your seat and venue once VTOP publishes them.",
  "Marks Predictor tells you exactly what you need in the FAT.",
  "Grade History keeps every semester's grades in one place.",
  "Degree Curriculum shows the credits you still need, basket by basket.",
  "Faculty Schedule finds when a professor is free. Office-hours hunting, solved.",
  "Find your friend shows who picked the same slots and faculty as you.",
  "The FFCS planner flags slot clashes before registration does.",
  "Auto-generate in FFCS builds clash-free timetables from your course list.",
  "Share your FFCS plan with a link. No screenshots needed.",
  "The paper scanner turns a photo of a question paper into a clean PDF.",
  "Question Bank has past CAT and FAT papers, sorted by course.",
  "Tap any day in Calendar to see its classes, exams and events.",
  "On-duty hours, history and official records live under Calendar → On-duty.",
  "The mess menu is on Home if you are a hosteller.",
  "Libraries shows what you have borrowed and when it is due.",
  "Payments lists fee receipts without logging into three portals.",
  "Event Hub collects campus events so you do not miss registration.",
  "Privacy mode (Alt+P) hides your CGPA on Home and the sidebar.",
  "Light, Dark or Night: switch themes from the sidebar or Settings.",
  "Everything you sync stays readable offline.",
  "Pull the latest from VTOP any time with the sync button on Home.",
  "Report a bug from the bug icon on Home. Screenshots welcome.",
  "Install AmazeCC from your browser menu: it opens like an app.",
  "Lab manuals: write the aim first, panic later.",
  "Bring a pen to the exam. Borrowing one at 9:29 is a sport nobody wins.",
  "Reporting time for exams is earlier than the start time. Read both.",
  "CAT marks matter. FAT marks matter more.",
  "Attendance is counted per course, not overall. Check each one.",
  "A missed lab often counts as two missed hours.",
  "The library is quietest right after it opens.",
  "Charge your laptop before the lab. The sockets are always taken.",
  "Ask seniors about faculty, then check the reviews too.",
  "FFCS day: have backups for every slot, and a stable connection.",
  "Sleep before an exam beats one more chapter at 3 AM.",
  "Group projects go better with a shared doc from day one.",
  "Keep a soft copy of every OD letter. Future you will need it.",
  "Hydrate. Chennai heat does not care about your schedule.",
  "Carry an ID card. Every gate will ask.",
  "Notes from the first week are the ones you will want in week ten.",
  "A two-minute walk between classes clears the head better than scrolling.",
  "Office hours are underrated. Most professors like being asked.",
  "Keep your VTOP password somewhere safe, not in your notes app.",
  "Write down assignment deadlines the day they are announced.",
  "Weekend plans work better after the week's attendance is safe.",
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
  // A loading screen mounted after an earlier one (opening passes through
  // several) starts with the tip already on screen, so the box is never
  // empty for a frame between screens. Only the very first, server-rendered
  // screen starts empty (lastShown is -1 there, on server and client alike).
  const [tip, setTip] = useState<number | null>(() => {
    if (tipState.lastShown >= 0) return tipState.lastShown;
    // The inline script below already put a tip on the very first paint
    // (owner: tips ASAP); adopt it so hydration does not swap the text.
    const early = typeof window !== "undefined" ? (window as any).__amazeTip : undefined;
    if (typeof early === "number" && LOADING_TIPS[early]) {
      tipState.index = early;
      tipState.since = Date.now();
      tipState.lastShown = early;
      return early;
    }
    return null;
  });
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

      <button
        type="button"
        onClick={() => {
          // Tap for another tip.
          const next = ((tip ?? tipState.index ?? 0) + 1) % LOADING_TIPS.length;
          tipState.index = next;
          tipState.since = Date.now();
          tipState.lastShown = next;
          setFade(true);
          setTip(next);
        }}
        className="w-full max-w-sm cursor-pointer rounded-[14px] border-2 border-border-ink bg-surface p-4 text-left shadow-brutal-sm brutal-press"
        aria-label="Show another tip"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
            Tip
          </span>
          <span className="font-mono text-xs text-text-muted">tap for another</span>
        </span>
        {/* key: re-mounts so the fade runs when the tip changes */}
        <span
          id={tip === null ? "app-loading-tip" : undefined}
          key={tip ?? "none"}
          suppressHydrationWarning
          className={`${fade ? "app-loading-tip " : ""}mt-2 block min-h-[2.75rem] text-sm leading-snug text-text-primary`}
        >
          {tip === null ? "\u00a0" : LOADING_TIPS[tip]}
        </span>
        {tip === null && (
          // Runs as the HTML is parsed, before any app JavaScript: the tip is
          // on screen from the first paint instead of after hydration.
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=${JSON.stringify(LOADING_TIPS)};var i=Math.floor(Math.random()*t.length);window.__amazeTip=i;var e=document.getElementById("app-loading-tip");if(e)e.textContent=t[i];}catch(_){}})();`,
            }}
          />
        )}
      </button>
    </div>
  );
}
