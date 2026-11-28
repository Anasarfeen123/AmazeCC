"use client";

import { getAssetPath } from "@/lib/utils";

/**
 * The screens a first-time visitor sees *before* the five onboarding steps:
 *
 *   login  →  full-sync progress  →  welcome  →  (hand-off to the steps)
 *
 * They share the onboarding hero's design language (brand canvas that follows
 * light/dark, display type, ink-edged cards) so
 * sign-in reads as page one of onboarding rather than a modal bolted on top.
 *
 * The sync screen replaces the sync-engine bottom sheet for the first login:
 * it subscribes to the very same session store the sheet uses, so it reports
 * real progress (and real failures) without a popup covering the hero.
 */

import { useEffect, useRef, useState } from "react";
import BrandLogo from "../shared/BrandLogo";
import OnboardingBackdrop from "./OnboardingBackdrop";
import { useAtomValue } from "jotai";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Server,
} from "lucide-react";
import { getStoredUser, signInInteractive, signOutApp, type StoredUser } from "@/lib/oauth2";
import { isLoggedInAtom } from "@/store";
import { useSyncSession, type SyncLogLine } from "@/lib/sync-engine/sync-session";
import { classifyAuthFailure, type AuthFailureKind } from "@/lib/sync-engine/errors";
import { getActiveApiUrl, setActiveApiUrl, PRIMARY_API_URL, BACKUP_API_URL } from "@/lib/fetch-utils";
import { listMounts, mountServes, getPreferredMount, setPreferredMount } from "@/lib/apis/registry";
import { useUniccTarget, setUniccTarget } from "@/lib/useUniccTarget";
import SelectField from "../shared/primitives/SelectField";

export type IntroPhase = "login" | "sync" | "welcome";

export interface IntroLogin {
  username: string;
  password: string;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  /** Resolves `true` when the sign-in landed; `false` when it was rejected. */
  onSignIn: () => Promise<boolean>;
  /** Reason the last attempt failed, straight from the sync log. */
  error: string | null;
  /**
   * Opens the credential editor ("Change Password"). Only offered for the
   * failures a new password actually fixes — see `classifyAuthFailure`.
   */
  onChangePassword?: () => void;
}

interface OnboardingIntroProps {
  initialPhase: Exclude<IntroPhase, "sync">;
  login: IntroLogin;
  /** Called once the student continues past the welcome screen. */
  onDone: () => void;
}

/** Don't flash past the loading screen on a warm cache — but don't stall either. */
const MIN_SYNC_FACE_MS = 1400;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    // Brand page background (dot grid + glows, brand.css) and the campus art
    // along the bottom edge, faded (user: "no background in sign in?").
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background px-4 text-text-primary select-none animate-in fade-in duration-200 sm:px-8">
      <OnboardingBackdrop />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+1.75rem)] sm:pb-[calc(env(safe-area-inset-bottom,0px)+1.75rem)]">
        {children}
      </div>
    </div>
  );
}

function Brand() {
  return <BrandLogo size="md" tagline />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="font-label text-sm font-semibold text-text-muted">{children}</label>;
}

const inputClass =
  // text-base: iOS zooms the page when a field under 16px is focused.
  "min-h-12 w-full rounded-[10px] border-2 border-border-ink bg-background px-4 py-2.5 text-base font-bold text-text-heading transition-colors placeholder:font-normal placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ochre sm:text-sm";

const ctaClass =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border-[3px] border-border-ink bg-primary px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-md brutal-press cursor-pointer disabled:opacity-70";

