"use client";

/**
 * One peer's timetable.
 *
 * Replaces `FriendTimetableModal`. The important behaviour is what happens on a
 * `coarse` grant: the server sends slot occupancy with every entry emptied and no
 * course list, so there is genuinely nothing to show beyond free/busy. This
 * sheet says so, rather than rendering an empty grid the user reads as a bug.
 */

import { useMemo } from "react";
import { BookOpen, EyeOff, MapPin, Clock } from "lucide-react";
import BottomSheet from "../shared/BottomSheet";
import { CHIP, TONE_TEXT } from "@/lib/libraries/ui";
import { DAYS, computeOverlap, parseSlotKey, slotMap, type Day } from "@/lib/social/schedule";
import { relativePublished, type PeerTimetable } from "@/lib/social/usePeerTimetables";
import type { BusyMap, SocialCourse } from "@/lib/social/types";
import { sharedWithPeer } from "@/lib/social/sharedClasses";
import { initials } from "./rows";

function busyDays(busyMap: BusyMap): { day: Day; count: number }[] {
  return DAYS.map((day) => ({
    day,
    count: Object.keys(busyMap ?? {}).filter((k) => k.startsWith(`${day}:`)).length,
  })).filter((d) => d.count > 0);
}

export default function PeerTimetableSheet({
  peer,
  ownBusyMap,
  ownCourses = [],
  onClose,
}: {
  peer: PeerTimetable;
  ownBusyMap: BusyMap;
  /** Your courses, to show which classes you share. */
  ownCourses?: SocialCourse[];
  onClose: () => void;
}) {
  const shared = useMemo(() => sharedWithPeer(ownCourses, peer.courses ?? []), [ownCourses, peer.courses]);
  const metrics = useMemo(
    () => (peer.loaded ? computeOverlap(ownBusyMap, peer.busyMap) : null),
    [peer.loaded, peer.busyMap, ownBusyMap],
  );
  const byDay = useMemo(() => busyDays(peer.busyMap), [peer.busyMap]);

  const clashSlots = useMemo(
    () => Object.keys(peer.busyMap ?? {}).filter((k) => ownBusyMap?.[k] !== undefined),
    [peer.busyMap, ownBusyMap],
  );

  return (
    <BottomSheet
      onClose={onClose}
      overlayId="social-peer-sheet"
      maxWidth="max-w-md"
      title={peer.name}
      subtitle={
        <>
          {peer.handle} · published {relativePublished(peer.publishedAt)}
          {peer.stale && (
            <span className="ml-1.5 inline-block align-middle bg-warning-surface text-warning-foreground text-xs uppercase font-bold px-2 py-0.5 rounded-[6px]">
              Stale
            </span>
          )}
        </>
      }
      icon={<span className="text-xs font-bold font-outfit">{initials(peer.name)}</span>}
      accent="border-border-ink bg-secondary text-secondary-foreground"
      closeLabel="Close peer timetable"
    >
      <div className="text-left space-y-5">
        {peer.noGrant ? (
          <div className="p-5 rounded-2xl border border-dashed border-border-ink text-center">
            <p className="text-xs font-bold text-text-muted">
              You are not paired with this student, so their timetable is not available.
            </p>
          </div>
        ) : peer.error ? (
          <div className="p-3 rounded-2xl bg-danger-surface border border-border-ink">
            <p className="text-xs font-bold text-danger-foreground">
              Could not read this pairing. It may have been revoked, or the session may have expired — try a sync.
            </p>
          </div>
        ) : !peer.loaded ? (
          <div className="space-y-2" role="status" aria-label="Loading timetable">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-[10px] bg-surface-secondary" />
            ))}
          </div>
        ) : (
          <>
            {metrics && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "match",
                    value: `${metrics.matchPct}%`,
                    tone: metrics.matchPct >= 70 ? "emerald" : metrics.matchPct >= 40 ? "amber" : "red",
                  },
                  {
                    label: "clash",
                    value: `${metrics.sharedClassHours}h`,
                    tone: metrics.sharedClassHours === 0 ? "emerald" : "amber",
                  },
                  {
                    label: "free now",
                    value: metrics.freeNow ? "Yes" : "No",
                    tone: metrics.freeNow ? "emerald" : "zinc",
                  },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-2xl border-2 border-border-ink text-center">
                    <p className={`text-lg font-bold font-outfit leading-none ${TONE_TEXT[s.tone] ?? TONE_TEXT.zinc}`}>
                      {s.value}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {peer.visibility === "coarse" ? (
              <div className="p-4 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
                  <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                  Free / busy only
                </p>
                <p className="text-xs text-text-muted font-medium leading-relaxed">
                  This pair is still returning free/busy only. Course codes, titles and venues are withheld by the
                  server, so there is nothing more to show here.
                </p>
              </div>
            ) : peer.courses.length > 0 ? (
              <>
                {(shared.sameClass.length > 0 || shared.sameCourse.length > 0) && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-success-foreground" />
                      Classes together
                    </p>
                    {shared.sameClass.map(({ mine }) => (
                      <div
                        key={`same-${mine.classId || mine.code}`}
                        className="p-3 rounded-2xl border border-border-ink bg-success-surface"
                      >
                        <p className="text-xs font-bold text-text-primary font-outfit truncate">
                          {mine.code} · {mine.title}
                        </p>
                        <p className="text-xs text-success-foreground font-bold mt-0.5 truncate">
                          Same class{mine.venue ? ` · ${mine.venue}` : ""}
                          {mine.componentType ? ` · ${mine.componentType}` : ""}
                        </p>
                      </div>
                    ))}
                    {shared.sameCourse.map(({ mine, theirs }) => (
                      <div
                        key={`course-${mine.classId || mine.code}-${mine.componentType}`}
                        className="p-3 rounded-2xl border-2 border-border-ink"
                      >
                        <p className="text-xs font-bold text-text-primary font-outfit truncate">
                          {mine.code} · {mine.title}
                        </p>
                        <p className="text-xs text-text-muted font-medium mt-0.5 truncate">
                          Same course, other section
                          {theirs.faculty ? ` · their faculty: ${theirs.faculty}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Courses
                  </p>
                  {peer.courses.map((c, i) => (
                    <div key={`${c.classId || c.code}-${i}`} className="p-3 rounded-2xl border-2 border-border-ink">
                      <p className="text-xs font-bold text-text-primary font-outfit truncate">
                        {c.code} · {c.title}
                      </p>
                      <p className="text-xs text-text-muted font-medium mt-0.5 flex items-center gap-1 truncate">
                        {c.venue && <MapPin className="w-3 h-3 shrink-0" />}
                        {c.venue || "—"}
                        {c.componentType ? ` · ${c.componentType}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Their week</p>
              <div className="flex flex-wrap gap-1.5">
                {byDay.length === 0 ? (
                  <p className="text-xs text-text-muted font-medium">Nothing published for this term.</p>
                ) : (
                  byDay.map((d) => (
                    <span key={d.day} className={`${CHIP} border-border-ink`}>
                      {d.day} {d.count}
                    </span>
                  ))
                )}
              </div>
            </div>

            {clashSlots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">You both have class in</p>
                <div className="flex flex-wrap gap-1.5">
                  {clashSlots.slice(0, 12).map((k) => {
                    const parsed = parseSlotKey(k);
                    const slot = parsed ? slotMap[parsed.day]?.[parsed.slotId] : null;
                    return (
                      <span key={k} className={`${CHIP} border-border-ink text-warning-foreground`}>
                        {parsed?.day} {parsed?.slotId}
                        {slot ? ` · ${slot.time}` : ""}
                      </span>
                    );
                  })}
                  {clashSlots.length > 12 && (
                    <span className={`${CHIP} border-border-ink`}>+{clashSlots.length - 12} more</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
