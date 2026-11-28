"use client";

import { TONE_BADGE } from "@/lib/uiTokens";
import BrandLogo from "./shared/BrandLogo";

import React from "react";
import { ExternalLink, Bus, BookOpen, FileText, GraduationCap, MapPin, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";

const iconMap: Record<string, React.ReactNode> = {
  Bus: <Bus className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  MapPin: <MapPin className="w-4 h-4" />,
  CalendarDays: <CalendarDays className="w-4 h-4" />,
  ExternalLink: <ExternalLink className="w-4 h-4" />,
};

interface Resource {
  id: number;
  title: string;
  description: string;
  url: string;
  icon: string;
  type?: string;
  content?: string;
}

interface FresherWelcomePageProps {
  onDismiss: () => void;
  username: string;
  friendlyName: string;
  eptData?: any;
  acknowledgementData?: any;
  resources?: Resource[];
}

function parseEPTDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  const d = Date.parse(dateStr.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
  if (!isNaN(d)) return new Date(d);
  return null;
}

function hasFutureExam(tables: any[]): boolean {
  if (!tables?.length) return false;
  for (const table of tables) {
    const dateKeys = (table.headers || []).filter((h: string) => /date|exam|schedule|slot|session/i.test(h));
    if (dateKeys.length === 0 && table.rows?.length) {
      for (const row of table.rows) {
        for (const val of Object.values(row || {})) {
          const dt = parseEPTDate(String(val));
          if (dt && dt > new Date()) return true;
        }
      }
    }
    for (const row of table.rows || []) {
      for (const key of dateKeys) {
        const dt = parseEPTDate(row[key]);
        if (dt && dt > new Date()) return true;
      }
    }
  }
  return false;
}

function getAckDocs(acknowledgementData: any): Array<{ documentName: string; status: string }> {
  if (!acknowledgementData) return [];
  if (Array.isArray(acknowledgementData.documents)) {
    return acknowledgementData.documents.map((d: any) => ({
      documentName: d?.documentName || d?.serialNo || "Document",
      status: d?.status || "",
    }));
  }
  // legacy table shape
  const table = acknowledgementData?.tables?.[1];
  const rows = table?.rows || [];
  const headers = table?.headers || [];
  return rows.map((row: any) => ({
    documentName: row[headers[1]] || row["Document Name"] || "",
    status: row[headers[2]] || row["Status"] || "",
  }));
}

export default function FresherWelcomePage({
  onDismiss,
  username,
  friendlyName,
  eptData,
  acknowledgementData,
  resources = [],
}: FresherWelcomePageProps) {
  const displayName = friendlyName || username || "Student";

  const ackDocs = getAckDocs(acknowledgementData);
  const totalAckDocs = ackDocs.length;
  const submittedAckDocs = ackDocs.filter((d) => /submitted|verified|accepted/i.test(d.status)).length;
  const ackProgressPct = totalAckDocs > 0 ? (submittedAckDocs / totalAckDocs) * 100 : 0;

  const upcomingEpt = eptData?.tables ? hasFutureExam(eptData.tables) : false;
  const eptMessage = eptData?.message || eptData?.messages?.warning || eptData?.messages?.success || "";
  const eptTable = eptData?.tables?.[0] || null;
  const eptHeaders: string[] = eptTable?.headers || (eptTable?.rows?.[0] ? Object.keys(eptTable.rows[0]) : []);
  const eptRows: any[] = eptTable?.rows || [];

  return (
    <div className="min-h-screen bg-background flex flex-col text-text-heading">
      <header
        className="sticky top-0 z-30 bg-surface border-b-2 border-border-ink px-4 sm:px-8 py-3 flex items-center justify-between gap-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="flex items-center gap-2.5">
          <BrandLogo variant="mark" size="md" />
          <span className="font-display text-lg font-bold leading-none text-text-heading">Fresher hub</span>
        </div>
        <button
          onClick={onDismiss}
          className="inline-flex min-h-11 items-center rounded-[10px] border-2 border-border-ink bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-sm brutal-press cursor-pointer"
        >
          Go to home
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-6">
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-secondary-foreground">
                First year
              </span>
              <h1 className="font-title text-[28px] sm:text-[36px] font-extrabold leading-[1.05] text-text-heading">
                Welcome, {displayName}
              </h1>
              <p className="text-sm text-text-muted max-w-xl">
                Your English test (EPT) schedule, the documents VIT still needs, and the portals you will use.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0 w-full sm:w-auto sm:min-w-[320px] pr-1 pb-1">
              {totalAckDocs > 0 && (
                <div className="rounded-[14px] border-2 border-border-ink bg-highlight p-3 text-highlight-foreground shadow-brutal-md">
                  <p className="font-label text-xs font-semibold opacity-80">Documents</p>
                  <p className="font-display text-[32px] font-bold leading-none mt-1">
                    {submittedAckDocs}
                    <span className="text-base">/{totalAckDocs}</span>
                  </p>
                  <p className="font-mono text-xs opacity-80 mt-1">submitted</p>
                </div>
              )}
              {eptData && (
                <div className="rounded-[14px] border-2 border-border-ink bg-surface p-3 shadow-brutal-md">
                  <p className="font-label text-xs font-semibold text-text-muted">English test</p>
                  <p className="font-display text-2xl font-bold leading-none mt-1 text-hero">
                    {upcomingEpt ? "Upcoming" : eptRows.length > 0 ? "Booked" : "Not yet"}
                  </p>
                  <p className="font-mono text-xs text-text-muted mt-1">EPT</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {eptData && (
          <section className="brutal-card p-4 sm:p-5 space-y-4 mr-1 mb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="font-label text-[13px] font-semibold text-text-heading">
                    {eptData.title || "English Proficiency Test (EPT) Schedule"}
                  </h2>
                  <p className="text-xs text-text-muted">Official venue and timing for your EPT exam</p>
                </div>
              </div>
              {upcomingEpt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning-surface text-warning-foreground text-xs font-bold border border-border-ink">
                  Upcoming exam
                </span>
              )}
            </div>

            {eptRows.length > 0 ? (
              <div className="rounded-xl border-2 border-border-ink overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-ink bg-surface-secondary">
                        {eptHeaders.map((h: string, i: number) => (
                          <th
                            key={i}
                            className="px-3.5 py-2.5 text-left font-bold text-text-muted uppercase tracking-wider text-xs"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border-muted">
                      {eptRows.map((row: any, ri: number) => (
                        <tr key={ri} className="hover:bg-surface-hover transition-colors">
                          {eptHeaders.map((h: string, ci: number) => (
                            <td key={ci} className="px-3.5 py-2.5 font-medium text-text-primary whitespace-nowrap">
                              {row?.[h] ?? row?.[String(ci)] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              eptMessage && (
                <div className="p-3 rounded-xl bg-warning-surface text-warning-foreground text-sm font-medium border border-border-ink">
                  {eptMessage}
                </div>
              )
            )}

            {eptData?.keyValuePairs && Object.keys(eptData.keyValuePairs).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {Object.entries(eptData.keyValuePairs).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-xl bg-surface-secondary border-2 border-border-ink">
                    <p className="font-label text-xs font-bold text-text-muted mb-0.5">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="text-xs font-bold text-text-heading truncate">{String(val)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {totalAckDocs > 0 && (
          <section className="brutal-card p-4 sm:p-5 space-y-4 mr-1 mb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="font-label text-[13px] font-semibold text-text-heading">
                    {acknowledgementData?.title || "Onboarding Documents Checklist"}
                  </h2>
                  <p className="text-xs text-text-muted">Track required document submissions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-success-foreground">{Math.round(ackProgressPct)}% Completed</span>
            </div>

            <div className="w-full h-3 rounded-[6px] border-2 border-border-ink bg-surface-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${ackProgressPct}%` }} />
            </div>

            {/* To-do first, then submitted, then not applicable: the list answers
                "what do I still need to hand in?" before anything else. */}
            <ul className="divide-y-2 divide-border-muted rounded-[10px] border-2 border-border-ink">
              {[...ackDocs]
                .map((doc) => {
                  const status = String(doc.status || "");
                  const kind = /submitted|verified|accepted/i.test(status)
                    ? "done"
                    : /not\s*applicable|n\/a/i.test(status)
                      ? "na"
                      : "todo";
                  return { doc, kind };
                })
                .sort((a, b) => ["todo", "done", "na"].indexOf(a.kind) - ["todo", "done", "na"].indexOf(b.kind))
                .map(({ doc, kind }, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 ${kind === "na" ? "opacity-70" : ""}`}
                  >
                    <span className="min-w-0 text-sm text-text-primary">
                      {String(doc.documentName || "").replace(/\uFFFD/g, "-")}
                    </span>
                    <span
                      className={`shrink-0 rounded-[6px] border-2 px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] ${
                        kind === "done" ? TONE_BADGE.emerald : kind === "na" ? TONE_BADGE.zinc : TONE_BADGE.amber
                      }`}
                    >
                      {kind === "done" ? "Submitted" : kind === "na" ? "Not needed" : doc.status || "To do"}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="brutal-card p-4 sm:p-5 space-y-4 mr-1 mb-1">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="font-label text-[13px] font-semibold text-text-heading">
                University Portals & Quick Links
              </h2>
              <p className="text-xs text-text-muted">Direct shortcuts to official VIT portals</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <a
              href="https://vtopcc.vit.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-20 flex-col justify-between gap-2 p-3 rounded-[10px] bg-surface border-2 border-border-ink transition-colors hover:bg-surface-secondary cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-text-heading">VTOP Student Portal</p>
                <p className="font-mono text-xs text-text-muted">vtopcc.vit.ac.in</p>
              </div>
              <span className="font-label text-xs font-semibold text-primary">Open portal</span>
            </a>
            {resources.map((r) => {
              const resourceType = r.type || "link";
              if (resourceType === "md") {
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-[10px] bg-surface-secondary border-2 border-border-ink col-span-full"
                  >
                    <h3 className="text-xs font-bold text-text-heading mb-2">{r.title}</h3>
                    <div className="text-xs text-text-muted space-y-1 leading-relaxed">
                      <ReactMarkdown>{r.content || ""}</ReactMarkdown>
                    </div>
                  </div>
                );
              }
              if (resourceType === "text") {
                return (
                  <div
                    key={r.id}
                    className="col-span-full p-4 rounded-[10px] bg-surface-secondary border-2 border-border-ink space-y-1"
                  >
                    <h3 className="text-xs font-bold text-text-heading">{r.title}</h3>
                    {r.description && <p className="text-xs text-text-muted">{r.description}</p>}
                    {r.content && <p className="text-xs text-text-muted whitespace-pre-line">{r.content}</p>}
                  </div>
                );
              }
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-20 flex-col justify-between gap-2 p-3 rounded-[10px] bg-surface border-2 border-border-ink transition-colors hover:bg-surface-secondary cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold text-text-heading line-clamp-1">{r.title}</p>
                    {r.description && <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{r.description}</p>}
                  </div>
                  <span className="font-label text-xs font-semibold text-primary">Open</span>
                </a>
              );
            })}
          </div>
        </section>

        <div className="py-4 text-center">
          <button
            onClick={onDismiss}
            className="inline-flex min-h-12 items-center rounded-[10px] border-2 border-border-ink bg-primary px-6 font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-md brutal-press cursor-pointer"
          >
            Go to home
          </button>
        </div>
      </main>
    </div>
  );
}

export { hasFutureExam, parseEPTDate, iconMap };
