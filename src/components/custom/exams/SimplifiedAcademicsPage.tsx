import { useState, useMemo, useCallback } from "react";
import { ChipTabs, EmptyPanel, PageShell, SelectField } from "../shared/primitives";
import { SEARCH_FIELD, TILE_INTERACTIVE_ROW } from "@/lib/uiTokens";
import { formatSemesterName } from "@/lib/formatSemesterName";
import { loadFrozenPastSemesters } from "@/lib/pastDataSync";
import { BookOpen, Search, ChevronRight, GraduationCap, History, Sparkles } from "lucide-react";
import { clickable } from "@/lib/a11y";
import { getTypedStorageItem, setTypedStorageItem } from "@/lib/storage";
import { normalizeCourse } from "@/lib/courseNormalizer";

/** The four course-type pills above the list. Ordered, so `ChipTabs` scrolls rather than wraps. */
type CourseTypeFilter = "all" | "theory" | "lab" | "embedded";

interface SimplifiedAcademicsPageProps {
  marksData: any;
  allGradesData?: any;
  pastSemesterData?: any;
  attendanceData?: any;
  loginToVTOP?: any;
  setActiveSubTab?: (subTab: string) => void;
  decimalValues?: boolean;
  onSelectCourse?: (courseCode: string) => void;
}

