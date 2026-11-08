"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import OptionPicker from "../shared/primitives/OptionPicker";
import AppLibraryPortal from "./AppLibraryPortal";

import { getAssetPath } from "@/lib/utils";
import { formatSemesterName } from "@/lib/formatSemesterName";
import { navigateToFFCSPlanner } from "@/lib/ffcsNavigation";
import { createTapTracker, hasSectionHome, sectionHomeFor } from "@/lib/sectionHome";
import { useOverlayBack } from "@/lib/overlayStack";
import { animateThemeCircularExpansion } from "../ThemeToggle";
import {
  BookOpen,
  Building,
  CalendarCheck,
  CheckSquare,
  ChevronRight,
  Command,
  CreditCard,
  GraduationCap,
  Home,
  Library,
  LayoutGrid,
  RefreshCcw,
  Settings,
  User,
  Wrench,
  WifiOff,
  Calendar,
  Compass,
  Key,
  Bus,
  Search,
  Coffee,
  Info,
  LogOut,
  CarTaxiFront,
  MoreHorizontal,
  Rss,
  Layers,
  Sparkles,
  Database,
  UserCheck,
  DoorOpen,
  Users,
  UserSearch,
  ScanLine,
  PanelLeftClose,
  PanelLeftOpen,
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
  SidebarThemeControl,
} from "@amazecontinuityprojects/amazeui";
import { useSyncTrigger } from "../shared/useSyncTrigger";
import config from "../../../../config.json";
import { shouldShowGpa, shouldShowProfilePhoto } from "@/lib/settingsVisibility";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
};

type Group = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

