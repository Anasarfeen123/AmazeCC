"use client";

import { useState, useEffect } from "react";
import { syncEngine } from "@/lib/sync-engine";
import { Skeleton } from "@amazecontinuityprojects/amazeui";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

async function getWhoami(_creds?: any): Promise<any> {
  try {
    const cached = localStorage.getItem("cache_whoami");
    if (cached) return JSON.parse(cached);
  } catch {}
  try {
    const w = (await syncEngine.sync("whoami")) as any;
    if (w && !w.error) {
      try {
        localStorage.setItem("cache_whoami", JSON.stringify(w));
      } catch {}
      return w;
    }
  } catch {}
  return null;
}

/**
 * The two read-status modals ProfilePage opens over a section: the registration
 * schedule and the bank/dayboarder submission receipts. Extracted from the
 * bottom of ProfilePage; both take their credentials as props and call `api`
 * directly, so they carry no other state from the settings shell.
 */

export function RegistrationModalContent({ creds, onClose }: { creds: any; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    syncEngine
      .sync("ffcs", {})
      .then((raw: any) => {
        const res = raw?.registrationSchedule || raw;
        const hasContent = res?.tables?.length > 0 && res.tables.some((t: any) => t.rows?.length > 0);
        setHasData(hasContent);
        if (hasContent) {
          let foundDate = "";
          let foundTime = "";

          if (res?.keyValuePairs?.date) foundDate = res.keyValuePairs.date;
          if (res?.keyValuePairs?.fromTime) {
            const to = res.keyValuePairs.toTime ? ` - ${res.keyValuePairs.toTime}` : "";
            foundTime = res.keyValuePairs.fromTime + to;
          }

          if (!foundDate || !foundTime) {
            const rows = res.tables[0].rows || [];
            const h = res.tables[0].headers?.[0] || "Registration Details";
            for (const row of rows) {
              const label = typeof row === "object" ? row[h] || "" : "";
              const val = typeof row === "object" ? row["col1"] || "" : "";
              if (!foundDate && /date/i.test(label)) foundDate = val;
              if (!foundTime && /from.?time|to.?time|time/i.test(label)) {
                foundTime = foundTime ? `${foundTime} - ${val}` : val;
              }
            }
          }

          if (!foundDate || !foundTime) {
            const firstRow = res.tables[0].rows?.[0];
            const headers = res.tables[0].headers || [];
            if (!foundDate) {
              const idx = headers.findIndex((h: string) => /date/i.test(h));
              if (idx >= 0) {
                foundDate = String(
                  typeof firstRow === "object" ? firstRow[headers[idx]] || firstRow[idx] || "" : firstRow[idx] || "",
                );
              }
            }
            if (!foundTime) {
              const idx = headers.findIndex((h: string) => /time|session/i.test(h));
              if (idx >= 0) {
                foundTime = String(
                  typeof firstRow === "object" ? firstRow[headers[idx]] || firstRow[idx] || "" : firstRow[idx] || "",
                );
              }
            }
          }

          setDate(foundDate);
          setTime(foundTime);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [creds]);

  const handleMarkRead = () => {
    localStorage.setItem("_reg_update_read", Date.now().toString());
    onClose();
  };

  if (loading) return <Skeleton className="h-20 w-full rounded-xl" />;

  if (error || !hasData) {
    return (
      <div className="flex flex-col items-center text-center py-4 space-y-3">
        <div className="p-3 rounded-full bg-warning-surface">
          <Clock className="w-8 h-8 text-warning-foreground" />
        </div>
        <p className="text-sm text-text-muted">No registration schedule available</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-surface-secondary text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-4 space-y-4">
      <div className="p-4 rounded-full bg-secondary">
        <Clock className="w-10 h-10 text-primary" />
      </div>
      <div>
        <p className="text-lg font-bold text-text-heading font-outfit">Registration Scheduled</p>
        <p className="text-sm text-text-muted mt-1">
          {date && <span>Date: {date}</span>}
          {date && time && <span>{" • "}</span>}
          {time && <span>Time: {time}</span>}
          {!date && !time && <span>Your registration is available</span>}
        </p>
      </div>
      <button
        onClick={handleMarkRead}
        className="px-5 py-2.5 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-sm font-semibold transition-colors cursor-pointer"
      >
        Mark as Read
      </button>
    </div>
  );
}

function hasWhoamiBank(bank: any) {
  return !!(
    bank?.name ||
    bank?.branch ||
    bank?.address ||
    (Array.isArray(bank?.fields) && bank.fields.some((f: any) => f?.value && String(f.value).trim()))
  );
}

function hasWhoamiDayboarder(day: any) {
  return !!(
    day?.fields && Object.values(day.fields).some((f: any) => (f as any)?.value && String((f as any).value).trim())
  );
}

export function BankDayStatusModal({ endpoint, title, creds }: { endpoint: string; title: string; creds: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (endpoint === "bank-info" || endpoint === "dayboarder") {
          const w = await getWhoami(creds);
          if (!cancelled) setData(w);
          return;
        }
        // Other endpoints must be fetched via sync ops; no direct UI API calls.
        if (!cancelled) setData(null);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creds, endpoint]);

  if (loading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  let hasContent = false;
  let details: Array<{ label: string; value: string }> = [];
  if (endpoint === "bank-info") {
    const bank = data?.bank;
    hasContent = hasWhoamiBank(bank);
    if (hasContent) {
      if (bank.name) details.push({ label: "Bank", value: String(bank.name) });
      if (bank.branch) details.push({ label: "Branch", value: String(bank.branch) });
      if (bank.address) details.push({ label: "Address", value: String(bank.address) });
      if (Array.isArray(bank.fields)) {
        for (const f of bank.fields)
          if (f?.label && f?.value) details.push({ label: String(f.label), value: String(f.value) });
      }
    }
  } else if (endpoint === "dayboarder") {
    const day = data?.dayboarder;
    hasContent = hasWhoamiDayboarder(day);
    if (hasContent && day?.fields) {
      for (const v of Object.values(day.fields) as any[]) {
        if (v?.label && v?.value) details.push({ label: String(v.label), value: String(v.selectedText || v.value) });
      }
    }
  } else {
    hasContent = data?.tables?.length > 0 || (data?.keyValuePairs && Object.keys(data.keyValuePairs).length > 0);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-4 rounded-xl">
        {hasContent ? (
          <>
            <div className="p-3 rounded-full bg-emerald-100 text-success-foreground">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-success-foreground text-lg">{title} Filled</p>
              <p className="text-sm text-success-foreground">
                Your {title.toLowerCase()} has been submitted successfully
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-surface-secondary text-text-muted">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-lg">{title} Not Filled</p>
              <p className="text-sm text-text-muted">No {title.toLowerCase()} found in the system</p>
            </div>
          </>
        )}
      </div>
      {details.length > 0 && (
        <div className="rounded-xl border-2 border-border-ink divide-y divide-border-muted dark:divide-border-muted overflow-hidden">
          {details.map((d, i) => (
            <div key={i} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
              <span className="text-text-muted shrink-0">{d.label}</span>
              <span className="text-text-heading font-medium text-right break-words">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
