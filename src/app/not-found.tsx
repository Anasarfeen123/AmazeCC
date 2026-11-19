"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ErrorScreen, { ERROR_LINK, ERROR_PRIMARY, ERROR_SECONDARY } from "@/components/custom/shared/ErrorScreen";

export default function NotFoundPage() {
  const pathname = usePathname();

  return (
    <ErrorScreen
      code="404"
      eyebrow="Page not found"
      title="Nothing lives here"
      description={
        <>
          <span className="block">
            The link may be old, or the page moved. Everything in AmazeCC is reachable from Home.
          </span>
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
          <Link href="/ffcs/" className={ERROR_LINK}>
            FFCS planner
          </Link>
        </>
      }
    />
  );
}