const navButtonBase = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

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
  const collapsedMenuRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(getAssetPath("/logo.png"));
  const [profileData, setProfileData] = useState<any>(null);
  const [collapsedMenu, setCollapsedMenu] = useState<{ groupId: string; top: number; left: number } | null>(null);

  const [isAppLibraryOpen, setIsAppLibraryOpen] = useState(false);

  // System back (incl. Android predictive back) dismisses the App Library
  // directly, before screen navigation does
  useOverlayBack("app-library", isAppLibraryOpen, () => setIsAppLibraryOpen(false));

  // Theme settings (next-themes)
  const { theme, setTheme } = useTheme();

  // Expanded mode depends on settings
  const isExpandedMode = !settings.isSidebarCollapsed;
  const isOpen = isExpandedMode;

  useEffect(() => {
    if (!collapsedMenu) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (sidebarRef.current?.contains(target) || collapsedMenuRef.current?.contains(target)) return;
      setCollapsedMenu(null);
    };
    const closeOnEscape = (event: WindowEventMap["keydown"]) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setCollapsedMenu(null);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [collapsedMenu]);

  useEffect(() => {
    if (isOpen) setCollapsedMenu(null);
  }, [isOpen]);

  const toggleCollapsedGroup = useCallback(
    (groupId: string, trigger: HTMLButtonElement) => {
      if (collapsedMenu?.groupId === groupId) {
        setCollapsedMenu(null);
        return;
      }

      const bounds = trigger.getBoundingClientRect();
      const menuHeight = Math.min(window.innerHeight * 0.72, 560);
      setCollapsedMenu({
        groupId,
        top: Math.max(12, Math.min(bounds.top, window.innerHeight - menuHeight - 12)),
        left: Math.max(80, Math.min(bounds.right + 8, window.innerWidth - 248)),
      });
    },
    [collapsedMenu],
  );

  // Command palette logic
  const openCommandPalette = useCallback(() => {
    onOpenCommandPalette?.();
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

  const isHosteller = profileData?.isHosteller;
  const residentialStatus = settings?.residentialStatus;

  // Semester Summary Data Calculations
  const totalODHours =
    ODhoursData && ODhoursData.length > 0 && ODhoursData[0].courses
      ? ODhoursData.reduce((sum: number, day: any) => sum + day.total, 0)
      : 0;
  const credits = marksData?.cgpa
    ? Number(marksData.cgpa.creditsEarned) + Number(marksData.cgpa.nonGradedRequirement || 0)
    : "-";
  const attendanceValue = `${attendancePercentage?.[settings.attendancePercentageOrString] || "-"}${
    settings.attendancePercentageOrString === "percentage" ? "%" : ""
  }`;

  const profileName = settings.friendlyName || profileData?.name || username || "Student";
  const shouldDisplayGpa = shouldShowGpa(settings);
  const shouldDisplayProfilePhoto = shouldShowProfilePhoto(settings);
  const initials = String(profileName)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const persistSidebarState = useCallback(
    (nextCollapsed: boolean) => {
      setSettings((prev) => ({ ...prev, isSidebarCollapsed: nextCollapsed }));
    },
    [setSettings],
  );

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
      cabshare: { icon: <CarTaxiFront className="h-5 w-5 stroke-[2]" />, label: "Cab Share" },
      transport: { icon: <Bus className="h-5 w-5 stroke-[2]" />, label: "Transport" },
      more: { icon: <MoreHorizontal className="h-5 w-5 stroke-[2]" />, label: "More" },
      profile: { icon: <User className="h-5 w-5 stroke-[2]" />, label: "Profile" },
      credentials: { icon: <Key className="h-5 w-5 stroke-[2]" />, label: "Credentials" },
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
    const rawItems: any[] = [
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
      label: "Apps",
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

  const sidebarActiveStyles = "bg-sidebar-accent border border-sidebar-border text-info font-semibold";
  const sidebarActiveIconStyles = "text-info font-semibold";
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
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const buttons = Array.from(document.querySelectorAll<HTMLElement>("[data-sidebar-nav='true']"));
      const index = buttons.indexOf(event.currentTarget);
      const next = event.key === "ArrowDown" ? buttons[index + 1] : buttons[index - 1];
      next?.focus();
    }
  }, []);

  // Navigation Items Memoization
  const studyItems = useMemo<NavItem[]>(
    () => [
      {
        id: "home",
        label: "Home",
        icon: Home,
        isActive: activeTab === "home",
        onSelect: () => selectTab("home"),
      },
      {
        id: "calendar",
        label: "Timetable Calendar",
        icon: Calendar,
        isActive: activeTab === "attendance",
        onSelect: () => {
          selectTab("attendance");
          setActiveAttendanceSubTab("calendar");
        },
      },
      {
        id: "academics",
        label: "Academics",
        icon: GraduationCap,
        isActive: activeTab === "academics",
        onSelect: () => {
          selectTab("academics");
          if (!activeSubTab || activeSubTab === "overview") setActiveSubTab("courses-simplified");
        },
      },
    ],
    [activeTab, activeSubTab, selectTab, setActiveAttendanceSubTab, setActiveSubTab],
  );

  const campusItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        isActive: activeTab === "payments",
        onSelect: () => selectTab("payments"),
      },
      {
        id: "libraries",
        label: "Libraries",
        icon: Library,
        isActive: activeTab === "libraries",
        onSelect: () => selectTab("libraries"),
      },
      {
        id: "transport",
        label: "Transport",
        icon: Bus,
        isActive: activeTab === "transport",
        onSelect: () => selectTab("transport"),
      },
      {
        id: "events",
        label: "Event Hub",
        icon: Calendar,
        isActive: activeTab === "events",
        onSelect: () => selectTab("events"),
      },
      {
        id: "clubs",
        label: "Club Hub",
        icon: LayoutGrid,
        isActive: activeTab === "clubs",
        onSelect: () => selectTab("clubs"),
      },
      {
        id: "community",
        label: "Announcements",
        icon: Rss,
        isActive: activeTab === "community",
        onSelect: () => selectTab("community"),
      },
      {
        id: "free-class",
        label: "Free Classrooms",
        icon: DoorOpen,
        // Preserve highlighting for older saved navigation state.
        isActive: activeTab === "free-class" || (activeTab === "tools" && activeToolsSubTab === "free-class"),
        onSelect: () => selectTab("free-class"),
      },
      {
        id: "faculty-schedule",
        label: "Faculty Schedule",
        icon: UserSearch,
        isActive: activeTab === "faculty-schedule",
        onSelect: () => selectTab("faculty-schedule"),
      },
    ];

    if (isHosteller === true || residentialStatus === "hosteller") {
      items.push({
        id: "hostel",
        label: "Hostel Hub",
        icon: Home,
        isActive: activeTab === "hostel",
        onSelect: () => {
          selectTab("hostel");
          if (!HostelActiveSubTab) setHostelActiveSubTab("overview");
        },
      });
    }

    return items;
  }, [
    activeTab,
    activeToolsSubTab,
    isHosteller,
    residentialStatus,
    selectTab,
    setActiveToolsSubTab,
    HostelActiveSubTab,
    setHostelActiveSubTab,
  ]);

  const toolsItems = useMemo<NavItem[]>(
    () => [
      {
        id: "ffcs",
        label: "FFCS Planner",
        icon: Compass,
        isActive:
          (activeTab === "more" && activeMoreSubTab === "ffcs") ||
          (activeTab === "tools" && activeToolsSubTab === "ffcs"),
        onSelect: navigateToFFCSPlanner,
      },
      {
        id: "paper-scanner",
        label: "Paper Scanner",
        icon: ScanLine,
        isActive: activeTab === "paper-scanner",
        onSelect: () => selectTab("paper-scanner"),
      },
      {
        id: "tools",
        label: "Tools & Utilities Hub",
        icon: Layers,
        isActive: activeTab === "tools" && (!activeToolsSubTab || activeToolsSubTab === "overview"),
        onSelect: () => {
          selectTab("tools");
          setActiveToolsSubTab?.("overview");
        },
      },
    ],
    [activeTab, activeToolsSubTab, selectTab, setActiveToolsSubTab],
  );

  const accountItems = useMemo<NavItem[]>(
    () => [
      {
        id: "profile",
        label: "Settings & Profile",
        icon: User,
        isActive: activeTab === "profile",
        onSelect: () => {
          // "settings" is the category hub. Without this the sidebar inherited
          // whatever section was last open and could re-open mid-section on a
          // return visit, or land on Student Profile on a cold start.
          selectTab("profile");
          setActiveProfileSubTab("settings");
        },
      },
      {
        id: "about",
        label: "About & Resources",
        icon: Info,
        isActive: activeTab === "about",
        onSelect: () => {
          selectTab("about");
        },
      },
    ],
    [activeTab, selectTab, setActiveProfileSubTab],
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
        isActive: activeTab === "profile",
        onSelect: () => {
          selectTab("profile");
        },
      },
    };
    return pinnedTabs.map((id: string) => ({ id, ...tabData[id] })).filter((item: any) => item.label !== undefined);
  }, [settings?.pinnedNavTabs, activeTab, selectTab]);

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

      const home = sectionHomeFor(item.id, {
        setActiveAttendanceSubTab,
        setActiveSubTab,
        setActiveToolsSubTab,
        setActiveDayscholarSubTab,
        setActiveMoreSubTab,
        setActiveProfileSubTab,
      });
      // A toggle icon (search, modules) has no home, and a single-screen tab
      // needs no reset - in both cases the normal tap already did everything
      // there is to do, so the double tap falls through to it.
      if (!home) {
        item.onClick();
        return;
      }

      setIsAppLibraryOpen(false);
      selectTab(item.id);
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
      onCollapseScreenChange,
      setActiveAttendanceSubTab,
      setActiveSubTab,
      setActiveToolsSubTab,
      setActiveDayscholarSubTab,
      setActiveMoreSubTab,
      setActiveProfileSubTab,
    ],
  );

  const renderMobileNav = () => {
    return (
      <>
        {/* Calm Notebook bottom tab bar: full width, hairline on top, 22 px
            outline icons with short labels, active tab in the accent. No pill,
            no zoom. It stays below option pickers and bottom sheets, so it dims
            with the page instead of floating over modals. */}
        <nav
          aria-label="Main"
          className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line bg-surface px-1.5 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] mobile-bottom-nav-bar"
        >
          {rawNavItems.map((item) => {
            const isActive = item.isActive;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavItemTap(item)}
                aria-label={hasSectionHome(item.id) ? `${item.label} — double tap for home` : item.label}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                className={`flex min-h-11 min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] select-none cursor-pointer transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&_svg]:h-[22px] [&_svg]:w-[22px] [&_svg]:stroke-[1.8] ${
                  isActive ? "font-semibold text-accent" : "text-muted hover:text-ink"
                }`}
              >
                <span aria-hidden="true" className="flex items-center justify-center">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

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
        isOpen={isOpen}
        onOpenChange={(val) => persistSidebarState(!val)}
      >
        {/* Sidebar Header */}
        <SidebarHeader>
          {/* Brand and sidebar controls */}
          <div className={`flex w-full items-center ${isOpen ? "justify-between" : "justify-center"}`}>
            <div className={`flex min-w-0 items-center ${isOpen ? "gap-2.5" : "justify-center"}`}>
              <img
                loading="lazy"
                decoding="async"
                src={currentIcon}
                alt="AmazeCC"
                className="h-8 w-8 rounded-lg object-contain"
              />
              {isOpen && (
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink">AmazeCC</h2>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Student space
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {isOpen && (
                <button
                  onClick={handleSyncClick}
                  className={`relative hit-expand group flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors duration-[120ms] ${navButtonBase} ${
                    isOffline ? "bg-warn-soft text-warn" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                  }`}
                  title={isOffline ? "You're offline — tap for details" : "Sync Data from VTOP"}
                  aria-label={isOffline ? "Offline — tap for details" : "Sync Data from VTOP"}
                  aria-live="polite"
                >
                  {isOffline ? (
                    <WifiOff className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <RefreshCcw
                      className={`h-3.5 w-3.5 transition-transform ${isSpinning ? "animate-spin text-accent" : ""}`}
                    />
                  )}
                  <span>{isOffline ? "Offline" : "Sync"}</span>
                </button>
              )}
              {isOpen && (
                <button
                  type="button"
                  onClick={() => persistSidebarState(true)}
                  className={`group grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sidebar-foreground/65 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${navButtonBase}`}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Section, Semester summary, & Search */}
          <AnimatePresence initial={false}>
            {isOpen ? (
              <m.div
                key="header-expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden space-y-3"
              >
                {/* Left-aligned clean Semester Summary Card */}
                <div className="mt-3 space-y-2 rounded-xl border border-line bg-surface/50 p-3 text-[13px]">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-medium text-muted">Current semester</div>
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
                        className="w-full [&>button:first-child]:h-auto [&>button:first-child]:p-0 [&>button:first-child]:rounded-none [&>button:first-child]:border-none [&>button:first-child]:shadow-none [&>button:first-child]:justify-end [&>button:first-child]:text-accent [&>button:first-child]:hover:underline [&>button:first-child_span]:text-[12px] [&>button:first-child_span]:font-medium [&>button:first-child_span]:text-accent [&>button:first-child_svg]:h-3 [&>button:first-child_svg]:w-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {shouldDisplayGpa && (
                      <button
                        onClick={() => {
                          setSettings((prev: any) => {
                            const next = { ...prev, CGPAHidden: !prev.CGPAHidden };
                            return next;
                          });
                        }}
                        className="-mx-1 flex w-full cursor-pointer items-center justify-between rounded-sm px-1 py-0.5 text-left text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
                        title="Click to show/hide CGPA"
                      >
                        <span className="text-muted">CGPA</span>
                        <span
                          className={`font-semibold text-sidebar-foreground transition-all duration-300 ${settings.CGPAHidden ? "blur-[4.5px] select-none" : ""}`}
                        >
                          {marksData?.cgpa?.cgpa || "-"}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSettings((prev: any) => {
                          const next = {
                            ...prev,
                            attendancePercentageOrString:
                              prev.attendancePercentageOrString === "percentage" ? "str" : "percentage",
                          };
                          return next;
                        });
                      }}
                      className="-mx-1 flex w-full cursor-pointer items-center justify-between rounded-sm px-1 py-0.5 text-left text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
                      title="Click to toggle attendance format"
                    >
                      <span className="text-muted">Attendance</span>
                      <span
                        className={`font-mono font-medium tabular-nums ${attendancePercentage?.percentage < 75 ? "text-danger" : "text-ok"}`}
                      >
                        {attendanceValue}
                      </span>
                    </button>

                    <button
                      onClick={() => setGradesDisplayIsOpen(true)}
                      className="-mx-1 flex w-full cursor-pointer items-center justify-between rounded-sm px-1 py-0.5 text-left text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
                      title="Click to view credits & grades details"
                    >
                      <span className="text-muted">Credits</span>
                      <span className="font-mono font-medium text-ink tabular-nums">{credits}</span>
                    </button>

                    <button
                      onClick={() => {
                        selectTab("attendance");
                        setActiveAttendanceSubTab("od");
                      }}
                      className="-mx-1 flex w-full cursor-pointer items-center justify-between rounded-sm px-1 py-0.5 text-left text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
                      title="Click to view OD tracker details"
                    >
                      <span className="text-muted">OD Hours</span>
                      <span className="font-mono font-medium text-ink tabular-nums">{totalODHours}/40</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar Input */}
                <button
                  data-sidebar-nav="true"
                  onClick={openCommandPalette}
                  onKeyDown={(event) => handleNavKeyDown(event, openCommandPalette)}
                  className={`group flex min-h-9 w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-left text-[13px] text-muted transition-colors duration-[120ms] hover:border-ink-2/40 hover:text-ink-2 ${navButtonBase}`}
                  aria-label="Open command palette"
                >
                  <Command className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">Search</span>
                  <kbd className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">⌘K</kbd>
                </button>
              </m.div>
            ) : (
              <m.div
                key="header-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex w-full flex-col items-center gap-2"
              >
                <button
                  type="button"
                  onClick={openCommandPalette}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${navButtonBase}`}
                  title="Search anything... (Ctrl+K)"
                  aria-label="Open command palette"
                >
                  <Command className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => persistSidebarState(false)}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${navButtonBase}`}
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </SidebarHeader>

        <SidebarContent className={!isOpen ? "px-2" : undefined}>
          <nav aria-label="Navigation" className={isOpen ? "space-y-3" : "flex w-full flex-col items-center gap-2"}>
            {groups.map((group) =>
              isOpen ? (
                <SidebarGroup key={group.id} className="space-y-1">
                  <SidebarGroupLabel className="my-0 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted first:mt-0">
                    {group.label}
                  </SidebarGroupLabel>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <SidebarItem
                        key={item.id}
                        icon={<item.icon className="h-[18px] w-[18px] stroke-[1.85]" aria-hidden="true" />}
                        label={item.label}
                        isActive={item.isActive}
                        aria-current={item.isActive ? "page" : undefined}
                        data-sidebar-nav="true"
                        className={`rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info ${
                          item.isActive
                            ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                        }`}
                        onClick={item.onSelect}
                        onKeyDown={(event) => handleNavKeyDown(event, item.onSelect)}
                      />
                    ))}
                  </div>
                </SidebarGroup>
              ) : (
                <button
                  key={group.id}
                  type="button"
                  aria-label={group.label}
                  aria-haspopup="menu"
                  aria-expanded={collapsedMenu?.groupId === group.id}
                  title={`${group.label} navigation`}
                  onClick={(event) => toggleCollapsedGroup(group.id, event.currentTarget)}
                  className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${
                    collapsedMenu?.groupId === group.id
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : group.items.some((item) => item.isActive)
                        ? "bg-sidebar-accent/70 text-sidebar-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  {group.items.some((item) => item.isActive) && (
                    <span aria-hidden="true" className="absolute -left-2 h-5 w-0.5 rounded-full bg-accent" />
                  )}
                  <group.icon className="h-[19px] w-[19px]" strokeWidth={1.85} aria-hidden="true" />
                </button>
              ),
            )}
          </nav>
        </SidebarContent>

        {!isOpen &&
          collapsedMenu &&
          typeof document !== "undefined" &&
          createPortal(
            <m.div
              ref={collapsedMenuRef}
              id="collapsed-sidebar-menu"
              role="menu"
              aria-label={`${groups.find((group) => group.id === collapsedMenu.groupId)?.label ?? ""} navigation`}
              initial={{ opacity: 0, x: -5, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -5, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[80] w-60 overflow-y-auto rounded-xl border border-line bg-surface p-2.5 text-ink shadow-xl"
              style={{
                top: collapsedMenu.top,
                left: collapsedMenu.left,
                maxHeight: `min(72vh, calc(100dvh - ${collapsedMenu.top}px - 24px))`,
              }}
            >
              {groups
                .find((group) => group.id === collapsedMenu.groupId)
                ?.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.onSelect();
                      setCollapsedMenu(null);
                    }}
                    aria-current={item.isActive ? "page" : undefined}
                    className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info ${
                      item.isActive
                        ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <item.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.85} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </button>
                ))}
            </m.div>,
            document.body,
          )}

        {/* Profile, Theme, and Logout Footer */}
        <SidebarFooter className="border-t border-sidebar-border">
          <AnimatePresence initial={false}>
            {isOpen ? (
              <m.div
                key="footer-expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="shrink-0 space-y-2.5"
              >
                <SidebarProfile
                  name={profileName}
                  degree={(profileData?.program || profileData?.branch || profileData?.batch || "").replace(
                    "B.Tech ",
                    "",
                  )}
                  avatarUrl={shouldDisplayProfilePhoto ? profileData?.image : undefined}
                  initials={initials || "ST"}
                  onLogout={handleLogOutRequest}
                />

                <div className="h-px bg-sidebar-accent" />

                <SidebarThemeControl theme={theme} onThemeChange={handleThemeChange} />
              </m.div>
            ) : (
              <m.div
                key="footer-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 w-full shrink-0"
              >
                <SidebarThemeControl theme={theme} onThemeChange={handleThemeChange} />

                {/* Profile Avatar */}
                <SidebarProfile
                  avatarUrl={shouldDisplayProfilePhoto ? profileData?.image : undefined}
                  initials={initials || "ST"}
                  onProfileClick={() => selectTab("profile")}
                />
              </m.div>
            )}
          </AnimatePresence>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

// Optimized Sub-component to isolate App Library state & prevent parent re-renders
