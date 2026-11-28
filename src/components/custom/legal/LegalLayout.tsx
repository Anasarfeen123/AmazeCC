"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import BrandLogo from "@/components/custom/shared/BrandLogo";
import ThemeToggle from "@/components/custom/ThemeToggle";

export type LegalTab = "privacy" | "terms" | "friend-finder";

const TABS: { id: LegalTab; label: string; short: string; href: string }[] = [
  { id: "privacy", label: "Privacy policy", short: "Privacy", href: "/privacy" },
  { id: "terms", label: "Terms of service", short: "Terms", href: "/terms" },
  { id: "friend-finder", label: "Friend Finder", short: "Friend Finder", href: "/friend-finder/disclaimer" },
];

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Shared shell for the legal pages (privacy, terms, Friend Finder
 * disclaimer): brand top bar with the three documents as tabs, a title block,
 * an "In short" summary, then numbered sections with a contents list on wide
 * screens. Plain words first; the detail sits in the sections.
 */
export default function LegalLayout({
  active,
  eyebrow,
  title,
  updated,
  summary,
  sections,
  children,
}: {
  active: LegalTab;
  eyebrow: string;
  title: string;
  updated: string;
  /** Three to six plain-language points shown above the full text. */
  summary?: ReactNode[];
  sections?: LegalSection[];
  /** Free-form body (used by pages that keep their own markup). */
  children?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="page-dots min-h-[100dvh] w-full bg-background text-text-primary">
      <header
        className="brand-sidebar sticky top-0 z-40 border-b-[3px] border-border-ink"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="AmazeCC home" className="flex shrink-0 items-center">
            <span className="sm:hidden">
              <BrandLogo size="sm" variant="mark" />
            </span>
            <span className="hidden sm:inline-flex">
              <BrandLogo size="sm" wordClassName="text-cream" />
            </span>
          </Link>
          <nav aria-label="Legal documents" className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const on = t.id === active;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex min-h-9 shrink-0 items-center rounded-[8px] border-2 px-2.5 font-mono text-xs font-bold uppercase tracking-[0.04em] ${
                    on
                      ? "border-obsidian bg-ochre text-obsidian"
                      : "border-transparent text-cream hover:border-border-ink"
                  }`}
                >
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.short}</span>
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0">{mounted && <ThemeToggle />}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <p className="w-fit rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-title text-[30px] font-extrabold leading-[1.05] text-text-heading sm:text-[44px]">
          {title}
        </h1>
        <p className="mt-2 font-label text-xs text-text-muted">Last updated {updated}</p>

        {summary && summary.length > 0 && (
          <section
            aria-labelledby="in-short"
            className="mt-8 rounded-[16px] border-[3px] border-border-ink bg-highlight p-5 text-highlight-foreground shadow-brutal-md sm:p-6"
          >
            <h2 id="in-short" className="font-display text-lg font-bold uppercase">
              In short
            </h2>
            <ul className="mt-3 space-y-2 text-base leading-relaxed">
              {summary.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="font-mono font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sections && sections.length > 0 ? (
          <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
            <nav aria-label="Contents" className="hidden lg:block">
              <div className="sticky top-24 space-y-1">
                <p className="mb-2 font-label text-xs font-semibold text-text-muted">Contents</p>
                {sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-[8px] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-secondary"
                  >
                    <span className="mr-2 font-mono text-xs text-text-muted">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                ))}
              </div>
            </nav>
            <div className="space-y-5">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="brutal-card scroll-mt-24 rounded-[14px] p-5 sm:p-6"
                  aria-labelledby={`${s.id}-h`}
                >
                  <h2
                    id={`${s.id}-h`}
                    className="flex items-baseline gap-3 font-display text-lg font-bold text-text-heading"
                  >
                    <span className="font-mono text-sm text-text-muted">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </h2>
                  <div className="legal-prose mt-3 space-y-3 text-[15px] leading-relaxed text-text-primary">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10">{children}</div>
        )}
      </main>
    </div>
  );
}
