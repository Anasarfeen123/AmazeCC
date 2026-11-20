"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import BrickBreak from "@/components/custom/games/BrickBreak";

/**
 * Offline fallback.
 *
 * This page is what the service worker returns when a document request fails
 * and nothing usable is cached — and it is also the way back *into* the app
 * when the shell is cached: tapping "Open dashboard" navigates to `/`, whose
 * HTML is served from the `pages` cache, so the app comes up with whatever
 * data was last synced. Worth keeping the copy honest about that.
 */
export default function OfflinePage() {
  return (
    <div className="page-dots min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="bg-surface border-2 border-border-ink rounded-[16px] p-8 max-w-md w-full text-center shadow-brutal-md">
        <div className="w-16 h-16 mx-auto bg-surface-secondary rounded-full flex items-center justify-center mb-6">
          <WifiOff className="w-8 h-8 text-text-muted" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase text-text-heading mb-2">You&apos;re offline</h1>
        <p className="text-text-muted mb-6">
          We couldn&apos;t load this page from the cache. Your saved data — timetable, tasks, attendance, settings — is
          still here; open the dashboard to see it.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-primary-foreground font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Open dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 bg-surface border-2 border-border-ink hover:bg-surface-hover text-text-primary font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try reconnecting
          </button>
        </div>
      </div>

      {/* Something to do while the connection comes back. */}
      <section aria-label="Brick breaker" className="w-full max-w-md space-y-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
          Bored? Break some bricks
        </p>
        <BrickBreak />
      </section>
    </div>
  );
}
