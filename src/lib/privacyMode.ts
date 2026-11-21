import type { Settings } from "@/store/settingsAtoms";

export const PRIVACY_CATEGORIES = ["cgpa", "attendance", "marks", "fees", "credits", "id", "identity"] as const;

export type PrivacyCategory = (typeof PRIVACY_CATEGORIES)[number];

/** What Privacy Mode hides until the user picks more. */
export const DEFAULT_PRIVACY_CATEGORIES: readonly PrivacyCategory[] = ["cgpa"];

export const PRIVACY_CATEGORY_DETAILS: Record<PrivacyCategory, { label: string; description: string }> = {
  cgpa: { label: "CGPA & GPA", description: "Cumulative and semester grade-point averages" },
  attendance: { label: "Attendance %", description: "Attendance totals, percentages and predictions" },
  marks: { label: "Marks & grades", description: "Assessment scores, grade points and results" },
  fees: { label: "Fees & payments", description: "Balances, charges and receipt amounts" },
  credits: { label: "Credits", description: "Earned, registered and remaining credits" },
  id: { label: "Registration number", description: "Your registration or student number" },
  identity: { label: "Name & photo", description: "Your name and profile photograph" },
};

/**
 * What privacy mode hides right now: CGPA & GPA, or nothing.
 *
 * Owner, 2026-11-22: privacy mode "just hides CGPA and GPA on the home page
 * and sidebar, like Hide CGPA; merge them". So it is one switch with one
 * category. The other categories stay in the type (values are still tagged
 * with data-private) but are never selected, and the hide rules only match
 * inside Home and the sidebar (globals.css, [data-privacy-zone]).
 *
 * The old single switches (CGPAHidden, blurGrades) and any saved category
 * list are read as "privacy mode on", so nobody who had CGPA hidden is
 * uncovered by the update.
 */
export function privacyCategories(settings?: Partial<Settings> | null): PrivacyCategory[] {
  if (!settings) return [];
  if (settings.privacyMode) return ["cgpa"];
  if (settings.privacyMode === undefined && (settings.CGPAHidden || settings.blurGrades)) return ["cgpa"];
  return [];
}

/** Always false now: privacy mode never covers every category. */
export function hasAllPrivacyCategories(_settings?: Partial<Settings> | null) {
  return false;
}

/** Merged switch: any category toggle turns privacy mode (CGPA) on or off. */
export function togglePrivacyCategory(settings: Settings, _category: PrivacyCategory, on: boolean): Settings {
  return setPrivacyMode(settings, on);
}

/** Kept for old callers; same as the privacy mode switch. */
export function setHideAllPrivacy(settings: Settings, on: boolean): Settings {
  return setPrivacyMode(settings, on);
}

/**
 * The one privacy switch (Settings, command palette, Alt/Option+P, the
 * sidebar eye): on hides CGPA & GPA on Home and in the sidebar.
 */
export function setPrivacyMode(settings: Settings, on: boolean): Settings {
  return {
    ...settings,
    privacyMode: on,
    privacyCategories: on ? ["cgpa"] : [],
    CGPAHidden: false,
    blurGrades: false,
  };
}
