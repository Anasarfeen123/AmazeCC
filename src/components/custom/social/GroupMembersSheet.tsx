"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FolderPlus, Users, X } from "lucide-react";
import BottomSheet from "../shared/BottomSheet";
import { SectionHeader, initials } from "./rows";
import { useSocialData } from "@/lib/social/useSocialData";
import { usePeerTimetables } from "@/lib/social/usePeerTimetables";
import { normaliseGroupName, useSocialGroups, type GroupSummary } from "@/lib/social/useSocialGroups";
import { GROUP_NAME_MAX, type BusyMap } from "@/lib/social/types";
import { FIELD_INPUT, TONE_BADGE } from "@/lib/libraries/ui";

/**
 * Group management: create a group, and choose who is in it.
 *
 * ## Membership is limited to existing peers
 *
 * The picker lists only people the user already holds a grant for. A group cannot
 * grant access to anything — every member is already readable — so offering a
 * wider list would be a promise the feature cannot keep. The server models pairs
 * and this screen deliberately does not pretend otherwise.
 */
export default function GroupMembersSheet({
  /** The group being edited, or null to create a new one. */
  groupId,
  onClose,
  onOpenGrid,
}: {
  groupId: string | null;
  onClose: () => void;
  onOpenGrid?: (id: string) => void;
}) {
  const { ownBusyMap } = useSocialData();
  const { peers } = usePeerTimetables();

  const busyByHandle = useMemo(() => {
    const m = new Map<string, BusyMap>();
    for (const p of peers) if (p.loaded) m.set(p.handle, p.busyMap);
    return m;
  }, [peers]);

  const known = useMemo(() => peers.map((p) => p.handle), [peers]);
  // One instance, built from the live peer list. The hook owns the single
  // read/write path for groups, so having two would give two hydration guards
  // racing over the same key.
  const groupApi = useSocialGroups({ ownBusyMap, knownHandles: known, busyByHandle });

  const existing = groupId ? (groupApi.groups.find((g) => g.id === groupId) ?? null) : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [selected, setSelected] = useState<string[]>(existing?.handles ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setSelected(existing.handles);
  }, [existing]);

  const toggle = useCallback((handle: string) => {
    setSelected((prev) => (prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]));
  }, []);

  const save = useCallback(() => {
    setError(null);
    const clean = normaliseGroupName(name);
    if (!clean) {
      setError("Give the group a name.");
      return;
    }
    if (existing) {
      groupApi.renameGroup(existing.id, clean);
      groupApi.setMembers(existing.id, selected);
    } else {
      const created = groupApi.createGroup(clean, selected);
      if (!created) {
        setError("Give the group a name.");
        return;
      }
    }
    onClose();
  }, [groupApi, existing, name, selected, onClose]);

  return (
    <BottomSheet
      overlayId="group-members"
      onClose={onClose}
      title={existing ? "Edit group" : "New group"}
      subtitle="Campus"
      closeLabel="Close group editor"
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="group-name" className="font-label text-xs font-bold text-text-muted">
            Name
          </label>
          <input
            id="group-name"
            value={name}
            maxLength={GROUP_NAME_MAX}
            placeholder="Project team, hostel floor, gym crew…"
            onChange={(e) => setName(e.target.value)}
            className={`${FIELD_INPUT} w-full`}
          />
        </div>

        <SectionHeader icon={Users} title={`Members (${selected.length}/${known.length})`} />

        {known.length === 0 ? (
          <p className="text-sm text-text-muted">
            Pair with someone first — a group is made from people you already share with.
          </p>
        ) : (
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {peers.map((p) => {
              const on = selected.includes(p.handle);
              return (
                <button
                  key={p.handle}
                  type="button"
                  onClick={() => toggle(p.handle)}
                  aria-pressed={on}
                  className="w-full flex items-center gap-3 text-left p-2.5 rounded-2xl border-2 border-border-ink bg-surface hover:bg-surface-hover transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-outfit bg-surface-secondary text-text-muted shrink-0">
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text-heading truncate">{p.name}</span>
                    <span className="block text-xs font-mono text-text-muted truncate">
                      {p.handle}
                      {!p.loaded && " · loading"}
                    </span>
                  </span>
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                      on ? "bg-primary border-border-ink text-primary-foreground" : "border-border-ink text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className={`text-xs font-semibold ${TONE_BADGE.red} px-1`}>
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary hover:brightness-110 text-primary-foreground text-sm font-bold px-4 py-3 transition-colors"
          >
            {existing ? "Save group" : "Create group"}
          </button>
          {existing && onOpenGrid && (
            <button
              type="button"
              onClick={() => onOpenGrid(existing.id)}
              title="Open this group's grid"
              aria-label="Open this group's grid"
              className="p-3 rounded-2xl border-2 border-border-ink text-text-muted hover:bg-surface-hover transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="p-3 rounded-2xl border-2 border-border-ink text-text-muted hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export type { GroupSummary };