export default function OnboardingIntro({ initialPhase, login, onDone }: OnboardingIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>(initialPhase);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const syncStartedAt = useRef(0);

  const [activeApi, setActiveApi] = useState("");
  const uniccTarget = useUniccTarget();
  // Only mounts that can serve the login op (vtop) are shown as sign-in targets.
  const mountOptions = listMounts().filter((m) => mountServes(m.id, "login", "vtop"));
  const preferredMount = getPreferredMount();
  const targetValue = mountOptions.some((m) => m.id === preferredMount)
    ? (preferredMount as string)
    : uniccTarget === "unicc"
      ? "unicc"
      : activeApi === BACKUP_API_URL
        ? (mountOptions.find((m) => m.id === "legacy")?.id ?? mountOptions[0]?.id ?? "hono")
        : (mountOptions.find((m) => m.id === "hono")?.id ?? mountOptions[0]?.id ?? "hono");
  const [amazeIdUser, setAmazeIdUser] = useState<StoredUser | null>(null);

  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const session = useSyncSession();

  useEffect(() => {
    setActiveApi(getActiveApiUrl());
    setAmazeIdUser(getStoredUser());
  }, []);

  const handleApiChange = (mountId: string) => {
    // The picker selects the preferred mount for every op it serves; other ops
    // fall through the ordered chain as usual. UniCC additionally flips the
    // legacy failover order (its allowlisted nine first).
    const chosen = listMounts().find((m) => m.id === mountId);
    if (!chosen) return;
    setPreferredMount(mountId);
    if (mountId === "unicc") {
      setUniccTarget("unicc");
      setActiveApi(PRIMARY_API_URL);
      setActiveApiUrl(PRIMARY_API_URL);
      return;
    }
    setUniccTarget("amazecc");
    setActiveApiUrl(chosen.baseUrl);
    setActiveApi(chosen.baseUrl);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!login.username.trim() || !login.password) {
      setLocalError("Enter your VTOP user ID and password to continue.");
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    syncStartedAt.current = Date.now();
    setPhase("sync");
    const ok = await login.onSignIn();
    setSubmitting(false);
    if (!ok) setPhase("login");
  };

  // Full sync → welcome. The session reports per-module progress, and the run
  // only counts as "some data" once the app is actually signed in (or the run
  // reported success), so a failed attempt bounces back to the login page.
  useEffect(() => {
    if (phase !== "sync") return;

    if (session.outcome === "error" && !isLoggedIn) {
      setPhase("login");
      return;
    }

    const ready = isLoggedIn || session.outcome === "success";
    if (!ready) return;

    const elapsed = Date.now() - syncStartedAt.current;
    const timer = setTimeout(() => setPhase("welcome"), Math.max(0, MIN_SYNC_FACE_MS - elapsed));
    return () => clearTimeout(timer);
  }, [phase, isLoggedIn, session.outcome]);

  // A retry can also start somewhere other than this form's Continue button —
  // most importantly the "Change Password" editor, which re-runs the login with
  // the freshly saved credentials. Follow it onto the sync screen so the student
  // watches the retry instead of staring at a login form.
  useEffect(() => {
    if (phase !== "login" || submitting) return;
    if (session.open && session.outcome === null) setPhase("sync");
  }, [phase, submitting, session.open, session.outcome]);

  // Why the sign-in was rejected, as far as the message can say. The same
  // classifier the sync sheet uses, so the two screens never give different
  // advice: a named bad password gets a "Change Password" fix here, while a
  // captcha / rate limit / bare "login failed" can only be resolved on VTOP.
  const authFailure: AuthFailureKind | null = (() => {
    let kind: AuthFailureKind | null = null;
    for (const line of session.lines) {
      if (line.status !== "error") continue;
      const found = classifyAuthFailure(line.text);
      // A named bad password is the more specific answer, so it wins.
      if (found === "bad-credentials") return found;
      if (found) kind = found;
    }
    return kind;
  })();

  // `login.error` only knows about failures from the Continue button. A retry
  // started by the credential editor reports through the session log instead,
  // so fall back to the last line the run actually wrote.
  const lastSessionError = [...session.lines].reverse().find((line) => line.status === "error")?.text ?? null;
  const error = localError ?? login.error ?? lastSessionError;

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 py-2">
        {phase === "login" && (
          <div className="grid w-full animate-in fade-in slide-in-from-bottom-4 duration-300 gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
            {/* Amaze ID — one account for every AmazeCC app */}
            {/* Phones: after the VTOP form (it was the first thing on screen, above
                the heading, and pushed the form below the fold). */}
            <div className="brand-sidebar order-last rounded-[14px] border-[3px] border-border-ink p-4 shadow-brutal-md sm:p-5 lg:order-first lg:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-label text-xs font-bold text-ochre">Amaze ID</p>
                    <p className="font-display text-base font-bold text-cream">One account for every AmazeCC app</p>
                    <p className="text-sm text-text-muted">
                      Club Hub, Admin Portal, GoRoBo and more, with VTOP as an optional link.
                    </p>
                  </div>
                </div>

                {amazeIdUser ? (
                  <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border-ink bg-success-surface px-3 py-2">
                    <CheckCircle2 size={17} className="shrink-0 text-success-foreground" />
                    <div className="min-w-0">
                      <p className="max-w-[190px] truncate text-xs font-bold text-success-foreground">
                        {amazeIdUser.name}
                      </p>
                      <p className="max-w-[190px] truncate text-xs text-success-foreground">{amazeIdUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void signOutApp().then(() => setAmazeIdUser(null));
                      }}
                      className="shrink-0 text-xs font-bold text-text-muted underline underline-offset-2 transition-colors hover:text-text-secondary"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={signInInteractive}
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-2 border-obsidian bg-ochre px-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-obsidian shadow-brutal-sm brutal-press"
                    >
                      Sign in with Amaze ID
                      <ArrowRight size={12} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={signInInteractive}
                      className="min-h-11 text-center font-label text-xs font-bold text-cream underline underline-offset-4 hover:text-ochre"
                    >
                      New here? Create an Amaze ID
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pitch (design language of the hero pages) */}
            <div className="space-y-3 text-left sm:space-y-4">
              <Brand />
              {/* No step number: the setup steps after sign-in count from 1
                  again, so "Step 1 of 4" here contradicted "Step 1 of 5". */}
              <p className="font-hand text-2xl font-bold leading-none text-primary">{"Hey there!"}</p>
              <h1 className="font-title text-[28px] font-extrabold leading-[1.05] text-text-heading sm:text-[40px]">
                Bring your VIT life
                <span className="block text-hero">into one place.</span>
              </h1>
              <p className="hidden max-w-md text-base leading-relaxed text-text-muted sm:block">
                Sign in with your VTOP credentials and we will pull attendance, grades, your timetable and campus
                services straight from the source.
              </p>
              <ul className="flex flex-wrap gap-2">
                {[
                  { text: "Saved encrypted on this device", cls: "bg-mint" },
                  { text: "Straight from VTOP", cls: "bg-ochre" },
                  { text: "Free, no ads", cls: "bg-coral" },
                ].map((item, i) => (
                  <li
                    key={item.text}
                    className={`rounded-[8px] border-2 border-obsidian ${item.cls} px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.06em] text-obsidian shadow-brutal-sm ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sign-in card */}
            <div className="rounded-[14px] border-[3px] border-border-ink bg-surface p-4 shadow-brutal-lg sm:p-6">
              <form onSubmit={submit} className="space-y-4 text-left">
                <div className="space-y-1 border-b-2 border-border-ink pb-3">
                  <h2 className="font-title text-xl font-extrabold text-text-heading">Sign in to VTOP</h2>
                  <p className="text-xs text-text-muted">Just your user ID and password.</p>
                </div>

                <div className="flex min-h-11 items-center justify-between gap-3 rounded-[10px] border-2 border-border-muted bg-background px-3 py-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                    <Server size={13} className="text-text-muted" />
                    Target server
                  </div>
                  <SelectField
                    value={targetValue}
                    onChange={handleApiChange}
                    options={mountOptions.map((m) => ({ value: m.id, label: m.name }))}
                    searchable={false}
                    size="sm"
                    role="group"
                    aria-label="Target server"
                    className="w-auto shrink-0 [&>button:first-child]:border-none [&>button:first-child]:bg-transparent [&>button:first-child]:px-0 [&>button:first-child]:text-primary"
                  />
                </div>

                {uniccTarget === "unicc" && (
                  <p className="rounded-lg border border-border-ink bg-warning-surface px-3 py-2 text-xs leading-relaxed text-warning-foreground">
                    Your VTOP password is sent to <span className="font-bold">api.uni-cc.site</span>, a third-party
                    service, to sign you in. Everything else still comes from AmazeCC.
                  </p>
                )}

                <div className="space-y-1.5">
                  <FieldLabel>VTOP user ID</FieldLabel>
                  <input
                    className={`${inputClass} uppercase`}
                    value={login.username}
                    onChange={(e) => login.setUsername(e.target.value)}
                    placeholder="E.g., VITUSER12345"
                    autoComplete="username"
                    autoCapitalize="characters"
                    spellCheck={false}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <FieldLabel>Password</FieldLabel>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`${inputClass} pr-11`}
                      value={login.password}
                      onChange={(e) => login.setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={submitting}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[8px] text-text-muted transition-colors hover:text-text-heading"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <SignInRejection
                    authFailure={authFailure}
                    message={error}
                    onChangePassword={login.onChangePassword}
                  />
                )}

                <button type="submit" className={ctaClass} disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  <span>{submitting ? "Signing in…" : "Continue"}</span>
                  {!submitting && <ArrowRight size={15} />}
                </button>

                <div className="flex flex-col gap-2 pt-1 text-xs text-text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <span>Saved encrypted on this device; sent only to sign you in.</span>
                  <a
                    href={getAssetPath("/ffcs/")}
                    className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-4 sm:min-h-0"
                  >
                    Skip — open FFCS Planner
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}

        {phase === "sync" && <SyncFace progress={session.progress} lines={session.lines} title={session.title} />}

        {phase === "welcome" && <WelcomeFace onDone={onDone} />}
      </div>
    </Shell>
  );
}

/**
 * Why the last sign-in was refused, and what to do about it.
 *
 * Mirrors the sync sheet's rejected-sign-in panel (`SyncNotification`) so the
 * loader screen and the login page never disagree:
 *
 * - `bad-credentials` — VTOP named the user ID / password as wrong. The saved
 *   password is the fix, so the credential editor is offered inline, plus a
 *   link to reset it on VTOP itself.
 * - `unknown` — a captcha, a rate limit, a lock-out, or a bare "login failed".
 *   A new password here will not clear those, so the only honest advice is to
 *   go and change it on VTOP.
 */
function SignInRejection({
  authFailure,
  message,
  onChangePassword,
}: {
  authFailure: AuthFailureKind | null;
  message: string;
  onChangePassword?: () => void;
}) {
  // Not a sign-in failure (a timeout, a dropped connection): keep the plain
  // error line — pretending otherwise would send the student to change a
  // password that was never the problem.
  if (!authFailure) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-border-ink bg-danger-surface px-3 py-2.5 text-xs font-semibold text-danger-foreground"
      >
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span className="min-w-0 break-words">{message}</span>
      </div>
    );
  }

  const badCredentials = authFailure === "bad-credentials";

  return (
    <div role="alert" className="space-y-3 rounded-xl border border-border-ink bg-warning-surface p-3.5 text-left">
      <div className="flex items-start gap-2">
        <KeyRound size={14} className="mt-0.5 shrink-0 text-warning-foreground" />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-warning-foreground">
            {badCredentials ? "Check your password" : "Sign-in rejected"}
          </p>
          <p className="text-xs font-semibold leading-relaxed text-text-secondary">
            {badCredentials ? (
              <>
                VTOP says that user ID and password don&apos;t match. If you changed your password recently, update it
                here — otherwise VTOP may lock the account after more failed attempts.
              </>
            ) : (
              <>
                VTOP refused the sign-in (a captcha, a rate limit or a lock-out). A new password here won&apos;t clear
                it — please log in to <span className="font-bold text-warning-foreground">vtopcc.vit.ac.in</span> and
                change your password there.
              </>
            )}
          </p>
          <p className="break-words text-xs font-semibold text-text-muted">{message}</p>
        </div>
      </div>

      {badCredentials && onChangePassword && (
        <button
          type="button"
          onClick={onChangePassword}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-brutal-sm border-2 border-border-ink transition-colors hover:brightness-110 active:scale-[0.985]"
        >
          <KeyRound size={11} />
          <span>Change Password</span>
        </button>
      )}

      <a
        href="https://vtopcc.vit.ac.in"
        target="_blank"
        rel="noreferrer"
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-ink px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.985] ${
          badCredentials
            ? "bg-warning-surface text-warning-foreground hover:bg-warning-surface"
            : "bg-highlight text-highlight-foreground border-2 border-border-ink shadow-brutal-sm hover:brightness-105"
        }`}
      >
        <ExternalLink size={11} />
        <span>{badCredentials ? "Reset on VTOP" : "Change Password on VTOP"}</span>
      </a>
    </div>
  );
}

/** Big percentage, spinner and the live module log — the first-login sync screen. */
const STEP_BADGE: Record<SyncLogLine["status"], { word: string; cls: string }> = {
  success: { word: "Done", cls: "bg-success-surface text-success-foreground" },
  error: { word: "Failed", cls: "bg-danger-surface text-danger-foreground" },
  pending: { word: "Next", cls: "bg-surface-secondary text-text-primary" },
  loading: { word: "Now", cls: "bg-highlight text-highlight-foreground" },
  info: { word: "Note", cls: "bg-surface-secondary text-text-primary" },
};

function stepBadge(status: SyncLogLine["status"]) {
  return STEP_BADGE[status] ?? STEP_BADGE.pending;
}

/**
 * First full sync after sign-in. One brand card, no icons: the number is the
 * hero, the bar is honest, and the last few steps say in words what is done.
 */
function SyncFace({ progress, lines, title }: { progress: number; lines: SyncLogLine[]; title: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const recent = lines.slice(-4);

  return (
    <div
      className="mx-auto w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="status"
      aria-live="polite"
      aria-label={`First sync ${pct} percent complete`}
    >
      <div className="brutal-card brutal-card-hero p-5 sm:p-7 space-y-6 text-left mr-1.5 mb-1.5">
        <Brand />

        <div className="space-y-2">
          <p className="font-label text-xs font-semibold text-text-muted">
            {title || "First sync"}
            {" // one time"}
          </p>
          <h1 className="font-title text-[28px] sm:text-[36px] font-extrabold leading-[1.05] text-text-heading">
            Getting your records
          </h1>
          <p className="text-sm text-text-muted">
            Attendance, marks, timetable and campus services, straight from VTOP.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <span className="font-display text-[56px] font-bold leading-none text-hero tabular-nums">{pct}%</span>
            <span className="pb-1 font-mono text-xs text-text-muted">{pct < 100 ? "Syncing" : "Finishing up"}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-[6px] border-2 border-border-ink bg-surface-secondary">
            <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {recent.length > 0 && (
          <ul className="divide-y-2 divide-border-muted rounded-[10px] border-2 border-border-ink">
            {recent.map((line, idx) => {
              const b = stepBadge(line.status);
              return (
                <li key={`${line.text}-${idx}`} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0 break-words text-sm text-text-primary">{line.text}</span>
                  <span
                    className={`shrink-0 rounded-[6px] border-2 border-border-ink px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] ${b.cls}`}
                  >
                    {b.word}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="font-mono text-xs text-text-muted">This happens once. Later syncs only fetch what changed.</p>
      </div>
    </div>
  );
}

/** Between "enough data is here" and the onboarding steps. */
function WelcomeFace({ onDone }: { onDone: () => void }) {
  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="brutal-card brutal-card-hero p-5 sm:p-7 space-y-6 text-left mr-1.5 mb-1.5">
        <Brand />

        <div className="space-y-2">
          <p className="font-label text-xs font-semibold text-text-muted">Signed in // synced</p>
          <h1 className="font-title text-[28px] sm:text-[36px] font-extrabold leading-[1.05] text-text-heading">
            You&apos;re all set
          </h1>
          <p className="text-sm text-text-muted">
            Your records are saved on this device. Three quick choices and your home screen is ready.
          </p>
        </div>

        <ul className="divide-y-2 divide-border-muted rounded-[10px] border-2 border-border-ink">
          {["Attendance and marks", "Grades and timetable", "Campus services"].map((label) => (
            <li key={label} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-sm font-semibold text-text-heading">{label}</span>
              <span className="rounded-[6px] border-2 border-border-ink bg-success-surface px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-success-foreground">
                Ready
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onDone}
          className="flex min-h-12 w-full items-center justify-center rounded-[10px] border-2 border-border-ink bg-primary px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-md brutal-press cursor-pointer"
        >
          Set up my home screen
        </button>
      </div>
    </div>
  );
}
