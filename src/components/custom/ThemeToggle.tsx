"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

/**
 * Light <-> dark switch: a soft cross-fade (CSS in globals.css, view
 * transitions); instant where unsupported or under reduced motion.
 *
 * Two things made the old switch look wrong: hundreds of elements carry
 * `transition-all`/`transition-colors`, so after the reveal every surface
 * faded again at its own speed (a staggered, muddy second animation); and
 * reduced-motion users got the full circle anyway. Now CSS transitions are
 * paused for the swap (`.theme-switching`, brand.css), the root class flips
 * synchronously inside the view transition, and reduced motion is an instant
 * swap.
 */
export function animateThemeCircularExpansion(
  event: React.MouseEvent<HTMLElement> | MouseEvent | null,
  newTheme: string,
  setTheme: (val: string) => void,
) {
  if (typeof document === "undefined") {
    setTheme(newTheme);
    return;
  }
  const root = document.documentElement;
  const applyRootClass = () => {
    root.classList.toggle("dark", newTheme === "dark");
    root.style.colorScheme = newTheme === "dark" ? "dark" : "light";
  };
  const pauseTransitions = () => root.classList.add("theme-switching");
  const resumeTransitions = () => {
    // Two frames: let the new colours paint before transitions come back.
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  };

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const supportsVT = typeof (document as any).startViewTransition === "function";

  if (reduceMotion || !supportsVT) {
    pauseTransitions();
    applyRootClass();
    setTheme(newTheme);
    resumeTransitions();
    return;
  }

  pauseTransitions();
  const transition = (document as any).startViewTransition(() => {
    applyRootClass();
    setTheme(newTheme);
  });

  transition.finished.finally(resumeTransitions);
}

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // next-themes only knows the saved theme in the browser. Keep the first
  // client render identical to the server render, then show the actual theme.
  const isDark = mounted && theme === "dark";

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const targetTheme = isDark ? "light" : "dark";
    animateThemeCircularExpansion(e, targetTheme, setTheme);
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={!mounted}
      className={`relative inline-flex min-h-11 min-w-11 items-center justify-center p-2 rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press cursor-pointer select-none group ${className}`}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative flex items-center justify-center gap-2 px-0.5">
        <motion.div
          key={theme}
          initial={{ rotate: -45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="h-4.5 w-4.5 stroke-[2.2] text-primary" aria-hidden />
          ) : (
            <Moon className="h-4.5 w-4.5 stroke-[2.2] text-primary" aria-hidden />
          )}
        </motion.div>

        {showLabel && (
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] pr-1">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        )}
      </div>
    </motion.button>
  );
}
