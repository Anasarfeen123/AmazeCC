"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  LayoutGrid,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  GraduationCap,
  Bus,
  Loader2,
  User,
  CalendarCheck,
  Car,
  CreditCard,
  Key,
  Download,
  Share,
  Plus,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { getAssetPath } from "@/lib/utils";
import { formatSemesterName } from "@/lib/formatSemesterName";
import { usePwaInstall } from "@/lib/pwaInstall";
import config from "../../../../config.json";
import { api } from "@/lib/sync-engine";
import SimplifiedMobileHome from "../mobile/SimplifiedMobileHome";
import SelectField from "../shared/primitives/SelectField";
import Switch from "../shared/primitives/Switch";
import OnboardingIntro, { type IntroPhase } from "./OnboardingIntro";
import {
  dismissSyncSession,
  isSyncSessionOpen,
  setSyncPresentation,
  useSyncSession,
} from "@/lib/sync-engine/sync-session";
import { setTypedStorageItem, storage } from "@/lib/storage";

export type InterfaceOptionId = "simplified";

const INTERFACES: Array<{
  id: InterfaceOptionId;
  title: string;
  icon: any;
}> = [
  {
    id: "simplified",
    title: "Minimal Dashboard",
    icon: Sparkles,
  },
];

const AVAILABLE_NAV_TABS: Array<{ id: string; label: string; icon: any; desc: string }> = [
  { id: "attendance", label: "Attendance", icon: CalendarCheck, desc: "Timetable & bunk margin" },
  { id: "academics", label: "Academics", icon: GraduationCap, desc: "Marks, CGPA & curriculum" },
  { id: "cabshare", label: "Cab Share", icon: Car, desc: "Share rides & airport cabs" },
  { id: "transport", label: "Transport", icon: Bus, desc: "College bus routes & timings" },
  { id: "payments", label: "Payments", icon: CreditCard, desc: "Tuition & hostel receipts" },
  { id: "credentials", label: "Credentials", icon: Key, desc: "Fast WiFi & VTOP auto-login" },
];

interface AmazeOnboardingFlowProps {
  initialStep?: number;
  isStandaloneInterfacePicker?: boolean;
  /**
   * First-run entry: sign-in → full-sync progress → welcome, drawn in this
   * hero's own design language before the numbered steps. Absent for the
   * standalone interface picker (Dashboard), which has nothing to sign in to.
   */
  intro?: {
    initialPhase: Exclude<IntroPhase, "sync">;
    login: import("./OnboardingIntro").IntroLogin;
  };
  settings: any;
  setSettings: (fn: any) => void;
  username?: string;
  onComplete: (semesterId?: string) => void;
  // Dashboard Live Props for Live Preview
  attendanceData?: any;
  marksData?: any;
  hostelData?: any;
  registeredEvents?: any;
  moodleData?: any;
  IDs?: any;
  profileData?: any;
  ODhoursData?: any;
  calendarData?: any;
  ScheduleData?: any;
  setGradesDisplayIsOpen?: (val: boolean) => void;
  setODhoursIsOpen?: (val: boolean) => void;
  handleReloadRequest?: (semId?: string) => Promise<any>;
  onOpenCommandPalette?: () => void;
  // Fresher Data
  eptData?: any;
  acknowledgementData?: any;
}

