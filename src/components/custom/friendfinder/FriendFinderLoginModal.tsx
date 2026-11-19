"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  Cpu,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
  Layers,
} from "lucide-react";
import { useSetAtom } from "jotai";
import { credentialsAtom, isLoggedInAtom, demoModeAtom } from "@/store";
import { storage } from "@/lib/storage";
import { syncEngine } from "@/lib/sync-engine";
import { pingVtopDirectly } from "@/lib/vtopHealth";
import { syncCurrentUserPostHogIdentity, trackFeatureUsage } from "@/lib/posthog";
import {
  useSyncSession,
  openSyncSession,
  appendSyncLine,
  setSyncProgress,
  closeSyncSession,
  setSyncPresentation,
} from "@/lib/sync-engine/sync-session";
import BottomSheet from "@/components/custom/shared/BottomSheet";
import { AnimatePresence } from "framer-motion";

interface FriendFinderLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** VTOP semester the open Friend Finder will query. */
  semesterId?: string;
}

export default function FriendFinderLoginModal({
  open,
  onClose,
  onSuccess,
  semesterId = "CH20262705",
}: FriendFinderLoginModalProps) {
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setDemoMode = useSetAtom(demoModeAtom);
  const setIDs = useSetAtom(credentialsAtom);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const session = useSyncSession();

  // Populate from local storage if existing credentials exist
  useEffect(() => {
    if (open) {
      const storedUsername = storage.username.get() || storage.ids.get()?.VtopUsername || "";
      const storedPassword = storage.password.get() || storage.ids.get()?.VtopPassword || "";
      if (storedUsername) setUsername(storedUsername);
      if (storedPassword) setPassword(storedPassword);
      setLoginError(null);
      // Suppress floating sheet while modal is in focus
      setSyncPresentation("inline");
    } else {
      setSyncPresentation("sheet");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toUpperCase();
    if (!cleanUsername || !password) {
      setLoginError("Please enter both your VTOP username and password.");
      return;
    }

    setLoginError(null);
    setIsSubmitting(true);

    try {
      // 1. Initialize Sync Engine Session
      openSyncSession("VTOP Authentication & Sync");
      setSyncProgress(10);
      appendSyncLine("Initializing AmazeCC Sync Engine…", "loading");

      // 2. Connectivity check to VTOP Portal
      appendSyncLine("Pinging VTOP gateway (vtopcc.vit.ac.in)…", "loading");
      const isUp = await pingVtopDirectly(4000);
      if (!isUp) {
        appendSyncLine("VTOP gateway is unreachable. Check network connection.", "error");
        setSyncProgress(100);
        closeSyncSession(0, "error");
        setLoginError("VTOP is currently unreachable. Please try again shortly.");
        setIsSubmitting(false);
        return;
      }
      appendSyncLine("VTOP gateway reachable", "success");
      setSyncProgress(30);

      // 3. Authenticate with Sync Engine
      appendSyncLine("Solving captcha and negotiating session tokens…", "loading");
      const creds = await syncEngine.login(
        {
          VtopUsername: cleanUsername,
          VtopPassword: password,
          MoodleUsername: "",
          MoodlePassword: "",
        },
        false,
      );

      appendSyncLine("VTOP session established successfully", "success");
      setSyncProgress(65);

      // 4. Hydrate profile to retrieve authentic student name & registration number
      appendSyncLine("Syncing student profile & registration info…", "loading");
      try {
        await syncEngine.sync("studentProfile");
        appendSyncLine("Student profile saved on this device", "success");
      } catch {
        appendSyncLine("Profile fetch skipped (best effort)", "info");
      }
      setSyncProgress(85);

      // 5. Hydrate timetable for Winter 2026-27 (CH20262705)
      appendSyncLine("Syncing registered timetable snapshot…", "loading");
      try {
        await syncEngine.sync("timetable", { semesterId });
        appendSyncLine("Registered courses synchronized", "success");
      } catch {
        appendSyncLine("Timetable fetch skipped (best effort)", "info");
      }
      setSyncProgress(100);
      appendSyncLine("Ready! Logged in across AmazeCC.", "success");

      // 6. Persist session for entire AmazeCC
      storage.ids.set({
        VtopUsername: cleanUsername,
        VtopPassword: password,
        MoodleUsername: storage.moodleUsername.get() || "",
        MoodlePassword: storage.moodlePassword.get() || "",
      });
      storage.username.set(cleanUsername);
      storage.password.set(password);
      storage.demoMode.set(false);

      if (creds?.cookies) {
        storage.vtopSession.set({
          cookies: creds.cookies,
          authorizedID: creds.authorizedID,
          csrf: creds.csrf,
          fetchedAt: Date.now(),
        });
      }

      setIDs({
        VtopUsername: cleanUsername,
        VtopPassword: password,
        MoodleUsername: "",
        MoodlePassword: "",
      });
      setDemoMode(false);
      setIsLoggedIn(true);

      // Register verified student identity with PostHog immediately on login
      syncCurrentUserPostHogIdentity({
        route: "friend_finder",
        semester: semesterId,
        username: cleanUsername,
        authorizedID: creds?.authorizedID,
        extraProperties: {
          login_source: "friend_finder_modal",
          sync_mode: "vtop",
        },
      });

      trackFeatureUsage("friend_finder", "login_completed", {
        registration_number: cleanUsername,
      });

      closeSyncSession(1200, "success");

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Authentication failed";
      appendSyncLine(`Sync error: ${msg}`, "error");
      closeSyncSession(0, "error");
      setLoginError(msg);
    }
  };

  return (
    <AnimatePresence>
      <BottomSheet
        onClose={() => {
          if (!isSubmitting) onClose();
        }}
        overlayId="friend-finder-login-sheet"
        maxWidth="max-w-md"
        title="Sign in with VTOP"
        subtitle="AmazeCC Unified Sync Engine"
        icon={<Cpu className="w-5 h-5 text-primary" />}
        accent="bg-secondary border-border-ink text-secondary-foreground"
        closeLabel="Close sign-in sheet"
      >
        <div className="space-y-4 pt-1">
          {/* Unified AmazeCC Sign-in Banner */}
          <div className="rounded-2xl border border-border-ink bg-secondary p-3.5 space-y-1.5 text-xs shadow-2xs">
            <div className="flex items-center gap-2 font-bold font-outfit text-primary">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Unified Amaze Continuity Projects Sign-In</span>
            </div>
            <p className="text-text-muted leading-relaxed text-xs sm:text-xs">
              Logging in here will log you into the rest of <strong>AmazeCC</strong>. Your VTOP session, attendance,
              timetable, and preferences are synchronized and instantly accessible across the Dashboard, FFCS Planner,
              and Event Hub.
            </p>
          </div>

          {/* Sync Engine Status & Console */}
          <div className="rounded-2xl border-2 border-border-ink bg-surface-secondary p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-secondary text-secondary-foreground">
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="text-xs font-bold font-outfit text-text-primary">Sync Engine Console</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-[6px] bg-surface-tertiary text-text-muted">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSubmitting
                      ? "bg-amber-500 animate-pulse"
                      : session.outcome === "success"
                        ? "bg-emerald-500"
                        : "bg-primary"
                  }`}
                />
                {isSubmitting ? "Synchronizing…" : session.outcome === "success" ? "Connected" : "Ready"}
              </span>
            </div>

            {/* Progress Bar (when active) */}
            {isSubmitting && (
              <div className="w-full bg-surface-tertiary h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, session.progress)}%` }}
                />
              </div>
            )}

            {/* Sync Engine Log Lines / Status Details */}
            <div className="rounded-xl bg-surface border-2 border-border-ink p-2.5 max-h-24 overflow-y-auto font-mono text-xs leading-relaxed space-y-1">
              {session.lines && session.lines.length > 0 ? (
                session.lines.slice(-4).map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-1.5 ${
                      line.status === "error"
                        ? "text-danger-foreground"
                        : line.status === "success"
                          ? "text-success-foreground"
                          : "text-text-muted"
                    }`}
                  >
                    <span className="shrink-0 select-none">
                      {line.status === "error" ? "✖" : line.status === "success" ? "✔" : "▸"}
                    </span>
                    <span className="truncate">{line.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-text-muted flex items-center justify-between text-xs">
                  <span>Gateway: vtopcc.vit.ac.in</span>
                  <span>Semester: CH20262705</span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="ff-vtop-username" className="block text-xs font-bold text-text-primary mb-1">
                VTOP Username / Registration Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="ff-vtop-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="e.g. 25BLC1081"
                  autoFocus
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border-ink bg-surface text-text-heading placeholder:text-text-muted dark:placeholder:text-text-muted text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-border-ink transition-all uppercase tracking-wider"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ff-vtop-password" className="block text-xs font-bold text-text-primary mb-1">
                VTOP Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="ff-vtop-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your VTOP password"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 border-border-ink bg-surface text-text-heading placeholder:text-text-muted dark:placeholder:text-text-muted text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-border-ink transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-muted transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-danger-surface border border-border-ink text-danger-foreground text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border-2 border-border-ink text-xs font-bold text-text-muted hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs sm:text-sm font-bold shadow-brutal-sm border-2 border-border-ink transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in via Sync Engine…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign in with VTOP</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Privacy Note */}
          <p className="text-xs text-center text-text-muted">
            Timetable sharing is voluntary and opt-in.{" "}
            <Link
              href="/friend-finder/disclaimer"
              onClick={onClose}
              className="text-primary hover:underline font-medium"
            >
              Read data disclaimer
            </Link>
          </p>
        </div>
      </BottomSheet>
    </AnimatePresence>
  );
}
