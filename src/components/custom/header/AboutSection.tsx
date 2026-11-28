"use client";
import { Heart } from "lucide-react";
import BrandLogo from "../shared/BrandLogo";
import buildInfo from "@/data/buildInfo.json";

/**
 * Version and build identity for the About page.
 *
 * The app no longer advertises a package.json semver that drifted from the
 * running code anyway (the page once claimed v2.0.4 while the package was on
 * 3.x). The "version number" is now the commit id the running copy was cut
 * from — `#<short sha>` from the generated `buildInfo.json` — which is also
 * what the Live Changelog and every commit chip elsewhere label builds with,
 * so About, the log and history all speak the same identifier.
 *
 * `buildInfo.json` is written by `scripts/generate-build-info.js` before
 * dev/test/typecheck/build, so it is always current at the moment this
 * renders.
 */
const buildDate = new Date(`${buildInfo.date}T00:00:00`);

export function AboutSection() {
  const facts: [string, string][] = [
    ["Version", `#${buildInfo.commitHash}`],
    ["Updated", buildDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })],
    ["Platform", "Web app"],
  ];
  return (
    <section className="brutal-card brutal-card-hero rounded-[18px] p-6 sm:p-8">
      <BrandLogo size="xl" tagline />
      <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted">
        Attendance, marks, timetable and campus tools for VIT Chennai, in one place. Free, open source, made by
        students.
      </p>
      <dl className="mt-5 flex flex-wrap gap-2">
        {facts.map(([k, v]) => (
          <div
            key={k}
            className="rounded-[8px] border-2 border-border-ink bg-surface-secondary px-2.5 py-1 font-mono text-xs uppercase"
          >
            <dt className="inline text-text-muted">{k} </dt>
            <dd className="inline font-bold text-text-primary">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 flex items-center gap-1.5 font-label text-xs font-semibold text-text-muted">
        Made with <Heart className="h-3.5 w-3.5 fill-coral text-coral" aria-label="love" /> by students at VIT Chennai
      </p>
    </section>
  );
}