// iOS Safari never fires `beforeinstallprompt`, so there the install step
// falls back to the manual Share → Add to Home Screen instructions instead.
function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) return new Uint8Array(0);
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function AmazeOnboardingFlow({
  initialStep = 0,
  isStandaloneInterfacePicker = false,
  intro,
  settings,
  setSettings,
  username = "",
  onComplete,
  attendanceData,
  marksData,
  hostelData,
  registeredEvents,
  moodleData,
  IDs,
  profileData,
  ODhoursData,
  calendarData,
  ScheduleData,
  setGradesDisplayIsOpen,
  setODhoursIsOpen,
  handleReloadRequest,
  onOpenCommandPalette,
  eptData,
  acknowledgementData,
}: AmazeOnboardingFlowProps) {
  const hasMultipleInterfaces = INTERFACES.length > 1;
  const [step, setStep] = useState(() =>
    initialStep === 1 && !isStandaloneInterfacePicker && !hasMultipleInterfaces ? 2 : initialStep,
  );
  // Sign-in + the first full sync + the welcome beat live in front of the
  // numbered steps; the standalone interface picker has none of them.
  const [introDone, setIntroDone] = useState(!intro);
  const syncSession = useSyncSession();
  // Residency comes from the VTOP profile when it is known (it reports
  // isHosteller), so the student only confirms it instead of guessing.
  const vtopIsHosteller = (() => {
    try {
      const flag = (storage.profile.get() as any)?.isHosteller;
      return typeof flag === "boolean" ? flag : null;
    } catch {
      return null;
    }
  })();
  const [temp, setTemp] = useState({
    ...settings,
    residentialStatus:
      settings?.residentialStatus ??
      (vtopIsHosteller === null ? undefined : vtopIsHosteller ? "hosteller" : "dayscholar"),
    pinnedNavTabs: settings?.pinnedNavTabs || ["attendance", "academics", "cabshare"],
    showProfilePhoto: settings?.showProfilePhoto ?? true,
    isDayscholarWithBus: settings?.isDayscholarWithBus ?? false,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
  });

  // Install-as-web step: reads the globally captured `beforeinstallprompt`
  // (see lib/pwaInstall) so the hero itself is the only install surface.
  const { canInstall, promptInstall } = usePwaInstall();
  const [installLoading, setInstallLoading] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Dynamic Viewport Dimensions & Aspect Ratio for responsive horizontal dual-pane layout
  const [viewportDimensions, setViewportDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  const [viewportRatio, setViewportRatio] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return Math.min(0.75, Math.max(0.42, w / Math.max(1, h)));
    }
    return 9 / 19;
  });

  useEffect(() => {
    setIsMounted(true);
    const updateDimensionsAndRatio = () => {
      if (typeof window !== "undefined") {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setViewportDimensions({ width: w, height: h });
        setViewportRatio(Math.min(0.75, Math.max(0.42, w / Math.max(1, h))));
      }
    };
    updateDimensionsAndRatio();
    window.addEventListener("resize", updateDimensionsAndRatio);
    return () => window.removeEventListener("resize", updateDimensionsAndRatio);
  }, []);

  // The first login must not pop the sync sheet over this hero — the intro
  // draws the run itself from the same session store. Restoring "sheet" on
  // unmount puts every later sync back behind the normal floating notification.
  useEffect(() => {
    if (isStandaloneInterfacePicker) return;
    setSyncPresentation("inline");
    return () => setSyncPresentation("sheet");
  }, [isStandaloneInterfacePicker]);

  const isHorizontal = isMounted && viewportDimensions.width > viewportDimensions.height;

  const interfaces = INTERFACES;

  const [activeInterfaceIdx, setActiveInterfaceIdx] = useState(0);

  const currentOption = interfaces[activeInterfaceIdx];
  const shouldAutoSelectInterface = isStandaloneInterfacePicker && interfaces.length <= 1;
  const hasAutoSelectedInterface = useRef(false);

  const update = (key: string, val: any) => {
    setTemp((prev: any) => ({ ...prev, [key]: val }));
  };

  const togglePinnedTab = (tabId: string) => {
    const current = temp.pinnedNavTabs || [];
    const isPinned = current.includes(tabId);
    if (!isPinned && current.length >= 4) return;
    const next = isPinned ? current.filter((id: string) => id !== tabId) : [...current, tabId];
    update("pinnedNavTabs", next);
  };

  const nextStep = () => {
    if (isStandaloneInterfacePicker) {
      finish();
      return;
    }

    if (step === 0 && !hasMultipleInterfaces) {
      setStep(2);
      return;
    }

    if (step < 5) setStep(step + 1);
    else finish();
  };

  const prevStep = () => {
    if (!hasMultipleInterfaces && step === 2) setStep(0);
    else if (step > 0) setStep(step - 1);
  };

  const finish = useCallback(() => {
    const finalSettings = {
      ...temp,
      interfaceChosen: true,
    };
    try {
      setTypedStorageItem("has_selected_interface", "true");
      setTypedStorageItem("introDone", "true");
      setTypedStorageItem("hasSeenPushPrompt", "true");
      setTypedStorageItem("push_prompt_dismissed", "true");
      setTypedStorageItem("busPromptDismissed", "true");
    } catch {}

    // Launch is not the moment for a progress modal: if the first full sync is
    // still sweeping in the background, let it finish silently instead of
    // opening the sheet the intro deliberately avoided.
    setSyncPresentation("sheet");
    if (isSyncSessionOpen()) dismissSyncSession();

    setSettings(() => finalSettings);
    onComplete(finalSettings.currSemesterID);
  }, [temp, setSettings, onComplete]);

  useEffect(() => {
    if (!shouldAutoSelectInterface || hasAutoSelectedInterface.current) return;
    hasAutoSelectedInterface.current = true;
    finish();
  }, [finish, shouldAutoSelectInterface]);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotifEnabled(true);
        setTypedStorageItem("hasSeenPushPrompt", "true");
        setTypedStorageItem("push_prompt_dismissed", "true");

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidPublicKey && (username || IDs?.VtopUsername) && "serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          await api("notifications/subscribe", {
            method: "POST",
            body: {
              UserID: username || IDs?.VtopUsername,
              subscription: JSON.parse(JSON.stringify(sub)),
              vitol_enabled: false,
              vitol_reminder_day: 1,
              vitol_reminder_time: "10:00",
            },
          });
        }
      } else {
        setNotifEnabled(false);
      }
    } catch (err) {
      console.error("Failed to enable push notifications", err);
    } finally {
      setNotifLoading(false);
    }
  };

  // Already-installed windows (installed PWA opened from the home screen)
  // don't need an install offer — say so instead of showing a dead button.
  useEffect(() => {
    setIsInstalled(isRunningStandalone());
  }, []);

  const installApp = async () => {
    setInstallLoading(true);
    try {
      const accepted = await promptInstall();
      if (accepted) setIsInstalled(true);
    } finally {
      setInstallLoading(false);
    }
  };

  // Preview settings proxy for live dashboard render
  const previewSettings = {
    ...temp,
    timetablePillStyle: temp.timetablePillStyle || "compact",
  };

  const totalSteps = hasMultipleInterfaces ? 6 : 5;
  const visibleStep = hasMultipleInterfaces || step === 0 ? step : step - 1;
  const stepLabels = [
    "Profile",
    ...(hasMultipleInterfaces ? ["Interface"] : []),
    "Display & goals",
    "Navigation",
    "Alerts",
    "Install",
  ];

  // Render Helpers for shared cards across vertical & horizontal dual-pane layouts
  const renderProfileCard = () => (
    <div className="p-5 sm:p-6 rounded-[16px] border-[3px] border-border-ink bg-surface shadow-brutal-md space-y-4 text-left">
      {/* Friendly Name */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
          What should we call you?
        </label>
        <input
          type="text"
          value={temp.friendlyName || ""}
          onChange={(e) => update("friendlyName", e.target.value)}
          placeholder={username || IDs?.VtopUsername || "Your Name"}
          className="w-full px-4 py-2.5 rounded-xl border border-border-ink bg-background text-sm font-bold text-text-heading focus:outline-none focus:ring-2 focus:ring-border-ink transition-all placeholder:text-text-muted"
        />
      </div>

      {/* Current Semester Selector */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
          Current Semester
        </label>
        <div>
          <SelectField
            value={temp.currSemesterID || config.semesterIDs[config.semesterIDs.length - 2]}
            onChange={(val) => update("currSemesterID", val)}
            options={config.semesterIDs.map((semId: string) => ({
              value: semId,
              label: formatSemesterName(semId),
            }))}
            stacked
            searchable
            role="group"
            aria-label="Current semester"
            className="[&>button:first-child]:border-border-ink [&>button:first-child]:bg-background [&>button:first-child]:text-white"
          />
        </div>
      </div>

      {/* Campus Residency & Bus Mode */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
          Campus Residency & Commute
        </label>
        {vtopIsHosteller !== null ? (
          <p className="text-xs text-text-muted">
            Detected from VTOP: {vtopIsHosteller ? "hosteller" : "day scholar"}. Change it if that is wrong.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "hosteller", label: "Hosteller", desc: "Living on campus", icon: GraduationCap },
            { id: "dayscholar", label: "Day Scholar", desc: "Daily commuter", icon: Bus },
          ].map((opt) => {
            const isSelected = temp.residentialStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  update("residentialStatus", opt.id);
                  if (opt.id === "hosteller") update("isDayscholarWithBus", false);
                }}
                className={`p-3 rounded-[12px] border-2 text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                  isSelected
                    ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
                    : "bg-surface border-border-ink text-text-primary hover:bg-surface-secondary"
                }`}
              >
                <div>
                  <p className="font-bold text-xs text-text-heading font-outfit">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* College bus: day scholars only (user: a hosteller was asked if
            they use the college bus). */}
        {temp.residentialStatus === "dayscholar" ? (
          <div className="p-3 rounded-[12px] bg-surface-secondary border-2 border-border-ink flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm font-bold text-text-heading">College bus user?</p>
                <p className="text-xs text-text-muted">Show bus routes and stops</p>
              </div>
            </div>
            <Switch
              checked={!!temp.isDayscholarWithBus}
              onCheckedChange={(v) => update("isDayscholarWithBus", v)}
              label="College bus user"
            />
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderPreviewIsland = (isLandscapeMode = false) => (
    <div
      style={{
        aspectRatio: isLandscapeMode ? "9 / 19" : `${viewportRatio}`,
      }}
      className={`${
        isLandscapeMode ? "h-[76vh] max-h-[660px] max-w-[85%]" : "h-[52vh] sm:h-[58vh] max-h-[600px] max-w-[88vw]"
      } rounded-[34px] sm:rounded-[42px] border-2 border-border-ink bg-surface shadow-2xl overflow-hidden flex flex-col relative text-left ring-1 ring-white/10`}
    >
      {/* Top Island Notch / Camera Pill */}
      <div className="w-20 h-3.5 sm:h-4 bg-background rounded-full mx-auto my-1.5 shrink-0 border border-border-ink flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-secondary" />
      </div>

      {/* Scaled Preview Inner Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 select-none">
        <div
          style={{
            width: "153.85%",
            transform: "scale(0.65)",
            transformOrigin: "top left",
            marginBottom: "-53.85%",
            marginRight: "-53.85%",
          }}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={currentOption.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              {currentOption.id === "simplified" && (
                <SimplifiedMobileHome
                  attendanceData={attendanceData}
                  marksData={marksData}
                  hostelData={hostelData}
                  registeredEvents={registeredEvents}
                  moodleData={moodleData}
                  settings={previewSettings}
                  setSettings={setSettings}
                  IDs={IDs}
                  setActiveTab={() => {}}
                  setActiveSubTab={() => {}}
                  setHostelActiveSubTab={() => {}}
                  setActiveAttendanceSubTab={() => {}}
                  setActiveProfileSubTab={() => {}}
                  handleReloadRequest={handleReloadRequest}
                  onOpenCommandPalette={onOpenCommandPalette}
                  profileData={profileData}
                  ODhoursData={ODhoursData}
                  calendarData={calendarData}
                  ScheduleData={ScheduleData}
                  setGradesDisplayIsOpen={setGradesDisplayIsOpen}
                  setODhoursIsOpen={setODhoursIsOpen}
                />
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderDisplayCard = () => (
    <div className="p-5 sm:p-6 rounded-[16px] border-[3px] border-border-ink bg-surface shadow-brutal-md space-y-4 text-left">
      {/* Dashboard Avatar Option */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
          Dashboard Greeting Avatar
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => update("showProfilePhoto", true)}
            className={`p-3 rounded-[12px] border-2 text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              temp.showProfilePhoto !== false
                ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
                : "bg-surface border-border-ink text-text-primary hover:bg-surface-secondary"
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-surface-secondary flex items-center justify-center text-primary shrink-0 font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-text-heading font-outfit truncate">Profile Photo</p>
              <p className="text-xs text-text-muted truncate">Your VTOP picture</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => update("showProfilePhoto", false)}
            className={`p-3 rounded-[12px] border-2 text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              temp.showProfilePhoto === false
                ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
                : "bg-surface border-border-ink text-text-primary hover:bg-surface-secondary"
            }`}
          >
            <img
              loading="lazy"
              src={getAssetPath("/brand/icon-app.svg")}
              alt="AmazeCC"
              decoding="async"
              className="w-7 h-7 rounded-xl object-contain border border-border-ink p-0.5 bg-surface shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold text-xs text-text-heading font-outfit truncate">AmazeCC Logo</p>
              <p className="text-xs text-text-muted truncate">Minimal app icon</p>
            </div>
          </button>
        </div>
      </div>

      {/* Target Attendance Goal */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
            Target Attendance Goal
          </label>
          <span className="text-xs font-bold text-primary">{temp.targetAttendance || 75}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[75, 80, 85].map((pct) => {
            const isSelected = Number(temp.targetAttendance || 75) === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => update("targetAttendance", pct)}
                className={`min-h-11 rounded-[10px] border-2 border-border-ink font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  isSelected
                    ? "bg-secondary text-secondary-foreground shadow-brutal-sm"
                    : "bg-surface text-text-primary hover:bg-surface-secondary"
                }`}
              >
                {pct}% Goal
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle GPA */}
      <div className="pt-2 border-t border-border-ink flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-text-heading">Show GPA on Home</p>
          <p className="text-xs text-text-muted">Quick grade indicator card</p>
        </div>
        <Switch checked={!!temp.showGpa} onCheckedChange={(v) => update("showGpa", v)} label="Show GPA on Home" />
      </div>
    </div>
  );

  const renderBottomNavCard = () => (
    <div className="p-5 sm:p-6 rounded-[16px] border-[3px] border-border-ink bg-surface shadow-brutal-md space-y-3.5 text-left">
      {/* Live Dock Preview */}
      <div className="p-2.5 rounded-[12px] bg-background border-2 border-border-ink flex items-center justify-around">
        <div className="flex flex-col items-center gap-0.5 opacity-60">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-text-muted">Home</span>
        </div>
        {(temp.pinnedNavTabs || []).map((tId: string) => {
          const found = AVAILABLE_NAV_TABS.find((x) => x.id === tId);
          if (!found) return null;
          const Icon = found.icon;
          return (
            <div key={tId} className="flex flex-col items-center gap-0.5 animate-in fade-in zoom-in duration-150">
              <Icon className="w-3.5 h-3.5 text-text-heading" />
              <span className="text-xs font-bold text-text-heading truncate max-w-[48px]">{found.label}</span>
            </div>
          );
        })}
        <div className="flex flex-col items-center gap-0.5 opacity-60">
          <LayoutGrid className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-bold text-text-muted">Apps</span>
        </div>
      </div>

      {/* Tab choices: the two most students use first; the rest are optional
          and sit lower, smaller (user: keep rarely used things deeper). */}
      {[AVAILABLE_NAV_TABS.slice(0, 2), AVAILABLE_NAV_TABS.slice(2)].map((list, li) => (
        <div key={li} className={li === 0 ? "grid grid-cols-2 gap-2" : "space-y-2 pt-1"}>
          {li === 1 && (
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
              Other shortcuts (optional)
            </p>
          )}
          <div className={li === 1 ? "grid grid-cols-2 gap-2 opacity-90" : "contents"}>
            {list.map((tab) => {
              const isPinned = (temp.pinnedNavTabs || []).includes(tab.id);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => togglePinnedTab(tab.id)}
                  className={`p-2.5 rounded-[12px] border-2 text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    isPinned
                      ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
                      : "bg-surface border-border-ink text-text-primary hover:bg-surface-secondary"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isPinned ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-text-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-text-heading font-outfit truncate">{tab.label}</p>
                    <p className="text-xs text-text-muted truncate">{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderNotificationsCard = () => (
    <div className="p-5 sm:p-6 rounded-[16px] border-[3px] border-border-ink bg-surface shadow-brutal-md space-y-3 text-left">
      {[
        { title: "Timetable Reminders", desc: "15 minutes before your class" },
        { title: "Attendance Safeguard", desc: "Alert if attendance drops below 75%" },
        { title: "Exam Seat & Venue Alerts", desc: "Live seating and room schedules" },
      ].map((perk, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2.5 rounded-[12px] bg-surface-secondary border-2 border-border-ink"
        >
          <div>
            <p className="text-xs font-bold text-text-heading">{perk.title}</p>
            <p className="text-xs text-text-muted">{perk.desc}</p>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={enableNotifications}
        disabled={notifLoading || notifEnabled}
        className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 mt-2 ${
          notifEnabled
            ? "bg-emerald-600/20 text-success-foreground border border-border-ink"
            : "bg-primary hover:brightness-110 text-primary-foreground shadow-brutal-sm border-2 border-border-ink cursor-pointer"
        }`}
      >
        {notifEnabled ? (
          <>
            <Check className="w-4 h-4" />
            <span>Instant Alerts Enabled</span>
          </>
        ) : notifLoading ? (
          <span>Enabling Alerts...</span>
        ) : (
          <span>Enable Class Alerts</span>
        )}
      </button>

      {/* Fresher Specific Callout if detected */}
      {eptData?.tables?.[0]?.rows?.length > 0 && (
        <div className="p-3 rounded-[12px] bg-surface-secondary border-2 border-border-ink space-y-0.5 mt-2">
          <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
            Fresher Schedule Active
          </span>
          <p className="text-xs font-bold text-text-secondary">
            EPT & Orientation Schedule integrated into your calendar.
          </p>
        </div>
      )}
    </div>
  );

  const renderInstallCard = () => {
    const showManualSteps = !canInstall && !isInstalled && isIosSafari();
    return (
      <div className="p-5 sm:p-6 rounded-[16px] border-[3px] border-border-ink bg-surface shadow-brutal-md space-y-3 text-left">
        {[
          { title: "Full-Screen App", desc: "Opens like a native app, no browser chrome" },
          { title: "Works Offline", desc: "Your dashboard loads even on patchy campus wifi" },
          { title: "Push Notifications", desc: "Class alerts keep flowing outside the tab" },
        ].map((perk, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2.5 rounded-[12px] bg-surface-secondary border-2 border-border-ink"
          >
            <div>
              <p className="text-xs font-bold text-text-heading">{perk.title}</p>
              <p className="text-xs text-text-muted">{perk.desc}</p>
            </div>
          </div>
        ))}

        {isInstalled ? (
          <button
            type="button"
            disabled
            className="w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 mt-2 bg-emerald-600/20 text-success-foreground border border-border-ink"
          >
            <Check className="w-4 h-4" />
            <span>AmazeCC Is Installed</span>
          </button>
        ) : canInstall ? (
          <button
            type="button"
            onClick={installApp}
            disabled={installLoading}
            className="w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 mt-2 bg-primary hover:brightness-110 text-primary-foreground shadow-brutal-sm border-2 border-border-ink cursor-pointer disabled:opacity-70"
          >
            {installLoading ? (
              <span>Opening Install Prompt...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Install AmazeCC</span>
              </>
            )}
          </button>
        ) : showManualSteps ? (
          <ol className="space-y-2.5 text-xs font-medium text-text-secondary pt-1">
            <li className="flex items-start gap-2.5">
              <Share className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>
                Tap the <strong className="text-text-heading">Share</strong> button in Safari&apos;s toolbar.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Plus className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>
                Choose <strong className="text-text-heading">Add to Home Screen</strong>, then confirm.
              </span>
            </li>
          </ol>
        ) : (
          <p className="text-xs text-text-muted leading-relaxed pt-1">
            Use your browser&apos;s menu to add AmazeCC to your home screen for the full app experience.
          </p>
        )}
      </div>
    );
  };

  if (!introDone && intro) {
    return <OnboardingIntro initialPhase={intro.initialPhase} login={intro.login} onDone={() => setIntroDone(true)} />;
  }

  if (shouldAutoSelectInterface) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background text-text-primary flex flex-col justify-between overflow-hidden select-none px-5 sm:px-8 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] sm:pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] animate-in fade-in duration-300">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

      {/* First-login sync still sweeping? Keep the percentage visible in the
          hero instead of opening the sheet it was deliberately suppressed for. */}
      {!isStandaloneInterfacePicker && syncSession.open && (
        <div
          role="status"
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-30 flex -translate-x-1/2 items-center gap-2 rounded-[10px] border border-border-ink bg-surface px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-text-secondary shadow-xl font-outfit min-h-9"
        >
          <Loader2 size={12} className="animate-spin text-primary" />
          Syncing {Math.round(syncSession.progress)}%
        </div>
      )}

      {/* ── RESPONSIVE DUAL PANE LAYOUT (WHEN VIEWPORT IS HORIZONTAL > VERTICAL) ── */}
      {isHorizontal ? (
        <div className="relative z-20 w-full max-w-6xl mx-auto flex-1 flex flex-row items-center justify-between gap-8 lg:gap-14 h-full min-h-0 py-2">
          {/* LEFT PANE: Little bit smaller than right pane (~40-42%) */}
          <div className="w-[42%] max-w-md shrink-0 flex flex-col justify-between h-full max-h-[640px] py-1 select-none">
            {/* Top: Back Button, Progress Bar & Step Indicator */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              {step > 0 && !isStandaloneInterfacePicker ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-[10px] border-2 border-border-ink bg-surface px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm brutal-press"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="w-16" />
              )}

              {/* Step Indicator Pills */}
              {!isStandaloneInterfacePicker && (
                <div className="flex items-center gap-1.5" aria-hidden>
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 rounded-[3px] border-2 border-border-ink transition-all duration-200 ${
                        i === visibleStep ? "w-8 bg-ochre" : i < visibleStep ? "w-4 bg-secondary" : "w-4 bg-surface"
                      }`}
                    />
                  ))}
                </div>
              )}

              {!isStandaloneInterfacePicker ? (
                <span className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
                  Step {visibleStep + 1} of {totalSteps}
                </span>
              ) : (
                <div className="w-16" />
              )}
            </div>

            {/* Center: Heading, Header, Icon, Description.
                min-h-0 + overflow-y-auto lets this middle section scroll when the
                viewport is short (landscape phones get ~350px of height, less than
                one step's content) — the shell is overflow-hidden, so without a
                scroll container here the Continue button gets clipped and the step
                becomes un-completable. Header and actions above/below stay pinned. */}
            <div className="flex flex-col items-start text-left space-y-4 my-auto min-h-0 overflow-y-auto py-2">
              {step === 1 || isStandaloneInterfacePicker ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        Workspace Layout
                      </span>
                      <h2 className="mt-2 font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading lg:text-[36px]">
                        Choose your interface
                      </h2>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-text-muted">
                    Pick how you want AmazeCC to look and feel. Switch between simplified or attendance anytime.
                  </p>

                  {/* Icon-Only Option Bar */}
                  <div className="space-y-2 pt-1 w-full">
                    <label className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
                      Select Mode
                    </label>
                    <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-surface border border-border-ink shadow-lg">
                      {interfaces.map((item, idx) => {
                        const isCurrent = activeInterfaceIdx === idx;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveInterfaceIdx(idx)}
                            title={item.title}
                            aria-pressed={isCurrent}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              isCurrent
                                ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink scale-105"
                                : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary"
                            }`}
                          >
                            <item.icon className="w-4.5 h-4.5" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Mode Summary Card */}
                    <div className="p-3.5 rounded-[12px] bg-surface border-2 border-border-ink shadow-sm space-y-1 mt-2">
                      <p className="text-xs font-bold text-text-heading flex items-center gap-2 font-outfit">
                        <currentOption.icon className="w-4 h-4 text-primary" />
                        <span>{currentOption.title}</span>
                      </p>
                      <p className="text-xs text-text-muted leading-relaxed">
                        Clean, focused single-page view with essential widgets, quick timetable glance, and simplified
                        cards.
                      </p>
                    </div>
                  </div>
                </>
              ) : step === 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        Getting Started
                      </span>
                      <h1 className="mt-2 font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading lg:text-[36px]">
                        Welcome to AmazeCC
                      </h1>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-text-muted">
                    Set up your personalized college companion in seconds.
                  </p>
                </>
              ) : step === 2 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        Personalization
                      </span>
                      <h2 className="mt-2 font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading lg:text-[36px]">
                        Display & Goals
                      </h2>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-text-muted">
                    Set your avatar, colors, and attendance safe goals.
                  </p>
                </>
              ) : step === 3 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        Navigation
                      </span>
                      <h2 className="mt-2 font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading lg:text-[36px]">
                        Bottom Navigation
                      </h2>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-text-muted">
                    Pin up to 4 quick-access tabs for your mobile dock.
                  </p>
                </>
              ) : step === 4 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        Smart Alerts
                      </span>
                      <h2 className="mt-2 font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading lg:text-[36px]">
                        Stay Ahead of Classes
                      </h2>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-text-muted">
                    Instant class alerts and low attendance safeguards.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-secondary-foreground">
                        Install
                      </span>
                      <h2 className="mt-2 font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading lg:text-[36px]">
                        AmazeCC on Your Device
                      </h2>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-text-muted">
                    Add AmazeCC as a web app for a full-screen, offline-ready experience.
                  </p>
                </>
              )}

              {/* The whole journey at a glance: fills the left column on wide
                  screens and shows what is done and what comes next. */}
              {!isStandaloneInterfacePicker && (
                <ol className="mt-2 w-full space-y-1.5" aria-label="Setup steps">
                  {stepLabels.map((label, i) => {
                    const state = i === visibleStep ? "now" : i < visibleStep ? "done" : "next";
                    return (
                      <li
                        key={label}
                        aria-current={state === "now" ? "step" : undefined}
                        className={`flex min-h-10 items-center gap-3 rounded-[10px] border-2 px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] ${
                          state === "now"
                            ? "border-border-ink bg-ochre text-obsidian shadow-brutal-sm"
                            : state === "done"
                              ? "border-border-ink bg-secondary text-secondary-foreground"
                              : "border-dashed border-border bg-transparent text-text-muted"
                        }`}
                      >
                        <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1 truncate">{label}</span>
                        <span>{state === "done" ? "Done" : state === "now" ? "Now" : ""}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Bottom: Action Buttons on the Left */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 w-full">
              {interfaces.length > 1 && (step === 1 || isStandaloneInterfacePicker) && (
                <button
                  type="button"
                  onClick={() => setActiveInterfaceIdx((prev) => (prev - 1 + interfaces.length) % interfaces.length)}
                  aria-label="Previous Interface"
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-heading shadow-brutal-sm brutal-press"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={nextStep}
                className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 truncate rounded-[12px] border-2 border-border-ink bg-primary px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-md brutal-press"
              >
                <span className="truncate">
                  {isStandaloneInterfacePicker
                    ? `Select ${currentOption.title}`
                    : step === 5
                      ? "Launch AmazeCC"
                      : step === 1
                        ? `Continue with ${currentOption.title}`
                        : "Continue"}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              {interfaces.length > 1 && (step === 1 || isStandaloneInterfacePicker) && (
                <button
                  type="button"
                  onClick={() => setActiveInterfaceIdx((prev) => (prev + 1) % interfaces.length)}
                  aria-label="Next Interface"
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-heading shadow-brutal-sm brutal-press"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Big island view on the right (~58%) */}
          <div className="w-[58%] flex-1 flex items-center justify-center h-full min-h-0 pl-2 lg:pl-6 overflow-y-auto">
            {step === 1 || isStandaloneInterfacePicker ? (
              renderPreviewIsland(true)
            ) : step === 0 ? (
              <div className="w-full max-w-md py-4">{renderProfileCard()}</div>
            ) : step === 2 ? (
              <div className="w-full max-w-md py-4">{renderDisplayCard()}</div>
            ) : step === 3 ? (
              <div className="w-full max-w-md py-4">{renderBottomNavCard()}</div>
            ) : step === 4 ? (
              <div className="w-full max-w-md py-4">{renderNotificationsCard()}</div>
            ) : (
              <div className="w-full max-w-md py-4">{renderInstallCard()}</div>
            )}
          </div>
        </div>
      ) : (
        /* ── ORIGINAL VERTICAL LAYOUT (PORTRAIT / MOBILE SCREENS) ── */
        <>
          {/* ── TOP BAR: BACK BUTTON, PROGRESS PILLS & STEP TITLE ── */}
          <header className="relative z-20 w-full max-w-md sm:max-w-lg mx-auto flex items-center justify-between shrink-0 pt-1">
            {step > 0 && !isStandaloneInterfacePicker ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-[10px] border-2 border-border-ink bg-surface px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm brutal-press"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div className="w-16" />
            )}

            {/* Step Indicator Pills */}
            {!isStandaloneInterfacePicker && (
              <div className="flex items-center gap-1.5" aria-hidden>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 rounded-[3px] border-2 border-border-ink transition-all duration-200 ${
                      i === visibleStep ? "w-8 bg-ochre" : i < visibleStep ? "w-4 bg-secondary" : "w-4 bg-surface"
                    }`}
                  />
                ))}
              </div>
            )}

            {!isStandaloneInterfacePicker ? (
              <span className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
                Step {visibleStep + 1} of {totalSteps}
              </span>
            ) : (
              <div className="w-16" />
            )}
          </header>

          {/* ── MAIN STEP CONTENT (SPACIOUS & CENTERED) ──
              overflow-y-auto: on short viewports (or when the keyboard eats half
              the screen) a step's card can exceed the space between the top bar
              and the footer actions; without a scroll container the shell's
              overflow-hidden would clip it with no way to reach the rest.
              Each step child carries `my-auto` so overflowing content anchors to
              the top (auto margins collapse to 0 in negative free space) instead
              of being centred — centred overflow leaves the top unreachable. */}
          <main className="relative z-20 w-full max-w-md sm:max-w-lg mx-auto flex-1 flex flex-col items-center justify-center my-auto min-h-0 overflow-y-auto py-2">
            <AnimatePresence mode="wait">
              {/* ──── STEP 0: WELCOME, SEMESTER & CAMPUS/BUS RESIDENCY ──── */}
              {step === 0 && !isStandaloneInterfacePicker && (
                <m.div
                  key="step-profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="my-auto w-full space-y-4 sm:space-y-5 text-center"
                >
                  <div className="flex flex-col items-center gap-2.5">
                    <h1 className="font-display text-[24px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[30px]">
                      Welcome to AmazeCC
                    </h1>
                    <p className="text-sm text-text-muted max-w-xs">
                      Set up your personalized college companion in seconds.
                    </p>
                  </div>

                  {/* Profile Card */}
                  {renderProfileCard()}
                </m.div>
              )}

              {/* ──── STEP 1: CHOOSE YOUR INTERFACE (ISLAND CAROUSEL WITH DYNAMIC ASPECT RATIO) ──── */}
              {(step === 1 || isStandaloneInterfacePicker) && (
                <m.div
                  key="step-interface"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="w-full shrink-0 flex flex-col items-center justify-center my-auto space-y-3"
                >
                  {/* Header inside interface picker */}
                  <div className="flex flex-col items-center text-center space-y-2 shrink-0">
                    <h2 className="font-display text-[24px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[30px]">
                      Choose your interface
                    </h2>

                    {/* Icon-Only Option Bar */}
                    <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-surface border border-border-ink shadow-lg">
                      {interfaces.map((item, idx) => {
                        const isCurrent = activeInterfaceIdx === idx;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveInterfaceIdx(idx)}
                            title={item.title}
                            aria-pressed={isCurrent}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              isCurrent
                                ? "bg-primary text-primary-foreground shadow-brutal-sm border-2 border-border-ink scale-105"
                                : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary"
                            }`}
                          >
                            <item.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Aspect Ratio Preview Island */}
                  {renderPreviewIsland(false)}
                </m.div>
              )}

              {/* ──── STEP 2: PERSONALIZATION, AVATAR & GOALS ──── */}
              {step === 2 && !isStandaloneInterfacePicker && (
                <m.div
                  key="step-personalization"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="my-auto w-full space-y-4 sm:space-y-5 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="font-display text-[24px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[30px]">
                      Display & Goals
                    </h2>
                    <p className="text-sm text-text-muted">Set your avatar, colors, and attendance safe goals.</p>
                  </div>

                  {/* Preferences Card */}
                  {renderDisplayCard()}
                </m.div>
              )}

              {/* ──── STEP 3: CUSTOMIZE BOTTOM NAVIGATION TABS ──── */}
              {step === 3 && !isStandaloneInterfacePicker && (
                <m.div
                  key="step-bottomnav"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="my-auto w-full space-y-4 sm:space-y-5 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="font-display text-[24px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[30px]">
                      Bottom Navigation
                    </h2>
                    <p className="text-sm text-text-muted">Pin up to 4 quick-access tabs for your mobile dock.</p>
                  </div>

                  {/* Bottom Nav Customizer Card */}
                  {renderBottomNavCard()}
                </m.div>
              )}

              {/* ──── STEP 4: SMART NOTIFICATIONS & READY ──── */}
              {step === 4 && !isStandaloneInterfacePicker && (
                <m.div
                  key="step-notifications"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="my-auto w-full space-y-4 sm:space-y-5 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="font-display text-[24px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[30px]">
                      Stay Ahead of Classes
                    </h2>
                    <p className="text-sm text-text-muted">Instant class alerts and low attendance safeguards.</p>
                  </div>

                  {/* Notification & Launch Card */}
                  {renderNotificationsCard()}
                </m.div>
              )}

              {/* ──── STEP 5: INSTALL AS A WEB APP ──── */}
              {step === 5 && !isStandaloneInterfacePicker && (
                <m.div
                  key="step-install"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="my-auto w-full space-y-4 sm:space-y-5 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="font-display text-[24px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[30px]">
                      Install AmazeCC
                    </h2>
                    <p className="text-sm text-text-muted max-w-xs">
                      Add it as a web app for a full-screen, offline-ready experience.
                    </p>
                  </div>

                  {/* Install Card & Launch */}
                  {renderInstallCard()}
                </m.div>
              )}
            </AnimatePresence>
          </main>

          {/* ── BOTTOM ACTION BAR (GENEROUS SPACING & DUAL ARROWS) ── */}
          <footer className="relative z-20 w-full max-w-sm sm:max-w-md mx-auto flex items-center justify-center gap-2.5 shrink-0 pb-1 sm:pb-3">
            {/* If on interface step, provide left & right carousel arrows */}
            {interfaces.length > 1 && (step === 1 || isStandaloneInterfacePicker) && (
              <button
                type="button"
                onClick={() => setActiveInterfaceIdx((prev) => (prev - 1 + interfaces.length) % interfaces.length)}
                aria-label="Previous Interface"
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-heading shadow-brutal-sm brutal-press"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Main CTA Button */}
            <button
              type="button"
              onClick={nextStep}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 truncate rounded-[12px] border-2 border-border-ink bg-primary px-5 font-mono text-sm font-bold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-md brutal-press"
            >
              <span className="truncate">
                {isStandaloneInterfacePicker
                  ? `Select ${currentOption.title}`
                  : step === 5
                    ? "Launch AmazeCC"
                    : step === 1
                      ? `Continue with ${currentOption.title}`
                      : "Continue"}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* If on interface step, provide right arrow */}
            {interfaces.length > 1 && (step === 1 || isStandaloneInterfacePicker) && (
              <button
                type="button"
                onClick={() => setActiveInterfaceIdx((prev) => (prev + 1) % interfaces.length)}
                aria-label="Next Interface"
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-heading shadow-brutal-sm brutal-press"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
