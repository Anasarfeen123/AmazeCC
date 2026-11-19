"use client";

import { syncEngine } from "@/lib/sync-engine";
import { updatePostHogPersonName } from "@/lib/posthog";
import { switchApiHost, hasBackupApi, getActiveApiUrl, BACKUP_API_URL, type ApiHostChoice } from "@/lib/fetch-utils";
import {
  X,
  Save,
  LogOut,
  Eye,
  EyeOff,
  User,
  Link2,
  ExternalLink,
  Database,
  Shield,
  ChevronRight,
  RefreshCcw,
  Sliders,
  Info,
  Key,
  Grid,
  Search,
  Keyboard,
  Palette,
  GraduationCap,
  Check,
  Edit3,
  Copy,
  KeyRound,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAtomValue } from "jotai";
import { unifiedIdentityAtom } from "@/store";
import type { UnifiedUserIdentity } from "@/types";
import { Button, cn } from "@amazecontinuityprojects/amazeui";
import { useOverlayBack } from "@/lib/overlayStack";
import { useForgetCredentialsAction } from "../app/useForgetCredentialsAction";
import {
  EmptyPanel,
  GhostButton,
  IconButton,
  KeyValue,
  ListRowText,
  ListShell,
  PageShell,
  SectionHeader,
  SegmentedControl,
  SelectField,
  StatTile,
  SubpageScreen,
  Switch,
} from "../shared/primitives";
// `TILE` was already dead here; `TILE_INTERACTIVE` went with the settings tile
// grid. `LIST_ROW` is the row shell the course overview uses for the same shape.
import { LIST_ROW, TILE_CARD, TONE_ICON_TILE, FIELD_INPUT } from "@/lib/uiTokens";
import { getAssetPath } from "@/lib/utils";
import { parentOf } from "@/lib/settingsNav";
import { RegistrationModalContent, BankDayStatusModal } from "./ProfileModals";
import config from "../../../../config.json";
import PushNotificationManager from "./PushNotificationManager";
import PwaInstallCard from "../shared/PwaInstallCard";
import LocalStorageSubpage from "../footer/LocalStorageSubpage";
import ChangelogModal from "./ChangelogModal";
import HallOfFameModal from "./HallOfFameModal";
import TeamModal from "./TeamModal";
import AboutBody from "./AboutBody";
import ProfileStatusCards from "../profile/ProfileStatusCards";
import AcknowledgementCards from "../profile/AcknowledgementCards";
import { useIsMobile } from "../shared";
import BottomSheet from "../shared/BottomSheet";
import { effectiveCellDensity } from "../timetable/useTimetableViewMode";
import { SyncModeEditorContent } from "../shared/SyncModeEditor";
import SyncCadenceGuide from "../shared/SyncCadenceGuide";
import { listModes, loadCustomModes, resolveMode, type SyncMode } from "@/lib/sync-engine/sync-modes";
import { clearApiCache } from "../exams/GenericApiView";
import { useTheme } from "next-themes";
import {
  PRIVACY_CATEGORIES,
  PRIVACY_CATEGORY_DETAILS,
  privacyCategories,
  setPrivacyMode,
  togglePrivacyCategory,
} from "@/lib/privacyMode";

export type SectionId =
  "profile" | "credentials" | "preferences" | "academic" | "sync" | "sync-modes" | "navigation" | "advanced" | "about";

