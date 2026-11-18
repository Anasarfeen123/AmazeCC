/**
 * Is this student a fresher (first year)?
 *
 * VIT registration numbers start with the two-digit admission year
 * ("26BCE1234" joined in 2026). The academic year starts in July, so from
 * July 2026 to June 2027 a fresher's number starts with "26".
 *
 * This replaces the old test ("VTOP returned any EPT message or any
 * acknowledgement document"), which was true for almost everyone: VTOP answers
 * "Exam will be scheduled soon.." and keeps admission documents for every
 * year, so seniors were shown the Fresher Onboarding Hub.
 *
 * Unknown or unparseable numbers return false: showing a senior the fresher
 * hub is worse than a fresher reaching it from the menu.
 */
export function isFresherRegNo(regNo: string | null | undefined, now: Date = new Date()): boolean {
  const m = /^\s*(\d{2})[A-Za-z]/.exec(String(regNo ?? ""));
  if (!m) return false;
  const admitted = Number(m[1]);
  const academicStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return admitted === academicStartYear % 100;
}
