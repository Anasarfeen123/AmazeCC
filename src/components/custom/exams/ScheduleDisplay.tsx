"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { buildExamIcs, isAndroid, saveIcs, type ExamPaper } from "@/lib/ics";
import CalendarExportNote from "../shared/CalendarExportNote";
import { AnimatePresence, m } from "framer-motion";
import {
  CalendarX,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  FileDown,
  Loader2,
  Printer,
  RefreshCcw,
  CalendarPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { downloadExamSchedulePdf } from "@/lib/exportTimetable";
import { generateExamScheduleHtml } from "@/lib/exportTimetableHtml";
import { downloadHtmlImage } from "@/lib/imageDownload";
import BottomSheet from "../shared/BottomSheet";
import {
  buildExamRows,
  nextExamLabel,
  prettyDate,
  seatLabel,
  seriesTone,
  shortDate,
  type ExamRow,
} from "@/lib/examSchedule";
import {
  PageShell,
  IconButton,
  GhostButton,
  SegmentedControl,
  SectionHeader,
  StatTile,
  ListShell,
  ToneBadge,
  ToneDot,
  EmptyPanel,
} from "../shared/primitives";

const ALL_TYPES = "__all__";
/** Sentinel: every row expanded — used for PNG/print capture. */
const EXPAND_ALL = "__all_rows__";

export default function ExamSchedule({ data, handleScheduleFetch, onBack }: any) {
  const scheduleObj = data?.Schedule || data?.schedule;
  const semester = data?.semester;

  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [openPast, setOpenPast] = useState<Set<string>>(() => new Set());
  const [icsFile, setIcsFile] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedModalSeries, setSelectedModalSeries] = useState<string>(ALL_TYPES);
  const [, setCopied] = useState(false);

  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme || "light";

  const examTypes = useMemo(
    () => (scheduleObj && typeof scheduleObj === "object" ? Object.keys(scheduleObj) : []),
    [scheduleObj],
  );

  const allRows = useMemo<ExamRow[]>(() => buildExamRows(scheduleObj), [scheduleObj]);

  const visibleRows = useMemo(
    () => (typeFilter === ALL_TYPES ? allRows : allRows.filter((r) => r.examType === typeFilter)),
    [allRows, typeFilter],
  );

  const upcomingRows = useMemo(() => allRows.filter((r) => r.state !== "past"), [allRows]);
  const todayCount = useMemo(() => allRows.filter((r) => r.state === "today").length, [allRows]);
  const nextRow = upcomingRows[0] ?? null;

  const allCourseCodes = useMemo(
    () => [...new Set(allRows.map((r) => r.raw?.courseCode).filter(Boolean))] as string[],
    [allRows],
  );

  const handleCopyCodes = useCallback(async () => {
    if (allCourseCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(allCourseCodes.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [allCourseCodes]);

  const handleDownloadPdf = useCallback(
    async (seriesOverride?: string) => {
      if (!scheduleObj || allRows.length === 0) return;
      const targetSeries =
        typeof seriesOverride === "string" ? seriesOverride : typeFilter !== ALL_TYPES ? typeFilter : undefined;

      setIsDownloadingPdf(true);
      try {
        await downloadExamSchedulePdf({
          scheduleObj,
          semester,
          layout: "document",
          selectedSeries: targetSeries,
        });
      } catch (err) {
        console.error("Failed to generate and download exam schedule PDF:", err);
      } finally {
        setIsDownloadingPdf(false);
      }
    },
    [scheduleObj, allRows.length, semester, typeFilter],
  );

  const handleDownloadImage = useCallback(
    async (seriesOverride?: string) => {
      if (!scheduleObj || allRows.length === 0) return;
      const targetSeries =
        typeof seriesOverride === "string" ? seriesOverride : typeFilter !== ALL_TYPES ? typeFilter : undefined;

      setIsDownloading(true);
      try {
        const isLight = currentTheme.includes("light");
        const html = generateExamScheduleHtml({
          scheduleObj,
          semester,
          isLight,
          layout: "cards",
          selectedSeries: targetSeries,
        });
        const fileTag = targetSeries ? `_${targetSeries}` : "";
        await downloadHtmlImage(html, `Exam_Schedule${fileTag}_FFCS`, {
          format: "png",
          backgroundColor: isLight ? "#ffffff" : "#090d16",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsDownloading(false);
      }
    },
    [scheduleObj, allRows.length, currentTheme, semester, typeFilter],
  );

  const actions = (
    <>
      <IconButton onClick={handleScheduleFetch} title="Reload exam schedule">
        <RefreshCcw className="w-4 h-4" />
      </IconButton>
      {/* Every device, not only iPhone: the exams (shown series) as an .ics
          with reminders the evening before and an hour before. */}
      <IconButton
        onClick={() => {
          const series =
            typeFilter === ALL_TYPES
              ? (scheduleObj as Record<string, ExamPaper[]>)
              : { [typeFilter]: (scheduleObj as Record<string, ExamPaper[]>)[typeFilter] ?? [] };
          const file = `AmazeCC-${typeFilter === ALL_TYPES ? "exams" : typeFilter}.ics`;
          void saveIcs(file, buildExamIcs(series, { name: "AmazeCC exams" })).then((r) =>
            setIcsFile(r === "downloaded" && isAndroid() ? file : null),
          );
        }}
        title="Add exams to your calendar"
        disabled={!scheduleObj}
      >
        <CalendarPlus className="w-4 h-4" />
      </IconButton>
      <IconButton onClick={handleCopyCodes} title="Copy all course codes" disabled={allCourseCodes.length === 0}>
        <ClipboardList className="w-4 h-4" />
      </IconButton>
      {examTypes.length > 1 && (
        <IconButton
          onClick={() => {
            setSelectedModalSeries(typeFilter);
            setShowDownloadModal(true);
          }}
          title="Choose exam to download"
          disabled={isDownloading || isDownloadingPdf}
        >
          <FileDown className="w-4 h-4 text-primary" />
        </IconButton>
      )}
      <IconButton
        onClick={() => handleDownloadImage()}
        title={typeFilter !== ALL_TYPES ? `Download ${typeFilter} as PNG` : "Download as PNG"}
        disabled={isDownloading || isDownloadingPdf}
      >
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Download className="w-4 h-4" />}
      </IconButton>
      <IconButton
        onClick={() => handleDownloadPdf()}
        title={typeFilter !== ALL_TYPES ? `Download ${typeFilter} Schedule (PDF)` : "Download Exam Schedule (PDF)"}
        disabled={isDownloading || isDownloadingPdf}
      >
        {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Printer className="w-4 h-4" />}
      </IconButton>
    </>
  );

  const shellProps = {
    syncedOps: ["schedule"],
    eyebrow: "Academics",
    title: "Exam Schedule",
    subtitle: semester ? `Session ${semester}` : undefined,
    actions,
    onBack,
  };

  if (!scheduleObj || Object.keys(scheduleObj).length === 0) {
    return (
      <PageShell {...shellProps}>
        <EmptyPanel
          icon={<CalendarX className="w-7 h-7" />}
          title="No exam schedule yet"
          description="Your CAT, FAT and lab timetables appear here once they are synced from VTOP."
          action={
            <GhostButton onClick={handleScheduleFetch}>
              <RefreshCcw className="w-3.5 h-3.5" />
              Sync now
            </GhostButton>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell {...shellProps}>
      <div className="summary-row grid grid-cols-2 gap-3 sm:gap-4">
        <StatTile
          label="Next exam"
          tone={nextRow?.state === "today" ? "amber" : "emerald"}
          badge={nextRow ? (nextRow.state === "today" ? "Today" : "Next") : undefined}
          value={nextExamLabel(nextRow)}
          sub={nextRow ? `${nextRow.raw.courseCode} · ${prettyDate(nextRow.date)}` : "Nothing scheduled"}
        />
        <StatTile
          label="Exams left"
          tone="neutral"
          badge={todayCount > 0 ? `${todayCount} today` : undefined}
          value={
            <>
              {upcomingRows.length}
              <span className="text-base sm:text-lg font-bold text-text-muted ml-1">of {allRows.length}</span>
            </>
          }
          sub={`${examTypes.length} series`}
        />
      </div>

      {/* `space-y-4` is what separates the filter strip from the first series
          header, and it has to be here rather than on either child. The list
          below carries `space-y-6`, which margins every child *except the
          first* — so the topmost `SectionHeader` gets nothing — and the filter
          row has no bottom margin of its own. The two sat flush, and because
          the shell spaces `captureRef` by 1.5rem from the stat tiles, the
          filter read as part of them and the header as an overlap.

          1rem rather than the list's 1.5rem: the filter is a control strip
          governing the list underneath it, not another section of it. */}
      {icsFile ? <CalendarExportNote file={icsFile} onClose={() => setIcsFile(null)} /> : null}
      <div ref={captureRef} className="space-y-4">
        {/* ── EXAM SERIES ── */}
        {examTypes.length > 1 && (
          // Full-width filter; the total chip went (each series shows its own count).
          <div className="flex items-center justify-between gap-2">
            <SegmentedControl
              grow
              className="min-w-0 flex-1"
              options={[{ value: ALL_TYPES, label: "All" }, ...examTypes.map((t) => ({ value: t, label: t }))]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
        )}

        <div className="space-y-6 sm:space-y-7">
          {examTypes
            .filter((examType) => typeFilter === ALL_TYPES || typeFilter === examType)
            .map((examType) => {
              const subjects = (scheduleObj as Record<string, any>)[examType];
              if (!Array.isArray(subjects)) return null;
              const rows = allRows.filter((r) => r.examType === examType);
              const tone = seriesTone(examType);
              // Upcoming papers first; finished ones fold into a "3 done" row
              // (owner review: the struck-through list buried what is next).
              const upcomingRows = rows.filter((r) => r.state !== "past");
              const pastRows = rows.filter((r) => r.state === "past");
              const pastOpen = openPast.has(examType);
              const renderRow = (row: (typeof rows)[number]) => {
                const subj = row.raw;
                const isOpen = expandedKey === EXPAND_ALL || expandedKey === row.key;

                return (
                  <div key={row.key}>
                    <button
                      type="button"
                      onClick={() => setExpandedKey(isOpen && expandedKey !== EXPAND_ALL ? null : row.key)}
                      className="w-full relative py-3.5 px-4 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      {row.state === "past" ? (
                        /* A tick reads faster than a faint dot for finished papers. */
                        <Check className="w-4 h-4 text-text-muted shrink-0" strokeWidth={2.5} />
                      ) : (
                        <ToneDot tone={row.state === "today" ? "amber" : "emerald"} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-bold truncate font-outfit leading-tight ${
                            row.state === "past" ? "text-text-muted line-through" : "text-text-heading"
                          }`}
                        >
                          {subj.courseTitle || subj.courseCode}
                        </p>
                        <p className="text-xs text-text-muted font-medium mt-1 truncate">
                          {subj.courseCode} · {shortDate(row.date)} · {subj.examSession || "TBA"} ·{" "}
                          {subj.venue === "-" ? "TBA" : subj.venue}
                        </p>
                      </div>
                      {/* Only "today" needs calling out — the tick and the
                                strikethrough already carry past/upcoming. */}
                      {row.state === "today" && (
                        <ToneBadge tone="amber" size="sm">
                          Today
                        </ToneBadge>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-border-ink mt-1.5">
                            <div className="grid grid-cols-2 gap-3.5">
                              {[
                                { label: "Date", value: subj.examDate || "TBA" },
                                { label: "Exam Time", value: subj.examTime || "TBA" },
                                { label: "Session", value: subj.examSession || "TBA" },
                                { label: "Reporting", value: subj.reportingTime || "TBA" },
                                { label: "Venue", value: subj.venue === "-" ? "TBA" : subj.venue || "TBA" },
                                { label: "Slot", value: subj.slot === "-" ? "TBA" : subj.slot || "TBA" },
                              ].map((field) => (
                                <div key={field.label} className="min-w-0">
                                  <p className="font-label text-xs font-bold text-text-muted">{field.label}</p>
                                  <p className="text-[12.5px] font-bold text-text-primary truncate mt-0.5">
                                    {field.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between gap-3 min-w-0 pt-1.5">
                              <p className="font-label text-xs font-bold text-text-muted shrink-0">Seat</p>
                              <p className="text-[12.5px] font-bold text-text-primary truncate">
                                Loc: {seatLabel(subj) || "TBA"} · No: {subj.seatNo || "TBA"}
                              </p>
                            </div>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              };

              return (
                <div key={examType} className="space-y-2.5">
                  <SectionHeader
                    leading={<ToneDot tone={tone} size="md" />}
                    title={examType}
                    count={rows.length}
                    right={
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {/* Per-series PDF/PNG buttons removed: the header's
                            "Choose exam to download" and the filtered PNG/PDF
                            already do this (owner: the page was cluttered). */}
                      </div>
                    }
                  />

                  <ListShell>
                    {upcomingRows.map(renderRow)}
                    {pastRows.length > 0 ? (
                      <>
                        {pastOpen ? pastRows.map(renderRow) : null}
                        <button
                          type="button"
                          aria-expanded={pastOpen}
                          onClick={() =>
                            setOpenPast((prev) => {
                              const next = new Set(prev);
                              if (next.has(examType)) next.delete(examType);
                              else next.add(examType);
                              return next;
                            })
                          }
                          className="flex w-full min-h-11 cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-text-muted transition-colors hover:bg-surface-secondary"
                        >
                          <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                          <span className="min-w-0 flex-1 font-semibold">
                            {upcomingRows.length === 0 ? `All ${pastRows.length} done` : `${pastRows.length} done`}
                          </span>
                          <span className="font-label text-sm font-semibold text-primary">
                            {pastOpen ? "Hide" : "Show"}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${pastOpen ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                      </>
                    ) : null}
                  </ListShell>
                </div>
              );
            })}
        </div>

        {visibleRows.length === 0 && (
          <EmptyPanel
            icon={<CalendarX className="w-7 h-7" />}
            title="Nothing under this filter"
            description="Try a different exam series to see the rest of your timetable."
          />
        )}
      </div>

      {showDownloadModal && (
        <BottomSheet
          onClose={() => setShowDownloadModal(false)}
          overlayId="download-exam-modal"
          maxWidth="max-w-md"
          title="Download Exam Schedule"
          subtitle="Choose an exam series and file format"
          icon={<Download className="w-5 h-5 text-primary" />}
        >
          <div className="p-4 space-y-4">
            <div>
              <label className="font-label text-xs font-bold text-text-muted block mb-2">Exam Series</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModalSeries(ALL_TYPES)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedModalSeries === ALL_TYPES
                      ? "border-border-ink bg-secondary text-secondary-foreground font-bold"
                      : "border-border-ink hover:bg-surface-hover text-text-primary"
                  }`}
                >
                  <div className="font-label text-xs text-text-muted font-bold">All Series</div>
                  <div className="text-sm font-bold mt-0.5">All Exams ({allRows.length})</div>
                </button>
                {examTypes.map((t) => {
                  const count = allRows.filter((r) => r.examType === t).length;
                  const isSel = selectedModalSeries === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedModalSeries(t)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSel
                          ? "border-border-ink bg-secondary text-secondary-foreground font-bold"
                          : "border-border-ink hover:bg-surface-hover text-text-primary"
                      }`}
                    >
                      <div className="font-label text-xs text-text-muted font-bold">Series</div>
                      <div className="text-sm font-bold mt-0.5">
                        {t} ({count})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-border-ink">
              <label className="font-label text-xs font-bold text-text-muted block mb-2">Download Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isDownloading || isDownloadingPdf}
                  onClick={async () => {
                    const target = selectedModalSeries === ALL_TYPES ? undefined : selectedModalSeries;
                    await handleDownloadPdf(target);
                    setShowDownloadModal(false);
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-sm shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  PDF (Schedule)
                </button>
                <button
                  type="button"
                  disabled={isDownloading || isDownloadingPdf}
                  onClick={async () => {
                    const target = selectedModalSeries === ALL_TYPES ? undefined : selectedModalSeries;
                    await handleDownloadImage(target);
                    setShowDownloadModal(false);
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-border-ink hover:bg-surface-hover text-text-primary font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  PNG (Image)
                </button>
              </div>
            </div>

            <p className="text-xs text-text-muted text-center pt-2">
              AmazeCC is an independent student initiative. Cross-check your schedule with official VTOP notices.
            </p>
          </div>
        </BottomSheet>
      )}
    </PageShell>
  );
}
