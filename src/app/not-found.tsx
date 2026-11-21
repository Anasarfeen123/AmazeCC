"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ErrorScreen, { ERROR_PRIMARY, ERROR_SECONDARY } from "@/components/custom/shared/ErrorScreen";

export default function NotFoundPage() {
  const pathname = usePathname();

  return (
    <ErrorScreen
      code="404"
      title="This page took a wrong turn"
      description={
        <>
          <span className="block">The link may be old, or the page moved. Nothing you saved is lost.</span>
          {pathname ? (
            <span className="mt-3 inline-block max-w-full truncate rounded-[6px] border-2 border-border-ink bg-surface-secondary px-2 py-0.5 font-mono text-xs text-text-primary">
              {pathname}
            </span>
          ) : null}
        </>
      }
      actions={
        <>
          <Link href="/" className={ERROR_PRIMARY}>
            Go home
          </Link>
          <button type="button" onClick={() => window.history.back()} className={ERROR_SECONDARY}>
            Go back
          </button>
        </>
      }
      links={[
        { href: "/?tab=attendance-calendar", label: "Attendance", hint: "Your 75% line and how many you can skip" },
        { href: "/?tab=academics-grades", label: "Marks and grades", hint: "Every assessment with the class average" },
        { href: "/?tab=academics-schedule", label: "Exam schedule", hint: "Seats, venues and reporting times" },
        { href: "/ffcs/", label: "FFCS planner", hint: "Plan next semester, no sign-in needed" },
      ]}
    />
  );
}
