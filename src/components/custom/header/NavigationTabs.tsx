"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import BrandLogo from "../shared/BrandLogo";
import SidebarThemeSwitch from "../theme/SidebarThemeSwitch";
import { TOGGLE_SIDEBAR_EVENT } from "@/lib/shortcuts";
import { useAtomValue } from "jotai";
import { unifiedIdentityAtom, unifiedAcademicsAtom } from "@/store";
import type { UnifiedUserIdentity } from "@/types";
import OptionPicker from "../shared/primitives/OptionPicker";
import AppLibraryPortal from "./AppLibraryPortal";

import { getAssetPath } from "@/lib/utils";
import { formatSemesterName } from "@/lib/formatSemesterName";
import { privacyCategories, togglePrivacyCategory } from "@/lib/privacyMode";

import { createTapTracker, getSectionRootTab, hasSectionHome, sectionHomeFor } from "@/lib/sectionHome";
import { useOverlayBack } from "@/lib/overlayStack";
import { animateThemeCircularExpansion } from "../ThemeToggle";
import {
  BookOpen,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Building,
  CalendarCheck,
  ChevronRight,
  Command,
  CreditCard,
  GraduationCap,
  Home,
  Library,
  LayoutGrid,
  Settings,
  User,
  Wrench,
  Calendar,
  Key,
  ArrowLeft,
  Bus,
  Search,
  LogOut,
  CarTaxiFront,
  MoreHorizontal,
  Rss,
  Layers,
  DoorOpen,
  UsersRound,
  UserSearch,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import {
  useTheme,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarProfile,
} from "@amazecontinuityprojects/amazeui";
import { useSyncTrigger } from "../shared/useSyncTrigger";
import config from "../../../../config.json";
import { shouldShowGpa, shouldShowProfilePhoto } from "@/lib/settingsVisibility";
import { activateEntry, getModuleRegistry, type ModuleEntry } from "@/lib/navigation/registry";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
  isExpandable?: boolean;
  /** Opens a separate page in a new tab (e.g. the FFCS planner). */
  isExternal?: boolean;
};

type Group = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

type MobileNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
};

const MobileBottomNav = memo(function MobileBottomNav({
  items,
  onItemTap,
}: {
  items: MobileNavItem[];
  onItemTap: (item: MobileNavItem) => void;
}) {
  return (
    <nav
      aria-label="Main"
      className="brand-sidebar md:hidden fixed bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[420px] z-40 border-2 border-border-ink rounded-[14px] p-1.5 shadow-brutal-md flex items-stretch justify-around gap-1 mobile-bottom-nav-bar"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemTap(item)}
          aria-label={hasSectionHome(item.id) ? `${item.label} — double tap for home` : item.label}
          aria-current={item.isActive ? "page" : undefined}
          className={`flex flex-1 min-h-12 flex-col items-center justify-center gap-0.5 rounded-[10px] border-2 px-1 py-1 select-none cursor-pointer transition-colors motion-reduce:transition-none ${
            item.isActive
              ? "bg-highlight text-highlight-foreground border-border-ink shadow-brutal-sm"
              : "border-transparent text-cream hover:bg-surface-hover"
          }`}
        >
          <span className="flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[2.2]" aria-hidden>
            {item.icon}
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.04em] leading-none truncate max-w-full">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
});

const navButtonBase = "";

/** Brand overrides for AmazeUI's SidebarItem / SidebarGroupLabel (twMerge wins). */
const SIDEBAR_ITEM_BRAND =
  "min-h-11 rounded-[10px] text-text-primary [&>div:first-child]:text-text-muted [&[data-active=true]>div:first-child]:text-highlight-foreground [&>div:first-child:empty]:hidden data-[active=true]:border-2 data-[active=true]:border-border-ink data-[active=true]:bg-highlight data-[active=true]:text-highlight-foreground data-[active=true]:shadow-brutal-sm [&[data-active=true]_svg]:text-highlight-foreground hover:bg-surface-hover";
const SIDEBAR_GROUP_LABEL_BRAND = "font-mono text-xs font-bold tracking-[0.06em] text-highlight";

