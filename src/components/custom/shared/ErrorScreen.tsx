"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { getAssetPath } from "@/lib/utils";

/**
 * Full-page shell for every "something went wrong" moment: 404, crash and
 * offline. Brand page background, the campus art in a tilted frame with the
 * big stamped code (404 / Oops / Offline) overlapping it, a plain-language
 * title and sentence, the actions, and optional "where to next" links.
 *
 * Phones: art on top, card below. Desktop: card left, art right.
 * The heading carries itself (no eyebrow label above it).
 */
export interface ErrorScreenLink {
  href: string;
  label: string;
  hint: string;
}

export default function ErrorScreen({
  code,
  codeTone = "ochre",
  title,
  description,
  actions,
  links,
  children,
}: {
  /** Big stamp, e.g. "404", "Oops" or "Offline". */
  code: string;
  codeTone?: "ochre" | "coral" | "sage";
  /** Kept for older callers; not rendered (the stamp already says it). */
  eyebrow?: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  /** Useful places to go instead, shown as a short list under the actions. */
  links?: ErrorScreenLink[];
  children?: ReactNode;
}) {
  const stampTone = codeTone === "coral" ? "bg-coral" : codeTone === "sage" ? "bg-sage" : "bg-ochre";

  return (
    <main className="page-dots flex min-h-[100dvh] w-full flex-col bg-background px-4 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-text-primary sm:px-8">
      <header className="mx-auto w-full max-w-5xl">
        <Link href="/" aria-label="AmazeCC home" className="inline-flex min-h-11 items-center">
          <BrandLogo size="md" />
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Art + stamp. Above the card on phones, to the right on desktop. */}
        <div className="relative mx-auto w-full max-w-md lg:order-2 lg:max-w-none" aria-hidden="true">
          <div className="rotate-[2deg] overflow-hidden rounded-[22px] border-[3px] border-border-ink bg-ochre shadow-brutal-lg">
            <img
              src={getAssetPath("/landing/campus-day.webp")}
              alt=""
              width={1672}
              height={941}
              decoding="async"
              className="aspect-[16/9] h-auto w-full object-cover object-[30%_60%] dark:hidden"
            />
            <img
              src={getAssetPath("/landing/campus-night.webp")}
              alt=""
              width={1671}
              height={941}
              decoding="async"
              className="hidden aspect-[16/9] h-auto w-full object-cover object-[30%_60%] dark:block"
            />
          </div>
          <span
            className={`absolute -bottom-5 -left-2 -rotate-3 rounded-[12px] border-[3px] border-obsidian px-4 py-1.5 font-display text-[48px] font-bold leading-none text-obsidian shadow-brutal-md sm:-left-4 sm:text-[64px] ${stampTone}`}
          >
            {code}
          </span>
        </div>

        <section className="brutal-card brutal-card-hero rounded-[18px] p-6 sm:p-8 lg:order-1">
          <h1 className="font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading [text-wrap:balance] sm:text-[36px]">
            {title}
          </h1>
          <div className="mt-3 max-w-[60ch] text-base leading-relaxed text-text-muted">{description}</div>

          <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>

          {links && links.length > 0 ? (
            <nav aria-label="Where to next" className="mt-7 border-t-2 border-border-ink pt-5">
              <h2 className="font-display text-base font-bold uppercase text-text-heading">Where were you headed?</h2>
              <ul className="mt-2 divide-y-2 divide-border-muted">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={getAssetPath(link.href)}
                      className="group flex min-h-12 items-center gap-3 rounded-[8px] px-1 py-2 hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-bold uppercase text-text-heading">
                          {link.label}
                        </span>
                        <span className="block text-sm text-text-muted">{link.hint}</span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {children}
        </section>
      </div>
    </main>
  );
}

/** Brand button styles for ErrorScreen actions (also used as link classes). */
export const ERROR_PRIMARY =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-[3px] border-border-ink bg-highlight px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-md brutal-press cursor-pointer";
export const ERROR_SECONDARY =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-2 border-border-ink bg-surface px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm brutal-press cursor-pointer";
export const ERROR_LINK =
  "inline-flex min-h-11 items-center gap-2 px-1 font-mono text-sm font-bold uppercase tracking-[0.06em] text-text-primary underline underline-offset-4 cursor-pointer";
