"use client";

import { plainErrorMessage } from "@/lib/plainError";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { officialOdDataAtom } from "@/store";
import { Skeleton } from "@amazecontinuityprojects/amazeui";
import { RefreshCw } from "lucide-react";
import { syncEngine } from "@/lib/sync-engine";
import { storage } from "@/lib/storage";
import { DEMO_OFFICIAL_OD, getOfficialOd } from "@/lib/officialOd";
import { formatSemesterName } from "@/lib/formatSemesterName";
import type { OfficialOdResponse } from "@/types/data/od";
import SelectField from "../shared/primitives/SelectField";

interface Props {
  currSemesterID: string;
  allGradesData?: any;
}

export default function OfficialOdSection({ currSemesterID, allGradesData }: Props) {
  const [engineOd] = useAtom(officialOdDataAtom);
  const [demoMode] = useState(() => {
    try {
      return storage.demoMode.get();
    } catch {
      return false;
    }
  });
  const [semesterId, setSemesterId] = useState(currSemesterID);
  const [otherSemData, setOtherSemData] = useState<Record<string, OfficialOdResponse>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semesterOptions = useMemo(() => {
    const ids = new Set<string>();
    if (currSemesterID) ids.add(currSemesterID);
    const grades = allGradesData?.grades;
    if (grades && typeof grades === "object") {
      Object.keys(grades).forEach((k) => {
        if (!k || k === "Current" || k === "curriculum" || k === "effectiveGrades") return;
        ids.add(k);
      });
    }
    return Array.from(ids)
      .sort((a, b) => b.localeCompare(a))
      .map((id) => ({
        value: id,
        label: id === currSemesterID ? `${formatSemesterName(id)} (Current)` : formatSemesterName(id),
      }));
  }, [currSemesterID, allGradesData]);

  useEffect(() => {
    setSemesterId(currSemesterID);
  }, [currSemesterID]);

  // Resolve display data: engine atom (current sem) -> other-sem cache -> local storage
  const data: OfficialOdResponse | null = useMemo(() => {
    if (demoMode) return { ...DEMO_OFFICIAL_OD, semesterId };
    if (engineOd && engineOd.semesterId === semesterId) return engineOd;
    if (otherSemData[semesterId]) return otherSemData[semesterId];
    return getOfficialOd(semesterId);
  }, [demoMode, engineOd, otherSemData, semesterId]);

  const fetchViaEngine = useCallback(
    async (sem: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await syncEngine.sync<OfficialOdResponse | null>("officialOd", { semesterId: sem });
        if (result && result.semesterId !== currSemesterID) {
          setOtherSemData((prev) => ({ ...prev, [sem]: result }));
        }
        if (!result) {
          const fallback = getOfficialOd(sem);
          if (!fallback) setError("No official OD records found for this semester");
        }
      } catch (err: any) {
        if (!getOfficialOd(sem)) setError(plainErrorMessage(err, "Couldn't load official OD records."));
      } finally {
        setLoading(false);
      }
    },
    [currSemesterID],
  );

  // Lazy-fill semesters the engine hasn't synced yet (e.g. past semesters)
  useEffect(() => {
    if (demoMode) return;
    if (data || loading) return;
    fetchViaEngine(semesterId);
  }, [semesterId, demoMode, data, loading, fetchViaEngine]);

  const refresh = () => {
    if (demoMode) return;
    fetchViaEngine(semesterId);
  };

  return (
    <section className="brutal-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b-2 border-border-ink p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold uppercase text-text-heading">Official OD records</h2>
            <p className="mt-1 text-sm text-text-muted">Straight from VTOP: why each on-duty was granted.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {data && (
              <span className="rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase text-secondary-foreground">
                {data.totalCount} {data.totalCount === 1 ? "record" : "records"}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              title="Refresh from VTOP"
              aria-label="Refresh official OD records from VTOP"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden />
            </button>
          </div>
        </div>
        {semesterOptions.length > 1 && (
          <div className="max-w-xs">
            <SelectField
              value={semesterId}
              onChange={(val) => setSemesterId(val)}
              options={semesterOptions}
              stacked
              searchable
              role="group"
              aria-label="Semester"
            />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {loading && !data && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-[10px] border-2 border-border-ink bg-coral p-3 text-sm font-semibold text-obsidian"
          >
            {error}
          </p>
        )}
        {!loading && !error && data && data.records.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">No official OD records for this semester.</p>
        )}
        {!loading && !error && data && data.records.length > 0 && (
          <div className="space-y-3">
            {data.records.map((r) => (
              <div key={r.slNo} className="rounded-[12px] border-2 border-border-ink bg-surface-secondary p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-heading">{r.reason}</p>
                    <p className="mt-1 break-words text-sm text-text-muted">{r.remarks || "No remarks"}</p>
                  </div>
                  <span className="shrink-0 rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase text-secondary-foreground">
                    #{r.slNo}
                  </span>
                </div>
                <p className="mt-2.5 font-label text-xs text-text-muted">
                  {[r.date, r.time, r.basis].filter(Boolean).join(" // ")}
                </p>
              </div>
            ))}
            {data.note && <p className="text-xs text-text-muted leading-relaxed pt-1">{data.note}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
