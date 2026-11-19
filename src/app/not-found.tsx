"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@amazecontinuityprojects/amazeui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@amazecontinuityprojects/amazeui";
import { HelpCircle, Bug } from "lucide-react";

export default function NotFoundPage() {
  const pathname = usePathname();

  return (
    <main className="min-h-screen w-full bg-surface-secondary px-4 text-foreground transition-colors duration-300 dark:bg-[#03060F] flex items-center justify-center py-10">
      <div className="w-full max-w-xl animate-in fade-in duration-300">
        <Card className="w-full border-border-strong dark:border-border card-surface shadow-2xl rounded-[14px] overflow-hidden relative text-center">
          {/* Subtle background gradient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary rounded-bl-full pointer-events-none -z-10" />

          <CardHeader className="pt-8">
            {/* Professional Search/404 Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-secondary dark:bg-secondary text-secondary-foreground text-secondary-foreground">
                <HelpCircle className="w-10 h-10 stroke-[2]" />
                <div className="absolute inset-0 rounded-full border border-border-ink animate-pulse duration-2000 pointer-events-none" />
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-text-muted font-[family-name:var(--font-outfit)]">
              Routing Error
            </p>
            <CardTitle className="text-xl md:text-2xl font-bold tracking-tight text-text-heading mt-1">
              Page not found
            </CardTitle>
            <CardDescription className="text-xs md:text-sm mt-2 text-text-muted font-medium max-w-sm mx-auto leading-relaxed">
              The requested resource does not exist, has been moved, or may be temporary unavailable.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 md:px-8 pb-8">
            <div className="rounded-2xl border border-border-muted dark:border-neutral-900 bg-surface-secondary dark:bg-neutral-950/20 p-4 text-xs font-semibold text-text-primary leading-relaxed text-left flex justify-between items-center">
              <span className="text-text-muted font-bold uppercase tracking-wider text-xs">Requested path</span>
              <span className="font-mono text-text-muted truncate max-w-[65%]">{pathname || "unknown"}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-xl font-bold text-xs py-2 min-h-11 px-6 cursor-pointer">
                <Link href="/">Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="rounded-xl font-bold text-xs py-2 min-h-11 px-6 cursor-pointer"
              >
                Go back
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl font-bold text-xs py-2 min-h-11 px-5 cursor-pointer gap-1.5 border-border-ink text-danger-foreground hover:bg-danger-surface dark:hover:bg-rose-950/20"
              >
                <Link href="/?tab=feedback&category=bug">
                  <Bug className="w-4 h-4" />
                  Report Bug
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
