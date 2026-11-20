"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A silly little brick-breaker for when the internet is gone (and an easter
 * egg otherwise). No branding on purpose (user, 2026-11-20): just bricks,
 * a paddle and dumb one-liners.
 *
 * Canvas, no assets, colours from the theme tokens. Drag / move the pointer
 * or use the arrow keys to steer; tap or Space launches the ball. Best score
 * is kept in localStorage (per device, a convenience only).
 */

const BEST_KEY = "amazecc.bricks.best";
const W = 420;
const H = 300;
const PADDLE_W = 70;
const PADDLE_H = 10;
const BALL_R = 6;
const ROWS = 5;
const COLS = 8;
const GAP = 4;
const TOP = 34;
const BRICK_H = 14;

const MISS_LINES = [
  "skill issue",
  "the ball has left the chat",
  "bro dropped it",
  "that one was lag, surely",
  "physics said no",
  "not like this",
];
const CLEAR_LINES = [
  "absolutely demolished",
  "zero bricks left. touch grass",
  "the wall had a family",
  "certified brick hater",
];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

type Brick = { x: number; y: number; w: number; alive: boolean; hits: number; color: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}
function saveBest(n: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* private mode: just not kept */
  }
}

export default function BrickBreak({ onClose }: { onClose?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, best: 0, line: "tap to launch" });
  const g = useRef({
    px: W / 2 - PADDLE_W / 2,
    bx: W / 2,
    by: H - 40,
    vx: 0,
    vy: 0,
    stuck: true,
    score: 0,
    lives: 3,
    level: 1,
    over: false,
    shake: 0,
    bricks: [] as Brick[],
    sparks: [] as Spark[],
    keys: { left: false, right: false },
  });

  const palette = useRef({
    bg: "#fffdf8",
    ink: "#001e1d",
    text: "#001e1d",
    fills: ["#f9bc60", "#abd1c6", "#e16162", "#9ed9b5", "#4fb3a5"],
  });

  const buildLevel = useCallback((level: number) => {
    const bw = (W - 16 - GAP * (COLS - 1)) / COLS;
    const fills = palette.current.fills;
    const bricks: Brick[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // later levels: some bricks take two hits, and a few gaps for fun
        if (level > 1 && Math.random() < 0.08) continue;
        bricks.push({
          x: 8 + c * (bw + GAP),
          y: TOP + r * (BRICK_H + GAP),
          w: bw,
          alive: true,
          hits: level > 1 && r < Math.min(level - 1, 2) ? 2 : 1,
          color: fills[(r + level) % fills.length],
        });
      }
    }
    g.current.bricks = bricks;
  }, []);

  const resetBall = () => {
    const s = g.current;
    s.stuck = true;
    s.vx = 0;
    s.vy = 0;
    s.bx = s.px + PADDLE_W / 2;
    s.by = H - 40;
  };

  const newGame = useCallback(() => {
    const s = g.current;
    s.score = 0;
    s.lives = 3;
    s.level = 1;
    s.over = false;
    s.sparks = [];
    buildLevel(1);
    resetBall();
    setHud((h) => ({ ...h, score: 0, lives: 3, level: 1, line: "tap to launch" }));
  }, [buildLevel]);

  const launch = useCallback(() => {
    const s = g.current;
    if (s.over) {
      newGame();
      return;
    }
    if (!s.stuck) return;
    const speed = 4.2 + s.level * 0.5;
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    s.vx = Math.cos(a) * speed;
    s.vy = Math.sin(a) * speed;
    s.stuck = false;
    setHud((h) => ({ ...h, line: "" }));
  }, [newGame]);

  // keyboard: arrows steer, Space launches, Escape closes
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = g.current.keys;
      if (e.key === "ArrowLeft") k.left = true;
      else if (e.key === "ArrowRight") k.right = true;
      else if (e.key === " ") {
        e.preventDefault();
        launch();
      } else if (e.key === "Escape" && onClose) onClose();
    };
    const up = (e: KeyboardEvent) => {
      const k = g.current.keys;
      if (e.key === "ArrowLeft") k.left = false;
      else if (e.key === "ArrowRight") k.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [launch, onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    palette.current = {
      bg: token("--surface", "#fffdf8"),
      ink: token("--border-ink", "#001e1d"),
      text: token("--text-heading", "#001e1d"),
      fills: palette.current.fills,
    };
    setHud((h) => ({ ...h, best: readBest() }));
    buildLevel(1);
    resetBall();

    let raf = 0;
    const burst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        g.current.sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.8) * 4,
          life: 24 + Math.random() * 10,
          color,
        });
      }
    };

    const step = () => {
      const s = g.current;
      const P = palette.current;

      // paddle from keys
      if (s.keys.left) s.px -= 7;
      if (s.keys.right) s.px += 7;
      s.px = Math.max(0, Math.min(W - PADDLE_W, s.px));

      if (s.stuck && !s.over) {
        s.bx = s.px + PADDLE_W / 2;
        s.by = H - 26 - BALL_R;
      } else if (!s.over) {
        s.bx += s.vx;
        s.by += s.vy;
        if (s.bx < BALL_R || s.bx > W - BALL_R) {
          s.vx *= -1;
          s.bx = Math.max(BALL_R, Math.min(W - BALL_R, s.bx));
        }
        if (s.by < BALL_R + 22) {
          s.vy = Math.abs(s.vy);
        }
        // paddle: bounce angle depends on where it hits
        const py = H - 26;
        if (
          s.vy > 0 &&
          s.by + BALL_R >= py &&
          s.by + BALL_R <= py + PADDLE_H + 6 &&
          s.bx > s.px - 4 &&
          s.bx < s.px + PADDLE_W + 4
        ) {
          const t = (s.bx - (s.px + PADDLE_W / 2)) / (PADDLE_W / 2);
          const speed = Math.hypot(s.vx, s.vy);
          const a = -Math.PI / 2 + t * 1.05;
          s.vx = Math.cos(a) * speed;
          s.vy = Math.sin(a) * speed;
          s.by = py - BALL_R;
        }
        // bricks
        for (const b of s.bricks) {
          if (!b.alive) continue;
          if (
            s.bx + BALL_R > b.x &&
            s.bx - BALL_R < b.x + b.w &&
            s.by + BALL_R > b.y &&
            s.by - BALL_R < b.y + BRICK_H
          ) {
            const fromSide = s.bx < b.x || s.bx > b.x + b.w;
            if (fromSide) s.vx *= -1;
            else s.vy *= -1;
            b.hits -= 1;
            if (b.hits <= 0) {
              b.alive = false;
              s.score += 10 * s.level;
              burst(b.x + b.w / 2, b.y + BRICK_H / 2, b.color);
              s.shake = 5;
            } else {
              s.score += 2;
              s.shake = 2;
            }
            setHud((h) => ({ ...h, score: s.score }));
            break;
          }
        }
        // fell off
        if (s.by > H + 10) {
          s.lives -= 1;
          if (s.lives <= 0) {
            s.over = true;
            const best = Math.max(readBest(), s.score);
            if (s.score >= best) saveBest(s.score);
            setHud((h) => ({ ...h, lives: 0, best, line: `game over. ${pick(MISS_LINES)}. tap to retry` }));
          } else {
            setHud((h) => ({ ...h, lives: s.lives, line: `${pick(MISS_LINES)}. tap to launch` }));
            resetBall();
          }
        }
        // cleared
        if (s.bricks.every((b) => !b.alive)) {
          s.level += 1;
          buildLevel(s.level);
          resetBall();
          setHud((h) => ({ ...h, level: s.level, line: `${pick(CLEAR_LINES)}. level ${s.level}, tap to go` }));
        }
      }

      // draw
      const shakeX = s.shake ? (Math.random() - 0.5) * s.shake : 0;
      const shakeY = s.shake ? (Math.random() - 0.5) * s.shake : 0;
      s.shake = Math.max(0, s.shake - 0.5);
      ctx.save();
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.translate(shakeX, shakeY);

      for (const b of s.bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = P.ink;
        ctx.fillRect(b.x + 2, b.y + 2, b.w, BRICK_H);
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, BRICK_H);
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, b.w, BRICK_H);
        if (b.hits > 1) {
          ctx.fillStyle = P.ink;
          ctx.fillRect(b.x + b.w / 2 - 6, b.y + BRICK_H / 2 - 1, 12, 2);
        }
      }
      for (const p of s.sparks) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.life -= 1;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      s.sparks = s.sparks.filter((p) => p.life > 0);

      // paddle with hard shadow
      const py = H - 26;
      ctx.fillStyle = P.ink;
      ctx.fillRect(s.px + 3, py + 3, PADDLE_W, PADDLE_H);
      ctx.fillStyle = "#f9bc60";
      ctx.fillRect(s.px, py, PADDLE_W, PADDLE_H);
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.px, py, PADDLE_W, PADDLE_H);

      // ball (with a face, because why not)
      ctx.fillStyle = P.text;
      ctx.beginPath();
      ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.bg;
      ctx.fillRect(s.bx - 3, s.by - 2, 1.5, 1.5);
      ctx.fillRect(s.bx + 1.5, s.by - 2, 1.5, 1.5);

      ctx.restore();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [buildLevel]);

  const steerTo = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    g.current.px = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-heading">
        <span>{"♥".repeat(Math.max(0, hud.lives)) || "×"}</span>
        <span aria-live="polite">
          {hud.score} pts · lvl {hud.level}
        </span>
        <span className="text-text-muted">best {Math.max(hud.best, hud.score)}</span>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          steerTo(e.clientX);
          launch();
        }}
        onPointerMove={(e) => steerTo(e.clientX)}
        role="img"
        aria-label="Brick breaker. Move to steer the paddle, tap or press Space to launch."
        className="block w-full touch-none select-none rounded-[12px] border-2 border-border-ink shadow-brutal-sm"
        style={{ aspectRatio: `${W} / ${H}` }}
      />
      <p className="min-h-4 text-center font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
        {hud.line}
      </p>
    </div>
  );
}
