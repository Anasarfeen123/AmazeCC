/**
 * Course colours, brand version.
 *
 * Courses store a colour *key* (a legacy Tailwind class such as "bg-blue-600",
 * also saved in FFCS plans and backups), so the keys must not change. This maps
 * each key to a distinct brand colour at display time. Without it, the brand
 * bridge turned blue/indigo/purple/violet/sky all into the same teal and every
 * course looked alike.
 *
 * All fills take ink text (>= 4.5:1) except the two teals, which take cream.
 */

type CourseColour = { cls: string; hex: string };

const INK = "text-obsidian";
const CREAM = "text-cream";

const PALETTE: Record<string, CourseColour> = {
  "bg-blue-600": { cls: `bg-[#004643] ${CREAM}`, hex: "#004643" }, // brand teal
  "bg-purple-600": { cls: `bg-[#E16162] ${INK}`, hex: "#E16162" }, // coral
  "bg-emerald-500": { cls: `bg-[#9ED9B5] ${INK}`, hex: "#9ED9B5" }, // mint
  "bg-red-600": { cls: `bg-[#E66A2C] ${INK}`, hex: "#E66A2C" }, // orange
  "bg-amber-500": { cls: `bg-[#F9BC60] ${INK}`, hex: "#F9BC60" }, // ochre
  "bg-pink-500": { cls: `bg-[#F2A7B5] ${INK}`, hex: "#F2A7B5" }, // pink
  "bg-indigo-600": { cls: `bg-[#3F8F84] ${INK}`, hex: "#3F8F84" }, // mid teal
  "bg-teal-500": { cls: `bg-[#ABD1C6] ${INK}`, hex: "#ABD1C6" }, // sage
  "bg-orange-500": { cls: `bg-[#F4A259] ${INK}`, hex: "#F4A259" }, // apricot
  "bg-cyan-600": { cls: `bg-[#7FC4C9] ${INK}`, hex: "#7FC4C9" }, // sea
  "bg-fuchsia-500": { cls: `bg-[#D9A3C7] ${INK}`, hex: "#D9A3C7" }, // rose clay
  "bg-lime-500": { cls: `bg-[#C8D96F] ${INK}`, hex: "#C8D96F" }, // lime
  "bg-rose-600": { cls: `bg-[#C9553D] ${CREAM}`, hex: "#C9553D" }, // brick
  "bg-violet-600": { cls: `bg-[#B8A6D9] ${INK}`, hex: "#B8A6D9" }, // lavender (soft, not indigo)
  "bg-sky-500": { cls: `bg-[#8FB8DE] ${INK}`, hex: "#8FB8DE" }, // sky
  "bg-yellow-500": { cls: `bg-[#F2D06B] ${INK}`, hex: "#F2D06B" }, // butter
  "bg-green-600": { cls: `bg-[#5FA36F] ${INK}`, hex: "#5FA36F" }, // leaf
  "bg-magenta-500": { cls: `bg-[#E58FA8] ${INK}`, hex: "#E58FA8" }, // blush
};

const FALLBACK = PALETTE["bg-blue-600"];

/** Brand fill + readable text for a stored course colour key (or a raw hex). */
export function courseColorClass(key: string | null | undefined): string {
  if (!key) return FALLBACK.cls;
  if (key.startsWith("#")) return `${INK}`;
  return PALETTE[key]?.cls ?? FALLBACK.cls;
}

/** Brand hex for a stored course colour key (keeps raw hex values). */
export function courseColorHex(key: string | null | undefined): string {
  if (!key) return FALLBACK.hex;
  if (key.startsWith("#")) return key;
  return PALETTE[key]?.hex ?? FALLBACK.hex;
}

export const COURSE_COLOR_KEYS = Object.keys(PALETTE);
