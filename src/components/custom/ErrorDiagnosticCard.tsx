"use client";

import React, { useState } from "react";
import { ErrorDiagnosticCard as BaseErrorDiagnosticCard, Button } from "@amazecontinuityprojects/amazeui";
import { Bug, Send, CheckCircle2, AlertTriangle } from "lucide-react";
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

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-xl">
        <BaseErrorDiagnosticCard {...props} />

        {/* Prominent Bug Report Action below Error Card */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsBugModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-danger-surface hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-border-ink text-xs font-bold text-danger-foreground shadow-sm transition-all cursor-pointer"
          >
            <Bug className="w-4 h-4 text-danger-foreground" />
            <span>Report this Bug to Developers</span>
          </button>
        </div>

        {/* Modal for reporting crash directly */}
        {isBugModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-surface border-2 border-border-ink p-6 shadow-2xl animate-in fade-in duration-200">
              {isSent ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-success-foreground mx-auto" />
                  <h3 className="font-bold text-base text-text-heading">Bug Report Sent!</h3>
                  <p className="text-xs text-text-muted">
                    Our team received your crash details and diagnostic logs. We will look into it immediately.
                  </p>
                  <Button
                    onClick={() => {
                      setIsBugModalOpen(false);
                      setIsSent(false);
                    }}
                    className="mt-4 text-xs font-bold rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendBugReport} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-danger-foreground font-bold text-sm">
                      <Bug className="w-4 h-4" />
                      <span>Report Crash / Bug</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBugModalOpen(false)}
                      className="text-text-muted hover:text-text-muted text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning-surface border border-border-ink text-xs text-amber-800 dark:text-warning-foreground">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-warning-foreground mt-0.5" />
                    <span>
                      Crash details (<strong className="font-mono">{props.error?.name || "Exception"}</strong>) will be
                      securely attached to your report.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      What were you doing when this happened? (optional)
                    </label>
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="e.g., opened attendance, switched semester..."
                      className="w-full rounded-xl border-2 border-border-ink bg-surface-secondary p-2.5 text-xs text-text-heading focus:outline-none focus:ring-1 focus:ring-rose-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Your Email (for developer updates)
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="personal@gmail.com"
                      className="w-full rounded-xl border-2 border-border-ink bg-surface-secondary p-2.5 text-xs text-text-heading focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {submissionError && (
                    <p role="alert" className="text-xs font-medium text-danger-foreground">
                      {submissionError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsBugModalOpen(false)}
                      className="text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSending}
                      className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSending ? "Submitting…" : "Send Bug Report"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
