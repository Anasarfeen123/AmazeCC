"use client";

/**
 * Pairs — the grant list.
 *
 * Groups are gone on purpose. A group was a client-side view over the friend's
 * list, and now that pairings live on the server a second client-side grouping
 * would be a second source of truth that can disagree with the first. If
 * grouping is wanted later it should be derived from this list, not stored
 * beside it.
 *
 * Visibility is no longer a choice: every pair shares full detail. A grant is
 * one row covering both directions, so this is the same for you and your peer.
 */

import { useState } from "react";
import { Link2, Loader2, ShieldCheck } from "lucide-react";
import { EMPTY_STATE, LIST_SHELL } from "@/lib/libraries/ui";
import { PairRow, SectionHeader } from "./rows";
import { PageShell } from "../shared/primitives";
import { revokeGrant } from "@/lib/social/client";
import { useSocialData } from "@/lib/social/useSocialData";

/** Confirmation instead of `confirm()`, which is blocked in some in-app browsers. */
function ConfirmRevoke({ name, onYes, onNo }: { name: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="p-3 rounded-2xl bg-danger-surface border border-border-ink space-y-2">
      <p className="text-xs font-bold text-danger-foreground">End the pairing with {name}?</p>
      <p className="text-xs text-danger-foreground font-medium leading-relaxed">
        Both of you lose access immediately. You can pair again later, but that mints a new grant and the old one stays
        dead.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNo}
          className="flex-1 py-2 rounded-xl bg-surface text-text-primary border-2 border-border-ink font-bold text-xs cursor-pointer"
        >
          Keep pairing
        </button>
        <button
          type="button"
          onClick={onYes}
          className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
        >
          End pairing
        </button>
      </div>
    </div>
  );
}

export default function PairsSubpage({ onBack, onAddPeer }: { onBack: () => void; onAddPeer: () => void }) {
  const { grants, peers, markDirty } = useSocialData();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameFor = (handle: string | null) => peers.find((p) => p.handle === handle)?.name || handle || "Unknown";

  const revoke = async (grantId: string, secret: string) => {
    setBusyId(grantId);
    setError(null);
    try {
      await revokeGrant(grantId, secret);
      markDirty();
      setConfirming(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not end the pairing.");
    } finally {
      setBusyId(null);
    }
  };

  const headerActions = (
    <button
      type="button"
      onClick={onAddPeer}
      className="px-3 py-2.5 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs transition-colors cursor-pointer shrink-0"
    >
      New pair
    </button>
  );

  return (
    <PageShell eyebrow="Campus" title="Pairs" onBack={onBack} actions={headerActions}>
      <SectionHeader icon={Link2} title="Active pairings" count={grants.length} />

      {error && (
        <p className="p-3 rounded-2xl bg-danger-surface border border-border-ink text-danger-foreground text-xs font-bold">
          {error}
        </p>
      )}

      {grants.length === 0 ? (
        <div className={EMPTY_STATE}>
          <p className="text-xs font-bold text-text-muted">No pairings yet</p>
          <p className="text-xs text-text-muted font-medium mt-1.5 leading-relaxed">
            A pairing is what lets two students see each other&apos;s timetable. It is mutual, and either side can end
            it.
          </p>
          <button
            type="button"
            onClick={onAddPeer}
            className="mt-4 px-4 py-2.5 rounded-2xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Pair with someone
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className={LIST_SHELL}>
            {grants.map((g) => (
              <div key={g.grantId}>
                {confirming === g.grantId ? (
                  <div className="p-3">
                    <ConfirmRevoke
                      name={nameFor(g.peerHandle)}
                      onNo={() => setConfirming(null)}
                      onYes={() => void revoke(g.grantId, g.secret)}
                    />
                  </div>
                ) : (
                  <PairRow
                    name={nameFor(g.peerHandle)}
                    handle={g.peerHandle || "—"}
                    visibility={g.visibility}
                    createdAt={g.createdAt}
                    busy={busyId === g.grantId}
                    onRevoke={() => setConfirming(g.grantId)}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="px-1 -mt-1 text-xs leading-relaxed text-text-muted font-medium flex items-start gap-1.5">
            {busyId ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mt-px shrink-0" />
                Updating…
              </>
            ) : grants.some((g) => g.visibility !== "full") ? (
              <>
                <ShieldCheck className="w-3 h-3 mt-px shrink-0" />A legacy free/busy-only pair is being raised to full
                detail automatically.
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 mt-px shrink-0" />
                Every pairing shares full detail — course, venue and title. Either of you can end it at any time.
              </>
            )}
          </p>
        </div>
      )}
    </PageShell>
  );
}
