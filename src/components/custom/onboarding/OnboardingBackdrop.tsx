"use client";

import { getAssetPath } from "@/lib/utils";

/**
 * The background for sign-in and every onboarding step (owner: "improve the
 * background and all about the onboarding"). It used to be an empty div on
 * the steps and a bare dot grid on sign-in.
 *
 * Friendly brutalist, not glossy: flat brand shapes with ink outlines and hard
 * shadows (an ochre sun, a sage tile, a teal ring, the logo's sparkle), the dot
 * grid, and the campus drawing faded along the bottom (day / night art). The
 * shapes sit at the edges, away from the text, and shift a little with each
 * step so moving forward feels like moving through something. They drift
 * slowly; reduced motion keeps them still.
 */
export default function OnboardingBackdrop({ step = 0, campus = true }: { step?: number; campus?: boolean }) {
  const s = Math.max(0, Math.min(step, 6));
  return (
    <div aria-hidden className="onb-backdrop pointer-events-none absolute inset-0 overflow-hidden">
      <div className="page-dots absolute inset-0" />

      {/* Ochre sun, top right */}
      <div
        className="onb-shape absolute -right-20 top-[9%] h-40 w-40 rounded-full border-[3px] border-border-ink bg-highlight shadow-brutal-md sm:-right-16 sm:top-[6%] sm:h-60 sm:w-60"
        style={{ transform: `translate(${-s * 10}px, ${s * 6}px)` }}
      />
      {/* Sage tile, left */}
      <div
        className="onb-shape onb-shape-slow absolute -left-10 top-[38%] h-28 w-28 rounded-[22px] border-[3px] border-border-ink bg-secondary shadow-brutal-sm sm:h-36 sm:w-36"
        style={{ transform: `translateY(${-s * 14}px) rotate(${12 + s * 4}deg)` }}
      />
      {/* Teal ring, bottom right (above the campus art) */}
      <div
        className="onb-shape absolute -right-8 bottom-[22%] h-24 w-24 rounded-full border-[10px] border-primary opacity-80 sm:h-32 sm:w-32"
        style={{ transform: `translateX(${-s * 8}px)` }}
      />
      {/* Sparkles from the logo */}
      {["left-[5%] top-[12%] h-5 w-5", "right-[5%] top-[44%] h-3.5 w-3.5", "left-[6%] bottom-[38%] h-4 w-4"].map(
        (pos, i) => (
          <svg
            key={pos}
            viewBox="0 0 24 24"
            className={`onb-twinkle absolute ${pos} text-highlight`}
            style={{ animationDelay: `${i * 0.9}s` }}
          >
            <path
              d="M12 1.5c.6 4.8 2.7 8.4 9 10.5-6.3 2.1-8.4 5.7-9 10.5-.6-4.8-2.7-8.4-9-10.5 6.3-2.1 8.4-5.7 9-10.5Z"
              fill="currentColor"
              stroke="var(--border-ink)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      )}

      {campus ? (
        <>
          <img
            src={getAssetPath("/landing/campus-day.webp")}
            alt=""
            className="onb-campus absolute inset-x-0 bottom-0 h-auto w-full opacity-25 dark:hidden"
          />
          <img
            src={getAssetPath("/landing/campus-night.webp")}
            alt=""
            className="onb-campus absolute inset-x-0 bottom-0 hidden h-auto w-full opacity-30 dark:block"
          />
        </>
      ) : null}

      {/* Keeps text readable over the shapes on small screens. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--background)_35%,transparent_75%)] opacity-70" />
    </div>
  );
}
