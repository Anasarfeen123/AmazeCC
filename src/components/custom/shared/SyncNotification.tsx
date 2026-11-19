"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomSheet from "./BottomSheet";
import { BACKUP_API_URL, PRIMARY_API_URL, getActiveApiUrl, setActiveApiUrl, hasBackupApi } from "@/lib/fetch-utils";
import { UNICC_API_URL, resetUniccActivity } from "@/lib/unicc-fallback";
import { useUniccActivity, useUniccTarget, setUniccTarget, isUniccFallbackEnabled } from "@/lib/useUniccTarget";
import { pingVtopDirectly, VTOP_PORTAL_URL } from "@/lib/vtopHealth";
import { appendSyncLine, closeSyncSession, setSyncNotice, setSyncProgress } from "@/lib/sync-engine/sync-session";
import { cancelAllRequests } from "@/lib/sync-engine/request-layer";
import type { SyncNotice } from "@/lib/sync-engine/sync-session";
import { classifyAuthFailure } from "@/lib/sync-engine/errors";
import type { AuthFailureKind } from "@/lib/sync-engine/errors";
import type { SyncMode } from "@/lib/sync-engine/sync-modes";
import { syncEngine } from "@/lib/sync-engine";
import { storage } from "@/lib/storage";
import { getDefaultStore } from "jotai";
import { credentialsAtom, isLoggedInAtom, demoModeAtom } from "@/store";
import { syncCurrentUserPostHogIdentity, trackFeatureUsage } from "@/lib/posthog";
import {
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  Globe,
  Terminal,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  AlertCircle,
  WifiOff,
  Settings,
  KeyRound,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ServerOff,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  CalendarRange,
  CalendarDays,
  CalendarClock,
} from "lucide-react";

interface SyncNotificationProps {
  message: string;
  progress: number;
  active: boolean;
  /** Expands the minimized notification when a non-routine sync notice arrives. */
  attentionVersion?: number;
  onDismiss: () => void;
  outcome?: "success" | "error" | null;
  /** Non-run reason the sheet was opened; replaces the progress UI when set. */
  notice?: SyncNotice;
  /** Re-attempt the sync from the offline notice. */
  onRetry?: () => void;
  /** Current sync mode id; when `modes` is set a switcher renders in the sheet. */
  modeId?: string;
  /** Default mode id, starred in the switcher. */
  defaultModeId?: string;
  /** All modes (built-in + custom) for the switcher. */
  modes?: SyncMode[];
  /** Title shown in the sheet header; defaults to "VTOP Sync". */
  modeLabel?: string;
  /** Switching modes mid-sheet re-runs the reload with that mode. */
  onSelectMode?: (id: string) => void;
  /** Opens the custom-mode editor. */
  onOpenEditor?: () => void;
  /**
   * Opens the credential editor, so a run that died on the saved password can
   * be fixed from inside the sheet instead of hunting for it on the login
   * screen.
   */
  onChangePassword?: () => void;
}

// Helper to clean emojis and determine status
const parseLogLine = (line: string, isLast: boolean) => {
  let cleanText = line.trim();
  let status: "success" | "error" | "pending" | "info" | "loading" = "info";

  if (cleanText.includes("✅")) {
    status = "success";
    cleanText = cleanText.replace(/✅/g, "").trim();
  } else if (cleanText.includes("❌")) {
    status = "error";
    cleanText = cleanText.replace(/❌/g, "").trim();
  } else if (cleanText.includes("⏳")) {
    status = "pending";
    cleanText = cleanText.replace(/⏳/g, "").trim();
  } else if (cleanText.includes("📝")) {
    status = "info";
    cleanText = cleanText.replace(/📝/g, "").trim();
  } else if (isLast) {
    status = "loading";
  }

  cleanText = cleanText.replace(/^[-•*]\s*/, "").trim();
  return { text: cleanText, status };
};

const getStatusIcon = (status: "success" | "error" | "pending" | "info" | "loading") => {
  switch (status) {
    case "success":
      return <CheckCircle2 className="w-3.5 h-3.5 text-success-foreground shrink-0 mt-0.5" />;
    case "error":
      return <AlertCircle className="w-3.5 h-3.5 text-danger-foreground shrink-0 mt-0.5" />;
    case "pending":
      return <div className="w-3.5 h-3.5 rounded-full border-2 border-border-ink shrink-0 mt-0.5" />;
    case "loading":
      return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0 mt-0.5" />;
    case "info":
    default:
      return <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5 mx-1" />;
  }
};

const cleanLogLine = (line: string) => {
  return line
    .replace(/[✅✔️❌⏳📝☐]/g, "")
    .replace(/^[-•*]\s*/, "")
    .trim();
};

