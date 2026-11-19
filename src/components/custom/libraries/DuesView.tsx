"use client";

import { plainErrorMessage } from "@/lib/plainError";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Receipt, RefreshCcw, TriangleAlert } from "lucide-react";
import { api } from "@/lib/sync-engine";
import { runPageSync } from "@/lib/sync-engine/single-sync";
import { setTypedStorageItem, storage } from "@/lib/storage";
import { DEMO_DUES } from "@/lib/libraries/demo";
import { num, type LibraryDueResponse, type PatronTable } from "@/lib/libraries/koha";
import { EMPTY_STATE, LIST_ROW, LIST_SHELL, SECTION_CHIP, TONE_BADGE } from "@/lib/libraries/ui";
import { ListSkeleton } from "../shared/primitives";

interface DuesViewProps {
  creds: { cookies: string[]; authorizedID: string; csrf: string } | null;
  isDemo?: boolean;
  refreshKey?: number;
  onTotals?: (outstanding: number, overdue: number) => void;
}

function renderTable(table: PatronTable, idx: number) {
  const headers = table.headers || [];
  return (
    <div key={idx} className="space-y-2">
      {table.caption && (
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">{table.caption}</p>
      )}
      <div className={LIST_SHELL}>
        {(table.rows || []).map((row, ri) => (
          <div key={ri} className={LIST_ROW}>
            {(row || []).map((cell, ci) => (
              <div key={ci} className={`min-w-0 flex-1 ${ci === 0 ? "shrink-0 basis-1/4" : ""}`}>
                {ci === 0 ? (
                  <span className="text-xs font-bold text-text-heading font-outfit truncate block">
                    {String(cell ?? "—")}
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                      {headers[ci] || ""}
                    </span>
                    <span className="text-xs font-semibold text-text-primary truncate block">
                      {String(cell ?? "—")}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DuesView({ creds, isDemo, refreshKey, onTotals }: DuesViewProps) {
  const [data, setData] = useState<LibraryDueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 250));
        setData(DEMO_DUES);
        return;
      }

      // The engine already prefetches this endpoint, so read its cache first.
      const cached = (() => {
        try {
          return storage.cache.get("library-due") as unknown as LibraryDueResponse | null;
        } catch {
          return null;
        }
      })();

      if (cached) {
        setData(cached);
        return;
      }

      if (!creds) return;
      // Single /api/finance call: fetch all finance sections and cache them.
      const res: any = await api("finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          cookies: creds.cookies,
          authorizedID: creds.authorizedID,
          csrf: creds.csrf,
          section: "all",
        },
      });
      const library = (
        res?.library && typeof res.library === "object" ? { success: true, ...res.library } : res
      ) as LibraryDueResponse;
      if ((library as any)?.success === false || (res as any)?.success === false) {
        setError((library as any)?.error || (res as any)?.error || "Could not load dues");
        return;
      }
      setData(library);
      try {
        storage.cache.set("library-due", library);
        if (res?.dues) setTypedStorageItem("payments_dues", res.dues);
        if (res?.receipts) setTypedStorageItem("payments_receipts", res.receipts);
        if (res?.wallet) setTypedStorageItem("payments_wallet", res.wallet);
        if (res?.bank) storage.cache.set("bank-info", res.bank);
      } catch {}
    } catch (e: any) {
      setError(plainErrorMessage(e, "Could not load dues."));
    } finally {
      setLoading(false);
    }
  }, [creds, isDemo]);

  const refreshDues = useCallback(async () => {
    if (isDemo) {
      await load();
      return;
    }
    // Exactly this screen's endpoint through the engine: session opens,
    // progress hits 100, sheet closes. The op refreshes the same cache key
    // `load()` reads, so state mirrors it afterwards.
    setLoading(true);
    setError(null);
    try {
      const res = await runPageSync({
        title: "Library Dues",
        steps: [{ op: "bulk", args: { only: ["library-due"] } }],
        doneLine: "Library dues reloaded successfully",
      });
      if (!res) return;
      const fresh = (() => {
        try {
          return storage.cache.get("library-due") as unknown as LibraryDueResponse | null;
        } catch {
          return null;
        }
      })();
      if (fresh) setData(fresh);
    } catch (e: any) {
      setError(plainErrorMessage(e, "Could not load dues."));
    } finally {
      setLoading(false);
    }
  }, [isDemo, load]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // Headline figures for the landing cards
  const books = data?.books || [];
  const tables = data?.tables || [];
  const outstanding = books.length ? books.reduce((s, b) => s + num(b.dueAmount), 0) : 0;
  const overdue = books.filter((b) => num(b.daysOverdue) > 0).length;
  useEffect(() => {
    onTotals?.(outstanding, overdue);
  }, [outstanding, overdue, onTotals]);

  const warning = data?.messages?.warning;
  const errorMsg = data?.messages?.error || data?.error;

  if (loading && !data) {
    return <ListSkeleton rows={3} />;
  }

  if (error && !data) {
    return (
      <div className={EMPTY_STATE}>
        <TriangleAlert className="w-7 h-7 text-danger-foreground mx-auto" />
        <p className="text-xs font-bold text-text-primary mt-2">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary text-xs font-bold text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-3 h-3" />
          Try again
        </button>
      </div>
    );
  }

  const hasContent = books.length > 0 || tables.length > 0;

  if (!hasContent) {
    return (
      <div className={EMPTY_STATE}>
        <CheckCircle2 className="w-7 h-7 text-success-foreground mx-auto" />
        <p className="text-xs font-bold text-text-primary mt-2">No dues</p>
        <p className="text-xs text-text-muted mt-1">Nothing outstanding on your library account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(warning || errorMsg) && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-start gap-2 ${
            errorMsg
              ? "bg-danger-surface border-border-ink text-danger-foreground"
              : "bg-warning-surface border-border-ink text-warning-foreground"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{errorMsg || warning}</span>
        </div>
      )}

      {/* Preferred shape: per-book dues with days overdue */}
      {books.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-text-heading font-outfit tracking-tight">Overdue books</h3>
              <span className={SECTION_CHIP}>{books.length}</span>
            </div>
            {overdue > 0 && (
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md border ${TONE_BADGE.red}`}>
                {overdue} overdue
              </span>
            )}
          </div>

          <div className={LIST_SHELL}>
            {books.map((b, i) => {
              const days = num(b.daysOverdue);
              return (
                <div key={`${b.isbn || b.title}-${i}`} className={LIST_ROW}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${days > 0 ? "bg-red-500" : "bg-emerald-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-heading truncate font-outfit leading-tight">
                      {b.title || "Untitled"}
                    </p>
                    <p className="text-xs text-text-muted font-medium mt-0.5 truncate">
                      {[b.author, b.isbn].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-outfit text-text-heading leading-tight">
                      ₹{num(b.dueAmount).toLocaleString("en-IN")}
                    </p>
                    {days > 0 && <p className="text-xs font-bold text-danger-foreground">{days}d late</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback shape: generic caption/headers/rows tables */}
      {tables.map((t, i) => renderTable(t, i))}

      <button
        type="button"
        onClick={() => {
          try {
            storage.cache.remove("library-due");
          } catch {}
          void refreshDues();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary text-xs font-bold text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
        Refresh dues
      </button>
    </div>
  );
}
