"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LayoutDashboard, LogIn } from "lucide-react";
import { useAtomValue } from "jotai";
import { isLoggedInAtom } from "@/store";
import { prepareSignIn, SIGN_IN_PARAM } from "@/lib/signInReturn";
import ThemeToggle from "@/components/custom/ThemeToggle";
import BrandLogo from "@/components/custom/shared/BrandLogo";
import { useOverlayBackBoundary } from "@/lib/overlayStack";

// The planner is ~440KB of async chunks; the shell (nav + footer) is a few
// KB. Deferring the tab keeps the share-link landing paintable without the
// whole graph, matching how the dashboard already lazy-loads its tabs.
const FFCSTimetableTab = dynamic(() => import("@/components/custom/exams/FFCSTimetableTab"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
      <span className="animate-pulse text-sm text-text-muted">Loading planner…</span>
    </div>
  ),
});

export default function FFCSPageView() {
  useOverlayBackBoundary("ffcs-route");
  const [mounted, setMounted] = useState(false);
  const [, setPlannerLayoutMode] = useState<"guided" | "modern" | "classic">("modern");
  // The planner tab hydrates this from the stored session on mount, so the
  // header can tell a signed-in student from a guest.
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-clip bg-background font-sans text-text-primary">
      {/* Brand top bar: makes it clear this is the separate FFCS planner site
          (it opens in its own tab from the app) and gives a way back. */}
      <header
        className="brand-sidebar sticky top-0 z-40 border-b-[3px] border-border-ink"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" title="AmazeCC home" aria-label="AmazeCC home">
            {/* Wrapped: BrandLogo's own inline-flex beat a `hidden` passed in,
                so both logos showed on phones and the bar overflowed. */}
            <span className="sm:hidden">
              <BrandLogo size="md" variant="mark" />
            </span>
            <span className="hidden sm:inline-flex">
              <BrandLogo size="md" wordClassName="text-cream" />
            </span>
            <span className="rounded-[6px] border-2 border-obsidian bg-ochre px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-obsidian">
              FFCS planner
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {/* Signed in: back to the app. Signed out: sign in, then return here. */}
            <Link
              href={isLoggedIn ? "/" : `/?${SIGN_IN_PARAM}=1`}
              onClick={isLoggedIn ? undefined : () => prepareSignIn("/ffcs/")}
              aria-label={isLoggedIn ? "Open AmazeCC" : "Sign in to AmazeCC"}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border-2 border-obsidian bg-cream px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-obsidian shadow-brutal-sm brutal-press"
            >
              {isLoggedIn ? <LayoutDashboard size={14} aria-hidden /> : <LogIn size={14} aria-hidden />}
              <span className="hidden sm:inline">{isLoggedIn ? "Open AmazeCC" : "Sign in"}</span>
            </Link>
            {mounted && <ThemeToggle />}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-x-clip px-4 py-6 sm:px-8 sm:py-8">
        <FFCSTimetableTab onLayoutModeChange={setPlannerLayoutMode} />
      </main>

      <footer className="border-t-[3px] border-border-ink bg-surface-secondary">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 font-mono text-xs sm:px-8">
          <p className="text-text-muted">{"AmazeCC FFCS planner // works offline // no sign-in needed"}</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4 font-semibold uppercase tracking-[0.06em]">
            {[
              ["AmazeCC", "/"],
              ["Friend finder", "/friend-finder"],
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="text-text-primary underline-offset-4 hover:underline">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