export default function SyncNotification({
  message,
  progress,
  active,
  attentionVersion = 0,
  onDismiss,
  outcome = null,
  notice = null,
  onRetry,
  modeId,
  defaultModeId,
  modes,
  modeLabel,
  onSelectMode,
  onOpenEditor,
  onChangePassword,
}: SyncNotificationProps) {
  const [showBackupBtn, setShowBackupBtn] = useState(false);
  const [hasSwitched, setHasSwitched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [vtopState, setVtopState] = useState<"idle" | "checking" | "up" | "down">("idle");

  const modeMenuRef = useRef<HTMLDivElement>(null);
  const serverMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (attentionVersion > 0) setIsMinimized(false);
  }, [attentionVersion]);

  // Live target + traffic
  const uniccTarget = useUniccTarget();
  const activity = useUniccActivity();
  const uniccAvailable = isUniccFallbackEnabled();
  const targetValue = uniccTarget === "unicc" ? UNICC_API_URL : getActiveApiUrl();

  const isOfflineNotice = notice === "offline";
  const isLoginNotice = notice === "login";

  // Login form state for unauthenticated bottom sheet view
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const hasExistingProfile = Boolean(storage.profile.get());
  const isNewStudent = !hasExistingProfile;

  // Prefill saved credentials on open if any
  useEffect(() => {
    if (active && isLoginNotice) {
      const storedU = storage.username.get() || storage.ids.get()?.VtopUsername || "";
      const storedP = storage.password.get() || storage.ids.get()?.VtopPassword || "";
      if (storedU) setLoginUsername(storedU);
      if (storedP) setLoginPassword(storedP);
      setLoginError(null);
    }
  }, [active, isLoginNotice]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = loginUsername.trim().toUpperCase();
    if (!cleanUsername || !loginPassword) {
      setLoginError("Please enter both your VTOP username and password.");
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      // 1. Transition notice from "login" to null so the sheet displays the active sync engine progress
      setSyncNotice(null);
      setSyncProgress(10);
      appendSyncLine("Initializing AmazeCC Sync Engine…", "loading");

      // 2. Gateway Connectivity Check
      appendSyncLine("Pinging VTOP gateway (vtopcc.vit.ac.in)…", "loading");
      const isUp = await pingVtopDirectly(4000);
      if (!isUp) {
        appendSyncLine("VTOP gateway is unreachable. Check network connection.", "error");
        closeSyncSession(0, "error");
        setIsLoggingIn(false);
        return;
      }
      appendSyncLine("VTOP gateway reachable", "success");
      setSyncProgress(30);

      // 3. Negotiate session
      appendSyncLine("Solving captcha and negotiating session tokens…", "loading");
      const creds = await syncEngine.login(
        {
          VtopUsername: cleanUsername,
          VtopPassword: loginPassword,
          MoodleUsername: "",
          MoodlePassword: "",
        },
        false,
      );
      appendSyncLine("VTOP session established successfully", "success");
      setSyncProgress(55);

      // 4. New user (Full Sync) vs Returning user (Quick Sync)
      if (isNewStudent) {
        appendSyncLine("New student account detected — performing full sync…", "loading");
        try {
          await syncEngine.sync("studentProfile");
          appendSyncLine("Student profile cached locally", "success");
        } catch {
          appendSyncLine("Profile fetch skipped (best effort)", "info");
        }
        setSyncProgress(75);

        appendSyncLine("Syncing registered timetable snapshot…", "loading");
        try {
          await syncEngine.sync("timetable", { semesterId: "CH20262705" });
          appendSyncLine("Registered courses synchronized", "success");
        } catch {
          appendSyncLine("Timetable fetch skipped (best effort)", "info");
        }
        setSyncProgress(95);
      } else {
        appendSyncLine("Returning student — performing quick sync…", "loading");
        try {
          await syncEngine.sync("timetable", { semesterId: "CH20262705" });
          appendSyncLine("Registered courses synchronized", "success");
        } catch {
          appendSyncLine("Timetable fetch skipped (best effort)", "info");
        }
        setSyncProgress(85);

        try {
          await syncEngine.sync("studentProfile");
        } catch {}
        setSyncProgress(95);
      }

      // 5. Persist credentials & session across AmazeCC
      storage.ids.set({
        VtopUsername: cleanUsername,
        VtopPassword: loginPassword,
        MoodleUsername: storage.moodleUsername.get() || "",
        MoodlePassword: storage.moodlePassword.get() || "",
      });
      storage.username.set(cleanUsername);
      storage.password.set(loginPassword);
      storage.demoMode.set(false);

      if (creds?.cookies) {
        storage.vtopSession.set({
          cookies: creds.cookies,
          authorizedID: creds.authorizedID,
          csrf: creds.csrf,
          fetchedAt: Date.now(),
        });
      }

      const store = getDefaultStore();
      store.set(credentialsAtom, {
        VtopUsername: cleanUsername,
        VtopPassword: loginPassword,
        MoodleUsername: "",
        MoodlePassword: "",
      });
      store.set(demoModeAtom, false);
      store.set(isLoggedInAtom, true);

      // 6. PostHog registration
      syncCurrentUserPostHogIdentity({
        route: "sync_engine",
        semester: "CH20262705",
        username: cleanUsername,
        authorizedID: creds?.authorizedID,
        extraProperties: {
          sync_mode: isNewStudent ? "quarterly" : "daily",
          login_source: "sync_bottom_sheet",
        },
      });
      trackFeatureUsage("sync_engine", "login_completed", {
        is_new_user: isNewStudent,
      });

      appendSyncLine("Ready! Logged in across AmazeCC.", "success");
      closeSyncSession(1500, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      appendSyncLine(`Sync error: ${msg}`, "error");
      closeSyncSession(0, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target as Node)) {
        setShowServerMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTargetChange = (newUrl: string) => {
    if (newUrl === UNICC_API_URL) {
      setUniccTarget("unicc");
    } else {
      setUniccTarget("amazecc");
      setActiveApiUrl(newUrl);
    }
    setShowServerMenu(false);
  };

  // Reset activity on open
  const wasActive = useRef(false);
  useEffect(() => {
    if (active && !wasActive.current) resetUniccActivity();
    wasActive.current = active;
  }, [active]);

  // Slow network timer (6s)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (active && !isOfflineNotice) {
      setShowBackupBtn(false);
      setHasSwitched(false);
      timer = setTimeout(() => {
        if (hasBackupApi() && getActiveApiUrl() === PRIMARY_API_URL) {
          setShowBackupBtn(true);
        }
      }, 6000);
    }
    return () => clearTimeout(timer);
  }, [active, message, isOfflineNotice]);

  const handleSwitchToBackup = () => {
    if (!hasBackupApi()) return;
    setActiveApiUrl(BACKUP_API_URL);
    setShowBackupBtn(false);
    setHasSwitched(true);
    setIsMinimized(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(BACKUP_API_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!active) return null;

  const logLines = message
    .split(/\r?\n|\\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  // Classify authentication failure
  const authFailure: AuthFailureKind | null = (() => {
    let kind: AuthFailureKind | null = null;
    for (const line of logLines) {
      const { text, status } = parseLogLine(line, false);
      if (status !== "error") continue;
      const found = classifyAuthFailure(text);
      if (found === "bad-credentials") return found;
      if (found) kind = found;
    }
    return kind;
  })();

  // Auto-expand console if an unexpected non-auth error occurs
  useEffect(() => {
    if (authFailure) return;
    const hasError = logLines.some((l) => l.includes("❌"));
    if (hasError) setShowConsole(true);
  }, [logLines, authFailure]);

  // Pre-flight check: check if VTOP is working as soon as sync starts
  useEffect(() => {
    if (active && outcome === null && vtopState === "idle" && !isOfflineNotice && !isLoginNotice) {
      let isMounted = true;
      pingVtopDirectly(4000).then((isUp) => {
        if (!isMounted) return;
        if (!isUp) {
          cancelAllRequests("VTOP is down");
          setVtopState("down");
          appendSyncLine("VTOP is down (vtopcc.vit.ac.in is unreachable) — sync cancelled", "error");
          closeSyncSession(4000, "error");
        } else {
          setVtopState("up");
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [active, outcome, vtopState, isOfflineNotice]);

  // Ping VTOP directly if all APIs failed to sync (and it's not a rejected password)
  const hasApiFailure =
    (outcome === "error" && !authFailure) ||
    (logLines.some((l) => /AmazeCC API failed|could not answer|fallback also failed|Failed to fetch/i.test(l)) &&
      !authFailure);

  const isPingingRef = useRef(false);

  useEffect(() => {
    if (!hasApiFailure) {
      setVtopState("idle");
      isPingingRef.current = false;
      return;
    }
    if (isPingingRef.current) return;
    isPingingRef.current = true;
    setVtopState("checking");

    let isMounted = true;
    pingVtopDirectly(4500)
      .then((isUp) => {
        if (isMounted) {
          const nextState = isUp ? "up" : "down";
          setVtopState(nextState);
          if (!isUp) {
            cancelAllRequests("VTOP is down");
            appendSyncLine("VTOP is down (vtopcc.vit.ac.in is unreachable) — sync cancelled", "error");
            closeSyncSession(4000, "error");
          }
        }
      })
      .finally(() => {
        isPingingRef.current = false;
      });

    return () => {
      isMounted = false;
    };
  }, [hasApiFailure]);

  // Cancel active sync if VTOP is confirmed down
  useEffect(() => {
    if (vtopState === "down" && active && outcome !== "error") {
      cancelAllRequests("VTOP is down");
      appendSyncLine("VTOP is down (vtopcc.vit.ac.in is unreachable) — sync cancelled", "error");
      closeSyncSession(4000, "error");
    }
  }, [vtopState, active, outcome]);

  const isVtopDown =
    vtopState === "down" || logLines.some((l) => /vtop.*down|vtopcc\.vit\.ac\.in.*down|portal unreachable/i.test(l));

  // When VTOP is detected down, immediately cancel all background sync requests
  useEffect(() => {
    if (isVtopDown) {
      cancelAllRequests("VTOP is down");
    }
  }, [isVtopDown]);

  const effectiveOutcome = outcome || (isVtopDown ? "error" : null);

  // The minimized bar is the default presentation; it only expands for fatal
  // outcomes the user must see — a rejected password (login form) or a hard
  // failure. Everything else waits until they tap the bar.
  useEffect(() => {
    if (authFailure || effectiveOutcome === "error") {
      setIsMinimized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFailure, effectiveOutcome]);

  // Server telemetry label
  const req = (n: number) => `${n} req${n === 1 ? "" : "s"}`;
  const servingText = (() => {
    if (!uniccAvailable || !activity.lastServer) return null;
    const viaUnicc = activity.lastServer === "unicc";
    const viaAmazecc = viaUnicc && activity.unsupported > 0 ? ` · ${req(activity.unsupported)} from AmazeCC` : "";

    if (viaUnicc) {
      return `UniCC serving${activity.lastPath ? ` ${activity.lastPath}` : ""}${viaAmazecc}`;
    }
    return `AmazeCC serving${activity.lastPath ? ` ${activity.lastPath}` : ""}`;
  })();

  // Active server name for the header chip
  const activeServerLabel =
    targetValue === UNICC_API_URL ? "UniCC" : targetValue === BACKUP_API_URL ? "Backup API" : "AmazeCC";

  // Headline determination
  const latestLog = logLines[logLines.length - 1] || "";
  const cleanedHeadline = cleanLogLine(latestLog) || "Syncing records...";

  // Standard Milestones
  const milestones = [
    {
      id: "auth",
      label: "Authentication & Session",
      status: authFailure ? "error" : progress >= 20 || /logged in|captcha/i.test(message) ? "completed" : "active",
      detail: authFailure
        ? "Sign-in rejected"
        : progress >= 20 || /logged in|captcha/i.test(message)
          ? "Session verified"
          : "Checking credentials...",
    },
    {
      id: "academics",
      label: "Attendance & Timetable",
      status:
        progress >= 60 || /attendance.*complete|timetable.*complete/i.test(message)
          ? "completed"
          : progress >= 20
            ? "active"
            : "pending",
      detail: progress >= 60 ? "Classes up to date" : progress >= 20 ? "Fetching latest slots..." : "Waiting",
    },
    {
      id: "evaluations",
      label: "Marks & Grades",
      status:
        progress >= 85 || /marks.*complete|grades.*complete/i.test(message)
          ? "completed"
          : progress >= 60
            ? "active"
            : "pending",
      detail:
        progress >= 85 ? "Grades & assessments verified" : progress >= 60 ? "Pulling assessment scores..." : "Waiting",
    },
    {
      id: "cache",
      label: "Local Storage & Finalize",
      status: progress >= 100 || outcome === "success" ? "completed" : progress >= 85 ? "active" : "pending",
      detail:
        progress >= 100 || outcome === "success"
          ? "Synchronized"
          : progress >= 85
            ? "Saving offline database..."
            : "Waiting",
    },
  ];

  const minimizeToBackground = () => setIsMinimized(true);
  const isFinished =
    isOfflineNotice || isLoginNotice || effectiveOutcome === "success" || effectiveOutcome === "error" || hasSwitched;
  const parkOrClose = isFinished ? onDismiss : minimizeToBackground;

  const handleCancelSync = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    cancelAllRequests("User cancelled sync mid-flight");
    onDismiss();
  };

  const currentMode = modes?.find((m) => m.id === modeId);
  const activeModeTitle = currentMode?.label || modeLabel || "VTOP Sync";
  // Mode glyph for the minimized bar — pick something per cadence tier.
  const ModeIcon =
    modeId === "daily"
      ? Zap
      : modeId === "weekly"
        ? CalendarRange
        : modeId === "monthly"
          ? CalendarDays
          : modeId === "quarterly"
            ? CalendarClock
            : RefreshCw;

  return (
    <AnimatePresence>
      {isMinimized ? (
        /* Minimized pill: a brand card with a plain progress bar along its
           bottom edge (was glass with a glowing gradient fill behind the text,
           which made the words hard to read and the % invisible). */
        <motion.div
          key="sync-minimized"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px] mx-auto z-50 overflow-hidden rounded-[14px] border-2 border-border-ink bg-surface shadow-brutal-md cursor-pointer"
          onClick={() => setIsMinimized(false)}
          role="status"
          aria-live="polite"
          aria-label={`Syncing — ${Math.min(100, Math.round(progress))}% complete`}
        >
          <div className="flex items-center gap-3 w-full px-3 pt-3 pb-3.5">
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-[10px] border-2 border-border-ink bg-secondary text-secondary-foreground flex items-center justify-center shrink-0"
            >
              {progress >= 100 ? <Check size={18} strokeWidth={3} /> : <ModeIcon size={18} strokeWidth={2.25} />}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-heading leading-none truncate">
                  {activeModeTitle}
                </h4>
                <span className="font-mono text-xs font-semibold text-text-muted tabular-nums shrink-0">
                  {progress >= 100 ? "Done" : `${Math.min(100, Math.round(progress))}%`}
                </span>
              </div>
              <p className="text-sm text-text-primary truncate mt-1 leading-tight">{cleanedHeadline}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
                title="Show sync details"
                aria-label="Show sync details"
              >
                <Maximize2 size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleCancelSync}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-danger-foreground hover:bg-danger-surface transition-colors cursor-pointer"
                title="Cancel sync"
                aria-label="Cancel sync"
              >
                <X size={16} strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>
          {/* Progress along the bottom edge */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-surface-secondary">
            <div
              className="h-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
            />
          </div>
        </motion.div>
      ) : (
        /* Expanded Bottom Sheet */
        <BottomSheet
          key="sync-expanded"
          onClose={onDismiss}
          overlayId="sync-progress"
          maxWidth="max-w-md"
          showClose={false}
          onBackdropClick={parkOrClose}
          onSwipeDown={parkOrClose}
          onSystemBack={parkOrClose}
        >
          <div className="flex flex-col gap-3.5 w-full relative">
            {/* 1. OFFLINE NOTICE TAKEOVER */}
            {isOfflineNotice ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 240 }}
                className="flex flex-col items-center text-center py-6 px-4"
              >
                <div className="w-14 h-14 rounded-full bg-warning-surface text-warning-foreground flex items-center justify-center border border-border-ink shadow-brutal-sm">
                  <WifiOff className="w-7 h-7" strokeWidth={2.4} />
                </div>
                <h4 className="mt-3.5 text-base font-bold text-text-heading font-outfit">You&apos;re Offline</h4>
                <p className="mt-1 text-xs font-medium text-text-muted max-w-[260px] leading-relaxed">
                  No network detected. Reconnect to sync the latest records from VTOP.
                </p>

                <div className="w-full flex items-center gap-2 mt-5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-[0.985] cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss();
                      onRetry?.();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-[0.985] cursor-pointer shadow-brutal-sm"
                  >
                    <RefreshCw size={12} />
                    <span>Try Again</span>
                  </button>
                </div>
              </motion.div>
            ) : isLoginNotice ? (
              /* 1B. LOGIN NOTICE TAKEOVER (UNAUTHENTICATED VIEW) */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 240 }}
                className="flex flex-col py-2 px-1 w-full"
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center border border-border-ink shadow-brutal-sm mb-3">
                    <KeyRound className="w-7 h-7" strokeWidth={2.4} />
                  </div>
                  <h3 className="text-xl font-bold text-text-heading font-outfit tracking-tight">Sign in with VTOP</h3>
                  <p className="mt-1 text-xs font-medium text-text-muted max-w-[320px] leading-relaxed">
                    Authenticate through the AmazeCC Unified Sync Engine to retrieve your profile and courses.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-secondary border border-border-ink text-secondary-foreground text-xs font-bold min-h-9">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{isNewStudent ? "New Student — Full Initial Sync" : "Returning Student — Quick Sync"}</span>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3 w-full">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-danger-surface border border-border-ink flex items-start gap-2 text-danger-foreground text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>VTOP Username / Reg No</span>
                    </label>
                    <input
                      type="text"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="e.g. 25BLC1081"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value.toUpperCase())}
                      disabled={isLoggingIn}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border-ink text-text-heading placeholder:text-text-muted dark:placeholder:text-text-muted text-sm font-semibold tracking-wide focus:outline-hidden focus:ring-2 focus:ring-border-ink transition-all uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>VTOP Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your VTOP password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoggingIn}
                        className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-surface-secondary border border-border-ink text-text-heading placeholder:text-text-muted dark:placeholder:text-text-muted text-sm font-semibold tracking-wide focus:outline-hidden focus:ring-2 focus:ring-border-ink transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-muted transition-colors"
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl p-3 bg-surface-secondary border border-border-ink text-xs text-text-muted leading-relaxed mt-1">
                    <p className="font-medium">
                      <strong className="text-text-primary">Unified Sign-In:</strong> Logging in here synchronizes your
                      timetable and profile, and signs you into all of AmazeCC.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss();
                      }}
                      disabled={isLoggingIn}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.985] cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="flex-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.985] cursor-pointer shadow-brutal-sm border-2 border-border-ink disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting…</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Sign In & Sync</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : effectiveOutcome === "success" ? (
              /* 2. SUCCESS STATE TAKEOVER */
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 240 }}
                className="flex flex-col items-center text-center py-6 px-4"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-brutal-sm">
                  <Check className="w-7 h-7" strokeWidth={3} />
                </div>
                <h4 className="mt-3.5 text-base font-bold text-text-heading font-outfit">Sync Successful</h4>
                <p className="mt-1 text-xs font-medium text-text-muted">
                  All academic records are completely up to date.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="mt-5 w-full py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-[0.985]"
                >
                  Done
                </button>
              </motion.div>
            ) : effectiveOutcome === "error" ? (
              /* 3. FULL-SCREEN ERROR TAKEOVER */
              isVtopDown ? (
                /* 3A. BOLD VTOP IS DOWN TAKEOVER */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 240 }}
                  className="flex flex-col items-center text-center py-6 px-3 sm:px-4 w-full"
                >
                  {/* Glowing Rose Halo + ServerOff Icon */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-rose-500/25 blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-danger-surface border border-border-ink text-danger-foreground flex items-center justify-center ring-2 ring-rose-500/30">
                      <ServerOff className="w-8 h-8" strokeWidth={2.4} />
                    </div>
                  </div>

                  {/* BOLD HEADLINE */}
                  <h3 className="mt-4 text-2xl font-bold text-danger-foreground font-outfit uppercase tracking-tight">
                    VTOP is Down
                  </h3>

                  {/* EXPLANATORY DESCRIPTION */}
                  <p className="mt-2 text-xs font-semibold text-text-muted max-w-[320px] leading-relaxed">
                    Direct connection to{" "}
                    <span className="font-bold text-danger-foreground underline decoration-rose-500/40 underline-offset-2">
                      vtopcc.vit.ac.in
                    </span>{" "}
                    did not respond. The university portal appears to be offline or undergoing maintenance. Background
                    sync has been cancelled.
                  </p>

                  {/* ACTION BUTTONS: PROMINENT DISMISS + SECONDARY ACTIONS */}
                  <div className="w-full flex flex-col gap-2.5 mt-6">
                    {/* Primary Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelAllRequests("User dismissed VTOP down notice");
                        onDismiss();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-text-primary hover:opacity-90 text-background font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-[0.985] cursor-pointer shadow-lg shadow-black/10 dark:shadow-white/10"
                    >
                      Dismiss
                    </button>

                    {/* Secondary Actions: Check VTOP & Retry */}
                    <div className="w-full flex items-center gap-2">
                      <a
                        href={VTOP_PORTAL_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-border-ink"
                      >
                        <ExternalLink size={12} />
                        <span>Check VTOP</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelAllRequests("Retrying sync");
                          onDismiss();
                          onRetry?.();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-danger-surface hover:bg-danger-surface active:bg-rose-500/25 text-danger-foreground border border-border-ink font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-brutal-sm"
                      >
                        <RefreshCw size={12} />
                        <span>Retry Sync</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : vtopState === "checking" ? (
                /* 3B. CHECKING VTOP STATUS TAKEOVER (PREVENTS FLASHING "SYNC FAILED") */
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-8 px-4 w-full"
                >
                  <div className="relative w-14 h-14 rounded-2xl bg-warning-surface border border-border-ink text-warning-foreground flex items-center justify-center shadow-brutal-sm">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-warning-surface border border-border-ink text-warning-foreground text-xs font-bold uppercase tracking-widest min-h-9">
                    <span>Checking Reachability</span>
                  </div>
                  <h4 className="mt-2.5 text-base font-bold text-text-heading font-outfit">Connecting to VTOP…</h4>
                  <p className="mt-1 text-xs font-medium text-text-muted max-w-[280px] leading-relaxed">
                    Checking if vtopcc.vit.ac.in is online to determine server status.
                  </p>
                </motion.div>
              ) : (
                /* 3C. OTHER ERRORS (Auth Rejection / General Error) */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 240 }}
                  className="flex flex-col items-center text-center py-6 px-4 w-full"
                >
                  {/* ICON BADGE */}
                  {authFailure ? (
                    <div className="w-14 h-14 rounded-full bg-warning-surface text-warning-foreground flex items-center justify-center border border-border-ink shadow-brutal-sm ring-1 ring-amber-500/30">
                      <KeyRound className="w-7 h-7" strokeWidth={2.2} />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-danger-surface text-danger-foreground flex items-center justify-center border border-border-ink shadow-brutal-sm ring-1 ring-rose-500/30">
                      <AlertCircle className="w-7 h-7" strokeWidth={2.2} />
                    </div>
                  )}

                  {/* HEADLINE */}
                  <h4 className="mt-3.5 text-base font-bold text-text-heading font-outfit">
                    {authFailure === "bad-credentials"
                      ? "Check Your Password"
                      : authFailure
                        ? "Sign-in Rejected"
                        : "Sync Failed"}
                  </h4>

                  {/* EXPLANATORY DESCRIPTION */}
                  <p className="mt-1 text-xs font-medium text-text-muted max-w-[280px] leading-relaxed">
                    {authFailure === "bad-credentials" ? (
                      "VTOP rejected your saved credentials. Update your password or reset it directly on the university portal."
                    ) : authFailure ? (
                      <>
                        Your VTOP session was rejected. Please log in directly to{" "}
                        <span className="font-bold text-warning-foreground">vtopcc.vit.ac.in</span> to verify or change
                        your password.
                      </>
                    ) : vtopState === "up" ? (
                      "VTOP portal is online, but our sync API gateways could not connect. Try switching to the Backup API or retry."
                    ) : (
                      "Unable to synchronize your academic records from VTOP. Please check your network and try again."
                    )}
                  </p>

                  {/* ACTION BUTTONS ROW */}
                  <div className="w-full flex flex-col gap-2 mt-5">
                    {authFailure === "bad-credentials" ? (
                      <div className="w-full flex flex-col gap-2">
                        {onChangePassword && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangePassword();
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-brutal-sm border-2 border-border-ink"
                          >
                            <KeyRound size={12} />
                            <span>Change Password</span>
                          </button>
                        )}
                        <div className="w-full flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss();
                            }}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <a
                            href={VTOP_PORTAL_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-brutal-sm"
                          >
                            <ExternalLink size={12} />
                            <span>Reset on VTOP</span>
                          </a>
                        </div>
                      </div>
                    ) : authFailure ? (
                      <div className="w-full flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss();
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <a
                          href={VTOP_PORTAL_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-brutal-sm"
                        >
                          <ExternalLink size={12} />
                          <span>Open VTOP</span>
                        </a>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-2">
                        {hasBackupApi() && getActiveApiUrl() === PRIMARY_API_URL && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchToBackup();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-warning-surface hover:bg-warning-surface text-warning-foreground border border-border-ink font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <RefreshCw size={12} />
                            <span>Switch to Backup API</span>
                          </button>
                        )}
                        <div className="w-full flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss();
                            }}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss();
                              onRetry?.();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-brutal-sm"
                          >
                            <RefreshCw size={12} />
                            <span>Retry Sync</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* OPTIONAL DIAGNOSTICS ACCORDION IN OTHER ERRORS (Omitted when VTOP is down) */}
                    {logLines.length > 0 && (
                      <div className="w-full mt-3 text-left">
                        <button
                          type="button"
                          onClick={() => setShowConsole(!showConsole)}
                          className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border-2 border-border-ink transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Terminal size={12} className="text-text-muted shrink-0" />
                            <span className="text-xs font-semibold text-text-muted">
                              Error Log & Diagnostics ({logLines.length} events)
                            </span>
                          </div>
                          {showConsole ? (
                            <ChevronUp size={12} className="text-text-muted" />
                          ) : (
                            <ChevronDown size={12} className="text-text-muted" />
                          )}
                        </button>

                        <AnimatePresence>
                          {showConsole && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden mt-1.5"
                            >
                              <div className="bg-surface-secondary text-text-muted border-2 border-border-ink rounded-[10px] p-3 max-h-[140px] overflow-y-auto text-xs font-mono space-y-1.5 scrollbar-none border border-border-ink">
                                {logLines.map((line, idx) => {
                                  const isLast = idx === logLines.length - 1;
                                  const { text, status } = parseLogLine(line, isLast);
                                  return (
                                    <div key={idx} className="flex items-start gap-2">
                                      {getStatusIcon(status)}
                                      <span
                                        className={
                                          status === "error"
                                            ? "text-danger-foreground font-bold"
                                            : isLast
                                              ? "text-white font-bold"
                                              : "text-text-muted"
                                        }
                                      >
                                        {text}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            ) : hasSwitched ? (
              /* 4. SWITCHED TO BACKUP STATE */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center py-5 px-3 gap-3.5"
              >
                <div className="w-12 h-12 rounded-full bg-success-surface text-success-foreground flex items-center justify-center border border-border-ink">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-text-heading text-sm font-outfit">Backup Server Active</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-medium">
                    Connection updated to bypass local firewall filters.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full bg-surface-secondary border-2 border-border-ink rounded-xl p-2.5 pr-1.5 select-none">
                  <Globe size={13} className="text-text-muted shrink-0" />
                  <span className="text-xs text-text-muted font-mono truncate text-left flex-1 font-semibold">
                    {BACKUP_API_URL}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    {copied ? <Check size={11} className="text-success-foreground" /> : <Copy size={11} />}
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.985] cursor-pointer shadow-brutal-sm border-2 border-border-ink"
                >
                  Dismiss & Try Again
                </button>
              </motion.div>
            ) : (
              /* 5. ACTIVE RUNNING SYNC VIEW */
              <>
                {/* 1. UNIFIED HEADER TOOLBAR */}
                <div className="flex items-center justify-between gap-2 pb-1">
                  {/* Left: Mode Chip Selector */}
                  <div className="relative" ref={modeMenuRef}>
                    {modes && modes.length > 0 && onSelectMode ? (
                      <button
                        onClick={() => {
                          setShowModeMenu(!showModeMenu);
                          setShowServerMenu(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-bold bg-secondary text-secondary-foreground border-2 border-border-ink hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-colors cursor-pointer min-h-9"
                        title="Change sync mode"
                      >
                        <Sparkles size={11} className="text-primary shrink-0" />
                        <span className="truncate max-w-[130px]">{activeModeTitle}</span>
                        <ChevronDown size={11} className="opacity-70 shrink-0" />
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-bold bg-surface-secondary text-text-primary min-h-9">
                        <Layers size={11} className="text-text-muted shrink-0" />
                        <span>{activeModeTitle}</span>
                      </div>
                    )}

                    {/* Mode Dropdown Menu */}
                    {showModeMenu && (
                      <div className="absolute left-0 top-full mt-1.5 z-30 w-60 rounded-2xl bg-surface border-2 border-border-ink shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {modes?.map((m) => {
                          const isSelected = m.id === modeId;
                          const isDefault = defaultModeId === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                onSelectMode?.(m.id);
                                setShowModeMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                                isSelected
                                  ? "bg-secondary text-secondary-foreground font-bold"
                                  : "text-text-primary hover:bg-surface-hover font-medium"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  {isDefault && (
                                    <span className="text-xs text-warning-foreground font-bold" title="Default Mode">
                                      ★
                                    </span>
                                  )}
                                  <span className="truncate">{m.label}</span>
                                </div>
                                <span className="text-xs text-text-muted truncate block">{m.description}</span>
                              </div>
                              {isSelected && <Check size={13} className="shrink-0 text-primary" />}
                            </button>
                          );
                        })}

                        {onOpenEditor && (
                          <div className="pt-1 mt-1 border-t border-border-ink">
                            <button
                              onClick={() => {
                                setShowModeMenu(false);
                                onOpenEditor();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left text-xs font-semibold text-text-muted hover:bg-surface-hover transition-colors"
                            >
                              <Settings size={12} />
                              <span>Manage Custom Modes</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Target Server Pill + Prominent Minimize Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Server Status Chip */}
                    <div className="relative" ref={serverMenuRef}>
                      <button
                        onClick={() => {
                          setShowServerMenu(!showServerMenu);
                          setShowModeMenu(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-bold bg-surface-secondary hover:bg-surface-tertiary border-2 border-border-ink text-text-primary transition-colors cursor-pointer min-h-9"
                        title="Target Server Status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            uniccTarget === "unicc"
                              ? "bg-amber-500 animate-pulse"
                              : targetValue === BACKUP_API_URL
                                ? "bg-primary"
                                : "bg-emerald-500"
                          }`}
                        />
                        <span>{activeServerLabel}</span>
                        <ChevronDown size={10} className="text-text-muted" />
                      </button>

                      {/* Server Selection Dropdown */}
                      {showServerMenu && (
                        <div className="absolute right-0 top-full mt-1.5 z-30 w-56 rounded-2xl bg-surface border-2 border-border-ink shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                            Switch Gateway
                          </div>
                          <button
                            onClick={() => handleTargetChange(PRIMARY_API_URL)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                              targetValue === PRIMARY_API_URL && uniccTarget !== "unicc"
                                ? "bg-success-surface text-success-foreground"
                                : "text-text-primary hover:bg-surface-hover"
                            }`}
                          >
                            <span>AmazeCC (Primary)</span>
                            {targetValue === PRIMARY_API_URL && uniccTarget !== "unicc" && (
                              <Check size={13} className="text-success-foreground" />
                            )}
                          </button>

                          {hasBackupApi() && (
                            <button
                              onClick={() => handleTargetChange(BACKUP_API_URL)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                                targetValue === BACKUP_API_URL && uniccTarget !== "unicc"
                                  ? "bg-secondary text-secondary-foreground"
                                  : "text-text-primary hover:bg-surface-hover"
                              }`}
                            >
                              <span>AmazeCC (Backup)</span>
                              {targetValue === BACKUP_API_URL && uniccTarget !== "unicc" && (
                                <Check size={13} className="text-primary" />
                              )}
                            </button>
                          )}

                          {uniccAvailable && (
                            <button
                              onClick={() => handleTargetChange(UNICC_API_URL)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                                uniccTarget === "unicc"
                                  ? "bg-warning-surface text-warning-foreground"
                                  : "text-text-primary hover:bg-surface-hover"
                              }`}
                            >
                              <span>UniCC Proxy</span>
                              {uniccTarget === "unicc" && <Check size={13} className="text-warning-foreground" />}
                            </button>
                          )}

                          {servingText && (
                            <div className="mt-1 pt-1 border-t border-border-ink px-2 py-1 text-[9.5px] font-medium text-text-muted leading-tight">
                              {servingText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bigger Minimize Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(true);
                      }}
                      className="p-2 sm:p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-muted hover:text-text-heading border-2 border-border-ink transition-all cursor-pointer shadow-xs"
                      title="Minimize / Run in background"
                    >
                      <Minimize2 size={17} />
                    </button>
                  </div>
                </div>

                {/* 2. HERO STAGE (PROGRESS & ACTIVE HEADLINE) */}
                <div className="w-full space-y-2 pt-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="font-bold text-text-heading text-sm font-outfit truncate">{cleanedHeadline}</h3>
                    <span className="text-xs font-mono font-bold text-primary shrink-0">
                      {Math.min(100, Math.round(progress))}%
                    </span>
                  </div>

                  {/* High performance spring progress bar */}
                  <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      transition={{ type: "spring", damping: 24, stiffness: 140 }}
                    />
                  </div>
                </div>

                {/* 3. MILESTONE STEPPER */}
                <div className="space-y-1.5 py-1">
                  {milestones.map((mItem) => {
                    return (
                      <div
                        key={mItem.id}
                        className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-surface-secondary border-2 border-border-ink text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {mItem.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-success-foreground shrink-0" />
                          ) : mItem.status === "error" ? (
                            <AlertCircle className="w-4 h-4 text-danger-foreground shrink-0" />
                          ) : mItem.status === "active" ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-border-ink shrink-0" />
                          )}
                          <span
                            className={`font-semibold truncate ${
                              mItem.status === "active"
                                ? "text-text-heading font-bold"
                                : mItem.status === "completed"
                                  ? "text-text-primary"
                                  : "text-text-muted"
                            }`}
                          >
                            {mItem.label}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            mItem.status === "completed"
                              ? "text-success-foreground font-bold"
                              : mItem.status === "error"
                                ? "text-danger-foreground font-bold"
                                : mItem.status === "active"
                                  ? "text-primary animate-pulse font-semibold"
                                  : "text-text-muted"
                          }`}
                        >
                          {mItem.detail}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* INLINE VTOP DOWN ALERT (DURING RUN) */}
                {vtopState === "down" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border-ink bg-danger-surface p-3 flex items-start gap-2.5"
                  >
                    <ServerOff className="w-4 h-4 text-danger-foreground shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-danger-foreground">
                          VTOP is Down
                        </p>
                        <span className="text-xs font-bold text-danger-foreground">Offline</span>
                      </div>
                      <p className="text-xs font-medium text-text-primary leading-relaxed">
                        Direct connection to vtopcc.vit.ac.in timed out. The university portal appears to be offline.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 4. PROGRESSIVE DISCLOSURE: LIVE CONSOLE LOG DRAWER */}
                <div className="w-full space-y-1.5">
                  <div className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-surface-secondary border-2 border-border-ink transition-colors">
                    <button
                      type="button"
                      onClick={() => setShowConsole(!showConsole)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer select-none py-0.5"
                    >
                      <Terminal size={12} className="text-text-muted shrink-0" />
                      <span className="text-xs font-semibold text-text-primary">
                        Diagnostics ({logLines.length} events)
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {showConsole && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(message);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          className="p-1 rounded text-text-muted hover:text-text-muted transition-colors cursor-pointer"
                          title="Copy full logs"
                        >
                          {copied ? <Check size={11} className="text-success-foreground" /> : <Copy size={11} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConsole(!showConsole)}
                        className="p-1 text-text-muted hover:text-text-muted transition-colors cursor-pointer"
                      >
                        {showConsole ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showConsole && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-surface-secondary text-text-muted border-2 border-border-ink rounded-[10px] p-3 max-h-[130px] overflow-y-auto text-xs font-mono space-y-1.5 scrollbar-none border border-border-ink">
                          {logLines.map((line, idx) => {
                            const isLast = idx === logLines.length - 1;
                            const { text, status } = parseLogLine(line, isLast);
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                {getStatusIcon(status)}
                                <span className={isLast ? "text-white font-bold" : "text-text-muted"}>{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5. SLOW NETWORK ALERT BUTTON */}
                <AnimatePresence>
                  {showBackupBtn && hasBackupApi() && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchToBackup();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-warning-surface hover:bg-warning-surface text-warning-foreground border border-border-ink font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.985] cursor-pointer"
                      >
                        <RefreshCw
                          size={11}
                          className="animate-spin text-warning-foreground"
                          style={{ animationDuration: "3s" }}
                        />
                        <span>Slow network? Switch to Backup API</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 6. RED NEON CANCEL SYNC BUTTON */}
                <div className="pt-1.5 w-full">
                  <button
                    onClick={handleCancelSync}
                    className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border-ink bg-danger-surface hover:brightness-95 hover:brightness-95 dark:hover:bg-rose-950/70 text-danger-foreground font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.985] cursor-pointer ring-1 ring-rose-500/40 dark:ring-rose-400/50"
                  >
                    <X size={15} className="stroke-[2.7] text-danger-foreground" />
                    <span className="">Cancel Sync</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  );
}
