"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarRange,
  ChevronRight,
  FlaskConical,
  Gauge,
  GraduationCap,
  Info,
  Layers,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@amazecontinuityprojects/amazeui";
import {
  ChipTabs,
  EmptyPanel,
  IconButton,
  InsightCarousel,
  KeyValue,
  ListRowText,
  ListShell,
  ListSkeleton,
  MiniBar,
  PageShell,
  SectionHeader,
  StatTile,
  SubpageScreen,
  ToneBadge,
  useCarousel,
  useSubpageStack,
  type InsightSlide,
} from "../shared/primitives";
import { LIST_ROW, TILE_CARD } from "@/lib/uiTokens";
import {
  averageByType,
  bestTerm,
  componentScore,
  creditWeightedTotal,
  cumulativeGpa,
  embeddedSegments,
  gradeDistribution,
  gradePoints,
  groupAssessmentsByType,
  isEmbeddedCourse,
  latestSemester,
  segmentBlend,
  semesterRows,
  toneForGrade,
  weightedTotal,
  weightedTotalDiffers,
  type SemesterRow,
} from "@/lib/gradeHistory";
import { resolveCgpa } from "@/lib/gradesEffective";
import type { GradeItem, GradeResultsMap } from "@/types/data/allgrades";

/**
 * Grade history.
 *
 * This was a hero card, a row of hand-rolled semester pills, three `recharts`
 * charts, four stat tiles and a list of expandable course cards — nine surfaces,
 * and the three charts shipped `recharts` in the first-load bundle for a screen
 * most people open a few times a term. The numbers are all still here; what
 * changed is that the trend and the semester picker became one object (the chip
 * strip), the radar became the sorted course list (which is the same data, and
 * readable), and the per-subject detail moved into a subpage where it has room
 * to be a page instead of an accordion.
 *
 * The arithmetic lives in `@/lib/gradeHistory`, not here. This file is layout
 * and tone.
 */

const SCREENS = ["overview", "insights", "course"] as const;
type Screen = (typeof SCREENS)[number];

/** A bar's hue, keyed on the same grade tones the pills use. */
const GRADE_BAR: Record<string, string> = {
  S: "bg-amber-500",
  A: "bg-emerald-500",
  B: "bg-primary",
  C: "bg-cyan-500",
  D: "bg-primary",
  E: "bg-red-500",
  F: "bg-red-600",
  N: "bg-border-muted",
  P: "bg-primary",
};

