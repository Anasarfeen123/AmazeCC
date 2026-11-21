/**
 * Credits earned towards the degree, as every screen shows it: graded
 * credits plus the non-graded requirement (VTOP reports them separately).
 * Home used graded only while the sidebar, grades modal and curriculum
 * added both, so the demo showed 42.5 on Home and 47.5 in the sidebar.
 * Returns null when nothing is known.
 */
export function totalCreditsEarned(
  cgpa: { creditsEarned?: string | number | null; nonGradedRequirement?: string | number | null } | null | undefined,
): number | null {
  if (!cgpa || cgpa.creditsEarned === undefined || cgpa.creditsEarned === null || cgpa.creditsEarned === "")
    return null;
  const graded = Number(cgpa.creditsEarned);
  if (!Number.isFinite(graded)) return null;
  const nonGraded = Number(cgpa.nonGradedRequirement ?? 0);
  return graded + (Number.isFinite(nonGraded) ? nonGraded : 0);
}
