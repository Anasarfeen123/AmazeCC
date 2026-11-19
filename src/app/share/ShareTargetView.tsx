"use client";

import { useState } from "react";
import { Copy, Check, Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Receives the payload from `share_target` and offers a copy affordance.
 * The payload is display-only: it is never persisted, authed, or routed by.
 */
export default function ShareTargetView() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const title = (searchParams.get("title") ?? "").trim();
  const url = (searchParams.get("url") ?? "").trim();
  const text = (searchParams.get("text") ?? "").trim();

  // Only http(s) URLs are echoed back — anything else is dropped rather than
  // handed to a link the user can't vet.
  const safeUrl = /^https?:\/\//i.test(url) ? url : undefined;

  const shared = [title, text, safeUrl].filter(Boolean).join("\n");
  const hasShared = shared.length > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shared);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-secondary dark:bg-[#03060F] px-4 py-16">
      <div className="w-full max-w-md rounded-[14px] border-2 border-border-ink bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
            <Copy size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-text-heading font-outfit tracking-tight">Shared with AmazeCC</h1>
            <p className="text-xs text-text-muted">Received from another app</p>
          </div>
        </div>

        {!hasShared ? (
          <p className="text-sm text-text-muted leading-relaxed">The share arrived empty — nothing was attached.</p>
        ) : (
          <div className="space-y-2.5">
            {title && (
              <div className="rounded-xl bg-surface-secondary border-2 border-border-ink p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Title</span>
                <p className="text-sm font-bold text-text-heading">{title}</p>
              </div>
            )}
            {text && (
              <div className="rounded-xl bg-surface-secondary border-2 border-border-ink p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Text</span>
                <p className="text-sm font-medium text-text-primary whitespace-pre-wrap break-words">{text}</p>
              </div>
            )}
            {safeUrl && (
              <div className="rounded-xl bg-surface-secondary border-2 border-border-ink p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Link</span>
                <p className="text-sm font-medium text-primary break-all">{safeUrl}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={copy}
            disabled={!hasShared}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Check size={16} /> {copied ? "Copied" : "Copy to clipboard"}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-surface-secondary hover:bg-surface-hover text-text-primary text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Home size={16} /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