export interface SectionConfig {
  id: SectionId;
  label: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

/**
 * The settings screens: the category hub, then one per section.
 *
 * Module scope so the array is referentially stable — `useSubpageStack` keeps
 * `screens` in a `useMemo`, and a list rebuilt on every render would make the
 * stack's identity churn with it.
 */
type SettingsScreen = "hub" | SectionId | "storage";

/**
 * Screens that are a drill-down inside a section rather than a section of their
 * own. They are in the back-stack — so `back()` from one lands on the section
 * it was opened from — but they are not in `SECTIONS`, so the hub does not list
 * them as categories. `storage` is the only one so far; it used to be a
 * full-screen overlay with its own header and close button, which meant a
 * second copy of the chrome and a back stack of exactly one entry.
 */
const DRILLDOWNS: Record<Exclude<SettingsScreen, "hub" | SectionId>, { label: string; subtitle: string }> = {
  storage: {
    label: "Local Storage",
    subtitle: "Every key this browser is holding for the app",
  },
};

export const SECTIONS: SectionConfig[] = [
  {
    id: "profile",
    label: "Student Profile",
    subtitle: "Your details from VTOP: personal info, proctor and records",
    icon: User,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "credentials",
    label: "VTOP Credentials",
    subtitle: "Portal logins, password change, and stored session keys",
    icon: Key,
    iconBg: "bg-warning-surface",
    iconColor: "text-warning-foreground",
  },
  {
    id: "preferences",
    label: "Appearance & Privacy",
    subtitle: "Theme, timetable layout, what Home shows, privacy blur, app icon",
    icon: Palette,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "academic",
    label: "Academic & Campus Life",
    subtitle: "Semester, attendance goal, hostel or day scholar, focus timer",
    icon: GraduationCap,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "sync",
    label: "Sync",
    subtitle: "When and what AmazeCC pulls from VTOP, sync modes, data saver",
    icon: RefreshCcw,
    iconBg: "bg-success-surface",
    iconColor: "text-success-foreground",
  },
  {
    id: "sync-modes",
    label: "Sync Modes",
    subtitle: "Quick, balanced and full sweeps plus your own custom modes",
    icon: Sliders,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "navigation",
    label: "Navigation & Notifications",
    subtitle: "Bottom bar shortcuts, push notifications, install the app",
    icon: Grid,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    id: "advanced",
    label: "Advanced",
    subtitle: "API server, backup and restore, stored data on this device",
    icon: Shield,
    iconBg: "bg-danger-surface",
    iconColor: "text-danger-foreground",
  },
  {
    id: "about",
    label: "About",
    subtitle: "What's new, the team, hall of fame, campus links",
    icon: Info,
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
];

/**
 * `"ALL0225-26"` -> `"FALLSEM 25-26"`.
 *
 * The semester picker and the Academic row on the settings hub both need
 * this, and they must not be allowed to disagree about what "FALLSEM" means.
 * The id carries the term in its last two digits and the year in the middle, so
 * a raw id is not a label a human can read at a glance.
 */
function semesterLabel(id?: string): string {
  if (!id) return "—";
  const term = id.endsWith("01")
    ? "FALLSEM"
    : id.endsWith("05")
      ? "WINTERSEM"
      : id.endsWith("07")
        ? "SUMMERSEM"
        : "TERM";
  return `${term} ${id.slice(4, -4)}-${id.slice(6, -2)}`;
}

export default function ProfilePage({
  currSemesterID,
  setCurrSemesterID,
  handleLogin,
  setIsReloading,
  handleLogOutRequest,
  username,
  password,
  setPassword,
  decimalValues,
  setDecimalValues,
  isDayscholarWithBus,
  setIsDayscholarWithBus,
  residentialStatus,
  setResidentialStatus,
  calendarType,
  setCalendarType,
  reloadAllData,
  setReloadAllData,
  isLoggedIn,
  friendlyName,
  setFriendlyName,
  creds,
  refreshKey,
  onCardClick,
  onCredentialsClick,
  onReload,
  onRunSyncMode,
  settings,
  setSettings,
  mode = "settings",
  onOpenShortcutsHelp,
}: any) {
  const handleForgetCredentials = useForgetCredentialsAction();
  const isMobile = useIsMobile();
  // One navigation state for both breakpoints. `null` is the category hub;
  // anything else is that section's page. `mode` is the profile screen's
  // history key, so it decides whether we arrive deep-linked on a section
  // (credentials, from the app library) or on the hub.
  const initialSection: SectionId | null =
    mode === "credentials" || mode === "profile" || mode === "info" ? (mode === "info" ? "profile" : mode) : null;

  /**
   * Where "back" goes from here.
   *
   * Settings is a two-level tree — hub → section → drill-down — not a linear
   * chain of siblings. It was built on `useSubpageStack` with every screen as
   * its own entry, and that primitive walks the array backwards, so opening
   * "Appearance & Theme" (third in the list) made back go to "VTOP Credentials",
   * then "Student Profile", and only then the hub: every screen in the list got
   * a back step whether or not the reader had ever visited it.
   *
   * The primitive is right for the pages that *are* linear (Grade History's
   * overview → insights → subject), so it stays untouched and this keeps the same
   * call shape — `go`, `back`, `reset`, `isRoot`, `canGoBack`, `screen` — over the
   * hierarchy the page actually has.
   */
  const [screen, setScreen] = useState<SettingsScreen>(initialSection ?? "hub");
  const activeSection: Exclude<SettingsScreen, "hub"> | null = screen === "hub" ? null : screen;

  const goBack = useCallback(() => setScreen((cur) => parentOf(cur) as SettingsScreen), []);
  const resetScreen = useCallback(() => setScreen("hub"), []);

  const screens = useMemo(
    () => ({
      screen,
      isRoot: screen === "hub",
      canGoBack: screen !== "hub",
      go: setScreen,
      back: goBack,
      reset: resetScreen,
    }),
    [screen, goBack, resetScreen],
  );

  // System back (incl. Android predictive back) walks drill-down -> section ->
  // hub, and only then falls through to Main's screen history — same order as
  // the in-app BackButton in PageShell.
  useOverlayBack("profile-section", !screens.isRoot, screens.back);

  const unifiedIdentity: UnifiedUserIdentity = useAtomValue(unifiedIdentityAtom);
  const resolvedUsername = unifiedIdentity.regNumber || username;
  const resolvedFriendlyName = friendlyName || unifiedIdentity.friendlyName;
  const resolvedDisplayName = resolvedFriendlyName || unifiedIdentity.name || resolvedUsername || "Student";

  const [selectedSemester, setSelectedSemester] = useState<string>(currSemesterID);
  const [appIcon, setAppIcon] = useState<string>("default");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempFriendlyName, setTempFriendlyName] = useState<string>(resolvedFriendlyName || "");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Which API host the app is pointed at.
   *
   * Derived from storage at mount rather than assumed, so the control shows the
   * real state after a reload — a custom URL is the strongest signal, then the
   * active key, and primary is the default. The backup option is only offered
   * when `hasBackupApi()` says it is a real, distinct mirror.
   */
  const [apiChoice, setApiChoice] = useState<ApiHostChoice>(() => {
    if (typeof window !== "undefined") {
      try {
        const custom = localStorage.getItem("amazecc_custom_api_url");
        if (custom) return "custom";
        const active = localStorage.getItem("amazecc_active_api_url");
        if (active === BACKUP_API_URL) return "backup";
      } catch {}
    }
    return "default";
  });

  const [customApiInput, setCustomApiInput] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("amazecc_custom_api_url") || "";
    }
    return "";
  });

  const [profileData, setProfileData] = useState<any>(null);
  const [profileImages, setProfileImages] = useState<any>(null);
  const [hostelInfo, setHostelInfo] = useState<any>(null);

  // Modals & Credential States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const closeModal = () => setActiveModal(null);
  const handleCardClick = (id: string) => {
    setActiveModal(id);
    onCardClick?.(id);
  };

  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [showHallOfFame, setShowHallOfFame] = useState<boolean>(false);
  // The About body is shared with the About tab, which offers three drill-downs.
  // Changelog and Hall of Fame were already reachable from here; the team page
  // was not, so it gets the same treatment rather than a dead row.
  const [showTeam, setShowTeam] = useState<boolean>(false);

  // Credentials Section States
  const [credData, setCredData] = useState<any>(null);
  const [, setCredLoading] = useState(true);
  const [changedUsername, setChangedUsername] = useState(username || "");
  const [changedPassword, setChangedPassword] = useState(Array.isArray(password) ? password[0] : password || "");
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [refreshingCreds, setRefreshingCreds] = useState(false);
  const [kohaCard, setKohaCard] = useState("");
  const [kohaPassword, setKohaPassword] = useState("");
  const [kohaSaved, setKohaSaved] = useState(false);
  const [lmsUsername, setLmsUsername] = useState("");
  const [lmsPassword, setLmsPassword] = useState("");
  const [showLmsPassword, setShowLmsPassword] = useState(false);
  const [lmsSaved, setLmsSaved] = useState(false);
  const [customSyncModes, setCustomSyncModes] = useState<SyncMode[]>(() => loadCustomModes());

  // `resolvedTheme` is the theme actually rendered — `theme` is undefined until
  // next-themes mounts, so reading it for a summary value would flash "Light"
  // at a dark-mode user on every first paint.
  const { theme, resolvedTheme, setTheme } = useTheme();

  const displayProfileImage = settings?.showProfilePhoto || mode === "info";

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  /**
   * A density pick here counts like an in-grid pick: it stamps
   * `timetableDensityTouched`, so the choice beats the phone's compact default
   * everywhere from now on. Single-key `updateSetting` can't stamp two keys.
   */
  const setTimetableDensity = (value: "full" | "compact") => {
    setSettings((prev: any) => {
      const next = {
        ...prev,
        timetableCellDensity: value,
        timetableDensityTouched: true,
      };
      return next;
    });
  };

  const handleToggleAllSync = (enable: boolean) => {
    setSettings((prev: any) => {
      const next = {
        ...prev,
        syncAdditionalData: enable,
        syncExcRegistration: enable,
        syncMinorHonour: enable,
        syncCourseCompletion: enable,
        syncProfileData: enable,
      };
      return next;
    });
  };

  const handleSaveSemester = async () => {
    if (!selectedSemester) return;
    setIsReloading(true);
    await handleLogin(selectedSemester);
    setCurrSemesterID(selectedSemester);
  };

  const handleThemeChange = (val: string) => {
    if (theme === val) return;
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setTheme(val);
      });
    } else {
      setTheme(val);
    }
  };

  const handleIconChange = (icon: string) => {
    setAppIcon(icon);
    localStorage.setItem("app-icon", icon);
    window.dispatchEvent(new Event("app-icon-changed"));
  };

  const applyApiChoice = (choice: ApiHostChoice, url?: string) => {
    switchApiHost(choice, url);
    setApiChoice(choice);
  };

  const saveCustomApiUrl = () => {
    const url = customApiInput.trim();
    if (!url) return;
    applyApiChoice("custom", url);
  };

  const handleResetCache = () => {
    if (confirm("Are you sure you want to reset all cached data? You will need to log in again.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExportSettings = () => {
    const data = {
      settings: localStorage.getItem("settings"),
      appIcon: localStorage.getItem("app-icon"),
      friendlyName: localStorage.getItem("friendlyName"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amazecc-settings-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.settings) localStorage.setItem("settings", parsed.settings);
          if (parsed.appIcon) localStorage.setItem("app-icon", parsed.appIcon);
          if (parsed.friendlyName) localStorage.setItem("friendlyName", parsed.friendlyName);
          window.location.reload();
        } catch (err) {
          alert("Invalid settings backup file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  useEffect(() => {
    setKohaCard(localStorage.getItem("koha_card") || "");
    setKohaPassword(localStorage.getItem("koha_password") || "");
    try {
      setLmsUsername(localStorage.getItem("moodle_username") || "");
      setLmsPassword(localStorage.getItem("moodle_password") || "");
    } catch {}
  }, []);

  const saveKoha = () => {
    localStorage.setItem("koha_card", kohaCard);
    localStorage.setItem("koha_password", kohaPassword);
    setKohaSaved(true);
    setTimeout(() => setKohaSaved(false), 2000);
  };

  // Same persistence contract as `MoodleDisplay` and the Koha form above: the IDs
  // bucket plus the two dedicated keys the boot path reads. This page holds no IDs
  // state of its own, so — like `MoodleDisplay` — it reloads after saving rather
  // than leaving the app's in-memory credentials stale.
  const saveLms = () => {
    try {
      const raw = localStorage.getItem("IDs");
      const ids = raw ? JSON.parse(raw) : {};
      localStorage.setItem("IDs", JSON.stringify({ ...ids, MoodleUsername: lmsUsername, MoodlePassword: lmsPassword }));
      localStorage.setItem("moodle_username", lmsUsername);
      localStorage.setItem("moodle_password", lmsPassword);
    } catch {}
    setLmsSaved(true);
    setTimeout(() => {
      setLmsSaved(false);
      window.location.reload();
    }, 1000);
  };

  const toggleShow = (idx: number) => setShowPasswords((p) => ({ ...p, [idx]: !p[idx] }));

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleRefreshCreds = async () => {
    setRefreshingCreds(true);
    clearApiCache();
    if (!creds || !creds.cookies) {
      setRefreshingCreds(false);
      return;
    }
    const { authorizedID } = creds;
    if (authorizedID === "DEMO123" || username === "demo") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setCredData({
        credentials: [
          {
            account: "VTOP Student Portal",
            username: "22BCE1234",
            defaultCredentials: "demo-password-vtop",
            url: "https://vtopcc.vit.ac.in",
            venueDate: "Active Session",
            seatLocation: "N/A",
          },
          {
            account: "Koha Library Card",
            username: "22BCE1234",
            defaultCredentials: "demo-password-koha",
            url: "http://opac.vit.ac.in",
            venueDate: "N/A",
            seatLocation: "N/A",
          },
        ],
      });
      setRefreshingCreds(false);
      return;
    }
    try {
      const w = (await syncEngine.sync("whoami")) as any;
      if (w && !w.error) {
        localStorage.setItem("cache_whoami", JSON.stringify(w));
        setCredData({ credentials: w.credentials || [], ranks: w.ranks || [] });
      }
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      setRefreshingCreds(false);
    }
  };

  useEffect(() => {
    setCredLoading(true);
    setChangedUsername(username);
    setChangedPassword(Array.isArray(password) ? password[0] : password || "");

    if (!creds || !creds.cookies) {
      setCredLoading(false);
      return;
    }

    const { authorizedID } = creds;
    if (authorizedID === "DEMO123" || username === "demo") {
      setCredData({
        credentials: [
          {
            account: "VTOP Student Portal",
            username: "22BCE1234",
            defaultCredentials: "demo-password-vtop",
            url: "https://vtopcc.vit.ac.in",
            venueDate: "Active Session",
            seatLocation: "N/A",
          },
          {
            account: "Koha Library Card",
            username: "22BCE1234",
            defaultCredentials: "demo-password-koha",
            url: "http://opac.vit.ac.in",
            venueDate: "N/A",
            seatLocation: "N/A",
          },
        ],
      });
      setCredLoading(false);
      return;
    }

    const applyWhoami = (w: any) => {
      if (w?.credentials || w?.ranks) {
        setCredData({ credentials: w.credentials || [], ranks: w.ranks || [] });
      }
    };

    if (refreshKey === 0) {
      try {
        const cached = localStorage.getItem("cache_whoami") || localStorage.getItem("cache_credentials");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.credentials || parsed?.ranks) {
            applyWhoami(parsed);
            setCredLoading(false);
            return;
          }
        }
      } catch {}
    }

    (async () => {
      try {
        const w = (await syncEngine.sync("whoami")) as any;
        if (w && !w.error) {
          localStorage.setItem("cache_whoami", JSON.stringify(w));
          applyWhoami(w);
          return;
        }
      } catch (e) {
        console.error("Credentials fetch error:", e);
      } finally {
        setCredLoading(false);
      }
      setCredLoading(false);
    })();
  }, [refreshKey, creds, username, password]);

  useEffect(() => {
    setSelectedSemester(currSemesterID);
    setAppIcon(localStorage.getItem("app-icon") || "default");

    if (username === "demo") {
      setProfileData({
        name: "Demo Student",
        branch: "B.Tech Computer Science & Engineering",
        isHosteller: true,
        nativeLanguage: "English",
        nativeState: "Tamil Nadu",
        nationality: "Indian",
        community: "General",
        religion: "None",
        caste: "General",
        physicallyChallenged: "No",
        mobileNumber: "+91 99999 99999",
        friendMobileNumber: "+91 88888 88888",
        aadharNumber: "XXXX-XXXX-XXXX",
        bloodGroup: "O+",
        currentAddress: {
          line1: "VIT Chennai Campus",
          line2: "Vandalur-Kelambakkam Road",
          city: "Chennai",
          pincode: "600127",
        },
        permanentAddress: {
          line1: "VIT Chennai Campus",
          line2: "Vandalur-Kelambakkam Road",
          city: "Chennai",
          pincode: "600127",
        },
      });
      setHostelInfo({ blockName: "D-Block", roomNo: "402" });
      return;
    }

    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      try {
        setProfileData(JSON.parse(storedProfile));
      } catch (e) {
        console.error(e);
      }
    }
    const storedImages = localStorage.getItem("profileImages");
    if (storedImages) {
      try {
        setProfileImages(JSON.parse(storedImages));
      } catch (e) {
        console.error(e);
      }
    }
    const storedHostel = localStorage.getItem("hostel");
    if (storedHostel) {
      try {
        const parsed = JSON.parse(storedHostel);
        setHostelInfo(parsed.hostelInfo || parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, [currSemesterID, username]);

  useEffect(() => {
    if (!creds || !creds.cookies) return;
    (async () => {
      try {
        let w: any = null;
        try {
          w = JSON.parse(localStorage.getItem("cache_whoami") || "null");
        } catch {}
        if (!w) {
          try {
            w = await syncEngine.sync("whoami");
          } catch {
            w = null;
          }
        }
        if (w && !w.error) {
          localStorage.setItem("cache_whoami", JSON.stringify(w));
          const profile = {
            regNo: w.regNo,
            name: w.name,
            email: w.email,
            mobile: w.mobile,
            dob: w.dob,
            gender: w.gender,
            bloodGroup: w.bloodGroup,
            photoBase64: w.photoBase64,
            isHosteller: w.isHosteller,
            program: w.program,
            nationality: w.nationality,
            nativeLanguage: w.nativeLanguage,
            nativeState: w.nativeState,
            community: w.community,
            religion: w.religion,
            caste: w.caste,
            physicallyChallenged: w.physicallyChallenged,
            aadharNumber: w.aadharNumber,
            currentAddress: w.currentAddress,
            permanentAddress: w.permanentAddress,
            father: w.father,
            mother: w.mother,
            guardian: w.guardian,
            proctor: w.proctor,
            hodDean: w.hodDean,
          };
          setProfileData(profile as any);
          localStorage.setItem("profile", JSON.stringify(profile));
          updatePostHogPersonName();
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    })();
  }, [creds]);

  const autoInferred = useRef(false);
  useEffect(() => {
    if (!profileData || autoInferred.current) return;
    autoInferred.current = true;
    if (profileData.isHosteller === false && residentialStatus === "hosteller") {
      setResidentialStatus("dayscholar");
    }
    try {
      const transportData = JSON.parse(localStorage.getItem("transportData") || "null");
      if (transportData?.hasRegistration === true) {
        setIsDayscholarWithBus(true);
        if (residentialStatus === "hosteller") setResidentialStatus("dayscholar");
      }
    } catch (_) {}
  }, [profileData]);

  // Unified available sections
  // Sync modes live inside Sync (a drill-down), not as a second hub entry.
  const availableSections = useMemo(() => SECTIONS.filter((s) => s.id !== "sync-modes"), []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return availableSections;
    const q = searchQuery.toLowerCase().trim();
    return availableSections.filter(
      (s) =>
        s.label.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
    );
  }, [availableSections, searchQuery]);

  /**
   * The one value that summarises each section, shown on the right of its hub
   * row — the same slot the course overview fills with a grade or a test count.
   *
   * Without it a settings row is a label, a subtitle and a chevron, which says
   * nothing about what is currently set. With it you can read the term, the
   * theme, the sync cadence and the sign-in state without opening a section.
   */
  const sectionSummary = useMemo((): Record<SectionId, { value: string; tone?: "emerald" | "amber" | "red" }> => {
    const sync = settings?.autoSyncInterval || "off";
    return {
      profile: { value: unifiedIdentity.programme || profileData?.branch || "" },
      credentials: isLoggedIn ? { value: "Active", tone: "emerald" } : { value: "Signed out", tone: "red" },
      preferences: {
        // A pinned "System" is worth showing as such rather than as the theme
        // the OS happens to be in right now.
        value:
          (theme ?? resolvedTheme) === "system"
            ? "System"
            : (resolvedTheme ?? theme) === "night"
              ? "Night"
              : (resolvedTheme ?? theme) === "dark"
                ? "Dark"
                : "Light",
      },
      academic: { value: semesterLabel(currSemesterID) },
      sync: {
        value: `${(resolveMode(settings?.defaultSyncMode || "quarterly", customSyncModes)?.label ?? "Quarterly").replace(/ Sync$/, "")} · ${
          sync === "off" ? "manual" : sync === "15m" ? "15 min" : sync === "30m" ? "30 min" : "hourly"
        }`,
      },
      "sync-modes": {
        value: `${resolveMode(settings?.defaultSyncMode || "quarterly", customSyncModes)?.label ?? "Quarterly Sync"}${customSyncModes.length > 0 ? ` · ${customSyncModes.length} custom` : ""}`,
      },
      navigation: {
        value: `${(settings?.pinnedNavTabs ?? []).length} pinned`,
      },
      advanced: {
        value: apiChoice === "backup" ? "Mirror API" : apiChoice === "custom" ? "Custom API" : "Default API",
      },
      about: { value: "v3.2.0" },
    };
  }, [
    settings?.autoSyncInterval,
    settings?.defaultSyncMode,
    customSyncModes,
    settings?.pinnedNavTabs,
    isLoggedIn,
    theme,
    resolvedTheme,
    currSemesterID,
    profileData?.branch,
    unifiedIdentity.programme,
    apiChoice,
  ]);

  const credAccounts =
    credData?.credentials ||
    credData?.tables?.[0]?.rows?.map((r: any) => {
      const h = credData.tables[0].headers || [];
      return {
        account: r[h[0]] || "",
        username: r[h[1]] || "",
        defaultCredentials: r[h[2]] || "",
        url: r[h[3]] || "",
        venueDate: r[h[4]] || "",
        seatLocation: r[h[5]] || "",
      };
    }) ||
    [];

  /* ─────────────────────────────────────────────────────────────
     RENDER: Category Specific Setting Blocks
  ───────────────────────────────────────────────────────────── */

  // 1. Student Info Section
  const renderProfileContent = () => (
    <div className="space-y-6">
      {/* Identity header. This was the page-level "Top Profile Summary Header
          Card" that sat above every settings screen — a photo, a name, a branch,
          a residential badge, two quick actions and the search field, all of it
          repeated over Appearance, Academic, Sync, Advanced and About.

          It belonged here. The name is also editable here, the photo obeys the
          same `showProfilePhoto` privacy switch, and the Shortcuts / Sign Out
          buttons it carried already exist on the settings hub — so removing it
          lost no action, only the repetition. */}
      <div className="brutal-card brutal-card-hero relative rounded-[16px] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          {displayProfileImage && (unifiedIdentity.photo || profileData?.image) ? (
            <div data-private="identity" className="privacy-photo shrink-0">
              <img
                loading="lazy"
                decoding="async"
                src={unifiedIdentity.photo || profileData.image}
                alt="Profile"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover shadow-sm ring-2 ring-border-ink border-2 border-border-ink"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] border-[3px] border-border-ink bg-ochre font-display text-2xl font-bold text-obsidian shadow-brutal-sm sm:h-18 sm:w-18"
            >
              {/* Initials from the name (it showed "2", the first digit of the
                  registration number, when no nickname was set). */}
              {(() => {
                const name = resolvedFriendlyName || unifiedIdentity.name || "";
                const letters = name
                  .split(/\s+/)
                  .filter((w) => /^[A-Za-z]/.test(w))
                  .map((w) => w[0].toUpperCase());
                return letters.length ? letters.slice(0, 2).join("") : "ST";
              })()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempFriendlyName}
                  onChange={(e) => setTempFriendlyName(e.target.value)}
                  placeholder="Preferred name..."
                  className="px-3 py-1.5 text-sm font-bold border-2 border-border-ink bg-surface rounded-xl text-text-heading focus:outline-none focus:ring-2 focus:ring-border-ink"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setFriendlyName(tempFriendlyName);
                      setIsEditingName(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setFriendlyName(tempFriendlyName);
                    setIsEditingName(false);
                  }}
                  className="bg-primary hover:brightness-110 text-primary-foreground py-1.5 h-auto rounded-xl"
                >
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  data-private="identity"
                  className="text-xl sm:text-2xl font-bold text-text-heading font-outfit tracking-tight truncate"
                >
                  {resolvedDisplayName}
                </h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded-lg text-text-muted text-primary hover:brightness-95 transition-colors cursor-pointer"
                  title="Edit Preferred Name"
                  aria-label="Edit preferred name"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted font-medium">
              <span
                data-private="id"
                className="px-2 py-0.5 rounded-md bg-surface-secondary font-mono text-xs font-bold text-text-primary"
              >
                {resolvedUsername}
              </span>
              {(unifiedIdentity.programme || profileData?.branch) && (
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {unifiedIdentity.programme || profileData.branch}
                </span>
              )}
              {unifiedIdentity.school && (
                <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-xs font-semibold text-text-muted">
                  {unifiedIdentity.school}
                </span>
              )}
              {profileData?.isHosteller !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-semibold text-xs">
                  {profileData.isHosteller ? "Hosteller" : "Day Scholar"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {creds && (
        <>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">
              Academic & Identity Status
            </h3>
            <ProfileStatusCards creds={creds} refreshKey={refreshKey} onCardClick={handleCardClick} />
          </div>

          <AcknowledgementCards creds={creds} refreshKey={refreshKey} />

          {profileImages?.proctor && (
            <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 sm:p-6 space-y-4 shadow-2xs">
              <h3 className="font-display text-base font-bold uppercase text-text-heading">
                Faculty Mentors & Leadership
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    role: "Proctor",
                    photo: profileImages.proctor.photoBase64,
                    details: profileImages.proctor.details || {},
                  },
                  ...(profileImages.hodDean?.people?.map((p: any) => ({
                    role: p.role,
                    photo: p.photoBase64,
                    details: p.details || {},
                  })) || []),
                ].map((person, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-secondary p-4 sm:p-5 rounded-2xl border-2 border-border-ink flex items-start gap-4"
                  >
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.role}
                        loading="lazy"
                        decoding="async"
                        className="w-14 h-14 rounded-2xl object-cover shadow-xs border-2 border-border-ink shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center shadow-xs shrink-0">
                        <User size={24} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-0.5">
                        {person.role}
                      </span>
                      <p className="font-bold text-sm text-text-heading truncate font-outfit">
                        {person.details.name || "N/A"}
                      </p>
                      {person.details.designation && (
                        <p className="text-xs text-text-muted truncate mt-0.5">{person.details.designation}</p>
                      )}
                      <div className="mt-3 space-y-1 text-xs text-text-muted border-t border-border-ink pt-2">
                        {Object.entries(person.details)
                          .filter(([k]) => k !== "name" && k !== "designation")
                          .map(([k, val]) => (
                            <div key={k} className="truncate text-xs">
                              <span className="capitalize font-semibold text-text-muted">
                                {k.replace(/([A-Z])/g, " $1").trim()}:{" "}
                              </span>
                              <span className="font-medium text-text-primary">{String(val)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Personal Info Grid */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 sm:p-6 space-y-6 shadow-2xs">
        {[
          unifiedIdentity.school,
          unifiedIdentity.programme,
          unifiedIdentity.campus,
          unifiedIdentity.email,
          unifiedIdentity.phone,
          profileData?.nativeLanguage,
          profileData?.nationality,
          profileData?.community,
          profileData?.aadharNumber,
          profileData?.mobileNumber,
        ].some(Boolean) && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold uppercase text-text-heading">Personal Information</h3>
              <p className="text-xs text-text-muted">Official profile records retrieved from university portal</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              {[
                ["School", unifiedIdentity.school || profileData?.school],
                ["Programme", unifiedIdentity.programme || profileData?.branch || profileData?.programme],
                ["Campus", unifiedIdentity.campus || profileData?.campus],
                ["Native Language", profileData?.nativeLanguage],
                ["Native State", profileData?.nativeState],
                ["Nationality", profileData?.nationality],
                ["Community", profileData?.community],
                ["Religion", profileData?.religion],
                ["Caste", profileData?.caste],
                ["Physically Challenged", profileData?.physicallyChallenged],
                ["Mobile Number", unifiedIdentity.phone || profileData?.mobileNumber],
                ["Email", unifiedIdentity.email || profileData?.email],
                ["Friend Mobile", profileData?.friendMobileNumber],
                ["Aadhar Number", profileData?.aadharNumber],
                ["Blood Group", unifiedIdentity.bloodGroup || profileData?.bloodGroup],
                [
                  "Hostel Status",
                  profileData?.isHosteller
                    ? `${hostelInfo?.blockName || "Hostel"} - Room ${hostelInfo?.roomNo || "N/A"}`
                    : "Day Scholar",
                ],
              ]
                .filter(([, v]) => v)
                .map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="p-3.5 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-1"
                  >
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{String(label)}</p>
                    <p
                      data-private="identity"
                      className="font-bold text-xs sm:text-sm text-text-primary break-words font-outfit"
                    >
                      {String(val)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {(profileData?.currentAddress || profileData?.permanentAddress) && (
          <div className="space-y-4 border-t border-border-ink pt-5">
            <div>
              <h3 className="font-display text-base font-bold uppercase text-text-heading">Address Records</h3>
              <p className="text-xs text-text-muted">Registered residential and communication addresses</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileData.currentAddress && (
                <div className="bg-surface-secondary p-4 sm:p-5 rounded-2xl border-2 border-border-ink space-y-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Current Address</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(profileData.currentAddress)
                      .filter(([, v]) => v)
                      .map(([k, val]) => (
                        <div key={k}>
                          <p className="text-xs text-text-muted capitalize mb-0.5">{k}</p>
                          <p className="font-bold text-text-primary break-words">{String(val)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {profileData.permanentAddress && (
                <div className="bg-surface-secondary p-4 sm:p-5 rounded-2xl border-2 border-border-ink space-y-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Permanent Address</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(profileData.permanentAddress)
                      .filter(([, v]) => v)
                      .map(([k, val]) => (
                        <div key={k}>
                          <p className="text-xs text-text-muted capitalize mb-0.5">{k}</p>
                          <p className="font-bold text-text-primary break-words">{String(val)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 2. VTOP Credentials & Security Section
  const renderCredentialsContent = () => (
    <div className="space-y-6">
      {/* HERO — who is signed in, and how many portals follow */}
      <div className="summary-row grid grid-cols-2 gap-3 sm:gap-4">
        <StatTile
          label="Signed in as"
          value={username || "—"}
          badge="VTOP"
          tone="neutral"
          sub="active portal session"
        />
        <StatTile
          label="Linked accounts"
          value={credAccounts.length}
          badge="Portals"
          tone="indigo"
          sub={
            credAccounts.length === 0
              ? "none synced yet"
              : `${credAccounts.length} portal${credAccounts.length === 1 ? "" : "s"} synced`
          }
        />
      </div>

      {/* Stored logins — editable, on this device */}
      <div className="space-y-3">
        <SectionHeader icon={Shield} title="Stored logins" count={3} />
        <p className="px-1 -mt-1 text-xs leading-relaxed text-text-muted font-medium">
          Saved encrypted on this device so you stay signed in. When you sign in or sync, they are sent to VTOP through
          the AmazeCC server, which does not keep them.
        </p>
        <div className={TILE_CARD}>
          <p className="text-sm font-bold text-text-heading font-outfit tracking-tight mb-3">VTOP portal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                VTOP registration / username
              </span>
              <input
                type="text"
                value={changedUsername}
                onChange={(e) => setChangedUsername(e.target.value)}
                className={FIELD_INPUT}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">VTOP password</span>
              <span className="relative block">
                <input
                  type={showAppPassword ? "text" : "password"}
                  value={changedPassword}
                  onChange={(e) => setChangedPassword(e.target.value)}
                  className={`${FIELD_INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowAppPassword(!showAppPassword)}
                  title={showAppPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted p-1 cursor-pointer"
                >
                  {showAppPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </label>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setPassword([changedUsername, changedPassword]);
                alert("Credentials saved locally!");
              }}
              disabled={!changedUsername || !changedPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save stored credentials
            </button>
          </div>
        </div>
        <div className={TILE_CARD}>
          <p className="text-sm font-bold text-text-heading font-outfit tracking-tight mb-3">LMS (Moodle)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">LMS username</span>
              <input
                type="text"
                value={lmsUsername}
                onChange={(e) => setLmsUsername(e.target.value)}
                placeholder="e.g. 22BCE1234"
                className={FIELD_INPUT}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">LMS password</span>
              <span className="relative block">
                <input
                  type={showLmsPassword ? "text" : "password"}
                  value={lmsPassword}
                  onChange={(e) => setLmsPassword(e.target.value)}
                  className={`${FIELD_INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowLmsPassword(!showLmsPassword)}
                  title={showLmsPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted p-1 cursor-pointer"
                >
                  {showLmsPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </label>
          </div>

          <div className="mt-4">
            <GhostButton onClick={saveLms} title="Save LMS credentials">
              <Save className="w-3.5 h-3.5" />
              {lmsSaved ? "Saved!" : "Save LMS credentials"}
            </GhostButton>
          </div>
          <p className="mt-3 text-xs text-text-secondary dark:text-text-muted font-medium">
            Used for course materials and deadline tracking. The app reloads once after saving so the new login takes
            effect.
          </p>
        </div>
        <div className={TILE_CARD}>
          <p className="text-sm font-bold text-text-heading font-outfit tracking-tight mb-3">Koha library</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">Card number</span>
              <input
                type="text"
                value={kohaCard}
                onChange={(e) => setKohaCard(e.target.value)}
                placeholder="e.g. 22BCE1234"
                className={FIELD_INPUT}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">Library password</span>
              <input
                type="password"
                value={kohaPassword}
                onChange={(e) => setKohaPassword(e.target.value)}
                placeholder="Library password"
                className={FIELD_INPUT}
              />
            </label>
          </div>

          <div className="mt-4">
            <GhostButton onClick={saveKoha} title="Save library credentials">
              <Save className="w-3.5 h-3.5" />
              {kohaSaved ? "Saved!" : "Save library credentials"}
            </GhostButton>
          </div>
        </div>
      </div>

      <p className="px-1 -mt-3 text-xs leading-relaxed text-text-muted font-medium">
        These are the logins VTOP itself reports for your account — read live from your session, never stored.
      </p>

      {/* Linked portal accounts */}
      <div className="space-y-3">
        <SectionHeader
          icon={Key}
          title="Linked portal accounts"
          count={credAccounts.length}
          right={
            <GhostButton onClick={handleRefreshCreds} title="Sync portal keys">
              <RefreshCcw className={`w-3.5 h-3.5 ${refreshingCreds ? "animate-spin" : ""}`} />
              {refreshingCreds ? "Syncing" : "Sync"}
            </GhostButton>
          }
        />

        {credAccounts.length === 0 ? (
          <EmptyPanel
            icon={<Key className="w-7 h-7" />}
            tone="indigo"
            variant="dashed"
            title="No linked accounts yet"
            description="Pull your portal keys from VTOP and every login it reports for you will collect here."
            action={
              <button
                type="button"
                onClick={handleRefreshCreds}
                disabled={refreshingCreds}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshingCreds ? "animate-spin" : ""}`} />
                Sync portal keys
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {credAccounts.map((row: any, idx: number) => {
              const accountName = row.account || "Portal Account";
              const userName = row.username || "";
              const pass = row.defaultCredentials || "";
              const url = row.url || "";

              return (
                <div key={idx} className={`${TILE_CARD} space-y-3`}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center ${TONE_ICON_TILE.indigo}`}
                    >
                      <User className="w-4 h-4" />
                    </span>
                    <p className="text-sm font-bold text-text-heading truncate font-outfit tracking-tight flex-1 min-w-0">
                      {accountName}
                    </p>
                    {userName && (
                      <IconButton title="Copy username" onClick={() => copyToClipboard(userName)}>
                        <Copy className="w-3.5 h-3.5" />
                      </IconButton>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <KeyValue
                      label="Username"
                      value={userName || "—"}
                      valueClassName="font-mono text-xs truncate block"
                    />
                    {pass && (
                      <div className="flex items-stretch gap-2">
                        <div className="flex-1 min-w-0">
                          <KeyValue
                            label="Password"
                            value={showPasswords[idx] ? pass : "••••••••"}
                            valueClassName="font-mono text-xs truncate block"
                          />
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <IconButton
                            title={showPasswords[idx] ? "Hide password" : "Show password"}
                            onClick={() => toggleShow(idx)}
                          >
                            {showPasswords[idx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </IconButton>
                          <IconButton title="Copy password" onClick={() => copyToClipboard(pass)}>
                            <Copy className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {url && url !== "-" && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-primary hover:underline font-medium truncate"
                    >
                      {url}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="space-y-3">
        <SectionHeader icon={LogOut} title="Sign out & end session" />
        <p className="px-1 -mt-1 text-xs leading-relaxed text-text-muted font-medium">
          Two ways to sign out of this device. Both remove your saved logins.
        </p>
        <div className={TILE_CARD}>
          <div className="flex items-center gap-3">
            <span
              className={`h-10 w-10 shrink-0 rounded-2xl border flex items-center justify-center ${TONE_ICON_TILE.amber}`}
            >
              <KeyRound className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-heading font-outfit tracking-tight">Forget my logins</p>
              <p className="text-xs text-text-secondary dark:text-text-muted font-medium mt-0.5">
                Removes your VTOP, Moodle, library and VITOL logins from this device. Your tasks, FFCS plans, friends
                and settings stay here for next time.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleForgetCredentials}
              className="inline-flex items-center gap-2 rounded-xl border border-border-ink bg-warning-surface px-4 py-2.5 text-sm font-bold text-warning-foreground transition-colors hover:bg-warning-surface cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Forget logins and sign out
            </button>
          </div>
        </div>
        <div className={TILE_CARD}>
          <div className="flex items-center gap-3">
            <span
              className={`h-10 w-10 shrink-0 rounded-2xl border flex items-center justify-center ${TONE_ICON_TILE.red}`}
            >
              <LogOut className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-heading font-outfit tracking-tight">
                Sign out and clear everything
              </p>
              <p className="text-xs text-text-secondary dark:text-text-muted font-medium mt-0.5">
                Removes your logins and everything AmazeCC has stored on this device, including tasks and FFCS plans.
                Only your theme is kept.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleLogOutRequest}
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border-2 border-border-ink bg-danger-surface px-4 py-2.5 text-sm font-bold text-danger-foreground transition-colors hover:brightness-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out and clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 2. Appearance & Theme Section
  const selectedPrivacyCategories = privacyCategories(settings);
  const privacyCoverageLabel =
    selectedPrivacyCategories.length === 0
      ? "Nothing covered"
      : selectedPrivacyCategories.length === PRIVACY_CATEGORIES.length
        ? "Everything covered"
        : selectedPrivacyCategories.length === 1
          ? PRIVACY_CATEGORY_DETAILS[selectedPrivacyCategories[0]].label
          : `${PRIVACY_CATEGORY_DETAILS[selectedPrivacyCategories[0]].label} +${selectedPrivacyCategories.length - 1}`;

  const renderPreferencesContent = () => (
    <div className="space-y-6">
      {/* Theme & Layout Card */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-5 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Theme & timetable</h3>

        {/* Theme Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Theme Mode</p>
            <p className="text-xs text-text-muted">Light, Dark, or Night (pitch black, easiest on the eyes at night)</p>
          </div>
          <SegmentedControl
            grow
            className="w-full shrink-0 sm:w-72"
            value={theme === "night" ? "night" : theme === "dark" ? "dark" : "light"}
            onChange={(v) => handleThemeChange(v as string)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "night", label: "Night" },
            ]}
          />
        </div>

        {/* Timetable Pill Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Timetable Class Density</p>
            <p className="text-xs text-text-muted">Choose between compact 2-line cards or spacious multi-line cards</p>
          </div>
          <SelectField
            value={(settings?.timetablePillStyle as string) || "compact"}
            onChange={(val) => updateSetting("timetablePillStyle", val)}
            options={[
              { value: "compact", label: "Compact (2-Line Info + Percentage on Right)" },
              { value: "detailed", label: "Detailed (Spacious Multi-line Card)" },
            ]}
            className="shrink-0"
          />
        </div>

        {/* Timetable Grid Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Timetable Grid Layout</p>
            <p className="text-xs text-text-muted">
              Auto uses the vertical day-by-time heatmap on phones and the full grid on larger screens
            </p>
          </div>
          <SelectField
            value={(settings?.timetableViewMode as string) || "auto"}
            onChange={(val) => updateSetting("timetableViewMode", val)}
            options={[
              { value: "auto", label: "Auto (recommended)" },
              { value: "vertical", label: "Vertical Heatmap (Days × Times)" },
              { value: "horizontal", label: "Full Grid (Days × Periods)" },
            ]}
            className="shrink-0"
          />
        </div>

        {/* Vertical Grid Cell Density */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Vertical Grid Cell Density</p>
            <p className="text-xs text-text-muted">
              Compact shows the slot only and fits the whole week on screen without swiping — phones default to it until
              you pick
            </p>
          </div>
          <SelectField
            value={effectiveCellDensity(settings?.timetableCellDensity, settings?.timetableDensityTouched, isMobile)}
            onChange={(val) => setTimetableDensity(val as "full" | "compact")}
            options={[
              { value: "full", label: "Full (Slot + Course Code)" },
              { value: "compact", label: "Compact (Slot Only, Fits Screen)" },
            ]}
            className="shrink-0"
          />
        </div>

        {/* Tasks Placement on Home */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Home Tasks Placement</p>
            <p className="text-xs text-text-muted">
              Display task badges inline with timetable classes or in a dedicated section below
            </p>
          </div>
          <SelectField
            value={settings?.tasksInlineOnHome !== false ? "inline" : "separate"}
            onChange={(val) => updateSetting("tasksInlineOnHome", val === "inline")}
            options={[
              { value: "inline", label: "Inline (3rd line on each class)" },
              { value: "separate", label: "Clean classes (Section below timetable)" },
            ]}
            className="shrink-0"
          />
        </div>
      </div>

      {/* Privacy & Visibility Toggles Card */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-4 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Home, privacy & sound</h3>

        <div className="divide-y divide-border-ink ">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Privacy mode</p>
              <p className="text-xs text-text-muted">
                Hides your CGPA by default; choose more under Private values. Shortcut: Alt/Option + P
              </p>
            </div>
            <Switch
              label="Privacy mode"
              checked={selectedPrivacyCategories.length > 0}
              onCheckedChange={(val) => setSettings((prev: any) => setPrivacyMode(prev, val))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Cover style</p>
              <p className="mt-0.5 text-xs text-text-muted">Comic is text; Marker is an opaque scribble.</p>
            </div>
            <SelectField
              aria-label="Cover style"
              value={settings?.privacyCoverStyle ?? "comic"}
              onChange={(style) => updateSetting("privacyCoverStyle", style as "comic" | "marker")}
              options={[
                { value: "comic", label: "Comic  #@%!" },
                { value: "marker", label: "Marker" },
              ]}
              searchable={false}
              className="w-36 shrink-0"
            />
          </div>

          <div className="py-3">
            <details className="group relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-[10px] border-2 border-border-ink bg-surface-secondary px-3 text-sm font-bold text-text-primary shadow-brutal-sm [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 truncate">Private values: {privacyCoverageLabel}</span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              <div className="mt-2 divide-y-2 divide-border-ink overflow-hidden rounded-[10px] border-2 border-border-ink bg-surface shadow-brutal-sm">
                {PRIVACY_CATEGORIES.map((category) => {
                  const detail = PRIVACY_CATEGORY_DETAILS[category];
                  return (
                    <div key={category} className="flex items-center justify-between gap-4 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary">{detail.label}</p>
                        <p className="text-xs text-text-muted">{detail.description}</p>
                      </div>
                      <Switch
                        label={`Cover ${detail.label}`}
                        checked={selectedPrivacyCategories.includes(category)}
                        onCheckedChange={(val) =>
                          setSettings((prev: any) => togglePrivacyCategory(prev, category, val))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </details>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Remove the CGPA card from Home</p>
              <p className="text-xs text-text-muted">
                When CGPA is hidden in Privacy Mode, Home leaves the card out instead of covering it
              </p>
            </div>
            <Switch
              label="Remove the CGPA card from Home"
              checked={settings?.privacyRemoveCgpaCard !== false}
              onCheckedChange={(val) => updateSetting("privacyRemoveCgpaCard", val)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Show GPA on Home</p>
              <p className="text-xs text-text-muted">
                Display cumulative CGPA score cards on the home page and sidebar
              </p>
            </div>
            <Switch checked={settings?.showGpa ?? false} onCheckedChange={(val) => updateSetting("showGpa", val)} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Show Profile Photo</p>
              <p className="text-xs text-text-muted">
                Render student avatar in headers, navigation rails, and profile cards
              </p>
            </div>
            <Switch
              checked={settings?.showProfilePhoto ?? false}
              onCheckedChange={(val) => updateSetting("showProfilePhoto", val)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Sound & Action Audio</p>
              <p className="text-xs text-text-muted">
                Play subtle audio feedback when completing tasks or toggling states
              </p>
            </div>
            <Switch
              checked={settings?.soundEnabled ?? true}
              onCheckedChange={(val) => updateSetting("soundEnabled", val)}
            />
          </div>
        </div>
      </div>

      {/* App Icon Card */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-4 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Application Icon</h3>
        <p className="text-xs text-text-muted">Choose which icon is displayed across header brandings</p>

        <div className="flex gap-4 pt-1">
          <button
            onClick={() => handleIconChange("default")}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
              appIcon === "default"
                ? "border-border-ink bg-secondary ring-1 ring-border-ink"
                : "border-border-ink hover:bg-surface-hover"
            }`}
          >
            <img
              loading="lazy"
              decoding="async"
              src={getAssetPath("/logo.png")}
              alt="Default Icon"
              className="w-12 h-12 rounded-xl shadow-xs object-cover"
            />
            <span className="text-xs font-bold text-text-primary">Default</span>
          </button>
          <button
            onClick={() => handleIconChange("fire")}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
              appIcon === "fire"
                ? "border-border-ink bg-secondary ring-1 ring-border-ink"
                : "border-border-ink hover:bg-surface-hover"
            }`}
          >
            <img
              loading="lazy"
              decoding="async"
              src={getAssetPath("/images/icons/fire.png")}
              alt="Fire Icon"
              className="w-12 h-12 rounded-xl shadow-xs object-cover"
            />
            <span className="text-xs font-bold text-text-primary">Fire</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 3. Academic & Schedule Section
  const renderAcademicContent = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-5 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Semester & Terms</h3>

        {/* Active Semester Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Active Semester</p>
            <p className="text-xs text-text-muted">Select term to fetch attendance, marks, and timetable</p>
          </div>
          <div className="flex gap-2 w-full sm:w-80 shrink-0">
            <SelectField
              value={selectedSemester}
              onChange={(val) => setSelectedSemester(val)}
              options={(config.semesterIDs ?? []).map((id: string) => ({
                value: id,
                label: semesterLabel(id),
              }))}
              searchable
              className="flex-1 sm:w-auto"
            />
            <Button
              onClick={handleSaveSemester}
              disabled={!selectedSemester || selectedSemester === currSemesterID}
              className="bg-primary hover:brightness-110 text-primary-foreground text-xs px-3.5 py-2 rounded-xl"
            >
              <Save size={14} className="mr-1.5" /> Save
            </Button>
          </div>
        </div>

        {/* Academic Calendar Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Academic Calendar</p>
            <p className="text-xs text-text-muted">Default calendar scheme for exam dates and working days</p>
          </div>
          <SelectField
            value={calendarType || "ALL"}
            onChange={(val) => setCalendarType(val)}
            options={[
              { value: "ALL", label: "General Semester" },
              { value: "ALL02", label: "General Flexible" },
              { value: "ALL03", label: "General Freshers" },
              { value: "ALL05", label: "General LAW" },
              { value: "ALL06", label: "Flexible Freshers" },
              { value: "ALL08", label: "Cohort LAW" },
              { value: "ALL11", label: "Flexible Research" },
              { value: "WEI", label: "Weekend Intra Semester" },
            ]}
            className="sm:w-80 shrink-0"
          />
        </div>

        {/* Target Attendance Threshold */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Target Attendance Goal</p>
            <p className="text-xs text-text-muted">Target threshold for safe bunk margin calculations</p>
          </div>
          <SelectField
            value={String(settings?.targetAttendance ?? 75)}
            onChange={(val) => updateSetting("targetAttendance", parseInt(val, 10))}
            options={[
              { value: "75", label: "75% (Standard Exam Eligibility)" },
              { value: "80", label: "80% (Safety Buffer)" },
              { value: "85", label: "85% (Bus Registration / Dayscholar Goal)" },
              { value: "90", label: "90% (Distinction Honor Target)" },
            ]}
            className="sm:w-80 shrink-0"
          />
        </div>

        {/* Precision Decimal Toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-bold text-text-primary">Use One Decimal Place</p>
            <p className="text-xs text-text-muted">Round attendance stats and scores to 1 decimal place instead of 2</p>
          </div>
          <Switch checked={decimalValues} onCheckedChange={setDecimalValues} />
        </div>
      </div>

      {/* Pomodoro Focus & Study Defaults */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-4 shadow-2xs">
        <div>
          <h3 className="font-display text-base font-bold uppercase text-text-heading">Focus timer</h3>
          <p className="text-xs text-text-muted">
            Customize default work interval, break lengths, and rounds for study sessions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
            <label htmlFor="pomodoro-focus" className="block text-xs font-bold text-text-primary mb-1">
              Focus Duration (min)
            </label>
            <input
              id="pomodoro-focus"
              type="number"
              min="5"
              max="120"
              value={settings?.taskPomodoroFocus || 25}
              onChange={(e) => updateSetting("taskPomodoroFocus", Math.max(5, Number(e.target.value)))}
              className="w-full text-xs font-bold rounded-lg bg-surface border-2 border-border-ink p-2 text-text-heading"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
            <label htmlFor="pomodoro-break" className="block text-xs font-bold text-text-primary mb-1">
              Break Duration (min)
            </label>
            <input
              id="pomodoro-break"
              type="number"
              min="1"
              max="60"
              value={settings?.taskPomodoroBreak || 5}
              onChange={(e) => updateSetting("taskPomodoroBreak", Math.max(1, Number(e.target.value)))}
              className="w-full text-xs font-bold rounded-lg bg-surface border-2 border-border-ink p-2 text-text-heading"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
            <label htmlFor="pomodoro-rounds" className="block text-xs font-bold text-text-primary mb-1">
              Default Rounds
            </label>
            <input
              id="pomodoro-rounds"
              type="number"
              min="1"
              max="16"
              value={settings?.taskPomodoroRounds || 4}
              onChange={(e) => updateSetting("taskPomodoroRounds", Math.max(1, Number(e.target.value)))}
              className="w-full text-xs font-bold rounded-lg bg-surface border-2 border-border-ink p-2 text-text-heading"
            />
          </div>
        </div>
      </div>

      {/* Residential & Hostel Card */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-4 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Residential Status & Mess</h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Hostel vs Day Scholar</p>
            <p className="text-xs text-text-muted">Affects mess menu shortcuts and gate pass integrations</p>
          </div>
          <div className="flex rounded-xl bg-surface-tertiary p-1 w-full sm:w-56 shrink-0">
            <button
              onClick={() => {
                setResidentialStatus("hosteller");
                setIsDayscholarWithBus(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                residentialStatus === "hosteller"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text-primary "
              }`}
            >
              Hosteller
            </button>
            <button
              onClick={() => setResidentialStatus("dayscholar")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                residentialStatus === "dayscholar"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text-primary "
              }`}
            >
              Dayscholar
            </button>
          </div>
        </div>

        {residentialStatus === "dayscholar" && (
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isDayscholarWithBus}
              onChange={(e) => setIsDayscholarWithBus(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-border-ink"
            />
            <span className="text-xs font-bold text-text-primary">Registered for University Transport / Bus</span>
          </label>
        )}

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-bold text-text-primary">Show only my mess menu</p>
            <p className="text-xs text-text-muted">Auto-select meal schedule based on current week of the month</p>
          </div>
          <Switch
            checked={settings?.smartMessFilter ?? false}
            onCheckedChange={(val) => updateSetting("smartMessFilter", val)}
          />
        </div>
      </div>
    </div>
  );

  // 4b. Sync Modes page: default picker plus the full editor inline.
  const renderSyncModesPage = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 shadow-2xs">
        <SyncCadenceGuide />
      </div>

      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-5 shadow-2xs">
        <div>
          <h3 className="font-display text-base font-bold uppercase text-text-heading">Default Sync Mode</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Used by the reload button, the sync sheet and the command palette. The starred mode below is the current
            default — picking here, starring a row, or tapping a mode in the sync sheet all change it.
          </p>
        </div>
        <SelectField
          value={settings?.defaultSyncMode || "quarterly"}
          onChange={(val) => updateSetting("defaultSyncMode", val)}
          options={listModes(customSyncModes).map((m) => ({
            value: m.id,
            label: m.builtIn ? m.label : `${m.label} (custom)`,
          }))}
        />
      </div>

      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 shadow-2xs">
        <SyncModeEditorContent
          onChanged={setCustomSyncModes}
          defaultId={settings?.defaultSyncMode || "quarterly"}
          onSetDefault={(id) => updateSetting("defaultSyncMode", id)}
          onRun={onRunSyncMode}
        />
      </div>
    </div>
  );
  // 4. Data Sync Section
  const renderSyncContent = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-ink pb-4">
          <div>
            <h3 className="font-display text-base font-bold uppercase text-text-heading">What to sync</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Choose which modules refresh automatically to conserve data and API limits
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleToggleAllSync(true)}
              className="min-h-9 rounded-[8px] border-2 border-border-ink px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] shadow-brutal-sm brutal-press cursor-pointer bg-secondary text-secondary-foreground"
            >
              Turn all on
            </button>
            <button
              onClick={() => handleToggleAllSync(false)}
              className="min-h-9 rounded-[8px] border-2 border-border-ink px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] shadow-brutal-sm brutal-press cursor-pointer bg-surface text-text-primary"
            >
              Turn all off
            </button>
          </div>
        </div>

        {/* Background Sync Frequency */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-secondary border-2 border-border-ink">
          <div>
            <p className="text-sm font-bold text-text-primary">Background Auto-Refresh</p>
            <p className="text-xs text-text-muted">
              When off, syncing only happens when you tap Sync — nothing hits the server otherwise. When a cadence is
              set, the sweep runs on that timer and pulls only what has come due (attendance at most once a day).
            </p>
          </div>
          <SelectField
            value={(settings?.autoSyncInterval as string) || "off"}
            onChange={(val) => updateSetting("autoSyncInterval", val)}
            options={[
              { value: "off", label: "Off (Sync Only When You Press It)" },
              { value: "15m", label: "Every 15 Minutes (Gated)" },
              { value: "30m", label: "Every 30 Minutes (Gated)" },
              { value: "1h", label: "Every 1 Hour (Gated)" },
            ]}
            className="shrink-0"
          />
        </div>

        {/* Sync mode: chosen and managed on the Sync modes page (one place). */}
        <button
          type="button"
          onClick={() => setScreen("sync-modes")}
          className="flex w-full items-center justify-between gap-3 rounded-[12px] border-2 border-border-ink bg-surface-secondary p-3.5 text-left shadow-brutal-sm brutal-press"
        >
          <span>
            <span className="block text-sm font-bold text-text-primary">Sync mode</span>
            <span className="block text-xs text-text-muted">
              What a sync pulls: daily, weekly, monthly, quarterly or your own mode.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 font-mono text-xs font-bold uppercase text-text-primary">
            {resolveMode(settings?.defaultSyncMode || "quarterly", customSyncModes)?.label ?? "Quarterly Sync"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </button>

        {/* Sync Toggles List */}
        <div className="divide-y divide-border-ink ">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Sync Profile & Hosteller Data</p>
              <p className="text-xs text-text-muted">Credentials, contact numbers, and hostel room information</p>
            </div>
            <Switch
              checked={settings?.syncProfileData ?? true}
              onCheckedChange={(val) => updateSetting("syncProfileData", val)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Sync extra records</p>
              <p className="text-xs text-text-muted">Turns the three below on or off together</p>
            </div>
            <Switch
              checked={settings?.syncAdditionalData ?? true}
              onCheckedChange={(val) => updateSetting("syncAdditionalData", val)}
            />
          </div>

          <div
            className={`flex items-center justify-between py-3 pl-5 border-l-2 border-border-ink ml-1 ${
              (settings?.syncAdditionalData ?? true) ? "" : "opacity-50"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-text-primary">Sync Extra-Curricular (EXC) Registration</p>
              <p className="text-xs text-text-muted">Clubs, chapters, and co-curricular credit allocations</p>
            </div>
            <Switch
              checked={settings?.syncExcRegistration ?? true}
              disabled={!(settings?.syncAdditionalData ?? true)}
              onCheckedChange={(val) => updateSetting("syncExcRegistration", val)}
            />
          </div>

          <div
            className={`flex items-center justify-between py-3 pl-5 border-l-2 border-border-ink ml-1 ${
              (settings?.syncAdditionalData ?? true) ? "" : "opacity-50"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-text-primary">Sync Minor & Honour Registrations</p>
              <p className="text-xs text-text-muted">Minor degrees and honour program course completions</p>
            </div>
            <Switch
              checked={settings?.syncMinorHonour ?? true}
              disabled={!(settings?.syncAdditionalData ?? true)}
              onCheckedChange={(val) => updateSetting("syncMinorHonour", val)}
            />
          </div>

          <div
            className={`flex items-center justify-between py-3 pl-5 border-l-2 border-border-ink ml-1 ${
              (settings?.syncAdditionalData ?? true) ? "" : "opacity-50"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-text-primary">Sync Course Completion Records</p>
              <p className="text-xs text-text-muted">Completed coursework and credit eligibility records</p>
            </div>
            <Switch
              checked={settings?.syncCourseCompletion ?? true}
              disabled={!(settings?.syncAdditionalData ?? true)}
              onCheckedChange={(val) => updateSetting("syncCourseCompletion", val)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Full reload on Sync</p>
              <p className="text-xs text-text-muted">
                Ignores the sync mode: every Sync pulls everything, past semesters included. Slow; for fixing bad data.
              </p>
            </div>
            <Switch checked={reloadAllData} onCheckedChange={setReloadAllData} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Low Data Saver Mode</p>
              <p className="text-xs text-text-muted">
                Disables automatic prefetching of heavy assets on metered connections
              </p>
            </div>
            <Switch
              checked={settings?.lowDataMode ?? false}
              onCheckedChange={(val) => updateSetting("lowDataMode", val)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // 5. Navigation & Mobile Section
  const renderNavigationContent = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-5 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Bottom bar shortcuts</h3>
        <p className="text-xs text-text-muted">
          Pin up to 4 custom shortcuts to your bottom navigation bar for quick access. Home is always present.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: "attendance", label: "Attendance" },
            { id: "academics", label: "Academics" },
            { id: "tools", label: "Tools Hub" },
            { id: "payments", label: "Payments" },
            { id: "libraries", label: "Libraries" },
            { id: "cabshare", label: "Cab Share" },
            { id: "transport", label: "Transport" },
            { id: "more", label: "More Hub" },
            { id: "profile", label: "Profile" },
            { id: "credentials", label: "Credentials" },
          ].map((tab) => {
            const pinned = settings?.pinnedNavTabs ?? [];
            const isPinned = pinned.includes(tab.id);
            const atLimit = !isPinned && pinned.length >= 4;

            return (
              <button
                key={tab.id}
                disabled={atLimit}
                onClick={() => {
                  const current = settings?.pinnedNavTabs ?? [];
                  const next = isPinned ? current.filter((id: string) => id !== tab.id) : [...current, tab.id];
                  updateSetting("pinnedNavTabs", next);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isPinned
                    ? "bg-primary border-border-ink text-primary-foreground shadow-xs"
                    : atLimit
                      ? "bg-surface-secondary border-border-ink text-text-muted cursor-not-allowed opacity-50"
                      : "bg-surface-secondary border-border-ink text-text-primary hover:border-border-ink"
                }`}
              >
                {isPinned && <Check className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Push Notifications Card */}
      <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-4 shadow-2xs">
        <h3 className="font-display text-base font-bold uppercase text-text-heading">Push Notifications</h3>
        <p className="text-xs text-text-muted">
          Receive exam reminders, attendance alerts, and moodle deadline notifications
        </p>
        <div className="pt-2">
          <PushNotificationManager />
        </div>
      </div>

      {/* Install — only rendered when the browser offers the prompt. */}
      <PwaInstallCard />
    </div>
  );

  // 6. Advanced & System Section
  const renderAdvancedContent = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border-2 border-border-ink divide-y divide-border-muted dark:divide-border-muted overflow-hidden shadow-2xs">
        {/* Local Storage — a drill-down, so it pushes a screen on the settings
            stack and inherits this page's header and back button, rather than
            opening an overlay with a second copy of both. */}
        <button
          type="button"
          onClick={() => screens.go("storage")}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="p-2.5 rounded-xl bg-secondary text-secondary-foreground shrink-0">
              <Database size={18} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-text-heading block">Local Storage Viewer</span>
              <span className="text-xs text-text-muted block truncate mt-0.5">
                Inspect raw client cache entries, tokens, and database keys
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </button>

        {/* API Endpoint */}
        <div className="p-4 space-y-3 bg-surface-secondary">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`p-2.5 rounded-xl border shrink-0 ${TONE_ICON_TILE.violet}`}>
              <Link2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-text-heading block">API Endpoint</span>
              <span className="text-xs text-text-muted block mt-0.5">
                Switch between the production API and its mirror
              </span>
            </div>
          </div>

          <SegmentedControl
            value={apiChoice}
            onChange={(choice) => {
              if (choice === "custom") {
                // Reveal the field first; applying an empty URL would just
                // drop the app back to primary and read as a no-op.
                setApiChoice("custom");
                return;
              }
              applyApiChoice(choice);
            }}
            options={[
              { value: "default", label: "Default" },
              ...(hasBackupApi() ? [{ value: "backup" as ApiHostChoice, label: "Mirror" }] : []),
              { value: "custom", label: "Custom" },
            ]}
          />

          {apiChoice === "custom" && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://api.amazecc.com"
                value={customApiInput}
                onChange={(e) => setCustomApiInput(e.target.value)}
                className={`${FIELD_INPUT} flex-1`}
              />
              <button
                type="button"
                onClick={saveCustomApiUrl}
                disabled={!customApiInput.trim()}
                className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:brightness-110 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}

          <p className="text-xs leading-relaxed text-text-secondary dark:text-text-muted font-medium">
            Active: <span className="font-mono">{getActiveApiUrl()}</span>
            {" · "}New requests use it immediately.
          </p>
        </div>

        {/* Backup Settings */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleExportSettings}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleExportSettings();
            }
          }}
          className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="p-2.5 rounded-xl bg-success-surface text-success-foreground shrink-0">
              <Save size={18} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-text-heading block">Backup / Export Settings</span>
              <span className="text-xs text-text-muted block truncate mt-0.5">
                Save application preferences, layout options, and custom name to file
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </div>

        {/* Restore Settings */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleImportSettings}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleImportSettings();
            }
          }}
          className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="p-2.5 rounded-xl bg-warning-surface text-warning-foreground shrink-0">
              <ExternalLink size={18} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-text-heading block">Restore / Import Settings</span>
              <span className="text-xs text-text-muted block truncate mt-0.5">
                Import and restore configuration from a settings backup JSON file
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </div>

        {/* Reset Cache */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleResetCache}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleResetCache();
            }
          }}
          className="flex items-center justify-between p-4 hover:bg-danger-surface transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="p-2.5 rounded-xl bg-danger-surface text-danger-foreground shrink-0">
              <RefreshCcw size={18} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-danger-foreground block">Reset Application Cache</span>
              <span className="text-xs text-danger-foreground block truncate mt-0.5">
                Clear all stored data, cached timetables, and reload fresh
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-danger-foreground shrink-0" />
        </div>
      </div>
    </div>
  );

  // 7. About & Community Section
  //
  // Was a hand-copy of the About tab: the same wordmark block, the same
  // quickLinks, the same changelog / hall-of-fame / GitHub / privacy / terms
  // rows, with its own version numbers that had already drifted out of date
  // (v3.2.0 / 2026.0816). It now renders `AboutBody` — the same body the About
  // tab shows — so the two cannot disagree, and the version comes from
  // `package.json` and the generated `buildInfo.json` once, in one place.
  const renderAboutContent = () => (
    <AboutBody
      setActiveSubpage={(page) => {
        if (page === "changelog") setShowChangelog(true);
        else if (page === "hallOfFame") setShowHallOfFame(true);
        else if (page === "team") setShowTeam(true);
      }}
    />
  );

  const getSectionContent = (id: SectionId) => {
    switch (id) {
      case "profile":
        return renderProfileContent();
      case "credentials":
        return renderCredentialsContent();
      case "preferences":
        return renderPreferencesContent();
      case "academic":
        return renderAcademicContent();
      case "sync":
        return renderSyncContent();
      case "sync-modes":
        return renderSyncModesPage();
      case "navigation":
        return renderNavigationContent();
      case "advanced":
        return renderAdvancedContent();
      case "about":
        return renderAboutContent();
      default:
        return null;
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MAIN RENDER
  ───────────────────────────────────────────────────────────── */

  return (
    /*
     * This wrapper exists only to host the overlay modals below, and to clear
     * the mobile bottom nav. It deliberately carries no horizontal padding and
     * no max-width.
     *
     * It used to be `px-3 sm:px-6 md:px-8 max-w-6xl mx-auto`, wrapped around a
     * `PageShell` that is *already* `max-w-4xl mx-auto` — so the settings
     * content was inset twice: once by the wrapper's own padding, and again by
     * centring a narrower column inside a wider capped one. Every other page
     * in the app (Event Hub, Club Hub, Free Classrooms) is mounted with no
     * padding and no width cap, and lets `PageShell` own the column, so this
     * now does too.
     *
     * `pb-16 md:pb-0` is the same single-source idea vertically: `PageShell`
     * already supplies `md:pb-8`, so the wrapper only adds clearance where
     * `PageShell` has none — on a phone, where the bottom nav would otherwise
     * sit over the last row.
     */
    <div className="w-full pb-16 md:pb-0">
      {/* Footer Modals */}
      {showChangelog && <ChangelogModal handleClose={() => setShowChangelog(false)} />}
      {showHallOfFame && <HallOfFameModal handleClose={() => setShowHallOfFame(false)} />}
      {showTeam && <TeamModal handleClose={() => setShowTeam(false)} />}

      {/* Detail sheets — bottom sheets instead of the desktop Modal so the
          full list works the same on a phone (swipe-down, system back, no
          centered dialog). */}
      {activeModal === "ept" && creds && (
        <BottomSheet
          onClose={closeModal}
          overlayId="profile-ept-schedule"
          maxWidth="max-w-2xl"
          title="EPT Schedule"
          closeLabel="Close EPT schedule"
        >
          <div className="space-y-4 pb-2">
            {(() => {
              let w: any = null;
              try {
                w = JSON.parse(localStorage.getItem("cache_whoami") || "null");
              } catch {}
              const ept = w?.eptSchedule;
              if (!ept) return <p className="text-sm text-text-muted">No EPT schedule data available.</p>;
              const msg = ept.message || ept.messages?.warning || ept.messages?.success;
              const tables = Array.isArray(ept.tables) ? ept.tables : [];
              if (tables.length === 0 && msg) {
                return (
                  <div className="p-4 rounded-xl bg-warning-surface text-warning-foreground border border-border-ink text-sm font-medium">
                    {msg}
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {msg && (
                    <div className="p-3 rounded-xl bg-warning-surface text-warning-foreground border border-border-ink text-sm">
                      {msg}
                    </div>
                  )}
                  {tables.map((t: any, ti: number) => {
                    const headers = t.headers || (t.rows?.[0] ? Object.keys(t.rows[0]) : []);
                    return (
                      <div key={ti} className="rounded-xl border-2 border-border-ink overflow-hidden">
                        {t.caption && (
                          <div className="px-3 py-2 text-xs font-semibold bg-surface-secondary border-b border-border-ink">
                            {t.caption}
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-surface-secondary">
                                {headers.map((h: string, i: number) => (
                                  <th
                                    key={i}
                                    className="px-3 py-2 text-left font-bold text-text-muted uppercase tracking-wider"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-ink ">
                              {(t.rows || []).map((row: any, ri: number) => (
                                <tr key={ri}>
                                  {headers.map((h: string, ci: number) => (
                                    <td key={ci} className="px-3 py-2 text-text-primary whitespace-nowrap">
                                      {row?.[h] ?? row?.[String(ci)] ?? "-"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </BottomSheet>
      )}
      {activeModal === "reg" && creds && (
        <BottomSheet
          onClose={closeModal}
          overlayId="profile-reg-schedule"
          maxWidth="max-w-sm"
          title="Registration Schedule"
          closeLabel="Close registration schedule"
        >
          <div className="space-y-4 pb-2">
            <RegistrationModalContent creds={creds} onClose={closeModal} />
          </div>
        </BottomSheet>
      )}
      {activeModal === "bank" && creds && (
        <BottomSheet
          onClose={closeModal}
          overlayId="profile-bank-info"
          maxWidth="max-w-md"
          title="Bank Information"
          closeLabel="Close bank information"
        >
          <div className="space-y-4 pb-2">
            <BankDayStatusModal endpoint="bank-info" title="Bank Info" creds={creds} />
          </div>
        </BottomSheet>
      )}
      {activeModal === "day" && creds && (
        <BottomSheet
          onClose={closeModal}
          overlayId="profile-dayboarder"
          maxWidth="max-w-md"
          title="Dayboarder Information"
          closeLabel="Close dayboarder information"
        >
          <div className="space-y-4 pb-2">
            <BankDayStatusModal endpoint="dayboarder" title="Dayboarder Info" creds={creds} />
          </div>
        </BottomSheet>
      )}

      {/* ── Settings: one hub → section flow for every breakpoint ──────────
          One `PageShell` for the whole flow, so the header — eyebrow, title,
          subtitle, back button — is described in one place and a section is
          genuinely a subpage of this page rather than a sibling screen with a
          second copy of the same chrome. `onBack` is only passed off the hub,
          which is what makes the back button appear at all. System back walks
          the same way via the overlay stack, so the two cannot disagree. */}
      {/* The section on show, or null on the hub. Looked up once so the header
          below does not repeat the same `find` for its title and its subtitle. */}
      {(() => {
        // Sections and drill-downs both title the header, so the lookup has to
        // span both. Doing it once here is what stops the header below repeating
        // the same two `find`s.
        const sec = activeSection ? SECTIONS.find((s) => s.id === activeSection) : null;
        const drill = activeSection && !sec ? DRILLDOWNS[activeSection] : undefined;
        return (
          <PageShell
            eyebrow="Settings"
            title={sec?.label ?? drill?.label ?? "Settings"}
            subtitle={sec ? sec.subtitle : drill ? drill.subtitle : "Categories, appearance, sync and account"}
            onBack={screens.canGoBack ? screens.back : undefined}
          >
            <SubpageScreen id={screens.screen}>
              {activeSection === null ? (
                /* `space-y-6` is load-bearing here, not decoration.
                 *
                 * `PageShell`'s own `space-y-6` only separates the header from
                 * the screen body — `SubpageScreen` itself is a bare animated
                 * wrapper with no spacing utility, so its children default to
                 * zero gap. That left the search field flush against the first
                 * section row and the shortcuts button flush against the last
                 * one, and because `LIST_SHELL` draws dividers between its rows
                 * it read as those controls being *part* of the list rather than
                 * beside it. Same rhythm as the rest of the page. */
                <div className="space-y-6">
                  {/* Search lives here, on the hub, and only here. It drives
                      `filteredSections`, which is read exclusively by the hub
                      branch — a section renders `getSectionContent` and never
                      consults it. While this field sat in the page-level header
                      it appeared over every section too, where typing into it
                      appeared to do nothing. */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search all settings, credentials, profile, themes, semesters..."
                      className="w-full pl-9 pr-4 py-2 text-xs font-medium border-2 border-border-ink bg-surface rounded-xl text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-ink transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 hit-expand p-1 text-text-muted hover:text-text-muted text-xs"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Cross-section search results, as the desktop rail used to do */}
                  {searchQuery.trim() ? (
                    <div className="space-y-8">
                      {filteredSections.map((sec) => (
                        <div key={sec.id} className="space-y-4">
                          <SectionHeader icon={sec.icon} title={sec.label} />
                          {getSectionContent(sec.id)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Rows, not tiles — the same `ListShell` / row / `ListRowText` /
                  value + chevron shape the course sub-page's overview uses
                  (`CourseDetailSubpage.tsx`). The 2-up tile grid this replaced
                  forced a line-clamped subtitle per card, truncated every
                  category name to three words on a phone, and had nowhere to put
                  the current value. */}
                      {/* The empty `ListShell` is only rendered when there is something
                  to put in it — otherwise a search with no hits drew a bare
                  2px-bordered box above the "no match" panel. */}
                      {filteredSections.length > 0 ? (
                        <ListShell>
                          {filteredSections.map((sec) => {
                            const Icon = sec.icon;
                            const summary = sectionSummary[sec.id];
                            return (
                              <button
                                key={sec.id}
                                type="button"
                                onClick={() => screens.go(sec.id)}
                                className={`${LIST_ROW} cursor-pointer active:bg-surface-secondary `}
                              >
                                <div
                                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${sec.iconBg} ${sec.iconColor}`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <ListRowText
                                  title={sec.label}
                                  subtitle={sec.subtitle}
                                  titleTag="h3"
                                  titleTooltip={sec.label}
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={cn(
                                      "text-sm font-bold font-outfit tracking-tight leading-none truncate max-w-24 sm:max-w-32",
                                      summary.tone === "emerald"
                                        ? "text-success-foreground"
                                        : summary.tone === "red"
                                          ? "text-danger-foreground"
                                          : summary.tone === "amber"
                                            ? "text-warning-foreground"
                                            : "text-text-primary",
                                    )}
                                  >
                                    {summary.value}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-text-muted" />
                                </div>
                              </button>
                            );
                          })}
                        </ListShell>
                      ) : (
                        <EmptyPanel
                          icon={<Search className="h-7 w-7" />}
                          title="No settings match"
                          description={`Nothing matches "${searchQuery}". Try a different word.`}
                        />
                      )}

                      {/* Quick actions */}
                      <div className="space-y-2">
                        <GhostButton onClick={onOpenShortcutsHelp} className="w-full justify-center py-2.5">
                          <Keyboard size={14} className="text-primary" />
                          <span>Keyboard Hotkeys &amp; Shortcuts</span>
                        </GhostButton>
                        <button
                          onClick={handleLogOutRequest}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger-surface border border-border-ink text-xs font-bold text-danger-foreground transition-colors cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Sign Out of Account</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : activeSection === "storage" ? (
                <LocalStorageSubpage />
              ) : (
                getSectionContent(activeSection)
              )}
            </SubpageScreen>
          </PageShell>
        );
      })()}
    </div>
  );
}