export default function MarksHistoryTab({
  data,
  marksData,
  gradesData,
  pastSemesters,
  onRefresh,
  refreshing,
  onBack,
}: {
  data: { grades?: GradeResultsMap } | null;
  marksData: any;
  /**
   * The `grades` route payload, and the CGPA's second source.
   *
   * `marksData.cgpa` used to be the only place a cumulative figure came from.
   * That breaks when a different backend answers, because `marks` is folded
   * into `attendance` on the UniCC side and is not a route it serves on its
   * own — so a UniCC-served session had no CGPA at all and this screen fell
   * back to an unweighted mean of term GPAs. `/api/grades` carries a published
   * CGPA, so it is read here too.
   */
  gradesData?: { cgpa?: unknown; effectiveGrades?: unknown } | null;
  /**
   * Frozen per-semester data from `pastDataSync`, keyed by semester id. Only
   * `marks` is read here, and only to split an embedded course into its theory
   * and lab halves - VTOP does not publish those in `all-grades`.
   */
  pastSemesters?: Record<string, { attendance?: any; marks?: any }> | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  onBack?: () => void;
}) {
  const stack = useSubpageStack<Screen>({ screens: SCREENS });
  const { screen, isRoot } = stack;

  const rows = useMemo(() => semesterRows(data?.grades), [data]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openCourse, setOpenCourse] = useState<{ item: GradeItem; semesterId: string } | null>(null);

  // The newest term with courses in it, unless the reader has picked another.
  const active: SemesterRow | undefined = useMemo(
    () => rows.find((r) => r.id === activeId) ?? latestSemester(rows),
    [rows, activeId],
  );

  // `marks` first, then `grades`, then a credit-weighted reconstruction. The
  // first two are VTOP's own figures; the third is this app rebuilding VTOP's
  // formula from the effective grades and is labelled differently for that
  // reason. See `gradesEffective.ts` for why the order matters.
  const cumulative = useMemo(() => {
    const cgpa = resolveCgpa(marksData?.cgpa, gradesData);

    // No route published a CGPA. The unweighted mean of term GPAs is still
    // worth showing — it is how the screen behaved before any of this, and it
    // is labelled as the approximation it is.
    if (!cgpa.cgpa) {
      const fallback = cumulativeGpa(rows, marksData?.cgpa);
      return {
        value: fallback.value,
        creditsEarned: fallback.creditsEarned,
        creditsRequired: Number(marksData?.cgpa?.creditsRequired ?? 0),
        source: fallback.source,
      };
    }

    return {
      value: Number(cgpa.cgpa),
      creditsEarned: Number(cgpa.creditsEarned ?? 0),
      creditsRequired: Number(marksData?.cgpa?.creditsRequired ?? 0),
      source: cgpa.source,
    };
  }, [rows, marksData, gradesData]);
  const best = useMemo(() => bestTerm(rows), [rows]);

  // Computed up here rather than beside the insights screen below, because that
  // screen is behind an early `return` and a `useMemo` after one is a
  // conditional hook — the count of hooks would change with the data.
  const allCourses = useMemo(() => rows.flatMap((r) => r.courses), [rows]);
  const distribution = useMemo(() => gradeDistribution(allCourses), [allCourses]);
  const byType = useMemo(() => averageByType(allCourses), [allCourses]);

  // The opened course, and the two halves behind it if it is embedded. Also up
  // here for the same reason as the three above: the course screen renders
  // after an early `return`, so a hook down there would be conditional.
  const opened = openCourse;
  const course = opened?.item ?? null;

  // VTOP publishes an embedded course as one blended grade with a flat
  // breakdown. The theory and lab halves are only in that term's marks
  // payload, which `pastDataSync` already caches as `frozen_marks_<semesterId>`.
  const frozenMarks = opened ? pastSemesters?.[opened.semesterId]?.marks : null;
  const segments = useMemo(
    () => embeddedSegments(course?.courseCode ?? "", frozenMarks),
    [course?.courseCode, frozenMarks],
  );
  const blend = segments ? segmentBlend(segments, course?.grandTotal) : null;

  // The published breakdown, regrouped by the "Mark Title" table each row came
  // from — theory, lab, component. The frozen legacy route strips `type`, so
  // this is null there and the flat list below stays as the fallback.
  const assessmentGroups = useMemo(() => groupAssessmentsByType(course?.details ?? null), [course?.details]);

  // VTOP's own total for the course: each component's score weighted by its
  // credits, over the total credits. Credits come from the marks halves, so a
  // course whose marks cache is missing (or which splits into components the
  // halves cannot carry) resolves to null rather than to a wrong number.
  const componentBlend = useMemo(() => {
    if (!assessmentGroups) return null;
    const oneGroup = assessmentGroups.length === 1;
    const parts = assessmentGroups.map((group) => ({
      type: group.type,
      score: componentScore(group.assessments),
      credits: oneGroup
        ? 1
        : (segments?.find((s) => s.kind.toLowerCase() === group.type.toLowerCase())?.credits ?? null),
    }));
    return creditWeightedTotal(parts);
  }, [assessmentGroups, segments]);

  // Whether the breakdown reconciles with the recorded total. With groups the
  // credit-weighted blend is the comparison that means something — the flat
  // sum is out of 100 per table, not a predictor of the grade. A multi-
  // component breakdown without credits is unknowable and shows nothing.
  const grandTotalRaw = String(course?.grandTotal ?? "").trim();
  const blendDelta = componentBlend != null && grandTotalRaw ? Math.abs(componentBlend - Number(grandTotalRaw)) : null;
  const showReconciliation =
    blendDelta != null ? blendDelta > 0.5 : assessmentGroups ? false : course ? weightedTotalDiffers(course) : false;

  const insightSlides = useMemo<InsightSlide[]>(() => {
    const out: InsightSlide[] = [];
    if (active && active.courses.length > 0) {
      out.push({
        id: "term",
        label: "This term",
        value: active.gpa > 0 ? active.gpa.toFixed(2) : "—",
        sub: `${active.label} · ${active.courses.length} courses`,
        badge: "GPA",
        privacyCategory: "cgpa",
        tone: active.gpa >= 9 ? "emerald" : active.gpa >= 8 ? "indigo" : "amber",
      });
    }
    if (best) {
      out.push({
        id: "best",
        label: "Best term",
        value: best.gpa.toFixed(2),
        sub: best.label,
        badge: "Peak",
        privacyCategory: "cgpa",
        tone: "emerald",
      });
    }
    out.push({
      id: "terms",
      label: "Terms recorded",
      value: String(rows.filter((r) => r.courses.length > 0).length),
      sub: rows.length > 1 ? `across ${rows.length} published` : "so far",
      badge: "History",
      tone: "neutral",
    });
    return out;
  }, [active, best, rows]);

  const carousel = useCarousel(insightSlides.length);

  // ── Nothing to show ──────────────────────────────────────────────────
  // A payload that has not arrived yet is a different state from one that
  // arrived empty, and only the second is something to offer the reader.
  if (!data && refreshing) {
    return (
      <PageShell
        eyebrow="Academics · Grades"
        title="Grade History"
        subtitle="Every term's results in one place."
        onBack={onBack}
      >
        <ListSkeleton rows={5} leading="dot" trailing />
      </PageShell>
    );
  }

  if (rows.length === 0) {
    return (
      <PageShell
        eyebrow="Academics · Grades"
        title="Grade History"
        subtitle="Every term's results in one place."
        onBack={onBack}
        selectable
      >
        <EmptyPanel
          icon={<GraduationCap className="h-7 w-7" />}
          title="No grades yet"
          description="Pull your grades from VTOP and every term's GPA, letter grades and assessment breakdowns will collect here."
          action={
            onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:brightness-110"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Sync grades
              </button>
            ) : null
          }
        />
      </PageShell>
    );
  }

  // ── Hero: cumulative CGPA + a rotating read on where the standing is ──
  const hero = (
    <div className="summary-row grid grid-cols-2 gap-3 sm:gap-4">
      <StatTile
        label="CGPA"
        value={cumulative.value > 0 ? cumulative.value.toFixed(2) : "—"}
        badge={
          cumulative.creditsRequired > 0
            ? `${cumulative.creditsEarned.toFixed(0)}/${cumulative.creditsRequired.toFixed(0)} cr`
            : undefined
        }
        privacyCategory="cgpa"
        height="min-h-32 sm:min-h-36"
        // Only VTOP's own figure may be presented as the CGPA; the other two
        // are this app's arithmetic, and the reader should know which it is.
        sub={
          cumulative.source === "marks" || cumulative.source === "grades"
            ? "From VTOP, credit-weighted"
            : cumulative.source === "derived"
              ? "Worked out from your grades"
              : "Average of terms (not weighted)"
        }
      />

      <InsightCarousel slides={insightSlides} carousel={carousel} height="min-h-32 sm:min-h-36" />
    </div>
  );

  // ── Overview ──────────────────────────────────────────────────────────
  const overview = (
    <div className="space-y-6">
      {hero}

      <div className="space-y-3">
        <SectionHeader icon={BookOpen} title="Courses" count={active?.courses.length} />
        {rows.length > 1 && (
          <ChipTabs
            size="sm"
            options={rows.map((r) => ({ value: r.id, label: r.label }))}
            value={active?.id ?? ""}
            onChange={setActiveId}
          />
        )}

        {!active || active.courses.length === 0 ? (
          <EmptyPanel
            variant="dashed"
            title="No courses for this term"
            description="VTOP has not published a course list for this semester yet."
          />
        ) : (
          <ListShell>
            {sortByGrade(active.courses).map((c, i) => (
              <CourseRow
                key={`${c.courseCode}-${i}`}
                course={c}
                onOpen={() => {
                  setOpenCourse({ item: c, semesterId: active.id });
                  stack.go("course");
                }}
              />
            ))}
          </ListShell>
        )}
      </div>

      {/* The trend, below the list. Reading it is a deliberate act; deciding
          which term to look at is not, so it does not sit above the courses. */}
      <div className="space-y-3">
        <SectionHeader icon={TrendingUp} title="Across terms" count={rows.length} />
        <ListShell>
          {rows.map((r) => {
            const isActive = r.id === active?.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                aria-pressed={isActive}
                className={cn(`${LIST_ROW} cursor-pointer`, isActive && "bg-surface-secondary")}
              >
                <span
                  className={cn(
                    "w-24 shrink-0 text-xs font-bold truncate",
                    isActive ? "text-text-heading" : "text-text-muted",
                  )}
                >
                  {r.label}
                </span>
                <span className="min-w-0 flex-1">
                  <MiniBar pct={(r.gpa / 10) * 100} tone={gpaBarTone(r.gpa)} />
                </span>
                <span
                  data-private="cgpa"
                  className="shrink-0 font-mono text-sm font-bold tracking-tight leading-none w-12 text-right text-text-heading"
                >
                  {r.gpa > 0 ? r.gpa.toFixed(2) : "—"}
                </span>
              </button>
            );
          })}
        </ListShell>
      </div>

      <button
        type="button"
        onClick={() => stack.go("insights")}
        className={`${TILE_CARD} w-full flex items-center gap-3 text-left cursor-pointer hover:border-border-strong dark:hover:border-border transition-colors`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border-ink bg-secondary text-secondary-foreground">
          <BarChart3 className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-text-heading font-outfit tracking-tight">Grade insights</span>
          <span className="block text-xs text-text-secondary dark:text-text-muted font-medium mt-0.5 truncate">
            Grade distribution, theory against lab, and score by term
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
      </button>
    </div>
  );

  // ── Insights ──────────────────────────────────────────────────────────
  const insights = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatTile
          label="Terms recorded"
          value={rows.filter((r) => r.courses.length > 0).length}
          badge="All time"
          tone="indigo"
          sub={rows.length > 1 ? `${rows.length} terms published` : "so far"}
        />
        <StatTile
          label="Best term"
          value={best ? best.gpa.toFixed(2) : "—"}
          badge={best?.label}
          tone="emerald"
          sub={best ? "highest GPA on record" : "no GPA published yet"}
        />
      </div>

      <div className="space-y-3">
        <SectionHeader icon={Award} title="Grade distribution" count={distribution.reduce((s, r) => s + r.count, 0)} />
        <p className="px-1 -mt-1 text-xs leading-relaxed text-text-muted font-medium">
          Every graded course across all terms. Ungraded results are left out of the share entirely, so a term you have
          not been assessed on yet cannot distort it.
        </p>
        {distribution.length === 0 ? (
          <EmptyPanel variant="dashed" title="No letter grades published yet" />
        ) : (
          <ListShell>
            {distribution.map((d) => (
              <div key={d.grade} className={LIST_ROW}>
                <span className="w-14 shrink-0">
                  <ToneBadge tone={d.tone}>{d.grade}</ToneBadge>
                </span>
                <span className="min-w-0 flex-1">
                  <MiniBar pct={d.share} tone={GRADE_BAR[d.grade] ?? "bg-border-muted"} />
                </span>
                <span className="shrink-0 text-sm font-bold font-outfit text-text-primary w-10 text-right">
                  {d.count}
                </span>
                <span className="shrink-0 text-xs font-bold text-text-muted w-12 text-right">
                  {d.share.toFixed(0)}%
                </span>
              </div>
            ))}
          </ListShell>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader icon={Gauge} title="Theory against lab" count={byType.length} />
        <p className="px-1 -mt-1 text-xs leading-relaxed text-text-muted font-medium">
          An embedded course is published as two entries under one code, so averaging everything together hides whether
          it is your labs dragging the number.
        </p>
        {byType.length === 0 ? (
          <EmptyPanel variant="dashed" title="No scored courses to compare" />
        ) : (
          <ListShell>
            {byType.map((t) => (
              <div key={t.type} className={LIST_ROW}>
                <ListRowText title={t.type} subtitle={`${t.count} course${t.count === 1 ? "" : "s"}`} />
                <span className="w-20 shrink-0">
                  <MiniBar
                    pct={t.avg}
                    tone={t.avg >= 80 ? "bg-emerald-500" : t.avg >= 65 ? "bg-amber-500" : "bg-red-500"}
                  />
                </span>
                <span className="shrink-0 text-sm font-bold font-outfit text-text-primary w-12 text-right">
                  {t.avg.toFixed(1)}%
                </span>
              </div>
            ))}
          </ListShell>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader icon={CalendarRange} title="Score by term" count={rows.length} />
        <ListShell>
          {rows.map((r) => (
            <div key={r.id} className={LIST_ROW}>
              <span className="w-24 shrink-0 text-xs font-bold text-text-muted truncate">{r.label}</span>
              <span className="min-w-0 flex-1">
                <MiniBar
                  pct={r.avgScore}
                  tone={r.avgScore >= 80 ? "bg-emerald-500" : r.avgScore >= 65 ? "bg-amber-500" : "bg-red-500"}
                />
              </span>
              <span className="shrink-0 text-sm font-bold font-outfit text-text-primary w-12 text-right">
                {r.scored.length > 0 ? `${r.avgScore.toFixed(1)}%` : "—"}
              </span>
            </div>
          ))}
        </ListShell>
      </div>
    </div>
  );

  // ── One course's grade, in full ───────────────────────────────────────
  const courseScreen = !course ? null : (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatTile
          label="Overall"
          value={`${numOrDash(course.grandTotal)}%`}
          badge={course.courseType}
          tone="neutral"
          sub="as recorded by VTOP"
        />
        <StatTile
          label="Grade"
          value={course.grade || "—"}
          badge={pointsLabel(course.grade)}
          tone={toneForGrade(course.grade)}
          sub={`${course.details?.length ?? 0} assessment${(course.details?.length ?? 0) === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <KeyValue label="Course" value={course.courseCode} />
        <KeyValue label="Type" value={course.courseType || "—"} />
      </div>

      {/* The halves, when the term's marks are cached. */}
      {isEmbeddedCourse(course) && segments && (
        <div className="space-y-3">
          <SectionHeader icon={Layers} title="Theory and lab" count={segments.length} />
          <p className="px-1 -mt-1 text-xs leading-relaxed text-text-muted font-medium">
            VTOP records an embedded course as a single blended grade. These are the two halves it blends, each scored
            out of 100 on its own.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {segments.map((s) => (
              <StatTile
                key={s.kind}
                label={s.kind}
                value={s.score == null ? "—" : `${s.score.toFixed(1)}%`}
                badge={s.credits == null ? undefined : `${s.credits} cr`}
                tone="neutral"
                sub={`${s.assessments.length} assessment${s.assessments.length === 1 ? "" : "s"}`}
              />
            ))}
          </div>

          {blend && (
            <p className="px-1 flex items-start gap-2 text-xs leading-relaxed text-text-muted font-medium">
              <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
              Weighted by {blend.theoryCredits} and {blend.labCredits} credits, the halves come to{" "}
              <span className="font-bold text-text-muted">{blend.blended.toFixed(2)}</span>, against the{" "}
              {blend.published} VTOP recorded.
            </p>
          )}

          {segments.map((s) => (
            <div key={s.kind} className="space-y-2">
              <SectionHeader
                icon={s.kind === "Theory" ? BookOpen : FlaskConical}
                title={`${s.kind} assessments`}
                count={s.assessments.length}
              />
              {s.assessments.length === 0 ? (
                <EmptyPanel variant="dashed" title={`No ${s.kind.toLowerCase()} assessments published`} />
              ) : (
                <ListShell>
                  {s.assessments.map((a, i) => (
                    <div key={`${a.title}-${i}`} className="flex items-center gap-3 py-2.5 px-4">
                      <ListRowText title={a.title} subtitle={`${a.weightagePercent || "-"}% weightage`} />
                      <span className="shrink-0 text-sm font-bold font-outfit text-text-primary">
                        {a.scoredMark || "-"}
                        <span className="text-xs font-medium text-text-muted ml-0.5">/{a.maxMark || "-"}</span>
                      </span>
                    </div>
                  ))}
                </ListShell>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Embedded with no cached halves: say so rather than show a flat list the
          reader will read as the whole story. */}
      {isEmbeddedCourse(course) && !segments && (
        <p className="px-1 flex items-start gap-2 text-xs leading-relaxed text-text-muted font-medium">
          <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
          VTOP records embedded courses as one blended grade, so the theory and lab halves are not part of the published
          record. Refresh to pull this term&apos;s marks and split them.
        </p>
      )}

      <div className="space-y-3">
        <SectionHeader
          icon={Award}
          title={isEmbeddedCourse(course) && segments ? "Published breakdown" : "Assessments"}
          count={course.details?.length ?? 0}
        />
        {!course.details || course.details.length === 0 ? (
          <EmptyPanel
            variant="dashed"
            title="No assessment breakdown"
            description="VTOP published a final grade for this course without the per-assessment marks behind it."
          />
        ) : assessmentGroups ? (
          // VTOP publishes each segment (theory, lab, component) as its own
          // table; the AmazeCC route tags every row with the table it came
          // from. Read the split the way VTOP records it.
          <div className="space-y-4">
            {assessmentGroups.map((group) => {
              const lower = group.type.toLowerCase();
              const icon = /theory/.test(lower) ? BookOpen : /lab/.test(lower) ? FlaskConical : Layers;
              return (
                <div key={group.type} className="space-y-2">
                  <SectionHeader icon={icon} title={`${group.type} assessments`} count={group.assessments.length} />
                  <ListShell>
                    {group.assessments.map((d, i) => (
                      <AssessmentRow key={`${d.component}-${i}`} item={d} />
                    ))}
                  </ListShell>
                </div>
              );
            })}
          </div>
        ) : (
          <ListShell>
            {byWeightage(course.details).map((d, i) => (
              <AssessmentRow key={`${d.component}-${i}`} item={d} />
            ))}
          </ListShell>
        )}

        {/* The assessments sum to a number, and that number is not always the
            one VTOP recorded. Saying so beats a reader adding up the column and
            concluding the app is wrong. */}
        {showReconciliation && course && (
          <p className="px-1 flex items-start gap-2 text-xs leading-relaxed text-warning-foreground font-medium">
            <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
            {componentBlend != null ? (
              <>
                The breakdown&apos;s components blend to <span className="font-bold">{componentBlend.toFixed(2)}%</span>{" "}
                credit-weighted, while VTOP records {numOrDash(course.grandTotal)}%. The recorded total is shown here.
              </>
            ) : (
              <>
                The weightage above sums to {weightedTotal(course.details)?.toFixed(2)}, while VTOP records{" "}
                {numOrDash(course.grandTotal)}%. The recorded total is shown here.
              </>
            )}
          </p>
        )}
      </div>

      {course.range && (
        <div className="space-y-3">
          <SectionHeader icon={GraduationCap} title="Grade scale" count={Object.keys(course.range).length} />
          <ListShell>
            {Object.entries(course.range).map(([grade, rangeStr]) => (
              <div key={grade} className={LIST_ROW}>
                <span className="w-14 shrink-0">
                  <ToneBadge tone={toneForGrade(grade)}>{grade}</ToneBadge>
                </span>
                <span className="text-xs font-bold text-text-muted truncate">{String(rangeStr)}</span>
                {String(grade).toUpperCase() === String(course.grade ?? "").toUpperCase() && (
                  <ToneBadge tone="indigo" className="ml-auto">
                    Yours
                  </ToneBadge>
                )}
              </div>
            ))}
          </ListShell>
        </div>
      )}
    </div>
  );

  // ── Chrome ────────────────────────────────────────────────────────────
  // One shell for all three screens, so the header is described once and a
  // drill-down is genuinely a subpage. Back returns to the overview rather than
  // stepping through insights: neither is a child of the other, which is the
  // same reason `CurriculumPage` calls `reset()` here.
  const title =
    screen === "insights" ? "Grade Insights" : screen === "course" ? (course?.courseCode ?? "Course") : "Grade History";
  const subtitle =
    screen === "insights"
      ? "How your grades are spread, across every term."
      : screen === "course"
        ? course?.courseTitle
        : "Every term's results in one place.";

  return (
    <PageShell
      syncedOps={["all-grades"]}
      eyebrow="Academics · Grades"
      title={title}
      subtitle={subtitle}
      wrap
      selectable
      onBack={isRoot ? onBack : stack.reset}
      actions={
        screen === "overview" && onRefresh ? (
          <IconButton onClick={onRefresh} title="Sync grades" disabled={refreshing}>
            <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </IconButton>
        ) : null
      }
    >
      {screen === "overview" && <SubpageScreen id="overview">{overview}</SubpageScreen>}
      {screen === "insights" && <SubpageScreen id="insights">{insights}</SubpageScreen>}
      {screen === "course" && course && (
        // Keyed on the course, not the screen, so opening a different subject
        // re-runs the enter animation rather than swapping content in place.
        <SubpageScreen id={`course:${course.courseCode}`}>{courseScreen}</SubpageScreen>
      )}
    </PageShell>
  );
}

// ── Local bits ───────────────────────────────────────────────────────────

function numOrDash(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "—";
}

/** Brand fills, same in every theme: mint 9+, ochre 8+, coral below. */
function gpaBarTone(gpa: number): string {
  if (gpa <= 0) return "bg-surface-tertiary";
  if (gpa >= 9) return "bg-mint";
  if (gpa >= 8) return "bg-ochre";
  return "bg-coral";
}

function pointsLabel(grade: string | undefined): string {
  const p = gradePoints(grade);
  if (p === null) return "—";
  return `${p} / 10`;
}

/**
 * Best grade first, unscored courses last.
 *
 * The old page listed courses in whatever order VTOP sent them. Sorting by points
 * answers the question a student opens a grade list to ask — where am I weakest
 * — without a control, and it is what makes the radar chart redundant.
 */
function sortByGrade(courses: GradeItem[]): GradeItem[] {
  return [...courses].sort((a, b) => {
    const pa = gradePoints(a.grade) ?? -1;
    const pb = gradePoints(b.grade) ?? -1;
    if (pa !== pb) return pb - pa;
    return Number(a.grandTotal || 0) - Number(b.grandTotal || 0);
  });
}

/**
 * Heaviest assessment first.
 *
 * This is the fallback for the flat list — used when no row carries a `type`
 * (the frozen legacy route behind api.uni-cc.site strips it). When it does, the
 * breakdown renders grouped by VTOP's Mark Title table instead — see
 * `groupAssessmentsByType` in `lib/gradeHistory.ts`.
 */
function byWeightage(details: NonNullable<GradeItem["details"]>) {
  return [...details].sort((a, b) => (Number(b.weightagePercent) || 0) - (Number(a.weightagePercent) || 0));
}

/** One published assessment — the row both the flat list and the grouped split render. */
function AssessmentRow({ item }: { item: NonNullable<GradeItem["details"]>[number] }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4">
      <ListRowText title={item.component} subtitle={`${item.weightagePercent ?? "-"}% weightage`} />
      <span className="shrink-0 text-sm font-bold font-outfit text-text-primary">
        {item.scoredMark ?? "-"}
        <span className="text-xs font-medium text-text-muted ml-0.5">/{item.maxMark ?? "-"}</span>
      </span>
    </div>
  );
}

/** One course, as a row that opens its own subpage. */
function CourseRow({ course, onOpen }: { course: GradeItem; onOpen: () => void }) {
  const embedded = isEmbeddedCourse(course);
  return (
    <button type="button" onClick={onOpen} className={`${LIST_ROW} cursor-pointer`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border-muted bg-surface-secondary text-text-muted">
        {embedded ? <Layers className="h-4.5 w-4.5" /> : <GraduationCap className="h-4.5 w-4.5" />}
      </span>
      <ListRowText title={course.courseCode} subtitle={course.courseTitle} titleTooltip={course.courseTitle} />
      {embedded && (
        /* The published number blends both halves, so a reader comparing it to
           their own marks needs to know that before they wonder why the
           subpage has two scores in it. */
        <span className="hidden shrink-0 rounded-[6px] bg-secondary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary sm:inline dark:text-primary">
          T+L
        </span>
      )}
      <span className="shrink-0 text-xs font-bold text-text-muted w-12 text-right">
        {numOrDash(course.grandTotal)}%
      </span>
      <ToneBadge tone={toneForGrade(course.grade)}>{course.grade || "—"}</ToneBadge>
      <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
    </button>
  );
}
