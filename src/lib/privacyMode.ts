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
 * Reads new category choices while preserving old privacy controls in saved
 * settings. The legacy values are deliberately interpreted, not discarded:
 * people who already enabled them remain covered after the update.
 */
export function privacyCategories(settings?: Partial<Settings> | null): PrivacyCategory[] {
  // Privacy Mode is the master switch. A stored category choice is inert until
  // it is on, so switching it off can never leave a stray cover behind.
  if (!settings?.privacyMode) {
    // One-time read migration for installs that predate the master switch.
    return settings?.privacyMode === undefined && (settings.CGPAHidden || settings.blurGrades) ? ["cgpa"] : [];
  }
  // Default is CGPA only (user: "main thing to censor is CGPA, that's it").
  // Other categories are opt-in from Settings.
  const saved = settings?.privacyCategories;
  const categories = Array.isArray(saved)
    ? saved.filter((category): category is PrivacyCategory => PRIVACY_CATEGORIES.includes(category as PrivacyCategory))
    : [...DEFAULT_PRIVACY_CATEGORIES];
  return categories.length ? categories : [...DEFAULT_PRIVACY_CATEGORIES];
}

export function hasAllPrivacyCategories(settings?: Partial<Settings> | null) {
  const selected = privacyCategories(settings);
  return PRIVACY_CATEGORIES.every((category) => selected.includes(category));
}

export function togglePrivacyCategory(settings: Settings, category: PrivacyCategory, on: boolean): Settings {
  const selected = new Set(
    Array.isArray(settings.privacyCategories)
      ? settings.privacyCategories.filter((item): item is PrivacyCategory =>
          PRIVACY_CATEGORIES.includes(item as PrivacyCategory),
        )
      : [...DEFAULT_PRIVACY_CATEGORIES],
  );
  if (on) selected.add(category);
  else selected.delete(category);
  return {
    ...settings,
    privacyMode: selected.size > 0,
    privacyCategories: PRIVACY_CATEGORIES.filter((item) => selected.has(item)),
    // These were the older single-CGPA switches. Once a user makes a category
    // choice, the category list becomes the single source of truth.
    CGPAHidden: category === "cgpa" ? false : settings.CGPAHidden,
    blurGrades: category === "cgpa" ? false : settings.blurGrades,
  };
}

export function setHideAllPrivacy(settings: Settings, on: boolean): Settings {
  return {
    ...settings,
    privacyMode: on,
    privacyCategories: on ? [...PRIVACY_CATEGORIES] : [],
    CGPAHidden: false,
    blurGrades: false,
  };
}

/**
 * The Privacy Mode master switch (Settings, command palette, Alt/Option+P).
 * On: the categories the user chose, or CGPA when none are chosen. Off: hides
 * nothing but keeps the choice for next time. (Was "hide all", which the user
 * found far too much: "the main thing to censor is CGPA".)
 */
export function setPrivacyMode(settings: Settings, on: boolean): Settings {
  const saved = Array.isArray(settings.privacyCategories)
    ? settings.privacyCategories.filter((c): c is PrivacyCategory => PRIVACY_CATEGORIES.includes(c as PrivacyCategory))
    : [];
  return {
    ...settings,
    privacyMode: on,
    privacyCategories: saved.length ? saved : [...DEFAULT_PRIVACY_CATEGORIES],
    CGPAHidden: false,
    blurGrades: false,
  };
}