const getNumericValue = (value: any, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const isJunkOrEmpty = (val: any) => {
  if (val == null) return true;
  const s = String(val).trim().toLowerCase();
  return (
    s === "" ||
    s === "nil" ||
    s === "null" ||
    s === "undefined" ||
    s === "n/a" ||
    s === "na" ||
    s === "-" ||
    s === "--" ||
    s === "none"
  );
};

const sanitizeCourseCode = (code: any) => {
  if (isJunkOrEmpty(code)) return "";
  const cleaned = String(code)
    .replace(/\s*\([LPT]\)$/i, "")
    .trim();
  return isJunkOrEmpty(cleaned) ? "" : cleaned;
};

const sanitizeCourseTitle = (title: any, fallbackCode: string) => {
  if (isJunkOrEmpty(title)) return fallbackCode;
  return String(title).trim();
};

const getAssessmentTotals = (assessments: any[] = []) => {
  return assessments.reduce(
    (acc, asm) => {
      acc.max += getNumericValue(asm.maxMark);
      acc.scored += getNumericValue(asm.scoredMark);
      acc.weightPercent += getNumericValue(asm.weightagePercent);
      acc.weighted += getNumericValue(asm.weightageMark);
      return acc;
    },
    { max: 0, scored: 0, weightPercent: 0, weighted: 0 },
  );
};

const getCourseCredits = (course: any) => {
  const credits = getNumericValue(course?.credits, -1);
  return credits > 0 ? credits : -1;
};

const formatUpToTwoDecimals = (num: number, padDecimals = false): string => {
  if (!Number.isFinite(num)) return "0";
  const rounded = Math.round(num * 100) / 100;
  if (padDecimals) {
    return rounded.toFixed(2);
  }
  return Number(rounded.toFixed(2)).toString();
};

interface GrandWeightageResult {
  scored: number;
  maxWeight: number;
  percentage: number | null;
  hasAssessments: boolean;
  isEmbedded: boolean;
  displayScore: string;
  displayMax: string;
}

const calculateGrandWeightage = (course: any, decimalValues = false): GrandWeightageResult => {
  const isEmbedded = Boolean(course.theory && course.lab);
  const theoryAssessments = course.theory?.assessments || [];
  const labAssessments = course.lab?.assessments || [];
  const allAssessments = [...theoryAssessments, ...labAssessments];

  const theoryTotals = getAssessmentTotals(theoryAssessments);
  const labTotals = getAssessmentTotals(labAssessments);

  if (allAssessments.length === 0) {
    return {
      scored: 0,
      maxWeight: 0,
      percentage: null,
      hasAssessments: false,
      isEmbedded,
      displayScore: "0",
      displayMax: "0",
    };
  }

  if (isEmbedded) {
    let theoryCredits = getCourseCredits(course.theory);
    let labCredits = getCourseCredits(course.lab);

    if (theoryCredits <= 0 && labCredits <= 0) {
      theoryCredits = 3;
      labCredits = 1;
    } else if (theoryCredits <= 0) {
      theoryCredits = 3;
    } else if (labCredits <= 0) {
      labCredits = 1;
    }

    const creditsTotal = theoryCredits + labCredits;
    const scored = (theoryCredits * theoryTotals.weighted + labCredits * labTotals.weighted) / creditsTotal;
    const maxWeight =
      (theoryCredits * theoryTotals.weightPercent + labCredits * labTotals.weightPercent) / creditsTotal;

    const percentage =
      maxWeight > 0
        ? (scored / maxWeight) * 100
        : theoryTotals.max + labTotals.max > 0
          ? ((theoryTotals.scored + labTotals.scored) / (theoryTotals.max + labTotals.max)) * 100
          : null;

    return {
      scored,
      maxWeight,
      percentage,
      hasAssessments: true,
      isEmbedded: true,
      displayScore: formatUpToTwoDecimals(scored, decimalValues),
      displayMax: maxWeight > 0 ? formatUpToTwoDecimals(maxWeight, decimalValues) : "0",
    };
  }

  // Non-embedded: Theory only or Lab only
  const activeTotals = course.lab ? labTotals : theoryTotals;
  const scored = activeTotals.weighted;
  const maxWeight = activeTotals.weightPercent;
  const percentage =
    maxWeight > 0
      ? (scored / maxWeight) * 100
      : activeTotals.max > 0
        ? (activeTotals.scored / activeTotals.max) * 100
        : null;

  return {
    scored,
    maxWeight,
    percentage,
    hasAssessments: true,
    isEmbedded: false,
    displayScore: formatUpToTwoDecimals(scored, decimalValues),
    displayMax: maxWeight > 0 ? formatUpToTwoDecimals(maxWeight, decimalValues) : "0",
  };
};

const safeObjectEntries = (obj: any): Array<[string, any]> => {
  if (!obj || typeof obj !== "object") return [];
  try {
    return Object.entries(obj);
  } catch {
    return [];
  }
};

const safeObjectKeys = (obj: any): string[] => {
  if (!obj || typeof obj !== "object") return [];
  try {
    return Object.keys(obj);
  } catch {
    return [];
  }
};

const safeObjectValues = (obj: any): any[] => {
  if (!obj || typeof obj !== "object") return [];
  try {
    return Object.values(obj);
  } catch {
    return [];
  }
};

export default function SimplifiedAcademicsPage({
  marksData,
  allGradesData,
  pastSemesterData,
  attendanceData,
  setActiveSubTab,
  decimalValues = false,
  onSelectCourse,
}: SimplifiedAcademicsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showPastSemestersView, setShowPastSemestersView] = useState(false);
  const [selectedPastSemId, setSelectedPastSemId] = useState<string>("all");

  // ── GROUP CURRENT SEMESTER COURSES WITH STRICT SANITIZATION ──
  const currentCourses = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Load from marksData
    if (marksData?.courses && Array.isArray(marksData.courses)) {
      marksData.courses.forEach((c: any) => {
        if (!c || typeof c !== "object") return;
        const rawCode = sanitizeCourseCode(c.courseCode || c.code);
        const rawTitle = String(c.courseTitle || c.title || "").trim();
        const classNbr = String(c.classNumber || c.classNbr || c.crn || "").trim();

        // Reject if both code and title are junk/empty
        if (!rawCode && isJunkOrEmpty(rawTitle)) return;
        if (isJunkOrEmpty(rawCode) && isJunkOrEmpty(classNbr)) return;

        const baseCode = rawCode || sanitizeCourseCode(rawTitle) || sanitizeCourseCode(classNbr);
        if (!baseCode) return;

        const courseTitle = sanitizeCourseTitle(rawTitle, baseCode);
        const isLab = c.courseType?.toLowerCase().includes("lab") || c.slot?.toLowerCase().startsWith("l");

        if (!map.has(baseCode)) {
          map.set(baseCode, {
            courseCode: baseCode,
            courseTitle,
            credits: Number(c.credits) || 0,
            theory: !isLab ? { ...c, courseCode: baseCode, courseTitle } : null,
            lab: isLab ? { ...c, courseCode: baseCode, courseTitle } : null,
            isCurrent: true,
          });
        } else {
          const existing = map.get(baseCode);
          if (isLab) existing.lab = { ...c, courseCode: baseCode, courseTitle };
          else existing.theory = { ...c, courseCode: baseCode, courseTitle };
          if (c.credits) existing.credits = Number(c.credits) || existing.credits;
          if (existing.courseTitle === baseCode && !isJunkOrEmpty(rawTitle)) {
            existing.courseTitle = courseTitle;
          }
        }
      });
    }

    // 2. Supplement from attendanceData
    if (attendanceData?.attendance && Array.isArray(attendanceData.attendance)) {
      attendanceData.attendance.forEach((att: any) => {
        if (!att || typeof att !== "object") return;
        let rawCode = sanitizeCourseCode(att.courseCode || att.code);
        if (rawCode && rawCode.includes(" ")) rawCode = rawCode.split(" ")[0];
        const rawTitle = String(att.courseTitle || att.title || "").trim();
        const classNbr = String(att.classNumber || att.classNbr || att.crn || "").trim();

        if (!rawCode && isJunkOrEmpty(rawTitle)) return;
        if (isJunkOrEmpty(rawCode) && isJunkOrEmpty(classNbr)) return;

        const baseCode = rawCode || sanitizeCourseCode(rawTitle) || sanitizeCourseCode(classNbr);
        if (!baseCode) return;

        const courseTitle = sanitizeCourseTitle(rawTitle, baseCode);
        const isLab = att.courseType?.toLowerCase().includes("lab") || att.slotName?.toLowerCase().startsWith("l");

        if (!map.has(baseCode)) {
          map.set(baseCode, {
            courseCode: baseCode,
            courseTitle,
            credits: Number(att.credits) || 0,
            theory: !isLab ? { ...att, courseCode: baseCode, courseTitle } : null,
            lab: isLab ? { ...att, courseCode: baseCode, courseTitle } : null,
            isCurrent: true,
          });
        } else {
          const existing = map.get(baseCode);
          if (isLab) existing.lab = { ...(existing.lab || {}), ...att, courseCode: baseCode, courseTitle };
          else existing.theory = { ...(existing.theory || {}), ...att, courseCode: baseCode, courseTitle };
          if (att.credits) existing.credits = Number(att.credits) || existing.credits;
          if (existing.courseTitle === baseCode && !isJunkOrEmpty(rawTitle)) {
            existing.courseTitle = courseTitle;
          }
        }
      });
    }

    return Array.from(map.values()).filter((c) => {
      return !isJunkOrEmpty(c.courseCode) && !isJunkOrEmpty(c.courseTitle) && Boolean(c.theory || c.lab);
    });
  }, [marksData, attendanceData]);

  // ── RESOLVE ALL-GRADES AND PAST SEMESTERS DATA (PROPS + LOCALSTORAGE FALLBACK) ──
  const resolvedAllGradesData = useMemo(() => {
    if (allGradesData && typeof allGradesData === "object" && allGradesData.grades) return allGradesData;
    if (typeof window !== "undefined") {
      try {
        const stored =
          getTypedStorageItem<any>("allGrades") ||
          getTypedStorageItem<any>("allgradesdata") ||
          getTypedStorageItem<any>("allGradesData");
        if (stored) {
          const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {}
    }
    return allGradesData && typeof allGradesData === "object" ? allGradesData : null;
  }, [allGradesData]);

  const resolvedPastSemesterData = useMemo(() => {
    if (pastSemesterData && typeof pastSemesterData === "object" && safeObjectKeys(pastSemesterData).length > 0) {
      return pastSemesterData;
    }
    if (typeof window !== "undefined") {
      try {
        const loaded = loadFrozenPastSemesters(resolvedAllGradesData);
        if (loaded && typeof loaded === "object" && safeObjectKeys(loaded).length > 0) return loaded;
      } catch {}
    }
    return pastSemesterData && typeof pastSemesterData === "object" ? pastSemesterData : {};
  }, [pastSemesterData, resolvedAllGradesData]);

  // ── GROUP PAST SEMESTERS WITH COMPREHENSIVE EXTRACTION & SANITIZATION ──
  const pastSemesters = useMemo(() => {
    const list: Array<{
      semesterId: string;
      semesterName: string;
      gpa?: string;
      courses: any[];
    }> = [];

    const currentSemId = attendanceData?.semester;

    // 1. From resolvedPastSemesterData
    if (resolvedPastSemesterData && typeof resolvedPastSemesterData === "object") {
      safeObjectKeys(resolvedPastSemesterData).forEach((semId) => {
        if (
          !semId ||
          semId === currentSemId ||
          semId === "Current" ||
          semId === "curriculum" ||
          semId === "effectiveGrades"
        )
          return;
        const semObj = resolvedPastSemesterData[semId];
        if (!semObj || typeof semObj !== "object") return;
        const semMap = new Map<string, any>();

        if (semObj?.marks?.courses && Array.isArray(semObj.marks.courses)) {
          semObj.marks.courses.forEach((c: any) => {
            if (!c || typeof c !== "object") return;
            const rawCode = sanitizeCourseCode(c.courseCode || c.code);
            const rawTitle = String(c.courseTitle || c.title || "").trim();
            if (!rawCode && isJunkOrEmpty(rawTitle)) return;
            const baseCode = rawCode || sanitizeCourseCode(rawTitle);
            if (!baseCode) return;

            const courseTitle = sanitizeCourseTitle(rawTitle, baseCode);
            const isLab = c.courseType?.toLowerCase().includes("lab") || c.slot?.toLowerCase().startsWith("l");

            if (!semMap.has(baseCode)) {
              semMap.set(baseCode, {
                courseCode: baseCode,
                courseTitle,
                credits: Number(c.credits) || 0,
                theory: !isLab ? { ...c, courseCode: baseCode, courseTitle } : null,
                lab: isLab ? { ...c, courseCode: baseCode, courseTitle } : null,
                grade: c.grade || c.courseGrade,
                isCurrent: false,
              });
            } else {
              const existing = semMap.get(baseCode);
              if (isLab) existing.lab = { ...c, courseCode: baseCode, courseTitle };
              else existing.theory = { ...c, courseCode: baseCode, courseTitle };
              if (c.grade || c.courseGrade) existing.grade = c.grade || c.courseGrade;
            }
          });
        }

        if (semObj?.attendance?.attendance && Array.isArray(semObj.attendance.attendance)) {
          semObj.attendance.attendance.forEach((c: any) => {
            if (!c || typeof c !== "object") return;
            let rawCode = sanitizeCourseCode(c.courseCode || c.code);
            if (rawCode && rawCode.includes(" ")) rawCode = rawCode.split(" ")[0];
            const rawTitle = String(c.courseTitle || c.title || "").trim();
            if (!rawCode && isJunkOrEmpty(rawTitle)) return;
            const baseCode = rawCode || sanitizeCourseCode(rawTitle);
            if (!baseCode) return;

            const courseTitle = sanitizeCourseTitle(rawTitle, baseCode);
            const isLab =
              c.courseType?.toLowerCase().includes("lab") ||
              c.slot?.toLowerCase().startsWith("l") ||
              c.slotName?.toLowerCase().startsWith("l");

            if (!semMap.has(baseCode)) {
              semMap.set(baseCode, {
                courseCode: baseCode,
                courseTitle,
                credits: Number(c.credits) || 0,
                theory: !isLab ? { ...c, courseCode: baseCode, courseTitle } : null,
                lab: isLab ? { ...c, courseCode: baseCode, courseTitle } : null,
                grade: c.grade || c.courseGrade,
                isCurrent: false,
              });
            } else {
              const existing = semMap.get(baseCode);
              if (isLab) existing.lab = { ...(existing.lab || {}), ...c, courseCode: baseCode, courseTitle };
              else existing.theory = { ...(existing.theory || {}), ...c, courseCode: baseCode, courseTitle };
              if (c.grade || c.courseGrade) existing.grade = c.grade || c.courseGrade;
            }
          });
        }

        const validCourses = Array.from(semMap.values()).filter(
          (c) => !isJunkOrEmpty(c.courseCode) && !isJunkOrEmpty(c.courseTitle) && Boolean(c.theory || c.lab),
        );

        if (validCourses.length > 0) {
          list.push({
            semesterId: semId,
            semesterName: formatSemesterName(semId),
            gpa: resolvedAllGradesData?.gpaHistory?.[semId] || resolvedAllGradesData?.grades?.[semId]?.gpa || undefined,
            courses: validCourses,
          });
        }
      });
    }

    // 2. From resolvedAllGradesData if not already in resolvedPastSemesterData
    if (resolvedAllGradesData?.grades) {
      const gradesObj = resolvedAllGradesData.grades;
      const semEntries: Array<[string, any]> = Array.isArray(gradesObj)
        ? gradesObj.map((s: any, idx: number) => [s?.semesterSubId || s?.semesterId || s?.semSubId || `sem_${idx}`, s])
        : safeObjectEntries(gradesObj);

      semEntries.forEach(([semId, semVal]) => {
        if (
          !semId ||
          semId === currentSemId ||
          semId === "Current" ||
          semId === "curriculum" ||
          semId === "effectiveGrades" ||
          !semVal
        )
          return;
        if (list.some((s) => s.semesterId === semId)) return;

        let items: any[] = [];
        if (Array.isArray(semVal)) {
          items = semVal;
        } else if (semVal && typeof semVal === "object") {
          if (Array.isArray(semVal.grades)) items = semVal.grades;
          else if (Array.isArray(semVal.courseGrades)) items = semVal.courseGrades;
          else if (Array.isArray(semVal.courses)) items = semVal.courses;
          else {
            items = safeObjectValues(semVal).filter(
              (v) => v && typeof v === "object" && (v.courseCode || v.code || v.courseTitle || v.title),
            );
          }
        }

        if (items.length > 0) {
          const semMap = new Map<string, any>();
          items.forEach((c: any) => {
            if (!c || typeof c !== "object") return;
            const code = sanitizeCourseCode(c.courseCode || c.code);
            const title = String(c.courseTitle || c.title || c.courseName || "").trim();
            if (!code && isJunkOrEmpty(title)) return;
            const cleanCode = code || sanitizeCourseCode(title);
            if (!cleanCode) return;

            const courseTitle = sanitizeCourseTitle(title, cleanCode);

            if (!semMap.has(cleanCode)) {
              semMap.set(cleanCode, {
                courseCode: cleanCode,
                courseTitle,
                credits: Number(c.creditsEarned || c.credits) || 0,
                grade: c.grade || c.courseGrade,
                theory: {
                  courseType: c.courseType || "Theory",
                  courseCode: cleanCode,
                  courseTitle,
                  grade: c.grade || c.courseGrade,
                },
                lab: null,
                isCurrent: false,
              });
            } else {
              const existing = semMap.get(cleanCode);
              if (c.grade || c.courseGrade) existing.grade = c.grade || c.courseGrade;
            }
          });

          const validCourses = Array.from(semMap.values()).filter(
            (c) => !isJunkOrEmpty(c.courseCode) && !isJunkOrEmpty(c.courseTitle) && Boolean(c.theory || c.lab),
          );

          if (validCourses.length > 0) {
            list.push({
              semesterId: semId,
              semesterName: formatSemesterName(semId),
              gpa: semVal?.gpa || resolvedAllGradesData?.gpaHistory?.[semId] || undefined,
              courses: validCourses,
            });
          }
        }
      });
    }

    // Sort past semesters chronologically (most recent first)
    return list.sort((a, b) => b.semesterId.localeCompare(a.semesterId));
  }, [resolvedPastSemesterData, resolvedAllGradesData, attendanceData]);

  // ── FILTER COURSES ──
  const filterCourseList = useCallback(
    (courses: any[]) => {
      return courses.filter((c) => {
        const title = (c.courseTitle || "").toLowerCase();
        const code = (c.courseCode || "").toLowerCase();
        const term = searchTerm.toLowerCase().trim();

        if (term && !title.includes(term) && !code.includes(term)) {
          return false;
        }

        const isEmbedded = c.theory && c.lab;
        const isLabOnly = !c.theory && c.lab;
        const isTheoryOnly = c.theory && !c.lab;

        if (selectedType === "theory" && !isTheoryOnly) return false;
        if (selectedType === "lab" && !isLabOnly) return false;
        if (selectedType === "embedded" && !isEmbedded) return false;

        return true;
      });
    },
    [searchTerm, selectedType],
  );

  const filteredCurrentCourses = useMemo(() => filterCourseList(currentCourses), [filterCourseList, currentCourses]);

  const handleCourseClick = (courseCode: string) => {
    const cleanCode = courseCode.replace(/\([LPT]\)$/i, "").trim();
    if (onSelectCourse) {
      onSelectCourse(cleanCode);
    } else if (setActiveSubTab) {
      try {
        setTypedStorageItem("course_dashboard_target", cleanCode);
        setTypedStorageItem("course_dashboard_tab", "marks");
      } catch {}
      setActiveSubTab("course-dashboard");
    }
  };

  // ── RENDER INDIVIDUAL COURSE PILL ──
  const renderCoursePill = (course: any) => {
    const isEmbedded = Boolean(course.theory && course.lab);
    const main = course.theory || course.lab;
    const norm = normalizeCourse(main || course);
    const displayCode = norm.baseCode || norm.code || course.courseCode;
    const displayTitle = norm.title || course.courseTitle;
    const courseTypeLabel = isEmbedded
      ? "Embedded Theory + Lab"
      : norm.componentType === "Lab Only" || course.lab
        ? "Lab Only"
        : "Theory Only";

    const grandWeightage = calculateGrandWeightage(course, decimalValues);

    // Stat styling based on performance percentage
    let statColor = "text-text-muted";
    // Score block fill by band (ink text on every fill; same in both themes).
    if (course.grade) {
      statColor = "bg-secondary text-secondary-foreground";
    } else if (grandWeightage.percentage !== null) {
      if (grandWeightage.percentage >= 80) statColor = "bg-mint text-obsidian";
      else if (grandWeightage.percentage >= 65) statColor = "bg-ochre text-obsidian";
      else statColor = "bg-coral text-obsidian";
    } else {
      statColor = "bg-surface-secondary text-text-primary";
    }

    return (
      <div
        key={course.courseCode}
        {...clickable(() => handleCourseClick(course.courseCode))}
        className={`${TILE_INTERACTIVE_ROW} duration-200 group select-none`}
      >
        {/* Left Column: Clean Icon + Course Code, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Course Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[6px] border-2 border-border-ink bg-surface-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase text-text-primary">
                {displayCode}
              </span>
              <span
                className={`rounded-[6px] border-2 border-border-ink px-1.5 py-0.5 font-mono text-xs font-bold uppercase text-obsidian ${
                  isEmbedded ? "bg-ochre" : course.lab ? "bg-mint" : "bg-sage"
                }`}
              >
                {isEmbedded ? "Embedded" : course.lab ? "Lab" : "Theory"}
              </span>
            </div>

            {/* Course Title */}
            <p className="mt-1.5 truncate font-display text-base font-bold text-text-heading">{displayTitle}</p>

            {/* Subtitle containing course type, credits and slot */}
            <p className="mt-0.5 truncate font-mono text-xs text-text-muted">
              {[
                // The badge already says Theory/Lab; keep the detail only for embedded.
                isEmbedded ? courseTypeLabel : "",
                (norm.credits ?? course.credits) > 0 ? `${norm.credits ?? course.credits} credits` : "",
                norm.slotDisplay || main?.slotName || main?.slot
                  ? `Slot ${norm.slotDisplay || main.slotName || main.slot}`
                  : "",
              ]
                .filter(Boolean)
                .join(" // ")}
            </p>
          </div>
        </div>

        {/* Right Column: Overall Grand Weightage Points Scored & Forward Arrow */}
        <div className="flex items-center gap-2.5 shrink-0 text-right">
          <div>
            {course.grade ? (
              <div
                className={`flex min-w-[92px] flex-col items-end rounded-[10px] border-2 border-border-ink px-3 py-1.5 shadow-brutal-sm ${statColor}`}
              >
                <span data-private="marks" className="font-display text-xl font-bold leading-none">
                  {course.grade}
                </span>
                <span className="mt-1 font-mono text-xs font-bold uppercase opacity-80">Final grade</span>
              </div>
            ) : grandWeightage.hasAssessments ? (
              <div
                className={`flex min-w-[92px] flex-col items-end rounded-[10px] border-2 border-border-ink px-3 py-1.5 shadow-brutal-sm ${statColor}`}
              >
                <span data-private="marks" className="font-display text-xl font-bold leading-none tabular-nums">
                  {grandWeightage.maxWeight > 0
                    ? `${grandWeightage.displayScore} / ${grandWeightage.displayMax}`
                    : `${grandWeightage.displayScore}`}
                </span>
                {grandWeightage.maxWeight !== 100 && (
                  <span
                    data-private={grandWeightage.percentage !== null ? "marks" : undefined}
                    className="mt-1 font-mono text-xs font-bold uppercase opacity-80"
                  >
                    {grandWeightage.percentage !== null
                      ? `${formatUpToTwoDecimals(grandWeightage.percentage, decimalValues)}%`
                      : "Weightage"}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex min-w-[92px] flex-col items-end rounded-[10px] border-2 border-dashed border-border px-3 py-1.5">
                <span className="font-mono text-xs font-bold uppercase text-text-primary">Pending</span>
                <span className="mt-1 font-mono text-xs text-text-muted">No marks yet</span>
              </div>
            )}
          </div>

          {/* Navigation indicator */}
          <div className="p-1 rounded-lg text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  // ── VIEW 2: DEDICATED PREVIOUS SEMESTERS SEPARATE PAGE ──
  if (showPastSemestersView) {
    const displayedPastSemesters =
      selectedPastSemId === "all" ? pastSemesters : pastSemesters.filter((s) => s.semesterId === selectedPastSemId);

    return (
      <PageShell
        eyebrow="Academics · History"
        title="Previous Semester History"
        subtitle={`${pastSemesters.length} ${pastSemesters.length === 1 ? "semester" : "semesters"}`}
        onBack={() => setShowPastSemestersView(false)}
        actions={
          pastSemesters.length > 1 ? (
            <SelectField
              value={selectedPastSemId}
              onChange={setSelectedPastSemId}
              options={[
                { value: "all", label: "All Past Semesters" },
                ...pastSemesters.map((s) => ({ value: s.semesterId, label: s.semesterName })),
              ]}
              className="w-44"
            />
          ) : undefined
        }
      >
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search past course code or name..."
            className={`${SEARCH_FIELD} pl-9 pr-4 text-xs sm:text-sm shadow-2xs focus:ring-2 focus:ring-border-ink`}
          />
        </div>

        {/* Past Semesters Course Lists */}
        <div className="space-y-6 pt-2">
          {displayedPastSemesters.length > 0 ? (
            displayedPastSemesters.map((sem) => {
              const filteredSemCourses = filterCourseList(sem.courses);
              if (filteredSemCourses.length === 0) return null;

              return (
                <div key={sem.semesterId} className="space-y-2.5">
                  {/* Semester Header Strip */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-text-heading font-outfit">
                        {sem.semesterName}
                      </span>
                      <span className="text-xs font-bold text-text-muted">({filteredSemCourses.length} courses)</span>
                    </div>
                    {sem.gpa && <span className="text-xs font-bold text-primary font-outfit">GPA: {sem.gpa}</span>}
                  </div>

                  {/* Course Pills */}
                  <div className="space-y-2">{filteredSemCourses.map(renderCoursePill)}</div>
                </div>
              );
            })
          ) : (
            <EmptyPanel
              variant="dashed"
              icon={<History className="w-8 h-8 text-text-muted mx-auto" />}
              title="No archived course records found for earlier semesters."
              action={
                setActiveSubTab ? (
                  <button
                    onClick={() => setActiveSubTab("grades")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold transition-colors cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>View Grade History</span>
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      </PageShell>
    );
  }

  // ── VIEW 1: CURRENT SEMESTER COURSES + PREVIOUS SEMESTERS PILL AT BOTTOM ──
  return (
    <PageShell
      syncedOps={["attendanceMarks"]}
      eyebrow="Academics"
      title="My Courses & Marks"
      subtitle={`${filteredCurrentCourses.length} ${filteredCurrentCourses.length === 1 ? "course" : "courses"}`}
    >
      {/* ── SEARCH & FILTER STRIP ── */}
      {/* A vertical stack, not a row: the house pattern (ClubHubTab, EventHubTab).
          `ChipTabs` is `w-full` + `overflow-x-auto` by design, so it wants its own
          line and to scroll horizontally. In a `sm:flex-row` it claims 100% width
          and squeezes the search field instead. */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search course code or name..."
            aria-label="Search your courses"
            className={`${SEARCH_FIELD} pl-9 pr-4 text-xs sm:text-sm shadow-2xs focus:ring-2 focus:ring-border-ink`}
          />
        </div>

        {/* Type Filter Pills */}
        <ChipTabs
          options={[
            { value: "all" as CourseTypeFilter, label: "All" },
            { value: "theory", label: "Theory" },
            { value: "lab", label: "Lab" },
            { value: "embedded", label: "Embedded" },
          ]}
          value={selectedType}
          onChange={setSelectedType}
        />
      </div>

      {/* ── CURRENT SEMESTER COURSES PILLS LIST ── */}
      <div className="space-y-2">
        {filteredCurrentCourses.length > 0 ? (
          filteredCurrentCourses.map(renderCoursePill)
        ) : (
          <EmptyPanel
            variant="dashed"
            icon={<BookOpen className="w-8 h-8 text-text-muted mx-auto" />}
            title="No courses found matching your search."
          />
        )}
      </div>

      {/* ── ACADEMIC EXPLORER NAVIGATION CARDS (CURRICULUM & GRADE HISTORY & MARKS PREDICTOR) ── */}
      <div className="pt-3 border-t border-border-ink space-y-2.5">
        {/* Marks Predictor Featured Hero Card */}
        <button
          onClick={() => setActiveSubTab?.("marks-predictor")}
          className="w-full p-4 rounded-[14px] border border-border-ink hover: hover: shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 group transition-all duration-200 cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold font-outfit text-text-heading truncate flex items-center gap-2">
                <span>Marks Predictor & Simulator</span>
                <span className="px-1.5 py-0.2 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase">
                  New
                </span>
              </p>
              <p className="text-xs text-text-muted truncate">
                Simulate what-if scores, calculate points lost & solve FAT targets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-primary font-outfit group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Predictor</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Degree Curriculum Card */}
          <button
            onClick={() => setActiveSubTab?.("curriculum")}
            className={`${TILE_INTERACTIVE_ROW} w-full p-4 hover:border-border-ink dark:hover:border-border-ink group duration-200`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-secondary border border-border-ink text-secondary-foreground flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold font-outfit text-text-heading truncate">Degree Curriculum</p>
                <p className="text-xs text-text-muted truncate">Program credits, baskets & distribution</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary font-outfit group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Curriculum</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Grade History Card */}
          <button
            onClick={() => setActiveSubTab?.("grades")}
            className={`${TILE_INTERACTIVE_ROW} w-full p-4 hover:border-border-ink dark:hover:border-border-ink group duration-200`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-secondary border border-border-ink text-secondary-foreground flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold font-outfit text-text-heading truncate">Grade History</p>
                <p className="text-xs text-text-muted truncate">Cumulative GPA & past semesters</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary font-outfit group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Grades</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* ── PREVIOUS SEMESTERS SEPARATE PAGE PILL (ALWAYS VISIBLE & ACCESSIBLE) ── */}
        <button
          onClick={() => {
            if (pastSemesters.length > 0) {
              setShowPastSemestersView(true);
            } else if (setActiveSubTab) {
              setActiveSubTab("grades");
            } else {
              setShowPastSemestersView(true);
            }
          }}
          className={`${TILE_INTERACTIVE_ROW} w-full p-3.5 sm:p-4 hover:border-border-ink dark:hover:border-border-ink group duration-200`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-secondary border border-border-ink text-secondary-foreground flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold font-outfit text-text-heading truncate">
                Looking for previous semesters?
              </p>
              <p className="text-xs text-text-muted truncate">
                {pastSemesters.length > 0
                  ? `View archived courses and grades from ${pastSemesters.length} earlier semesters`
                  : "View archived courses, GPA & grades from previous semesters"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-outfit group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>{pastSemesters.length > 0 ? "View History" : "Grade History"}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </PageShell>
  );
}
