"use client";

import Link from "next/link";
import { ShieldAlert, ShieldCheck, Eye, Trash2, Users, Lock } from "lucide-react";
import LegalLayout from "@/components/custom/legal/LegalLayout";
import { useOverlayBackBoundary } from "@/lib/overlayStack";

export default function FriendFinderDisclaimerView() {
  useOverlayBackBoundary("friend-finder-disclaimer");
  return (
    <LegalLayout
      active="friend-finder"
      eyebrow="Friend Finder"
      title="Friend Finder disclaimer"
      updated="June 2026"
      summary={[
        "Friend Finder is optional. Nothing is shared unless you tap Share and find classmates.",
        "Only students in the same sections as you can see you. There is no public list.",
        "What you share (name, registration number, sections) is visible to them; you are responsible for that choice.",
        "You can hide yourself or delete your profile at any time.",
      ]}
    >
      <article className="brutal-card space-y-8 rounded-[14px] p-5 text-text-primary sm:p-8">
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
              <strong>not affiliated with, authorized, endorsed, sponsored, or in any way officially connected</strong>{" "}
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
              Your timetable and identity are only registered in the section matching system if you explicitly initiate
              sharing by clicking <strong>&ldquo;Share and find classmates&rdquo;</strong>. If you do not opt in, no
              record of your enrolled classes is discoverable by peers.
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
                  Any personal information, real name, university registration number (e.g. <code>25BXX0001</code>), or
                  course schedule that you voluntarily choose to share with fellow students.
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
                A classmate can <em>only</em> see your profile in a specific section if they themselves are enrolled in
                that identical course, faculty, and slot.
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
              You retain immediate control over your information at all times directly from the Friend Finder interface:
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
              coordination. Any harassment, intimidation, stalking, unauthorized data collection, automated scraping, or
              misuse of classmate details will result in immediate termination of access and ban of associated
              credentials.
            </p>
          </section>

          {/* 7. Acceptance */}
          <section className="border-t border-border-ink pt-5 space-y-2">
            <h2 className="text-base font-bold text-text-heading font-outfit">7. Acknowledgement & Consent</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              By tapping &ldquo;Share and find classmates&rdquo;, publishing your timetable, or utilizing Friend Finder
              features, you explicitly declare that you have read, comprehended, and agreed to be legally bound by this
              Disclaimer, as well as AmazeCC&apos;s general{" "}
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
    </LegalLayout>
  );
}
