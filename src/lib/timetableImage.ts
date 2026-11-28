/**
 * The week's timetable as a clean PNG for WhatsApp / Instagram (owner:
 * "share timetable as an image"). Drawn on a canvas rather than screenshotted,
 * so the picture is the same in every theme and on every screen: one column
 * per day, one card per class (time, course, room), the brand frame and a
 * small "amazecc.com" footer.
 */
import { getAttendanceTimeRange } from "./attendanceTimetable";
import { shortCourseName } from "./displayNames";

const INK = "#001E1D";
const PAPER = "#F7F1E6";
const CARD = "#FFFDF8";
const TEAL = "#004643";
const OCHRE = "#F9BC60";
const SAGE = "#ABD1C6";
const MUTED = "#4A5F5C";
const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAME: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

/** The real family name next/font gave a font role (e.g. font-title). */
function family(cls: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.className = cls;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const f = getComputedStyle(probe).fontFamily || fallback;
  probe.remove();
  return f;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Card with an ink border and a hard offset shadow (the brand look). */
function brutalCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  roundRect(ctx, x + 6, y + 6, w, h, 18);
  ctx.fillStyle = INK;
  ctx.fill();
  roundRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** Word-wrap into at most `max` lines that fit `width`. */
function lines(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= width) cur = next;
    else {
      if (cur) out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  if (out.length > max) {
    out.length = max;
    out[max - 1] = out[max - 1].replace(/\s*\S*$/, "") + "…";
  }
  return out;
}

export interface ImageClass {
  courseCode?: string;
  courseTitle?: string;
  slotVenue?: string;
  venue?: string;
  time: string;
}

export async function drawTimetablePng(
  map: Record<string, ImageClass[]>,
  opts: { title?: string; subtitle?: string } = {},
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
  const fTitle = family("font-title", "system-ui");
  const fMono = family("font-mono", "monospace");
  const fBody = family("font-label", "system-ui");

  const days = DAY_ORDER.filter((d, i) => i < 5 || (map[d]?.length ?? 0) > 0);
  const maxClasses = Math.max(1, ...days.map((d) => map[d]?.length ?? 0));
  const COL = 300;
  const GAP = 22;
  const PAD = 56;
  const CARD_H = 150;
  const HEAD = 230;
  const W = PAD * 2 + days.length * COL + (days.length - 1) * GAP;
  const H = HEAD + 70 + maxClasses * (CARD_H + 20) + 120;

  const scale = 1.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Paper + dot grid.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,30,29,0.10)";
  for (let y = 20; y < H; y += 28) for (let x = 20; x < W; x += 28) ctx.fillRect(x, y, 2.4, 2.4);

  // Header band.
  brutalCard(ctx, PAD, 40, W - PAD * 2 - 6, 150, TEAL);
  ctx.fillStyle = PAPER;
  ctx.font = `800 64px ${fTitle}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(opts.title ?? "My timetable", PAD + 36, 128);
  ctx.font = `500 26px ${fBody}`;
  ctx.fillStyle = SAGE;
  if (opts.subtitle) ctx.fillText(opts.subtitle, PAD + 38, 168);
  // Brand sticker.
  ctx.font = `700 26px ${fMono}`;
  const brand = "AmazeCC";
  const bw = ctx.measureText(brand).width + 40;
  const bx = W - PAD - 36 - bw;
  roundRect(ctx, bx, 84, bw, 54, 12);
  ctx.fillStyle = OCHRE;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(brand, bx + 20, 120);

  // Columns.
  days.forEach((day, di) => {
    const x = PAD + di * (COL + GAP);
    ctx.fillStyle = INK;
    ctx.font = `800 34px ${fTitle}`;
    ctx.fillText(DAY_NAME[day], x + 4, HEAD + 44);
    const classes = [...(map[day] ?? [])].sort(
      (a, b) => getAttendanceTimeRange(a.time).start - getAttendanceTimeRange(b.time).start,
    );
    if (!classes.length) {
      ctx.font = `700 26px ${fMono}`;
      ctx.fillStyle = MUTED;
      ctx.fillText("Free day", x + 4, HEAD + 100);
    }
    classes.forEach((c, ci) => {
      const y = HEAD + 70 + ci * (CARD_H + 20);
      brutalCard(ctx, x, y, COL - 6, CARD_H, CARD);
      ctx.fillStyle = TEAL;
      ctx.font = `700 24px ${fMono}`;
      ctx.fillText(c.time.replace("-", "–"), x + 20, y + 40);
      ctx.fillStyle = INK;
      ctx.font = `800 26px ${fTitle}`;
      const name = shortCourseName(c.courseTitle || c.courseCode || "", 40);
      lines(ctx, name, COL - 46, 2).forEach((l, li) => ctx.fillText(l, x + 20, y + 76 + li * 30));
      const room = c.slotVenue || c.venue;
      if (room) {
        ctx.fillStyle = MUTED;
        ctx.font = `600 21px ${fBody}`;
        ctx.fillText(room, x + 20, y + CARD_H - 18);
      }
    });
  });

  // Footer.
  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${fBody}`;
  ctx.fillText("Made with AmazeCC · amazecc.com", PAD, H - 44);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not draw the timetable"))), "image/png"),
  );
}

/** Share sheet on phones (straight into WhatsApp), download elsewhere. */
export async function shareTimetablePng(blob: Blob, filename = "AmazeCC-timetable.png"): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "My timetable" });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
