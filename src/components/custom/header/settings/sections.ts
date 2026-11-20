/**
 * Settings: the section list, drill-down titles and small helpers, split out
 * of ProfilePage.tsx (2026-11-20) so the page file holds only the screen.
 * ProfilePage re-exports SECTIONS / SectionId / SectionConfig for older
 * imports.
 */
import { EyeOff, GraduationCap, Grid, Info, Key, Palette, RefreshCcw, Shield, Sliders, User } from "lucide-react";

export type SectionId =
  | "profile"
  | "credentials"
  | "preferences"
  | "home-privacy"
  | "academic"
  | "sync"
  | "sync-modes"
  | "navigation"
  | "advanced"
  | "about";

export interface SectionConfig {
  id: SectionId;
  /** Hub heading the row is listed under. */
  group?: "Account" | "App" | "Study" | "Data";
  label: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

/**
 * The settings screens: the category hub, then one per section.
 *
 * Module scope so the array is referentially stable — `useSubpageStack` keeps
 * `screens` in a `useMemo`, and a list rebuilt on every render would make the
 * stack's identity churn with it.
 */
export type SettingsScreen = "hub" | SectionId | "storage";

/**
 * Screens that are a drill-down inside a section rather than a section of their
 * own. They are in the back-stack — so `back()` from one lands on the section
 * it was opened from — but they are not in `SECTIONS`, so the hub does not list
 * them as categories. `storage` is the only one so far; it used to be a
 * full-screen overlay with its own header and close button, which meant a
 * second copy of the chrome and a back stack of exactly one entry.
 */
export const DRILLDOWNS: Record<Exclude<SettingsScreen, "hub" | SectionId>, { label: string; subtitle: string }> = {
  storage: {
    label: "Local Storage",
    subtitle: "Every key this browser is holding for the app",
  },
};

export const SECTIONS: SectionConfig[] = [
  {
    id: "profile",
    label: "Your profile",
    subtitle: "Your details from VTOP: personal info, proctor, records",
    group: "Account",
    icon: User,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "credentials",
    label: "VTOP login",
    subtitle: "Your VTOP and Moodle logins, change password",
    group: "Account",
    icon: Key,
    iconBg: "bg-warning-surface",
    iconColor: "text-warning-foreground",
  },
  {
    id: "preferences",
    label: "Appearance",
    subtitle: "Theme, sounds, number format, timetable look",
    group: "App",
    icon: Palette,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "home-privacy",
    label: "Home & privacy",
    subtitle: "What Home shows, privacy mode, hiding your CGPA, photo",
    group: "App",
    icon: EyeOff,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "academic",
    label: "Semester & campus",
    subtitle: "Semester, attendance goal, hostel or day scholar, focus timer",
    group: "Study",
    icon: GraduationCap,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "sync",
    label: "Sync",
    subtitle: "When and what AmazeCC pulls from VTOP, data saver",
    group: "Data",
    icon: RefreshCcw,
    iconBg: "bg-success-surface",
    iconColor: "text-success-foreground",
  },
  {
    id: "sync-modes",
    label: "Sync Modes",
    subtitle: "Quick, balanced and full sweeps plus your own custom modes",
    icon: Sliders,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "navigation",
    label: "Bottom bar & notifications",
    subtitle: "Bottom bar shortcuts, reminders, install the app",
    group: "App",
    icon: Grid,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "advanced",
    label: "Advanced",
    subtitle: "Server, backup and restore, data on this device, app icon",
    group: "Data",
    icon: Shield,
    iconBg: "bg-danger-surface",
    iconColor: "text-danger-foreground",
  },
  {
    id: "about",
    label: "About",
    subtitle: "What's new, the team, campus links",
    group: "Data",
    icon: Info,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
];

/**
 * `"ALL0225-26"` -> `"FALLSEM 25-26"`.
 *
 * The semester picker and the Academic row on the settings hub both need
 * this, and they must not be allowed to disagree about what "FALLSEM" means.
 * The id carries the term in its last two digits and the year in the middle, so
 * a raw id is not a label a human can read at a glance.
 */
export function semesterLabel(id?: string): string {
  if (!id) return "—";
  const term = id.endsWith("01")
    ? "FALLSEM"
    : id.endsWith("05")
      ? "WINTERSEM"
      : id.endsWith("07")
        ? "SUMMERSEM"
        : "TERM";
  return `${term} ${id.slice(4, -4)}-${id.slice(6, -2)}`;
}
