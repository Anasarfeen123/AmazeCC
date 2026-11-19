"use client";

import { RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@amazecontinuityprojects/amazeui";
import NoContentFound from "../NoContentFound";
import BottomSheet from "../shared/BottomSheet";
import FetchButton from "../shared/FetchButton";

const normalizeGradesCategory = (rawCategory?: string | null) => {
  let category = rawCategory?.toLowerCase().trim() || "uncategorized";

  switch (category) {
    case "fcbes":
      return "Foundation Core - Basic Engineering Sciences";
    case "fchssm":
      return "Foundation Core - Humanities, Social Sciences and Management";
    case "fcbsm":
      return "Foundation Core - Basic Sciences and Mathematics";
    case "dc":
      return "Discipline Core";
    case "de":
      return "Discipline Elective";
    case "dles":
      return "Discipline-linked Engineering Sciences";
    case "ngcr":
      return "Non-graded Core Requirement";
    case "oe":
      return "Open Elective";
    default:
      return category;
  }
};

/** One colour per grade (brand palette, ink text on all). */
function gradeTone(grade?: string): string {
  switch ((grade || "").toUpperCase()) {
    case "S":
      return "bg-mint text-obsidian";
    case "A":
      return "bg-sage text-obsidian";
    case "B":
      return "bg-ochre text-obsidian";
    case "C":
      return "bg-[#F4A259] text-obsidian";
    case "D":
    case "E":
      return "bg-coral text-obsidian";
    default:
      return "bg-surface-secondary text-text-primary";
  }
}

export default function GradesModal({ allGradesData, GradesData, onClose, handleFetchGrades, marksData, attendance }) {
  // Body scroll-lock + system back handled by BottomSheet.
  return (
    <BottomSheet onClose={onClose} overlayId="grades-breakdown" maxWidth="max-w-5xl">
      <GradesDisplay
        allGradesData={allGradesData}
        data={GradesData}
        handleFetchGrades={handleFetchGrades}
        marksData={marksData}
        attendance={attendance}
      />
    </BottomSheet>
  );
}

function GradesDisplay({ allGradesData, data, handleFetchGrades, marksData, attendance }) {
  if (!data || !marksData?.cgpa) {
    return (
      <div>
        <p className="text-center text-text-muted">
          No Grades Data Available.{" "}
          <FetchButton onClick={handleFetchGrades} icon={<RefreshCcw className="w-4 h-4" />} className="mt-2" />
        </p>
        <NoContentFound />
      </div>
    );
  }

  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const findCurriculum = () => {
    const sources = [
      allGradesData?.curriculum,
      allGradesData?.cgpa?.curriculum,
      allGradesData?.grades?.curriculum,
      allGradesData?.data?.curriculum,
      data?.curriculum,
      data?.cgpa?.curriculum,
      data?.grades?.curriculum,
      data?.data?.curriculum,
      marksData?.curriculum,
      marksData?.cgpa?.curriculum,
      marksData?.grades?.curriculum,
    ];
    for (const src of sources) {
      if (Array.isArray(src) && src.length > 0) return src;
    }
    return [];
  };

  const curriculum = findCurriculum();

  const ongoingCreditsByCategory = safeAttendance.reduce<Record<string, number>>((acc, item) => {
    let category = item.category || "Uncategorized";
    const credits = parseFloat(item.credits) || 0;
    if (category === "Foundation Core - Humanities, Social Sciences and Management (LANGUAGE Basket)") {
      category = "Foreign Language";
    } else if (category === "Foundation Core - Humanities, Social Sciences and Management (GENERAL Basket)") {
      category = "HSM Elective";
    } else if (category === "Foundation Core - Humanities, Social Sciences and Management (EXTRA CURRICULAR Basket)") {
      category = "Extra curricular activities";
    }
    acc[category] = (acc[category] || 0) + credits;

    const hssm = "Foundation Core - Humanities, Social Sciences and Management";
    const ngcr = "Non-graded Core Requirement";

    if (category === "Foreign Language" || category === "HSM Elective") {
      acc[hssm] = (acc[hssm] || 0) + credits;
    }
    if (category === "Extra curricular activities") {
      acc[ngcr] = (acc[ngcr] || 0) + credits;
    }

    return acc;
  }, {});

  const totalCredits = curriculum.find((c) => (c?.basketTitle || "").toLowerCase().includes("total credits"));

  const Curriculum = curriculum.filter((c) => !(c?.basketTitle || "").toLowerCase().includes("total credits"));
  const findEffectiveGrades = () => {
    const sources = [
      allGradesData?.effectiveGrades,
      allGradesData?.cgpa?.effectiveGrades,
      allGradesData?.grades?.effectiveGrades,
      allGradesData?.data?.effectiveGrades,
      data?.effectiveGrades,
      data?.cgpa?.effectiveGrades,
      data?.grades?.effectiveGrades,
      data?.data?.effectiveGrades,
      marksData?.effectiveGrades,
      marksData?.cgpa?.effectiveGrades,
      marksData?.grades?.effectiveGrades,
    ];
    for (const src of sources) {
      if (Array.isArray(src) && src.length > 0) return src;
    }
    return [];
  };

  let effectiveGrades = findEffectiveGrades();
  effectiveGrades = effectiveGrades.filter((eg) => !isNaN(parseFloat(eg.creditsEarned)));

  const groupedEffectiveGrades = effectiveGrades.reduce((acc: Record<string, typeof effectiveGrades>, grade) => {
    const category = normalizeGradesCategory(
      (grade as { distributionType?: string })?.distributionType || "Uncategorized",
    );
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(grade);
    return acc;
  }, {});

  const sortedGradeCategories = Object.keys(groupedEffectiveGrades).sort((a, b) => a.localeCompare(b));

  const specialBaskets = ["Extra curricular activities", "HSM Elective", "Foreign Language"];

  const normalCurriculum = Curriculum.filter(
    (c) => !specialBaskets.some((b) => (c?.basketTitle || "").toLowerCase().includes(b.toLowerCase())),
  );

  const specialCurriculum = Curriculum.filter((c) =>
    specialBaskets.some((b) => (c?.basketTitle || "").toLowerCase().includes(b.toLowerCase())),
  );

  const totalInProgressRaw = Object.values(ongoingCreditsByCategory).reduce((a, b) => a + b, 0);

  const specialInProgress = specialBaskets.reduce((sum, basket) => {
    return sum + (ongoingCreditsByCategory[basket] || 0);
  }, 0);

  const totalInProgress = totalInProgressRaw - specialInProgress;

  return (
    <div>
      <Card className="bg-surface border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="font-display text-xl font-bold uppercase text-text-heading">Grade distribution</span>
            <FetchButton onClick={handleFetchGrades} icon={<RefreshCcw className="w-4 h-4" />} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-2 pb-1 pr-1 text-center md:grid-cols-8">
          {(() => {
            let rawGradeCounts = (data?.cgpa?.grades || marksData?.cgpa?.grades || {}) as Record<string, number>;
            if (Object.keys(rawGradeCounts).length === 0) {
              const computedGradeCounts: Record<string, number> = {};
              const allSemesters = Object.values(data?.grades || {}) as Array<{
                grades?: Array<{ grade?: string }>;
              } | null>;
              allSemesters.forEach((sem) => {
                if (!sem) return;
                (sem.grades || []).forEach((course) => {
                  if (course.grade && course.grade !== "N" && course.grade !== "F") {
                    computedGradeCounts[course.grade] = (computedGradeCounts[course.grade] || 0) + 1;
                  }
                });
              });
              rawGradeCounts = computedGradeCounts;
            }
            return Object.entries(rawGradeCounts).map(([grade, count]) => (
              <div
                key={grade}
                className={`rounded-[10px] border-2 border-border-ink px-2 py-2 shadow-brutal-sm ${gradeTone(grade)} ${
                  count ? "" : "opacity-45 shadow-none"
                }`}
              >
                <p className="font-display text-2xl font-bold leading-none">{grade}</p>
                <p className="mt-1 font-mono text-xs font-bold">{count}</p>
              </div>
            ));
          })()}
        </CardContent>
      </Card>

      <Card className="bg-surface border-0">
        <CardContent className="space-y-6">
          {totalCredits &&
            (() => {
              let earned = parseFloat(totalCredits.creditsEarned);
              let baseRequired = parseFloat(totalCredits.creditsRequired);

              if (earned === 0 && marksData?.cgpa?.creditsEarned) {
                earned =
                  parseFloat(marksData.cgpa.creditsEarned) + parseFloat(marksData.cgpa.nonGradedRequirement || "0");
                baseRequired = parseFloat(marksData.cgpa.creditsRequired) || 160;
              } else if (earned === 0 && effectiveGrades.length > 0) {
                earned = effectiveGrades.reduce((acc, curr) => acc + (parseFloat(curr.creditsEarned) || 0), 0);
              }

              const required =
                baseRequired +
                Curriculum.filter((c) => c.basketTitle.toLowerCase().includes("non-graded core requirement")).reduce(
                  (acc, c) => acc + parseFloat(c.creditsRequired),
                  0,
                );

              const isComplete = earned >= required;
              const effectiveTotal = isComplete ? earned : earned + totalInProgress;

              const progressEarned = Math.min((earned / required) * 100, 100);
              const progressWithOngoing = Math.min((effectiveTotal / required) * 100, 100);

              return (
                <div className="space-y-4 border-b-2 pb-6">
                  <p className="text-lg font-bold">Total Credits</p>
                  <div className="relative h-3 rounded-full overflow-hidden bg-surface-tertiary">
                    {!isComplete && (
                      <div
                        className="absolute left-0 top-0 h-full bg-yellow-400/60"
                        style={{ width: `${progressWithOngoing}%` }}
                      />
                    )}
                    <div
                      className={`absolute left-0 top-0 h-full ${
                        isComplete ? "bg-green-500" : "bg-primary dark:bg-blue-600"
                      }`}
                      style={{ width: `${progressEarned}%` }}
                    />
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {earned.toFixed(1)}
                    {!isComplete && totalInProgress > 0
                      ? ` + ${totalInProgress.toFixed(1)} → ${effectiveTotal.toFixed(1)}`
                      : ""}{" "}
                    / {required.toFixed(1)} total credits
                  </p>
                </div>
              );
            })()}

          <div className="space-y-4 border-b-2 pb-6">
            <div className="relative">
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-surface-tertiary transform -translate-x-1/2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {normalCurriculum.map((c, idx) => {
                  const earned = parseFloat(c.creditsEarned);
                  const required = parseFloat(c.creditsRequired);
                  const inProgress = ongoingCreditsByCategory[c.basketTitle] || 0;

                  const isComplete = earned >= required;
                  const effectiveTotal = isComplete ? earned : earned + inProgress;

                  const progressEarned = Math.min((earned / required) * 100, 100);
                  const progressWithOngoing = Math.min((effectiveTotal / required) * 100, 100);

                  return (
                    <div key={idx} className="p-2 space-y-1">
                      <p className="font-medium text-text-heading">{c.basketTitle}</p>

                      <div className="relative h-2 rounded-full overflow-hidden bg-surface-tertiary">
                        {!isComplete && (
                          <div
                            className="absolute left-0 top-0 h-full bg-yellow-400/60"
                            style={{ width: `${progressWithOngoing}%` }}
                          />
                        )}
                        <div
                          className={`absolute left-0 top-0 h-full ${
                            isComplete ? "bg-green-500" : "bg-primary dark:bg-blue-600"
                          }`}
                          style={{ width: `${progressEarned}%` }}
                        />
                      </div>

                      <p className="text-xs font-medium">
                        {earned.toFixed(1)}
                        {!isComplete && inProgress > 0
                          ? ` + ${inProgress.toFixed(1)} → ${effectiveTotal.toFixed(1)}`
                          : ""}{" "}
                        / {required.toFixed(1)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {specialCurriculum.length > 0 && (
            <div className="space-y-4 border-b-2 pb-6">
              <h3 className="font-semibold text-text-heading">Basket</h3>
              {specialCurriculum.map((c, idx) => {
                const earned = parseFloat(c.creditsEarned);
                const required = parseFloat(c.creditsRequired);
                const inProgress = ongoingCreditsByCategory[c.basketTitle] || 0;

                const isComplete = earned >= required;
                const effectiveTotal = isComplete ? earned : earned + inProgress;

                const progressEarned = Math.min((earned / required) * 100, 100);
                const progressWithOngoing = Math.min((effectiveTotal / required) * 100, 100);

                return (
                  <div key={idx}>
                    <p className="font-medium text-text-heading">{c.basketTitle}</p>
                    <div className="relative h-2 rounded-full overflow-hidden bg-surface-tertiary">
                      {!isComplete && (
                        <div
                          className="absolute left-0 top-0 h-full bg-yellow-400/60"
                          style={{ width: `${progressWithOngoing}%` }}
                        />
                      )}
                      <div
                        className={`absolute left-0 top-0 h-full ${
                          isComplete ? "bg-green-500" : "bg-primary dark:bg-blue-600"
                        }`}
                        style={{ width: `${progressEarned}%` }}
                      />
                    </div>

                    <p className="text-xs font-medium">
                      {earned.toFixed(1)}
                      {!isComplete && inProgress > 0
                        ? ` + ${inProgress.toFixed(1)} → ${effectiveTotal.toFixed(1)}`
                        : ""}{" "}
                      / {required.toFixed(1)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {effectiveGrades.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-3 font-display text-xl font-bold uppercase text-text-heading">Grades</h4>

              <div className="space-y-4">
                {sortedGradeCategories.map((category) => {
                  const courses = [...groupedEffectiveGrades[category]].sort((a, b) =>
                    (a?.basketTitle || "").localeCompare(b?.basketTitle || ""),
                  );

                  return (
                    <div key={category}>
                      <h5 className="mb-2 inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        {category}
                      </h5>
                      <div className="grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-2">
                        {courses.map(({ basketTitle, creditsEarned, distributionType, grade }, idx) => (
                          <div
                            key={`${category}-${basketTitle || "Unknown"}-${idx}`}
                            className="flex min-h-14 items-center justify-between gap-3 rounded-[10px] border-2 border-border-ink bg-surface px-3 py-2 text-text-primary"
                          >
                            <div className="flex min-w-0 flex-col text-left">
                              <span className="truncate text-sm font-semibold">{basketTitle || "Unknown"}</span>
                              <span className="font-mono text-xs uppercase text-text-muted">
                                {distributionType || "—"}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="font-mono text-xs text-text-muted">
                                {Number.isFinite(Number(creditsEarned))
                                  ? `${Number(creditsEarned).toFixed(1)} cr`
                                  : "—"}
                              </span>
                              <span
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-[8px] border-2 border-border-ink font-display text-lg font-bold ${gradeTone(grade)}`}
                              >
                                {grade || "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
