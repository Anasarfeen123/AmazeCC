/**
 * One fill per VIT grade, shared by every screen that shows a grade letter
 * (grades sheet, curriculum, course details). Ink text on every fill, so it
 * reads the same in light and dark.
 */
export function gradeTone(grade?: string): string {
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
    case "F":
      return "bg-coral text-obsidian";
    case "P":
      return "bg-sage text-obsidian";
    default:
      return "bg-surface-secondary text-text-primary";
  }
}
