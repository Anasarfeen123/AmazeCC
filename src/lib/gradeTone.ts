/**
 * One fill per VIT grade, shared by every screen that shows a grade letter
 * (grades sheet, curriculum, course details). Ink text on every fill, so it
 * reads the same in light and dark.
 */
export function gradeTone(grade?: string): string {
  // Blue -> green -> yellow -> red, best to worst (team review 2026-11-28).
  switch ((grade || "").toUpperCase()) {
    case "S":
      return "bg-[#9cc8ec] text-obsidian";
    case "A":
      return "bg-mint text-obsidian";
    case "B":
      return "bg-sage text-obsidian";
    case "C":
    case "D":
      return "bg-ochre text-obsidian";
    case "E":
    case "F":
      return "bg-coral text-obsidian";
    case "P":
      return "bg-sage text-obsidian";
    default:
      return "bg-surface-secondary text-text-primary";
  }
}
