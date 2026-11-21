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
  "bg-purple-600": { cls: `bg-[#6F8FB5] ${INK}`, hex: "#6F8FB5" }, // slate (was coral #E16162, the danger colour: critique #16)
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
  "bg-rose-600": { cls: `bg-[#B08D5E] ${INK}`, hex: "#B08D5E" }, // caramel (was brick #C9553D, read as danger)
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

/**
 * A soft accent per course, picked from the course code (stable: the same
 * course gets the same colour on every screen and after re-syncs; position in
 * a list does not matter). Only mid-light brand colours, so a thin stripe of
 * it reads on cream, dark teal and black alike. For subtle marks (a card's
 * edge stripe), not for fills behind text.
 */
const ACCENTS = [
  "#F9BC60",
  "#E16162",
  "#9ED9B5",
  "#ABD1C6",
  "#F2A7B5",
  "#7FC4C9",
  "#C8D96F",
  "#B8A6D9",
  "#F4A259",
  "#8FB8DE",
];

export function courseAccent(code: string | null | undefined): string {
  const key = String(code ?? "")
    .trim()
    .toUpperCase();
  if (!key) return ACCENTS[0];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

/** Ink or cream text for a coloured fill, by luminance (WCAG relative luminance). */
export function inkOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#001e1d";
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  // Contrast with ink (L 0.011) vs cream (L 0.98): pick the larger.
  return (L + 0.05) / (0.011 + 0.05) >= (0.98 + 0.05) / (L + 0.05) ? "#001e1d" : "#fffdf8";
}
