"use client";

import { RefreshCw } from "lucide-react";
import BrickBreak from "@/components/custom/games/BrickBreak";
import ErrorScreen, { ERROR_PRIMARY, ERROR_SECONDARY } from "@/components/custom/shared/ErrorScreen";

/**
 * Offline fallback.
 *
 * This page is what the service worker returns when a document request fails
 * and nothing usable is cached — and it is also the way back *into* the app
 * when the shell is cached: tapping "Open Home" navigates to `/`, whose
 * HTML is served from the `pages` cache, so the app comes up with whatever
 * data was last synced. Worth keeping the copy honest about that.
 */
export default function OfflinePage() {
  return (
    <ErrorScreen
      code="Offline"
      codeTone="sage"
      title="No signal, no problem"
      description="This page was not saved for offline use. Your synced timetable, attendance, marks and settings are still on this device: open Home to see them."
      actions={
        <>
          <a href="/" className={ERROR_PRIMARY}>
            Open Home
          </a>
          <button type="button" onClick={() => window.location.reload()} className={ERROR_SECONDARY}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </button>
        </>
      }
    >
      {/* Something to do while the connection comes back. */}
      <section aria-label="Brick breaker" className="mt-7 space-y-2 border-t-2 border-border-ink pt-5">
        <h2 className="font-display text-base font-bold uppercase text-text-heading">Waiting? Break some bricks</h2>
        <BrickBreak />
      </section>
    </ErrorScreen>
  );
}
