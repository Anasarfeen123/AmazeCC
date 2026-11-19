"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, ShieldCheck, Eye, Trash2, Users, AlertTriangle, FileText, Lock } from "lucide-react";
import ThemeToggle from "@/components/custom/ThemeToggle";
import { useOverlayBackBoundary } from "@/lib/overlayStack";

export default function FriendFinderDisclaimerView() {
  useOverlayBackBoundary("friend-finder-disclaimer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full px-4 py-20 bg-surface-secondary dark:bg-[#03060F] transition-colors duration-300 relative overflow-hidden text-text-primary font-sans">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary dark:bg-secondary blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-warning-surface blur-[120px]" />
      </div>

      {/* Navigation Bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#03060F]/85 border-b border-border-ink transition-all"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/friend-finder"
              className="inline-flex items-center gap-2 text-xs font-bold text-text-primary hover:text-primary transition-colors py-1.5 px-3 rounded-xl bg-surface-secondary border-2 border-border-ink"
            >
              <ArrowLeft size={14} />
              <span>Back to Friend Finder</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-text-muted hover:text-text-heading px-2.5 py-1.5 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <ShieldCheck size={13} />
              <span>Privacy</span>
            </Link>
            <Link
              href="/terms"
              className="text-xs font-semibold text-text-muted hover:text-text-heading px-2.5 py-1.5 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <FileText size={13} />
              <span>Terms</span>
            </Link>
            {mounted && <ThemeToggle />}
          </div>
        </div>
      </nav>

      <div className="w-full max-w-3xl space-y-6 relative z-10 pt-6">
        {/* Header Alert Banner */}
        <div className="rounded-2xl border border-border-ink bg-warning-surface p-4 sm:p-5 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-warning-foreground shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed space-y-1">
            <p className="font-bold font-outfit text-sm sm:text-base">Voluntary Data Sharing & Liability Notice</p>
            <p className="text-amber-800/90 dark:text-warning-foreground">
              Timetable sharing on AmazeCC is entirely voluntary and opt-in. Please review how your registered course
              data is displayed to enrolled classmates and the boundaries of AmazeCC&apos;s responsibility.
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <article className="card-surface border border-border-ink rounded-[14px] p-6 sm:p-10 shadow-xl space-y-8 text-text-primary bg-surface">
          <header className="border-b border-border-ink pb-6 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-primary">
              Amaze Continuity Projects
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-heading leading-tight font-outfit">
              Friend Finder Disclaimer & Sharing Terms
            </h1>
            <p className="text-xs text-text-muted font-medium">
              Effective for Winter Semester 2026-2027 (CH20262705) · Last updated: June 2026
            </p>
          </header>

          <div className="space-y-7 text-sm leading-relaxed">
            {/* 1. Independent Platform */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-heading font-bold text-base font-outfit">
                <Lock className="w-4 h-4 text-primary" />
                <h2>1. Independent Platform & Non-Affiliation</h2>
              </div>
              <p>
                <strong>AmazeCC</strong> is an independent open-source suite of student tools built by Amaze Continuity
                Projects. AmazeCC is{" "}
                <strong>
                  not affiliated with, authorized, endorsed, sponsored, or in any way officially connected
                </strong>{" "}
                with Vellore Institute of Technology (VIT) or any of its campuses, schools, or administration.
              </p>
              <p className="text-xs text-text-muted">
                All course codes, faculty designations, and timetable formats are referenced strictly for academic
                scheduling convenience under fair academic utility.
              </p>
            </section>

            {/* 2. Voluntary Participation */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-heading font-bold text-base font-outfit">
                <Users className="w-4 h-4 text-success-foreground" />
                <h2>2. 100% Voluntary & Explicit Opt-In</h2>
              </div>
              <p>
                Using Friend Finder is <strong>strictly optional</strong>. Logging into AmazeCC or checking your VTOP
                timetable does <em>not</em> automatically share your classes with anyone.
              </p>
              <p>
                Your timetable and identity are only registered in the section matching system if you explicitly
                initiate sharing by clicking <strong>&ldquo;Share and find classmates&rdquo;</strong>. If you do not opt
                in, no record of your enrolled classes is discoverable by peers.
              </p>
            </section>

            {/* 3. Disclaimer of Liability */}
            <section className="space-y-3 rounded-2xl border border-border-ink bg-danger-surface p-4 sm:p-5">
              <div className="flex items-center gap-2 text-red-900 dark:text-danger-foreground font-bold text-base font-outfit">
                <ShieldAlert className="w-5 h-5 text-danger-foreground" />
                <h2>3. Complete Disclaimer of Liability for Shared Information</h2>
              </div>
              <div className="space-y-2 text-red-950/90 dark:text-red-200/90">
                <p>
                  <strong>
                    AmazeCC, its developers, contributors, and hosting providers bear NO RESPONSIBILITY OR LIABILITY
                  </strong>{" "}
                  for:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                  <li>
                    Any personal information, real name, university registration number (e.g. <code>25BXX0001</code>),
                    or course schedule that you voluntarily choose to share with fellow students.
                  </li>
                  <li>
                    Actions taken by other students or third parties who view, record, screenshot, copy, or redistribute
                    information that you made visible in shared classroom sections.
                  </li>
                  <li>
                    Unintended disclosures, personal disputes, scheduling conflicts, attendance discrepancies, or any
                    social or academic consequences resulting from timetable discovery.
                  </li>
                </ul>
                <p className="text-xs pt-1 font-semibold">
                  You assume full and sole responsibility for your choice to share your timetable sections with peers.
                </p>
              </div>
            </section>

            {/* 4. Limited & Reciprocal Visibility */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-heading font-bold text-base font-outfit">
                <Eye className="w-4 h-4 text-primary" />
                <h2>4. Reciprocal & Scoped Visibility Only</h2>
              </div>
              <p>
                Friend Finder operates on a <strong>reciprocal section boundary</strong> model:
              </p>
              <ul className="list-disc list-inside space-y-1 text-text-muted pl-1">
                <li>There is no public or global directory of students.</li>
                <li>
                  A classmate can <em>only</em> see your profile in a specific section if they themselves are enrolled
                  in that identical course, faculty, and slot.
                </li>
                <li>
                  Students who share zero sections with you can never see your timetable, presence, or registration
                  status.
                </li>
              </ul>
            </section>

            {/* 5. Complete User Control */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-heading font-bold text-base font-outfit">
                <Trash2 className="w-4 h-4 text-primary" />
                <h2>5. Instant Concealment & Permanent Deletion</h2>
              </div>
              <p>
                You retain immediate control over your information at all times directly from the Friend Finder
                interface:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border-2 border-border-ink bg-surface-secondary space-y-1">
                  <p className="font-bold text-text-heading text-xs">Toggle Hidden Mode</p>
                  <p className="text-xs text-text-muted">
                    Switch visibility from &ldquo;Visible&rdquo; to &ldquo;Hidden&rdquo; to vanish immediately from all
                    section rosters while retaining your matches.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-border-ink bg-surface-secondary space-y-1">
                  <p className="font-bold text-text-heading text-xs">Leave Friend Finder</p>
                  <p className="text-xs text-text-muted">
                    Click &ldquo;Leave Friend Finder&rdquo; to permanently remove your registrations, section links, and
                    timetable entries from the database.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Code of Conduct */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-heading font-bold text-base font-outfit">
                <ShieldCheck className="w-4 h-4 text-success-foreground" />
                <h2>6. Code of Conduct & Fair Use</h2>
              </div>
              <p>
                Friend Finder is created to foster positive academic collaboration, group study formation, and peer
                coordination. Any harassment, intimidation, stalking, unauthorized data collection, automated scraping,
                or misuse of classmate details will result in immediate termination of access and ban of associated
                credentials.
              </p>
            </section>

            {/* 7. Acceptance */}
            <section className="border-t border-border-ink pt-5 space-y-2">
              <h2 className="text-base font-bold text-text-heading font-outfit">7. Acknowledgement & Consent</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                By tapping &ldquo;Share and find classmates&rdquo;, publishing your timetable, or utilizing Friend
                Finder features, you explicitly declare that you have read, comprehended, and agreed to be legally bound
                by this Disclaimer, as well as AmazeCC&apos;s general{" "}
                <Link href="/terms" className="text-primary underline hover:opacity-80">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary underline hover:opacity-80">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>

          <footer className="pt-4 border-t border-border-ink flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/friend-finder"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:brightness-110 text-primary-foreground font-bold px-6 py-3 text-xs shadow-brutal-sm border-2 border-border-ink transition-all cursor-pointer"
            >
              <span>Return to Friend Finder</span>
            </Link>
            <span className="text-xs text-text-muted">Amaze Continuity Projects</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
