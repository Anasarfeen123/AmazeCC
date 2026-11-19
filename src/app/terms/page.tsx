"use client";

import Link from "next/link";
import LegalLayout, { type LegalSection } from "@/components/custom/legal/LegalLayout";

/*
 * Plain-language terms. The data-handling paragraph must agree with the
 * privacy policy (/privacy), which was checked against the code; the old
 * version said the app "does not collect, store, or transmit any personal
 * information to any server", which was not true (sign-in goes through the
 * AmazeCC server; Social, Cab Share, uploads and feedback are stored).
 */

const sections: LegalSection[] = [
  {
    id: "what",
    title: "What AmazeCC is",
    body: (
      <p>
        AmazeCC is a free, open-source student project that helps you see and organise your VIT Chennai data from VTOP
        (attendance, marks, timetable, exams and more) and use campus tools built around it. It is{" "}
        <strong>not an official VIT product</strong> and is not affiliated with, endorsed by or supported by Vellore
        Institute of Technology or any of its departments.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account and VTOP",
    body: (
      <>
        <p>
          You sign in with your own VTOP account. You are responsible for it: use AmazeCC only with your own
          credentials, and preferably on devices and networks you trust.
        </p>
        <p>
          To fetch your data, your VTOP ID and password pass through the AmazeCC server to VTOP; the server does not
          save your password. The full details are in the <Link href="/privacy">privacy policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "fair-use",
    title: "Using AmazeCC fairly",
    body: (
      <ul>
        <li>Do not use AmazeCC to access anyone else&rsquo;s account or data.</li>
        <li>Do not try to overload, scrape or break AmazeCC, VTOP or other VIT services through it.</li>
        <li>
          Only upload or post what you have the right to share (question papers, club posts, Cab Share trips), and
          nothing abusive or misleading.
        </li>
        <li>We may remove content or limit access that breaks these rules.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Features where you share with others",
    body: (
      <p>
        Friend Finder, Social, Cab Share and club features are optional. When you use them, what you choose to share is
        visible to the other students the feature is designed for. You decide what to share and can remove it. Friend
        Finder has its own <Link href="/friend-finder/disclaimer">disclaimer</Link>; please read it before you opt in.
      </p>
    ),
  },
  {
    id: "payments",
    title: "Payments and other portals",
    body: (
      <p>
        AmazeCC never handles money. &ldquo;Pay now&rdquo; and similar buttons open the official payment or event
        portal, and anything you do there is under that portal&rsquo;s own terms. The same goes for VTOP, the Events
        portal, the library, Moodle and VITOL.
      </p>
    ),
  },
  {
    id: "accuracy",
    title: "No guarantees",
    body: (
      <>
        <p>
          AmazeCC is provided as is. It shows data as VTOP returns it and adds estimates (attendance predictions, grade
          predictions, class averages) that can be wrong. Always check anything important, like attendance shortage or
          exam details, on VTOP itself.
        </p>
        <p>
          The app may be unavailable, or features may stop working when VTOP or other VIT services change. The
          developers are not responsible for losses or decisions based on what AmazeCC shows.
        </p>
      </>
    ),
  },
  {
    id: "free",
    title: "Free and non-commercial",
    body: (
      <p>
        AmazeCC is free. It shows no ads and does not sell data. It is built by students for learning and to make campus
        life easier.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        We may update these terms as the app changes; the date at the top will change with them. Using AmazeCC after an
        update means you accept the new version.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms: <a href="mailto:sugeeth2007@gmail.com">sugeeth2007@gmail.com</a>.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      active="terms"
      eyebrow="Terms"
      title="Terms of service"
      updated="19 Nov 2026"
      summary={[
        "AmazeCC is a free student project. It is not an official VIT app.",
        "Use it only with your own VTOP account. You are responsible for that account.",
        "Predictions and averages are estimates: check anything important on VTOP.",
        "Only share or upload what you have the right to. Sharing features are optional.",
        "AmazeCC never handles payments; Pay now opens the official portal.",
      ]}
      sections={sections}
    />
  );
}
