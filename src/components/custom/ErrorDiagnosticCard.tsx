"use client";

import React, { useState } from "react";
import { Bug, RotateCcw, Send } from "lucide-react";
import ErrorScreen, { ERROR_LINK, ERROR_PRIMARY, ERROR_SECONDARY } from "./shared/ErrorScreen";
import { sendPostHogSupportTicket } from "@/lib/posthog";
import { getTypedStorageItem, setTypedStorageItem } from "@/lib/storage";

export interface ErrorDiagnosticCardProps {
  title: string;
  description: string;
  error?: {
    name?: string;
    message?: string;
    digest?: string;
    stack?: string;
  };
  onRetry?: () => void;
  dashboardHref?: string;
}

/**
 * The crash page body (app/error.tsx, app/global-error.tsx): plain words,
 * Try again / Reload / Go home, an inline bug report (crash details attached
 * automatically) and the technical details tucked behind a disclosure.
 */
export default function ErrorDiagnosticCard(props: ErrorDiagnosticCardProps) {
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [userComment, setUserComment] = useState("");
  const [contactEmail, setContactEmail] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return getTypedStorageItem("amazecc_feedback_email") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSendBugReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSubmissionError("");
    try {
      const errorPayload = {
        name: props.error?.name || "Error",
        message: props.error?.message || "Unknown client error",
        stack: props.error?.stack || "",
        digest: props.error?.digest || "",
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      };

      const fullMessage = [
        `**Bug Report from Error Page**`,
        userComment.trim() ? `**User Notes**: ${userComment.trim()}` : "",
        `**Error Name**: ${errorPayload.name}`,
        `**Message**: ${errorPayload.message}`,
        errorPayload.digest ? `**Digest**: ${errorPayload.digest}` : "",
        `**URL**: ${errorPayload.url}`,
        `\`\`\`\n${errorPayload.stack.slice(0, 1000)}\n\`\`\``,
      ]
        .filter(Boolean)
        .join("\n\n");

      const result = await sendPostHogSupportTicket({
        category: "bug",
        message: fullMessage,
        contact: contactEmail.trim() || undefined,
        metadata: {
          error_name: errorPayload.name,
          error_message: errorPayload.message,
          error_digest: errorPayload.digest,
          source: "error_page",
        },
      });
      if (!result.success) {
        setSubmissionError("Could not send your report. Please try again.");
        return;
      }

      if (contactEmail.trim() && typeof window !== "undefined") {
        try {
          setTypedStorageItem("amazecc_feedback_email", contactEmail.trim());
        } catch {}
      }

      setIsSent(true);
    } catch (err) {
      console.error("Failed to send bug report from error page", err);
      setSubmissionError("Could not send your report. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const details = [
    `Error: ${props.error?.name || "Error"}: ${props.error?.message || "Unknown client error"}`,
    props.error?.digest ? `Digest: ${props.error.digest}` : "",
    `Page: ${typeof window !== "undefined" ? window.location.href : ""}`,
    `Time: ${new Date().toISOString()}`,
    `Online: ${typeof navigator !== "undefined" ? String(navigator.onLine) : "unknown"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(`${details}\n\n${props.error?.stack ?? ""}`.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const field =
    "w-full rounded-[10px] border-2 border-border-ink bg-surface-secondary p-3 text-base text-text-primary placeholder:text-text-muted sm:text-sm";

  return (
    <ErrorScreen
      code="Oops"
      codeTone="coral"
      eyebrow="Something went wrong"
      title={props.title}
      description={props.description}
      actions={
        <>
          {props.onRetry ? (
            <button type="button" onClick={props.onRetry} className={ERROR_PRIMARY}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          ) : null}
          <button type="button" onClick={() => window.location.reload()} className={ERROR_SECONDARY}>
            Reload page
          </button>
          <a href={props.dashboardHref ?? "/"} className={ERROR_LINK}>
            Go home
          </a>
        </>
      }
    >
      <div className="mt-6 border-t-2 border-border-ink pt-5">
        {isSent ? (
          <div role="status" className="rounded-[12px] border-2 border-border-ink bg-mint p-4 text-obsidian">
            <p className="font-display text-lg font-bold uppercase">Bug report sent</p>
            <p className="mt-1 text-sm">Thanks. The crash details went with it, so we can find and fix this.</p>
          </div>
        ) : isBugModalOpen ? (
          <form onSubmit={handleSendBugReport} className="space-y-4" aria-label="Report this bug">
            <p className="text-sm text-text-muted">
              The technical details below are attached automatically. A line about what you were doing helps a lot.
            </p>
            <label className="block">
              <span className="mb-1 block font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                What were you doing? (optional)
              </span>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="e.g., opened attendance, switched semester..."
                className={field}
                rows={3}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                Email for a reply (optional)
              </span>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="personal@gmail.com"
                className={field}
              />
            </label>
            {submissionError && (
              <p
                role="alert"
                className="rounded-[10px] border-2 border-border-ink bg-coral p-3 text-sm font-semibold text-obsidian"
              >
                {submissionError}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={isSending} className={`${ERROR_PRIMARY} disabled:opacity-60`}>
                <Send className="h-4 w-4" aria-hidden />
                {isSending ? "Sending…" : "Send bug report"}
              </button>
              <button type="button" onClick={() => setIsBugModalOpen(false)} className={ERROR_LINK}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setIsBugModalOpen(true)} className={ERROR_SECONDARY}>
            <Bug className="h-4 w-4" aria-hidden />
            Report this bug
          </button>
        )}

        <details className="group mt-5">
          <summary className="cursor-pointer list-none font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted hover:text-text-primary">
            <span className="group-open:hidden">Show technical details</span>
            <span className="hidden group-open:inline">Hide technical details</span>
          </summary>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[10px] border-2 border-border-ink bg-surface-secondary p-3 font-mono text-xs text-text-primary">
            {details}
          </pre>
          <button type="button" onClick={copyDetails} className={`${ERROR_LINK} mt-1`}>
            {copied ? "Copied" : "Copy details"}
          </button>
        </details>
      </div>
    </ErrorScreen>
  );
}
