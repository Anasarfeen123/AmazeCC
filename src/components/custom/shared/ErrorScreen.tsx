"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import BrandLogo from "./BrandLogo";

/**
 * Full-page shell for the 404 and crash pages: logo, a big stamped code
 * (404 / a short word), a plain-language title and sentence, then actions.
 * One brand look for every "something went wrong" moment.
 */
export default function ErrorScreen({
  code,
  codeTone = "ochre",
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  /** Big stamp, e.g. "404" or "Oops". */
  code: string;
  codeTone?: "ochre" | "coral";
  eyebrow: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-10 text-text-primary">
      <div className="w-full max-w-xl">
        <Link href="/" aria-label="AmazeCC home" className="mb-6 inline-flex">
          <BrandLogo size="md" />
        </Link>

        <section className="brutal-card brutal-card-hero rounded-[18px] p-6 sm:p-8">
          <span
            aria-hidden
            className={`inline-block -rotate-2 rounded-[10px] border-[3px] border-obsidian px-3 py-1 font-display text-[44px] font-bold leading-none text-obsidian shadow-brutal-sm sm:text-[56px] ${
              codeTone === "coral" ? "bg-coral" : "bg-ochre"
            }`}
          >
            {code}
          </span>

          <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">{eyebrow}</p>
          <h1 className="mt-1 font-display text-[26px] font-bold uppercase leading-tight text-text-heading sm:text-[32px]">
            {title}
          </h1>
          <div className="mt-3 max-w-md text-base leading-relaxed text-text-muted">{description}</div>

          <div className="mt-6 flex flex-wrap gap-3">{actions}</div>

          {children}
        </section>
      </div>
    </main>
  );
}

/** Brand button styles for ErrorScreen actions (also used as link classes). */
export const ERROR_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-2 border-border-ink bg-primary px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-sm brutal-press cursor-pointer";
export const ERROR_SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-2 border-border-ink bg-surface px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm brutal-press cursor-pointer";
export const ERROR_LINK =
  "inline-flex min-h-11 items-center gap-2 px-1 font-mono text-sm font-bold uppercase tracking-[0.06em] text-text-primary underline underline-offset-4 cursor-pointer";
