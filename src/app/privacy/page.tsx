"use client";

import Link from "next/link";
import LegalLayout, { type LegalSection } from "@/components/custom/legal/LegalLayout";

/*
 * Every statement here was checked against the code on 2026-11-19
 * (frontend + amazecc-api). If you change how data flows, update this page in
 * the same change. Sources:
 *   - credentials vault: src/lib/credentialVault.ts (AES-GCM, this browser)
 *   - VTOP sign-in relay: api/src/app/api/login/route.ts (password passed to
 *     VTOP, not stored)
 *   - class statistics: api/src/lib/marksStats.ts (running averages only)
 *   - analytics: src/lib/posthog.ts (identify by registration number + name,
 *     autocapture off, session recording off unless you start a bug
 *     recording), Google Analytics in src/app/layout.tsx
 *   - server tables: social_*, cabshare_*, push_subscriptions,
 *     papers_archive/qbank_*, gorobo_*, club_* in amazecc-api
 */

const sections: LegalSection[] = [
  {
    id: "on-device",
    title: "What stays on your device",
    body: (
      <>
        <p>
          Your VTOP user ID and password are saved <strong>encrypted in this browser</strong> (AES-GCM, with a key that
          cannot be read out of the browser), so you do not have to sign in every time.
        </p>
        <p>
          The academic data AmazeCC fetches for you (attendance, marks, grades, timetable, exams, payments and so on),
          your settings, and the app&rsquo;s cache are stored in this browser&rsquo;s local storage. Signing out, or
          clearing this site&rsquo;s data in your browser, removes all of it.
        </p>
      </>
    ),
  },
  {
    id: "sign-in",
    title: "How signing in works",
    body: (
      <>
        <p>
          VTOP has no public API, so the AmazeCC server signs in to VTOP for you. When you sign in or sync, your VTOP
          user ID and password are sent over an encrypted (HTTPS) connection to the AmazeCC server, which passes them to
          VTOP, solves the captcha, and returns your data to your device.
        </p>
        <p>
          The server <strong>does not save your VTOP password</strong>. The data it fetches is sent back to you; it is
          not kept in a database except for the features listed in &ldquo;What the AmazeCC server keeps&rdquo; below.
        </p>
        <p>
          <strong>Amaze ID</strong> is an optional AmazeCC account that links your AmazeCC apps. If you create one, your
          account details and the link to your VTOP registration number are stored by AmazeCC.
        </p>
      </>
    ),
  },
  {
    id: "server",
    title: "What the AmazeCC server keeps",
    body: (
      <>
        <p>Only when you use these features, and only what each one needs:</p>
        <ul>
          <li>
            <strong>Friend Finder / Social:</strong> if you choose to share, your name, registration number, the
            sections you are enrolled in and any handles you add, so classmates in the same sections can find you. See
            the <Link href="/friend-finder/disclaimer">Friend Finder disclaimer</Link>.
          </li>
          <li>
            <strong>Cab Share:</strong> the trips you post or join and what you choose to show on them.
          </li>
          <li>
            <strong>Push notifications:</strong> your browser&rsquo;s push subscription, if you turn notifications on.
          </li>
          <li>
            <strong>Question papers:</strong> papers you choose to upload to the question bank.
          </li>
          <li>
            <strong>Clubs, events and GoRoBo:</strong> the posts, orders and details you submit there.
          </li>
          <li>
            <strong>Feedback and bug reports:</strong> your message, the email you give (optional) and the technical
            details of the error, so we can reply and fix it.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "statistics",
    title: "Class statistics for grade prediction",
    body: (
      <p>
        To show class averages in the grade predictor, your marks are sent to the server, which updates running averages
        for each course (a mean and spread) and then discards your individual marks. Your marks are not stored or linked
        to you.
      </p>
    ),
  },
  {
    id: "analytics",
    title: "Analytics and error tracking",
    body: (
      <>
        <p>
          <strong>Google Analytics</strong> collects anonymous, aggregate usage: pages visited, device type and similar.
        </p>
        <p>
          <strong>PostHog</strong> (through shoot.amazecc.com) is used to find and fix errors and to understand which
          features are used. When you are signed in it is linked to your <strong>registration number and name</strong>,
          so we can trace a bug to the account it happened on. It does not record your screen: session recording is off
          unless you start a bug recording yourself from the feedback screen, and it does not capture what you type.
        </p>
        <p>We do not sell your data, show ads, or share analytics with anyone else.</p>
      </>
    ),
  },
  {
    id: "other-sites",
    title: "Other services you reach through AmazeCC",
    body: (
      <p>
        Some features talk to other VIT services on your behalf (VTOP, the Events portal, the library, Moodle, VITOL).
        &ldquo;Pay now&rdquo; buttons open the official payment page; AmazeCC never handles payments. Those services
        have their own policies.
      </p>
    ),
  },
  {
    id: "your-choices",
    title: "Your choices",
    body: (
      <ul>
        <li>Sign out or clear this site&rsquo;s data to remove everything stored on your device.</li>
        <li>Hide yourself or delete your Friend Finder profile at any time from Friend Finder.</li>
        <li>Turn push notifications off in Settings or your browser.</li>
        <li>
          To delete data the server keeps for you (Amaze ID, Social, Cab Share, feedback), email us and we will remove
          it.
        </li>
      </ul>
    ),
  },
  {
    id: "open-source",
    title: "Open source",
    body: (
      <p>
        AmazeCC is an open-source student project. Anyone can read the code to check how data is handled. Contributors
        follow the project&rsquo;s license.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions or deletion requests: <a href="mailto:sugeeth2007@gmail.com">sugeeth2007@gmail.com</a>. We will update
        this page when how AmazeCC handles data changes, and change the date above.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      active="privacy"
      eyebrow="Privacy"
      title="Privacy policy"
      updated="19 Nov 2026"
      summary={[
        "Your VTOP password is saved encrypted in your browser, and your academic data stays on your device.",
        "To sign in, the AmazeCC server relays your ID and password to VTOP over HTTPS. It does not save your password.",
        "The server only keeps what you choose to share: Friend Finder, Cab Share, uploads, feedback, notifications.",
        "Error tracking (PostHog) is linked to your registration number and name. No ads, nothing sold.",
        "Sign out to clear your device; email us to delete anything on the server.",
      ]}
      sections={sections}
    />
  );
}