export default function NavigationTabs({
  activeTab,
  setActiveTab,
  handleLogOutRequest,
  handleReloadRequest,
  currSemesterID,
  setCurrSemesterID,
  handleLogin,
  setIsReloading,
  username,
  password,
  setPassword,
  settings,
  setSettings,
  attendancePercentage,
  marksData,
  ODhoursData,
  setODhoursIsOpen,
  feedbackStatus,
  setGradesDisplayIsOpen,
  activeAttendanceSubTab,
  setActiveAttendanceSubTab,
  activeToolsSubTab,
  setActiveToolsSubTab,
  activeSubTab,
  setActiveSubTab,
  HostelActiveSubTab,
  setHostelActiveSubTab,
  activeDayscholarSubTab,
  setActiveDayscholarSubTab,
  activeMoreSubTab,
  setActiveMoreSubTab,
  activeProfileSubTab,
  setActiveProfileSubTab,
  onOpenFeedbackStatus,
  onOpenCommandPalette,
  onCollapseScreenChange,
}: any) {
  // Suppress unused warnings to comply with ESLint configurations
  void handleLogOutRequest;
  void setCurrSemesterID;
  void handleLogin;
  void setIsReloading;
  void password;
  void setPassword;
  void activeDayscholarSubTab;
  void setActiveDayscholarSubTab;
  void activeToolsSubTab;
  void setActiveToolsSubTab;
  void feedbackStatus;
  void onOpenFeedbackStatus;

  const sidebarRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(getAssetPath("/logo.png"));
  const [profileData, setProfileData] = useState<any>(null);

  const unifiedIdentity: UnifiedUserIdentity = useAtomValue(unifiedIdentityAtom);
  const unifiedAcademics = useAtomValue(unifiedAcademicsAtom);

  // Progressive disclosure
  const [showAcademicsPanel, setShowAcademicsPanel] = useState(activeTab === "academics");
  const [showToolsPanel, setShowToolsPanel] = useState(activeTab === "tools");
  const [showHostelPanel, setShowHostelPanel] = useState(activeTab === "hostel");
  const [activeRailGroup, setActiveRailGroup] = useState<string | null>(null);
  const [isAppLibraryOpen, setIsAppLibraryOpen] = useState(false);

  // System back (incl. Android predictive back) dismisses the App Library
  // directly, before screen navigation does
  useOverlayBack("app-library", isAppLibraryOpen, () => setIsAppLibraryOpen(false));

  // Theme settings (next-themes)
  const { theme, setTheme } = useTheme();
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);

  // Tablets (md up to lg, 768-1023px) get the icon rail by default so the
  // content keeps its width; opening it there is temporary and overlays the
  // content instead of being saved. From lg up the saved preference rules.
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023.98px)");
    const sync = () => {
      setIsTabletViewport(mq.matches);
      if (!mq.matches) setTabletExpanded(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const isExpandedMode = isTabletViewport ? tabletExpanded : !settings.isSidebarCollapsed;
  const isOpen = isExpandedMode;

  // Command palette logic
  const openCommandPalette = useCallback(() => {
    onOpenCommandPalette?.();
    setActiveRailGroup(null);
  }, [onOpenCommandPalette]);

  useEffect(() => {
    const updateIcon = () => {
      const savedIcon = localStorage.getItem("app-icon") || "default";
      setCurrentIcon(getAssetPath(savedIcon === "fire" ? "/images/icons/fire.png" : "/logo.png"));
    };

    updateIcon();
    window.addEventListener("app-icon-changed", updateIcon);

    try {
      const stored = localStorage.getItem("profile");
      if (stored) setProfileData(JSON.parse(stored));
    } catch (e) {}

    return () => {
      window.removeEventListener("app-icon-changed", updateIcon);
    };
  }, []);

  // No swipe-up gesture — App Library is opened only via the Modules button

  // Keep the matching drill-in panel open for section-level destinations.
  useEffect(() => {
    if (activeTab === "academics") {
      setShowAcademicsPanel(true);
      setShowToolsPanel(false);
      setShowHostelPanel(false);
    } else if (activeTab === "tools") {
      setShowToolsPanel(true);
      setShowAcademicsPanel(false);
      setShowHostelPanel(false);
    } else if (activeTab === "hostel") {
      setShowHostelPanel(true);
      setShowToolsPanel(false);
      setShowAcademicsPanel(false);
    } else {
      setShowAcademicsPanel(false);
      setShowToolsPanel(false);
      setShowHostelPanel(false);
    }
  }, [activeTab]);

  // Handle clicking outside the rail popover in compact mode
  useEffect(() => {
    if (!activeRailGroup) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (sidebarRef.current?.contains(target) || flyoutRef.current?.contains(target)) return;
      setActiveRailGroup(null);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [activeRailGroup]);

  // Close rail popover if expanded state changes
  useEffect(() => {
    if (isOpen) {
      setActiveRailGroup(null);
    }
  }, [isOpen]);

  const isHosteller = profileData?.isHosteller;
  const residentialStatus = settings?.residentialStatus;

  // Semester Summary Data Calculations
  const totalODHours =
    ODhoursData && ODhoursData.length > 0 && ODhoursData[0].courses
      ? ODhoursData.reduce((sum: number, day: any) => sum + day.total, 0)
      : 0;
  const credits = marksData?.cgpa
    ? Number(marksData.cgpa.creditsEarned) + Number(marksData.cgpa.nonGradedRequirement || 0)
    : unifiedAcademics.cgpa || "-";
  const formatAttendancePercentage = (value: unknown) => {
    const numeric = Number(value);
    if (value == null || value === "" || !Number.isFinite(numeric) || numeric < 0) return undefined;
    return `${numeric.toFixed(settings.decimalValues ? 1 : 0)}%`;
  };
  const normalizedOverallAttendance =
    settings.attendancePercentageOrString === "percentage"
      ? formatAttendancePercentage(unifiedAcademics.overallAttendancePercentage)
      : unifiedAcademics.overallAttendanceFormatted;
  const attendanceValue =
    settings.attendancePercentageOrString === "percentage"
      ? formatAttendancePercentage(attendancePercentage?.percentage) || normalizedOverallAttendance || "-"
      : attendancePercentage?.str || normalizedOverallAttendance || "-";

  const profileName =
    settings.friendlyName ||
    unifiedIdentity.friendlyName ||
    unifiedIdentity.name ||
    profileData?.name ||
    username ||
    "Student";
  const shouldDisplayGpa = shouldShowGpa(settings);
  const shouldDisplayProfilePhoto = shouldShowProfilePhoto(settings);
  const hideIdentity = privacyCategories(settings).includes("identity");
  const initials = String(profileName)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const persistSidebarState = useCallback(
    (nextCollapsed: boolean) => {
      if (isTabletViewport) {
        setTabletExpanded(!nextCollapsed);
        return;
      }
      setSettings((prev) => ({ ...prev, isSidebarCollapsed: nextCollapsed }));
    },
    [setSettings, isTabletViewport],
  );

  // Alt/Option+S (lib/shortcuts): collapse/expand the sidebar on wide
  // screens; on phones, where there is no sidebar, open or close Modules.
  useEffect(() => {
    const onToggle = () => {
      if (window.matchMedia("(min-width: 768px)").matches) persistSidebarState(isOpen);
      else setIsAppLibraryOpen((v) => !v);
    };
    window.addEventListener(TOGGLE_SIDEBAR_EVENT, onToggle);
    return () => window.removeEventListener(TOGGLE_SIDEBAR_EVENT, onToggle);
  }, [persistSidebarState, isOpen]);

  const handleReloadClick = useCallback(async () => {
    setIsSpinning(true);
    await handleReloadRequest();
    window.setTimeout(() => setIsSpinning(false), 600);
  }, [handleReloadRequest]);

  const { isOffline, triggerSync: handleSyncClick } = useSyncTrigger(handleReloadClick);

  const selectTab = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      window.scrollTo(0, 0);
    },
    [setActiveTab],
  );

  // The rail popover opens level with the button that opened it (it used to
  // sit at a fixed top-12, far from buttons lower in the rail; user report),
  // and is pulled up if it would run past the bottom of the window.
  const [railPopoverTop, setRailPopoverTop] = useState(48);
  const toggleRailPopover = useCallback((groupId: string, anchor?: HTMLElement | null) => {
    if (anchor) {
      const sidebarTop = sidebarRef.current?.getBoundingClientRect().top ?? 0;
      setRailPopoverTop(Math.max(8, anchor.getBoundingClientRect().top - sidebarTop - 8));
    }
    setActiveRailGroup((current) => (current === groupId ? null : groupId));
  }, []);
  useLayoutEffect(() => {
    const el = flyoutRef.current;
    if (!activeRailGroup || !el) return;
    const sidebarTop = sidebarRef.current?.getBoundingClientRect().top ?? 0;
    const maxTop = window.innerHeight - sidebarTop - el.offsetHeight - 12;
    if (railPopoverTop > maxTop) setRailPopoverTop(Math.max(8, maxTop));
  }, [activeRailGroup, railPopoverTop]);

  // Removed old layout items as they are now fully isolated inside AppLibraryPortal

  const tabIcons = useMemo<Record<string, { icon: React.ReactNode; label: string }>>(
    () => ({
      attendance:
        activeAttendanceSubTab === "calendar"
          ? { icon: <Calendar className="h-5 w-5 stroke-[2]" />, label: "Calendar" }
          : { icon: <CalendarCheck className="h-5 w-5 stroke-[2]" />, label: "Attendance" },
      academics: { icon: <GraduationCap className="h-5 w-5 stroke-[2]" />, label: "Academics" },
      tools: { icon: <Layers className="h-5 w-5 stroke-[2]" />, label: "Tools" },
      payments: { icon: <CreditCard className="h-5 w-5 stroke-[2]" />, label: "Payments" },
      libraries: { icon: <Library className="h-5 w-5 stroke-[2]" />, label: "Libraries" },
      events: { icon: <Calendar className="h-5 w-5 stroke-[2]" />, label: "Event Hub" },
      clubs: { icon: <LayoutGrid className="h-5 w-5 stroke-[2]" />, label: "Club Hub" },
      community: { icon: <Rss className="h-5 w-5 stroke-[2]" />, label: "Announcements" },
      "free-class": { icon: <DoorOpen className="h-5 w-5 stroke-[2]" />, label: "Free Classrooms" },
      "paper-scanner": { icon: <ScanLine className="h-5 w-5 stroke-[2]" />, label: "Paper Scanner" },
      "faculty-schedule": { icon: <UserSearch className="h-5 w-5 stroke-[2]" />, label: "Faculty Schedule" },
      "friend-finder": { icon: <UsersRound className="h-5 w-5 stroke-[2]" />, label: "Find Classmates" },
      cabshare: { icon: <CarTaxiFront className="h-5 w-5 stroke-[2]" />, label: "Cab Share" },
      transport: { icon: <Bus className="h-5 w-5 stroke-[2]" />, label: "Transport" },
      more: { icon: <MoreHorizontal className="h-5 w-5 stroke-[2]" />, label: "More" },
      profile: { icon: <User className="h-5 w-5 stroke-[2]" />, label: "Profile" },
      credentials: { icon: <Key className="h-5 w-5 stroke-[2]" />, label: "Credentials" },
      hostel: { icon: <Home className="h-5 w-5 stroke-[2]" />, label: "Hostel Hub" },
    }),
    [activeAttendanceSubTab],
  );

  const togglePin = useCallback(
    (tabId: string) => {
      const current = settings?.pinnedNavTabs ?? [];
      const isPinned = current.includes(tabId);
      const atLimit = !isPinned && current.length >= 4;
      if (atLimit) return;
      const next = isPinned ? current.filter((id: string) => id !== tabId) : [...current, tabId];
      setSettings((prev: any) => {
        const updated = { ...prev, pinnedNavTabs: next };
        return updated;
      });
    },
    [settings, setSettings],
  );

  const rawNavItems = useMemo(() => {
    const pinnedTabs = settings?.pinnedNavTabs ?? [];
    const rawItems: MobileNavItem[] = [
      {
        id: "home",
        icon: <Home className="h-5 w-5 stroke-[2]" />,
        label: "Home",
        isActive: activeTab === "home" && !isAppLibraryOpen,
        onClick: () => {
          setIsAppLibraryOpen(false);
          selectTab("home");
        },
      },
    ];

    if (pinnedTabs.length === 0) {
      rawItems.push({
        id: "search",
        icon: <Search className="h-5 w-5 stroke-[2]" />,
        label: "Search",
        isActive: false,
        onClick: openCommandPalette,
      });
    } else {
      pinnedTabs.forEach((tabId: string) => {
        const t = tabIcons[tabId];
        if (t) {
          rawItems.push({
            id: tabId,
            icon: t.icon,
            label: t.label,
            isActive:
              tabId === "credentials"
                ? activeTab === "profile" && activeProfileSubTab === "credentials" && !isAppLibraryOpen
                : tabId === "profile" && pinnedTabs.includes("credentials")
                  ? activeTab === "profile" && activeProfileSubTab !== "credentials" && !isAppLibraryOpen
                  : activeTab === tabId && !isAppLibraryOpen,
            onClick: () => {
              setIsAppLibraryOpen(false);
              if (tabId === "credentials") {
                selectTab("profile");
                setActiveProfileSubTab("credentials");
              } else {
                selectTab(tabId);
                if (tabId === "attendance") {
                  setActiveAttendanceSubTab("calendar");
                }
              }
            },
          });
        }
      });
    }

    rawItems.push({
      id: "modules",
      icon: <LayoutGrid className="h-5 w-5 stroke-[2]" />,
      label: "Modules",
      isActive: isAppLibraryOpen,
      onClick: () => {
        setIsAppLibraryOpen((prev) => !prev);
      },
    });

    return rawItems;
  }, [
    settings?.pinnedNavTabs,
    activeTab,
    activeProfileSubTab,
    isAppLibraryOpen,
    selectTab,
    openCommandPalette,
    tabIcons,
    setIsAppLibraryOpen,
    setActiveAttendanceSubTab,
    setActiveProfileSubTab,
  ]);

  const sidebarActiveStyles =
    "bg-highlight text-highlight-foreground border-2 border-border-ink font-semibold shadow-brutal-sm";
  // Rail header buttons (collapsed sidebar): one size and look.
  const RAIL_BTN =
    "inline-flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press cursor-pointer";
  const railActiveStyles = "bg-highlight text-highlight-foreground border-2 border-border-ink shadow-brutal-sm";

  const handleThemeChange = (selectedTheme: string, e?: React.MouseEvent<HTMLElement>) => {
    if (theme === selectedTheme) return;
    animateThemeCircularExpansion(e || null, selectedTheme, setTheme);
  };

  // Keyboard navigation
  const handleNavKeyDown = useCallback((event: KeyboardEvent<HTMLElement>, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
      return;
    }
    if (event.key === "Escape") {
      setActiveRailGroup(null);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const buttons = Array.from(document.querySelectorAll<HTMLElement>("[data-sidebar-nav='true']"));
      const index = buttons.indexOf(event.currentTarget);
      const next = event.key === "ArrowDown" ? buttons[index + 1] : buttons[index - 1];
      next?.focus();
    }
  }, []);

  // Navigation Items Memoization
  const navCtx = useMemo(
    () => ({
      selectTab,
      setActiveSubTab,
      setActiveAttendanceSubTab,
      setActiveToolsSubTab,
      setHostelActiveSubTab,
      setActiveMoreSubTab,
      setActiveProfileSubTab,
      handleLogOutRequest,
      isHosteller,
      residentialStatus,
    }),
    [
      selectTab,
      setActiveSubTab,
      setActiveAttendanceSubTab,
      setActiveToolsSubTab,
      setHostelActiveSubTab,
      setActiveMoreSubTab,
      setActiveProfileSubTab,
      handleLogOutRequest,
      isHosteller,
      residentialStatus,
    ],
  );
  const registry = useMemo(() => getModuleRegistry(navCtx), [navCtx]);

  const toNavItem = (entry: ModuleEntry): NavItem => {
    let isActive = false;
    const t = entry.target;
    if (t.kind === "tab") isActive = activeTab === t.tab;
    else if (t.kind === "tabSub") {
      isActive = activeTab === t.tab;
      if (isActive) {
        if (t.subtabKey === "academics") isActive = activeTab === "academics";
        if (t.subtabKey === "tools")
          isActive = activeTab === "tools" && (!activeToolsSubTab || activeToolsSubTab === "overview");
        if (t.subtabKey === "hostel") isActive = activeTab === "hostel";
        if (t.subtabKey === "attendance") isActive = activeTab === "attendance";
        if (t.subtabKey === "profile") isActive = activeTab === "profile";
      }
    } else if (t.kind === "external") {
      isActive = false;
    }
    // The same page can be listed twice (under PINNED and in its group).
    // Highlight only the pinned shortcut so the sidebar shows one current page.
    const pinKey = entry.pinId ?? entry.id;
    if (isActive && entry.pinnable && (settings?.pinnedNavTabs ?? []).includes(pinKey)) isActive = false;
    return {
      id: entry.id,
      label: entry.label,
      icon: entry.icon as any,
      isActive,
      isExpandable: entry.isExpandable,
      isExternal: entry.target.kind === "external",
      onSelect: () => {
        if (entry.id === "academics") {
          selectTab("academics");
          if (!activeSubTab || activeSubTab === "overview") setActiveSubTab("courses-simplified");
          setShowAcademicsPanel(true);
          return;
        }
        if (entry.id === "tools") {
          selectTab("tools");
          setActiveToolsSubTab?.("overview");
          setShowToolsPanel(true);
          return;
        }
        if (entry.id === "hostel") {
          selectTab("hostel");
          if (!HostelActiveSubTab) setHostelActiveSubTab("overview");
          setShowHostelPanel(true);
          return;
        }
        if (entry.id === "profile") {
          selectTab("profile");
          setActiveProfileSubTab("settings");
          return;
        }
        activateEntry(entry, navCtx);
      },
    };
  };

  // Home is its own item at the top (like the phone bottom bar), not one
  // entry inside "Study".
  const homeItem = useMemo<NavItem | null>(() => {
    const e = registry.find((x) => x.id === "home" && x.surfaces.sidebar === true);
    return e ? toNavItem(e) : null;
  }, [registry, activeTab, activeSubTab, activeToolsSubTab, HostelActiveSubTab, navCtx]);

  const studyItems = useMemo<NavItem[]>(
    () =>
      registry
        .filter((e) => e.id !== "home" && e.surfaces.sidebar === true && e.surfaces.sidebarGroup === "study")
        .map(toNavItem),
    [registry, activeTab, activeSubTab, activeToolsSubTab, HostelActiveSubTab, navCtx],
  );

  const campusItems = useMemo<NavItem[]>(
    () => registry.filter((e) => e.surfaces.sidebar === true && e.surfaces.sidebarGroup === "campus").map(toNavItem),
    [registry, activeTab, activeSubTab, activeToolsSubTab, HostelActiveSubTab, navCtx],
  );

  const toolsItems = useMemo<NavItem[]>(
    () => registry.filter((e) => e.surfaces.sidebar === true && e.surfaces.sidebarGroup === "tools").map(toNavItem),
    [registry, activeTab, activeSubTab, activeToolsSubTab, HostelActiveSubTab, navCtx],
  );

  const accountItems = useMemo<NavItem[]>(
    () => registry.filter((e) => e.surfaces.sidebar === true && e.surfaces.sidebarGroup === "account").map(toNavItem),
    [registry, activeTab, activeSubTab, activeToolsSubTab, HostelActiveSubTab, navCtx],
  );

  const groups = useMemo<Group[]>(
    () => [
      { id: "study", label: "Study", icon: BookOpen, items: studyItems },
      { id: "campus", label: "Campus", icon: Building, items: campusItems },
      { id: "tools", label: "Tools", icon: Wrench, items: toolsItems },
      { id: "account", label: "Account", icon: Settings, items: accountItems },
    ],
    [studyItems, campusItems, toolsItems, accountItems],
  );

  // TRIAL (user, 2026-11-19): a core-only sidebar. Most students use the
  // timetable, grades and attendance ~99% of the time, so the sidebar keeps
  // Home, Pinned, Study and Account; Campus and Tools live in the Modules
  // sheet ("All modules"). Set to false to bring the full sidebar back.
  const SIDEBAR_CORE_ONLY = false; // user (2026-11-20): reverted, "redundant and weird"
  const visibleGroups = SIDEBAR_CORE_ONLY
    ? groups
        .filter((g) => g.id === "study" || g.id === "account")
        // A page already under Pinned is not listed again in its group.
        .map((g) => ({
          ...g,
          items: g.items.filter((it) => {
            const entry = registry.find((e) => e.id === it.id);
            return !(entry?.pinnable && (settings?.pinnedNavTabs ?? []).includes(entry.pinId ?? entry.id));
          }),
        }))
        .filter((g) => g.items.length > 0)
    : groups;

  const pinnedItems = useMemo(() => {
    const pinnedTabs = settings?.pinnedNavTabs ?? [];
    const tabData: Record<string, { label: string; icon: any; onSelect: () => void; isActive: boolean }> = {
      attendance: {
        label: "Attendance",
        icon: CalendarCheck,
        isActive: activeTab === "attendance",
        onSelect: () => {
          selectTab("attendance");
        },
      },
      academics: {
        label: "Academics",
        icon: GraduationCap,
        isActive: activeTab === "academics",
        onSelect: () => {
          selectTab("academics");
        },
      },
      tools: {
        label: "Tools",
        icon: Layers,
        isActive: activeTab === "tools",
        onSelect: () => {
          selectTab("tools");
        },
      },
      payments: {
        label: "Payments",
        icon: CreditCard,
        isActive: activeTab === "payments",
        onSelect: () => {
          selectTab("payments");
        },
      },
      libraries: {
        label: "Libraries",
        icon: Library,
        isActive: activeTab === "libraries",
        onSelect: () => {
          selectTab("libraries");
        },
      },
      events: {
        label: "Event Hub",
        icon: Calendar,
        isActive: activeTab === "events",
        onSelect: () => {
          selectTab("events");
        },
      },
      clubs: {
        label: "Club Hub",
        icon: LayoutGrid,
        isActive: activeTab === "clubs",
        onSelect: () => {
          selectTab("clubs");
        },
      },
      community: {
        label: "Announcements",
        icon: Rss,
        isActive: activeTab === "community",
        onSelect: () => {
          selectTab("community");
        },
      },
      "free-class": {
        label: "Free Classrooms",
        icon: DoorOpen,
        isActive: activeTab === "free-class" || (activeTab === "tools" && activeToolsSubTab === "free-class"),
        onSelect: () => {
          selectTab("free-class");
        },
      },
      "faculty-schedule": {
        label: "Faculty Schedule",
        icon: UserSearch,
        isActive: activeTab === "faculty-schedule",
        onSelect: () => {
          selectTab("faculty-schedule");
        },
      },
      "friend-finder": {
        label: "Find Classmates",
        icon: UsersRound,
        isActive: activeTab === "friend-finder",
        onSelect: () => {
          selectTab("friend-finder");
        },
      },
      "paper-scanner": {
        label: "Paper Scanner",
        icon: ScanLine,
        isActive: activeTab === "paper-scanner",
        onSelect: () => {
          selectTab("paper-scanner");
        },
      },
      cabshare: {
        label: "Cab Share",
        icon: CarTaxiFront,
        isActive: activeTab === "cabshare",
        onSelect: () => {
          selectTab("cabshare");
        },
      },
      transport: {
        label: "Transport",
        icon: Bus,
        isActive: activeTab === "transport",
        onSelect: () => {
          selectTab("transport");
        },
      },
      more: {
        label: "More",
        icon: MoreHorizontal,
        isActive: activeTab === "more",
        onSelect: () => {
          selectTab("more");
        },
      },
      profile: {
        label: "Profile",
        icon: User,
        isActive: activeTab === "profile" && activeProfileSubTab !== "credentials",
        onSelect: () => {
          selectTab("profile");
        },
      },
      credentials: {
        label: "Credentials",
        icon: Key,
        isActive: activeTab === "profile" && activeProfileSubTab === "credentials",
        onSelect: () => {
          selectTab("profile");
          setActiveProfileSubTab("credentials");
        },
      },
      hostel: {
        label: "Hostel Hub",
        icon: Home,
        isActive: activeTab === "hostel",
        onSelect: () => {
          selectTab("hostel");
          setHostelActiveSubTab("overview");
        },
      },
    };
    return pinnedTabs.map((id: string) => ({ id, ...tabData[id] })).filter((item: any) => item.label !== undefined);
  }, [
    settings?.pinnedNavTabs,
    activeTab,
    activeProfileSubTab,
    selectTab,
    setActiveProfileSubTab,
    setHostelActiveSubTab,
  ]);

  const academicsItems = useMemo(
    () =>
      registry
        .filter((e) => e.surfaces.sidebar === "drill-in" && e.group === "Academics")
        .map((e) => {
          const item = toNavItem(e);
          const t = e.target as any;
          let isActive = activeTab === "academics";
          if (isActive && t.kind === "tabSub") {
            if (t.subtab === "courses-simplified") {
              isActive = ["courses-simplified", "simplified-academics", "overview", "course-dashboard"].includes(
                activeSubTab,
              );
            } else isActive = activeSubTab === t.subtab;
          }
          return {
            ...item,
            isActive,
            onSelect: () => {
              activateEntry(e, navCtx);
              if (t.kind === "tabSub") {
                selectTab("academics");
                setActiveSubTab(t.subtab);
              }
            },
          };
        }),
    [registry, activeTab, activeSubTab, navCtx, selectTab, setActiveSubTab],
  );

  const toolsSubItems = useMemo(
    () =>
      registry
        .filter((e) => e.surfaces.sidebar === "drill-in" && (e.group === "Tools" || e.id.startsWith("tools-")))
        .map((e) => {
          const item = toNavItem(e);
          const t = e.target as any;
          let isActive = activeTab === "tools";
          if (isActive && t.kind === "tabSub" && t.subtabKey === "tools") {
            if (t.subtab === "overview") isActive = activeToolsSubTab === "overview" || !activeToolsSubTab;
            else isActive = activeToolsSubTab === t.subtab;
          }
          if (e.id === "tools-cabshare")
            isActive = activeTab === "cabshare" || (activeTab === "tools" && activeToolsSubTab === "cabshare");
          return {
            ...item,
            isActive,
            onSelect: () => {
              activateEntry(e, navCtx);
              if (t.kind === "tabSub" && t.subtabKey === "tools") {
                selectTab("tools");
                setActiveToolsSubTab?.(t.subtab);
              }
            },
          };
        }),
    [registry, activeTab, activeToolsSubTab, navCtx, selectTab, setActiveToolsSubTab],
  );

  const hostelSubItems = useMemo(
    () =>
      registry
        .filter((e) => e.surfaces.sidebar === "drill-in" && e.group === "Hostel")
        .map((e) => {
          const item = toNavItem(e);
          const t = e.target as any;
          let isActive = activeTab === "hostel";
          if (isActive && t.kind === "tabSub" && t.subtabKey === "hostel") isActive = HostelActiveSubTab === t.subtab;
          return {
            ...item,
            isActive,
            onSelect: () => {
              activateEntry(e, navCtx);
              if (t.kind === "tabSub" && t.subtabKey === "hostel") {
                selectTab("hostel");
                setHostelActiveSubTab(t.subtab);
              }
            },
          };
        }),
    [registry, activeTab, HostelActiveSubTab, navCtx, selectTab, setHostelActiveSubTab],
  );

  /**
   * Single tap does the tab's normal thing; a second tap on the same icon inside
   * `DOUBLE_TAP_MS` takes that section to its home sub-screen.
   *
   * The first tap is *not* delayed waiting to see whether a second follows: an
   * icon that felt laggy would be worse than a double tap being one step late,
   * which is how Android's own double-tap-to-top behaves.
   */
  const navTaps = useMemo(() => createTapTracker(), []);

  const handleNavItemTap = useCallback(
    (item: { id: string; onClick: () => void; isActive: boolean }) => {
      const outcome = navTaps.tap(item.id, { wasActive: item.isActive });
      if (outcome.kind === "single") {
        item.onClick();
        return;
      }

      if (item.id === "modules") {
        setIsAppLibraryOpen(true);
        return;
      }

      if (item.id === "search") {
        openCommandPalette();
        return;
      }

      sectionHomeFor(item.id, {
        setActiveAttendanceSubTab,
        setActiveSubTab,
        setActiveToolsSubTab,
        setActiveDayscholarSubTab,
        setActiveMoreSubTab,
        setActiveProfileSubTab,
        setHostelActiveSubTab,
      });

      setIsAppLibraryOpen(false);
      const targetTab = getSectionRootTab(item.id);
      selectTab(targetTab);
      // When the first tap switched sections it already committed and wrote
      // that section as its own screen, so fold this move into it. Otherwise the
      // double tap would be two Back steps instead of one.
      if (outcome.collapseFirstTap) {
        onCollapseScreenChange?.();
      }
    },
    [
      navTaps,
      selectTab,
      setIsAppLibraryOpen,
      openCommandPalette,
      onCollapseScreenChange,
      setActiveAttendanceSubTab,
      setActiveSubTab,
      setActiveToolsSubTab,
      setActiveDayscholarSubTab,
      setActiveMoreSubTab,
      setActiveProfileSubTab,
      setHostelActiveSubTab,
    ],
  );

  const renderMobileNav = () => {
    return (
      <>
        {/* Sleek Floating Pill Bottom Navigation Bar (Icon-Only on Mobile).
            z-40, deliberately below every overlay surface: the option-picker
            portal paints at z-50, sheets at z-55/60. At z-55 this pill floated
            *above* an open picker — staying bright and tappable under the dim,
            swallowing outside-taps meant to dismiss, and covering popups that
            extended into its region. A bottom nav must dim with the page, not
            hover over modals. */}
        <MobileBottomNav items={rawNavItems} onItemTap={handleNavItemTap} />

        <AppLibraryPortal
          open={isAppLibraryOpen}
          onClose={() => setIsAppLibraryOpen(false)}
          settings={settings}
          setSettings={setSettings}
          selectTab={selectTab}
          setActiveAttendanceSubTab={setActiveAttendanceSubTab}
          setActiveToolsSubTab={setActiveToolsSubTab}
          setActiveSubTab={setActiveSubTab}
          setHostelActiveSubTab={setHostelActiveSubTab}
          setActiveMoreSubTab={setActiveMoreSubTab}
          setActiveProfileSubTab={setActiveProfileSubTab}
          handleLogOutRequest={handleLogOutRequest}
          handleReloadRequest={handleReloadRequest}
          isHosteller={isHosteller}
          residentialStatus={residentialStatus}
          theme={theme}
          handleThemeChange={handleThemeChange}
          openCommandPalette={openCommandPalette}
          tabIcons={tabIcons}
          togglePin={togglePin}
        />
      </>
    );
  };

  return (
    <>
      {renderMobileNav()}

      <Sidebar
        ref={sidebarRef}
        data-sidebar-root="true"
        aria-label="Primary navigation"
        className="brand-sidebar top-0 left-0 h-[100dvh] rounded-none border-0 border-r-2 border-border-ink shadow-none !duration-200 motion-reduce:!duration-0"
        isOpen={isOpen}
        onOpenChange={(val) => persistSidebarState(!val)}
      >
        {/* Sidebar Header */}
        <SidebarHeader className="border-b-2 border-border-ink">
          {/* Logo & Expand Toggle */}
          <div className={`flex items-center ${isOpen ? "justify-between w-full" : "justify-center w-full"}`}>
            <div className={`flex items-center min-w-0 overflow-hidden ${isOpen ? "gap-2.5" : "justify-center"}`}>
              {/* Lockup when open, mark on the rail; honours the alternate app icon.
                  sm when open: at md the lockup + "Offline"/"Syncing" + collapse
                  did not fit in 280px and the status pill covered the CC. */}
              <BrandLogo
                variant={isOpen ? "lockup" : "mark"}
                size={isOpen ? "sm" : "md"}
                markSrc={currentIcon.includes("fire") ? currentIcon : undefined}
                wordClassName="text-cream"
              />
            </div>
            {isOpen && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={handleSyncClick}
                  className={`relative inline-flex min-h-9 items-center rounded-[8px] border-2 border-border-ink px-2.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] shadow-brutal-sm brutal-press cursor-pointer ${
                    isOffline ? "bg-highlight text-highlight-foreground" : "bg-surface text-text-primary"
                  }`}
                  title={isOffline ? "You're offline — tap for details" : "Sync Data from VTOP"}
                  aria-label={isOffline ? "Offline — tap for details" : "Sync Data from VTOP"}
                  aria-live="polite"
                >
                  <span>{isOffline ? "Offline" : isSpinning ? "Syncing" : "Sync"}</span>
                </button>
                <button
                  onClick={() => persistSidebarState(isOpen)}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-text-primary transition-colors hover:bg-surface-secondary"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* Profile Section, Semester summary, & Search */}
          <AnimatePresence initial={false} mode="wait">
            {isOpen ? (
              <m.div
                key="header-expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.1 }}
                className="overflow-hidden space-y-3"
              >
                {/* Left-aligned clean Semester Summary Card */}
                <div className="mt-3 rounded-[10px] border-2 border-border-ink bg-surface p-2.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-mono font-semibold text-text-muted tracking-[0.06em] text-xs uppercase">
                      Semester
                    </div>
                    <div role="group" aria-label="Current semester" className="flex max-w-[9rem] shrink-0">
                      <OptionPicker
                        value={settings.currSemesterID || config.semesterIDs[config.semesterIDs.length - 2]}
                        onChange={(val) => {
                          handleReloadRequest(val);
                        }}
                        options={config.semesterIDs.map((semId: string) => ({
                          value: semId,
                          label: formatSemesterName(semId),
                        }))}
                        searchable={false}
                        className="w-full [&>button:first-child]:h-8 [&>button:first-child]:px-2 [&>button:first-child]:gap-1 [&>button:first-child]:rounded-[8px] [&>button:first-child]:bg-surface-secondary [&>button:first-child_span]:font-mono [&>button:first-child_span]:text-xs [&>button:first-child_span]:font-semibold [&>button:first-child_span]:uppercase"
                      />
                    </div>
                  </div>
                  {/* Three tiles fit one row; with CGPA shown, four ~52px tiles
                      overflowed ("CREDITS", "79.1%"), so they go 2 x 2. */}
                  <div className={`grid gap-1.5 ${shouldDisplayGpa ? "grid-cols-2" : "grid-flow-col auto-cols-fr"}`}>
                    {shouldDisplayGpa && (
                      <button
                        onClick={() => {
                          setSettings((prev: any) =>
                            togglePrivacyCategory(prev, "cgpa", !privacyCategories(prev).includes("cgpa")),
                          );
                        }}
                        className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-[8px] bg-surface-secondary px-2 py-1.5 text-left cursor-pointer transition-colors hover:bg-surface-hover"
                        title="Click to show/hide CGPA"
                      >
                        <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                          CGPA
                        </span>
                        <span
                          data-private="cgpa"
                          className="font-display text-base font-bold leading-none text-text-heading transition-all duration-300"
                        >
                          {marksData?.cgpa?.cgpa || "-"}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        selectTab("attendance");
                        setActiveAttendanceSubTab("predictor");
                      }}
                      className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-[8px] bg-surface-secondary px-2 py-1.5 text-left cursor-pointer transition-colors hover:bg-surface-hover"
                      title="Open attendance predictor"
                    >
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                        Attend
                      </span>
                      {(() => {
                        // Colour alone does not say "below target" to everyone,
                        // so a warning icon and a spoken label carry it too.
                        const target = Number(settings?.targetAttendance) || 75;
                        const below = attendancePercentage?.percentage < target;
                        return (
                          <span
                            data-private="attendance"
                            className={`inline-flex max-w-full items-baseline gap-1 font-display font-bold leading-none tabular-nums ${String(attendanceValue).length > 6 ? "text-[13px]" : "text-base"} ${below ? "text-danger-foreground" : "text-text-heading"}`}
                            title={below ? `Below your ${target}% target` : `At or above your ${target}% target`}
                          >
                            {attendanceValue}
                            {below ? (
                              <span aria-hidden="true" className="font-mono text-xs font-semibold uppercase">
                                Low
                              </span>
                            ) : null}
                            <span className="sr-only">{below ? `, below your ${target}% target` : `, on track`}</span>
                          </span>
                        );
                      })()}
                    </button>

                    <button
                      onClick={() => setGradesDisplayIsOpen(true)}
                      className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-[8px] bg-surface-secondary px-2 py-1.5 text-left cursor-pointer transition-colors hover:bg-surface-hover"
                      title="Click to view credits & grades details"
                    >
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                        Credits
                      </span>
                      <span
                        data-private="credits"
                        className="font-display text-base font-bold leading-none text-text-heading"
                      >
                        {credits}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        selectTab("attendance");
                        setActiveAttendanceSubTab("od");
                      }}
                      className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-[8px] bg-surface-secondary px-2 py-1.5 text-left cursor-pointer transition-colors hover:bg-surface-hover"
                      title="Click to view OD tracker details"
                    >
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                        OD hrs
                      </span>
                      <span className="font-display text-base font-bold leading-none text-text-heading">
                        {totalODHours}
                        <span className="font-mono text-xs font-semibold text-text-muted">/40</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Search Bar Input */}
                <button
                  data-sidebar-nav="true"
                  onClick={openCommandPalette}
                  onKeyDown={(event) => handleNavKeyDown(event, openCommandPalette)}
                  className={`group flex w-full min-h-11 items-center gap-2 rounded-[10px] border-2 border-border-ink bg-surface px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-secondary ${navButtonBase}`}
                  aria-label="Open command palette"
                >
                  <Command className="h-4 w-4 shrink-0 text-sidebar-foreground transition-colors group-hover:text-sidebar-foreground" />
                  <span className="flex-1 truncate transition-colors group-hover:text-sidebar-foreground">
                    Search anything...
                  </span>
                  <kbd className="rounded-[6px] border-2 border-border-ink bg-surface-secondary px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary">
                    ⌘K
                  </kbd>
                </button>
              </m.div>
            ) : (
              <m.div
                key="header-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="mt-3.5 flex flex-col items-center gap-3 w-full"
              >
                {/* Same order as the open sidebar: toggle at the top (it used to
                    jump to the very bottom on the rail), then sync, then search.
                    One button style for all three. */}
                <button
                  type="button"
                  onClick={() => persistSidebarState(isOpen)}
                  className={RAIL_BTN}
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={handleSyncClick}
                  className={`${RAIL_BTN} ${isOffline ? "!bg-highlight !text-highlight-foreground" : ""}`}
                  title={isOffline ? "You're offline — tap for details" : "Sync data from VTOP"}
                  aria-label={isOffline ? "Offline — tap for details" : "Sync data from VTOP"}
                >
                  <RefreshCcw className={`h-4.5 w-4.5 ${isSpinning ? "animate-spin" : ""}`} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={openCommandPalette}
                  className={RAIL_BTN}
                  title="Search anything (Ctrl+K)"
                  aria-label="Search anything"
                >
                  <Command className="h-4.5 w-4.5" aria-hidden />
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </SidebarHeader>

        {/* Navigation Content (Expanded Mode vs Compact Rail) */}
        {isOpen ? (
          <SidebarContent>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={
                  showAcademicsPanel ? "academics" : showToolsPanel ? "tools" : showHostelPanel ? "hostel" : "primary"
                }
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {!showAcademicsPanel && !showToolsPanel && !showHostelPanel ? (
                  <div className="space-y-4">
                    {homeItem && (
                      <SidebarItem
                        icon={<homeItem.icon className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                        label={homeItem.label}
                        isActive={homeItem.isActive}
                        aria-current={homeItem.isActive ? "page" : undefined}
                        data-sidebar-nav="true"
                        className={SIDEBAR_ITEM_BRAND}
                        onClick={homeItem.onSelect}
                        onKeyDown={(event) => handleNavKeyDown(event, homeItem.onSelect)}
                      />
                    )}
                    {pinnedItems.length > 0 && (
                      <SidebarGroup>
                        <SidebarGroupLabel className={SIDEBAR_GROUP_LABEL_BRAND}>Pinned</SidebarGroupLabel>
                        <div className="space-y-0.5">
                          {pinnedItems.map((item) => (
                            <SidebarItem
                              key={item.id}
                              icon={<item.icon className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                              label={item.label}
                              isActive={item.isActive}
                              aria-current={item.isActive ? "page" : undefined}
                              data-sidebar-nav="true"
                              className={SIDEBAR_ITEM_BRAND}
                              onClick={item.onSelect}
                              onKeyDown={(event) => handleNavKeyDown(event, item.onSelect)}
                            />
                          ))}
                        </div>
                      </SidebarGroup>
                    )}

                    {visibleGroups.map((group) => (
                      <SidebarGroup key={group.id}>
                        <SidebarGroupLabel className={SIDEBAR_GROUP_LABEL_BRAND}>{group.label}</SidebarGroupLabel>
                        <div className="space-y-0.5">
                          {group.items.map((item) => (
                            <SidebarItem
                              key={item.id}
                              icon={<item.icon className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                              label={item.label}
                              isActive={item.isActive}
                              aria-current={item.isActive ? "page" : undefined}
                              data-sidebar-nav="true"
                              className={SIDEBAR_ITEM_BRAND}
                              rightElement={
                                item.isExpandable ? (
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                ) : item.isExternal ? (
                                  <span className="inline-flex items-center gap-1 rounded-[6px] border-2 border-current px-1 font-mono text-[12px] font-semibold uppercase leading-4 opacity-80">
                                    New tab
                                    <ExternalLink className="h-3 w-3" aria-hidden />
                                  </span>
                                ) : undefined
                              }
                              aria-label={item.isExternal ? `${item.label} (opens in a new tab)` : undefined}
                              onClick={item.onSelect}
                              onKeyDown={(event) => handleNavKeyDown(event, item.onSelect)}
                            />
                          ))}
                        </div>
                      </SidebarGroup>
                    ))}
                    {SIDEBAR_CORE_ONLY && (
                      <SidebarItem
                        icon={<LayoutGrid className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                        label="All modules"
                        isActive={isAppLibraryOpen}
                        data-sidebar-nav="true"
                        className={SIDEBAR_ITEM_BRAND}
                        onClick={() => setIsAppLibraryOpen(true)}
                        onKeyDown={(event) => handleNavKeyDown(event, () => setIsAppLibraryOpen(true))}
                      />
                    )}
                  </div>
                ) : showAcademicsPanel ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowAcademicsPanel(false)}
                      className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>

                    <SidebarGroup>
                      <SidebarGroupLabel className={SIDEBAR_GROUP_LABEL_BRAND}>Academics</SidebarGroupLabel>
                      <div className="space-y-0.5">
                        {academicsItems.map((item) => (
                          <SidebarItem
                            key={item.id}
                            icon={<item.icon className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                            label={item.label}
                            isActive={item.isActive}
                            aria-current={item.isActive ? "page" : undefined}
                            data-sidebar-nav="true"
                            className={SIDEBAR_ITEM_BRAND}
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleNavKeyDown(event, item.onSelect)}
                          />
                        ))}
                      </div>
                    </SidebarGroup>
                  </div>
                ) : showToolsPanel ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowToolsPanel(false)}
                      className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>

                    <SidebarGroup>
                      <SidebarGroupLabel className={SIDEBAR_GROUP_LABEL_BRAND}>Tools & Utilities</SidebarGroupLabel>
                      <div className="space-y-0.5">
                        {toolsSubItems.map((item) => (
                          <SidebarItem
                            key={item.id}
                            icon={<item.icon className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                            label={item.label}
                            isActive={item.isActive}
                            aria-current={item.isActive ? "page" : undefined}
                            data-sidebar-nav="true"
                            className={SIDEBAR_ITEM_BRAND}
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleNavKeyDown(event, item.onSelect)}
                          />
                        ))}
                      </div>
                    </SidebarGroup>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowHostelPanel(false)}
                      className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-sidebar-foreground hover:text-sidebar-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>

                    <SidebarGroup>
                      <SidebarGroupLabel className={SIDEBAR_GROUP_LABEL_BRAND}>Hostel Hub</SidebarGroupLabel>
                      <div className="space-y-0.5">
                        {hostelSubItems.map((item) => (
                          <SidebarItem
                            key={item.id}
                            icon={<item.icon className="h-[18px] w-[18px] stroke-[2.2]" aria-hidden="true" />}
                            label={item.label}
                            isActive={item.isActive}
                            aria-current={item.isActive ? "page" : undefined}
                            data-sidebar-nav="true"
                            className={SIDEBAR_ITEM_BRAND}
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleNavKeyDown(event, item.onSelect)}
                          />
                        ))}
                      </div>
                    </SidebarGroup>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </SidebarContent>
        ) : (
          /* Compact Mode Rail Content */
          <div className="flex flex-1 min-h-0 flex-col items-center justify-start w-full mt-3">
            {/* Divider */}
            <div className="w-8 border-t border-sidebar-border mb-3" />

            {/* Home first, on its own (same as the open sidebar and the bottom bar). */}
            {homeItem && (
              <div className="relative flex justify-center group/rail mb-3">
                <button
                  onClick={homeItem.onSelect}
                  aria-current={homeItem.isActive ? "page" : undefined}
                  className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors duration-150 ${
                    homeItem.isActive
                      ? railActiveStyles
                      : "text-cream hover:bg-sidebar-accent border-2 border-transparent"
                  } ${navButtonBase}`}
                  title={homeItem.label}
                  aria-label={`Open ${homeItem.label}`}
                >
                  <homeItem.icon className="h-5 w-5 stroke-[2.2]" />
                </button>
              </div>
            )}

            {pinnedItems.length > 0 && (
              <>
                <nav className="flex flex-col items-center gap-2.5 w-full mb-3" aria-label="Pinned rail shortcuts">
                  {pinnedItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.id} className="relative flex justify-center group/rail">
                        <button
                          onClick={item.onSelect}
                          className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors duration-150 ${
                            item.isActive
                              ? railActiveStyles
                              : "text-cream hover:bg-sidebar-accent border-2 border-transparent"
                          } ${navButtonBase}`}
                          title={item.label}
                          aria-label={`Open ${item.label}`}
                        >
                          <ItemIcon className="h-5 w-5 stroke-[2.2]" />
                        </button>
                      </div>
                    );
                  })}
                </nav>
                {/* Secondary Divider */}
                <div className="w-8 border-t border-sidebar-border mb-3" />
              </>
            )}

            {/* Navigation Rail Buttons */}
            <nav className="flex flex-col items-center gap-2.5 w-full" aria-label="Navigation rail">
              {visibleGroups.map((group) => {
                const GroupIcon = group.icon;
                const isActive =
                  group.id === "study"
                    ? activeTab === "attendance" || activeTab === "academics" // Home has its own rail button
                    : group.id === "campus"
                      ? [
                          "payments",
                          "libraries",
                          "events",
                          "clubs",
                          "community",
                          "free-class",
                          "faculty-schedule",
                          "friend-finder",
                          "hostel",
                          "transport",
                        ].includes(activeTab)
                      : group.id === "tools"
                        ? activeTab === "tools" ||
                          activeTab === "more" ||
                          activeTab === "cabshare" ||
                          activeTab === "paper-scanner"
                        : activeTab === "profile" || activeTab === "about";

                return (
                  <div key={group.id} className="relative flex justify-center group/rail">
                    <button
                      onClick={(e) => toggleRailPopover(group.id, e.currentTarget)}
                      className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors duration-150 ${
                        isActive ? railActiveStyles : "text-cream hover:bg-sidebar-accent border-2 border-transparent"
                      } ${navButtonBase}`}
                      title={group.label}
                      aria-label={`Open ${group.label} menu`}
                      aria-expanded={activeRailGroup === group.id}
                    >
                      <GroupIcon className="h-5 w-5 stroke-[2.2]" />
                    </button>
                  </div>
                );
              })}
              {SIDEBAR_CORE_ONLY && (
                <div className="relative flex justify-center group/rail">
                  <button
                    onClick={() => setIsAppLibraryOpen(true)}
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors duration-150 ${
                      isAppLibraryOpen
                        ? railActiveStyles
                        : "text-cream hover:bg-sidebar-accent border-2 border-transparent"
                    } ${navButtonBase}`}
                    title="All modules"
                    aria-label="All modules"
                  >
                    <LayoutGrid className="h-5 w-5 stroke-[2.2]" />
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}

        {/* Profile, Theme, and Logout Footer */}
        <SidebarFooter className="bg-sidebar border-t-2 border-border-ink">
          {isOpen ? (
            <div className="shrink-0 space-y-2.5">
              <div>
                <SidebarProfile
                  name={hideIdentity ? "Private" : profileName}
                  degree={(
                    unifiedIdentity.programme ||
                    profileData?.program ||
                    profileData?.branch ||
                    profileData?.batch ||
                    ""
                  ).replace("B.Tech ", "")}
                  avatarUrl={
                    !hideIdentity && shouldDisplayProfilePhoto ? unifiedIdentity.photo || profileData?.image : undefined
                  }
                  initials={hideIdentity ? "--" : initials || "ST"}
                  onLogout={handleLogOutRequest}
                />
              </div>

              <div className="h-px bg-sidebar-accent" />

              <SidebarThemeSwitch theme={theme} onThemeChange={handleThemeChange} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full shrink-0">
              {/* Same order as the open footer: profile, then theme. */}
              <div>
                <SidebarProfile
                  avatarUrl={
                    !hideIdentity && shouldDisplayProfilePhoto ? unifiedIdentity.photo || profileData?.image : undefined
                  }
                  initials={hideIdentity ? "--" : initials || "ST"}
                  onProfileClick={() => selectTab("profile")}
                />
              </div>
              <SidebarThemeSwitch compact theme={theme} onThemeChange={handleThemeChange} />
            </div>
          )}
        </SidebarFooter>

        {/* Floating popover beside the compact rail */}
        <AnimatePresence>
          {activeRailGroup && (
            <m.div
              ref={flyoutRef}
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ top: railPopoverTop }}
              className="absolute left-[76px] z-50 w-56 rounded-2xl border border-sidebar-border bg-popover p-2 text-popover-foreground shadow-2xl"
            >
              {activeRailGroup === "account" ? (
                <div>
                  <div className="px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-sidebar-foreground border-b border-sidebar-border pb-1.5 mb-1.5">
                    Account
                  </div>
                  <div className="space-y-1">
                    {/* My Info */}
                    {groups
                      .find((g) => g.id === "account")
                      ?.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.onSelect();
                            setActiveRailGroup(null);
                          }}
                          className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[color,background-color] duration-150 ${navButtonBase} ${
                            item.isActive
                              ? sidebarActiveStyles
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${item.isActive ? "text-info" : "text-sidebar-foreground"}`}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}

                    {/* Theme */}
                    <div className="space-y-0.5">
                      <button
                        onClick={() => setIsThemeExpanded(!isThemeExpanded)}
                        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[color,background-color] duration-150 ${navButtonBase} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground`}
                      >
                        <Wrench className="h-4 w-4 shrink-0 text-sidebar-foreground group-hover:text-sidebar-foreground" />
                        <span className="truncate flex-1 text-left">Theme</span>
                        <m.div animate={{ rotate: isThemeExpanded ? 90 : 0 }} transition={{ duration: 0.18 }}>
                          <ChevronRight className="h-3 w-3 text-sidebar-foreground" />
                        </m.div>
                      </button>
                      <m.div
                        initial={false}
                        animate={{ height: isThemeExpanded ? "auto" : 0, opacity: isThemeExpanded ? 1 : 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 space-y-1 py-1">
                          {(
                            [
                              ["light", "Light"],
                              ["dark", "Dark"],
                              ["night", "Night"],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={(e) => handleThemeChange(value, e)}
                              aria-pressed={theme === value}
                              className="flex items-center gap-2 w-full text-left text-xs text-sidebar-foreground hover:text-sidebar-foreground py-0.5 transition-colors"
                            >
                              <span
                                className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${theme === value ? "border-info text-info bg-info-surface" : "border-sidebar-border"}`}
                              >
                                {theme === value && <span className="h-1 w-1 rounded-full bg-info" />}
                              </span>
                              <span className={theme === value ? "text-info font-medium" : ""}>{label}</span>
                            </button>
                          ))}
                        </div>
                      </m.div>
                    </div>

                    {/* Log out */}
                    <button
                      onClick={() => {
                        handleLogOutRequest();
                        setActiveRailGroup(null);
                      }}
                      className="group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[color,background-color] duration-150 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground mt-1.5 border-t border-sidebar-border pt-1.5"
                    >
                      <LogOut className="h-4 w-4 shrink-0 text-sidebar-foreground" />
                      <span className="truncate">Log out</span>
                    </button>
                  </div>
                </div>
              ) : activeRailGroup === "academics" ? (
                <div>
                  <button
                    onClick={() => setActiveRailGroup("study")}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sidebar-foreground hover:text-sidebar-foreground transition-colors border-b border-sidebar-border pb-1.5 mb-1.5 w-full text-left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to Study</span>
                  </button>
                  <div className="space-y-0.5 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: "none" }}>
                    {academicsItems.map((item, index) => {
                      const showDivider = index === 6;
                      return (
                        <div key={item.id}>
                          {showDivider && <div className="my-1.5 border-t border-sidebar-border" />}
                          <button
                            onClick={() => {
                              item.onSelect();
                              setActiveRailGroup(null);
                            }}
                            className={`group relative flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[color,background-color] duration-150 ${navButtonBase} ${
                              item.isActive
                                ? sidebarActiveStyles
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 shrink-0 ${item.isActive ? "text-info" : "text-sidebar-foreground/70"}`}
                            />
                            <span className="truncate">{item.label}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeRailGroup === "hostel-sub" ? (
                <div>
                  <button
                    onClick={() => setActiveRailGroup("campus")}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sidebar-foreground hover:text-sidebar-foreground transition-colors border-b border-sidebar-border pb-1.5 mb-1.5 w-full text-left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to Campus</span>
                  </button>
                  <div className="space-y-0.5 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: "none" }}>
                    {hostelSubItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onSelect();
                          setActiveRailGroup(null);
                        }}
                        className={`group relative flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[color,background-color] duration-150 ${navButtonBase} ${
                          item.isActive
                            ? sidebarActiveStyles
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${item.isActive ? "text-info" : "text-sidebar-foreground/70"}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : activeRailGroup === "tools-sub" ? (
                <div>
                  <button
                    onClick={() => setActiveRailGroup("tools")}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sidebar-foreground hover:text-sidebar-foreground transition-colors border-b border-sidebar-border pb-1.5 mb-1.5 w-full text-left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to Tools</span>
                  </button>
                  <div className="space-y-0.5 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: "none" }}>
                    {toolsSubItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onSelect();
                          setActiveRailGroup(null);
                        }}
                        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[color,background-color] duration-150 ${navButtonBase} ${item.isActive ? sidebarActiveStyles : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${item.isActive ? "text-info" : "text-sidebar-foreground/70"}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-sidebar-foreground border-b border-sidebar-border pb-1.5 mb-1.5">
                    {activeRailGroup === "study" && "Study"}
                    {activeRailGroup === "campus" && "Campus"}
                    {activeRailGroup === "tools" && "Tools"}
                  </div>
                  <div className="space-y-1">
                    {groups
                      .find((g) => g.id === activeRailGroup)
                      ?.items.map((item) => {
                        const activeStyles = railActiveStyles;
                        const inactiveStyles =
                          "border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1";
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.id === "academics") {
                                setActiveRailGroup("academics");
                              } else if (item.id === "hostel") {
                                setActiveRailGroup("hostel-sub");
                              } else if (item.id === "tools") {
                                setActiveRailGroup("tools-sub");
                              } else {
                                item.onSelect();
                                setActiveRailGroup(null);
                              }
                            }}
                            className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 ${navButtonBase} ${
                              item.isActive ? activeStyles : inactiveStyles
                            }`}
                          >
                            <item.icon
                              className={`h-4.5 w-4.5 shrink-0 transition-all duration-300 ${item.isActive ? "text-info scale-110" : "text-sidebar-foreground group-hover:text-sidebar-foreground"}`}
                            />
                            <span className="truncate transition-transform duration-300">{item.label}</span>
                            {item.isExpandable && (
                              <ChevronRight className="h-3.5 w-3.5 ml-auto text-sidebar-foreground" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </Sidebar>
    </>
  );
}

// Optimized Sub-component to isolate App Library state & prevent parent re-renders
