"use client";

/**
 * The App Library portal. Navigation/search items come from the unified
 * module registry (`src/lib/navigation/registry.tsx`) so they stay in sync
 * with other surfaces (sidebar, command palette).
 */

import { moduleTone, type ToneName } from "@/lib/uiTokens";
import { memo, useEffect, useMemo, useState } from "react";
import SelectField from "../shared/primitives/SelectField";
import { formatSemesterName } from "@/lib/formatSemesterName";
import { ChevronRight, ExternalLink, Home, Moon, MoonStar, Sun } from "lucide-react";
import { BrandSheet as AppLibrary } from "../shared/primitives/BrandSheet";
import config from "../../../../config.json";
import {
  activateEntry,
  getModuleRegistry,
  quickPinTabs,
  type ModuleEntry,
  type NavContext,
} from "@/lib/navigation/registry";

const groupOrder = ["Study", "Campus", "Tools", "Account"] as const;

const AppLibraryPortal = memo(
  ({
    open,
    onClose,
    settings,
    setSettings,
    selectTab,
    setActiveAttendanceSubTab,
    setActiveToolsSubTab,
    setActiveSubTab,
    setHostelActiveSubTab,
    setActiveMoreSubTab,
    setActiveProfileSubTab,
    handleLogOutRequest,
    handleReloadRequest,
    isHosteller,
    residentialStatus,
    theme,
    handleThemeChange,
    openCommandPalette,
    tabIcons,
    togglePin,
  }: any) => {
    void setSettings;
    void openCommandPalette;
    void tabIcons;

    const [librarySearchQuery, setLibrarySearchQuery] = useState("");
    const [pendingSemester, setPendingSemester] = useState<string | null>(null);

    useEffect(() => {
      if (!open) {
        setLibrarySearchQuery("");
      }
    }, [open]);

    const ctx = useMemo<NavContext>(
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

    const registry = useMemo(() => getModuleRegistry(ctx), [ctx]);

    const runEntry = (entry: ModuleEntry) => {
      if (entry.target.kind === "panel") return;
      activateEntry(entry, ctx);
      onClose();
    };

    const commonNavEntries = useMemo(
      () =>
        registry.filter(
          (e) =>
            e.surfaces.sidebar === true ||
            e.surfaces.sidebar === "drill-in" ||
            e.surfaces.appLibraryPrimary ||
            e.surfaces.appLibrarySearch,
        ),
      [registry],
    );

    const primaryGroups = useMemo(() => {
      const items = registry.filter((e) => e.surfaces.appLibraryPrimary);
      return groupOrder
        .map((name) => ({ name, items: items.filter((e) => e.group === name) }))
        .filter((g) => g.items.length > 0);
    }, [registry]);

    // App library search shares all common enabled nav entries (sidebar + app library).
    const searchItems = useMemo(() => {
      const seen = new Set<string>();
      return commonNavEntries.filter((e) => {
        if (e.target.kind === "panel") return false; // panels are containers, not searchable destinations
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }, [commonNavEntries]);

    const academicsItems = useMemo(() => searchItems.filter((item) => item.searchGroup === "Academics"), [searchItems]);
    const hostelItems = useMemo(() => searchItems.filter((item) => item.searchGroup === "Hostel"), [searchItems]);

    const filteredSearchItems = useMemo(() => {
      if (!librarySearchQuery) return [];
      const q = librarySearchQuery.toLowerCase();
      return searchItems.filter((item) => {
        if (item.label.toLowerCase().includes(q)) return true;
        return (item.keywords ?? []).some((k) => k.toLowerCase().includes(q));
      });
    }, [librarySearchQuery, searchItems]);

    // Launcher tile (phone home-screen style): colour icon + short label.
    // Colours come from MODULE_TONE so a module looks the same everywhere.
    // Pinning lives in the "Bottom bar shortcuts" section below, not on
    // every tile (it used to be a pin button per card).
    const GROUP_FALLBACK: Record<string, ToneName> = {
      Study: "ochre",
      Campus: "apricot",
      Tools: "sea",
      Account: "neutral",
    };
    const renderItemCard = (item: ModuleEntry, opts?: { cleanPrefix?: string; subtitle?: string; tint?: string }) => {
      const Icon = item.icon || Home;
      const label = opts?.cleanPrefix ? item.label.replace(opts.cleanPrefix, "") : item.label;
      const tone = moduleTone(item.pinId ?? item.id, GROUP_FALLBACK[item.group as string] ?? "teal");
      const external = item.target.kind === "external";
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => runEntry(item)}
          className="group/tile flex min-w-0 flex-col items-center gap-1.5 rounded-[12px] px-0.5 py-1 text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={external ? `${label} (opens in a new tab)` : label}
        >
          <span
            className={`relative flex h-14 w-14 items-center justify-center rounded-[16px] border-2 shadow-brutal-sm transition-transform duration-150 group-hover/tile:-translate-y-0.5 group-active/tile:translate-y-0.5 ${tone}`}
          >
            <Icon className="h-6 w-6 stroke-[2.2]" aria-hidden />
            {external ? (
              <ExternalLink
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-border-ink bg-surface p-0.5 text-text-muted"
                aria-hidden
              />
            ) : null}
          </span>
          <span className="line-clamp-2 w-full text-xs font-semibold leading-tight text-text-heading">{label}</span>
        </button>
      );
    };

    return (
      <AppLibrary
        open={open}
        onClose={onClose}
        title="Modules"
        subtitle="Open any part of AmazeCC"
        showBack={false}
        searchQuery={librarySearchQuery}
        onSearchChange={setLibrarySearchQuery}
        headerRight={
          // Theme at the top of the sheet (user: it was at the very bottom,
          // under every module). Icon-only to fit beside the title.
          <div
            role="group"
            aria-label="Theme"
            className="flex shrink-0 gap-0.5 rounded-[10px] border-2 border-border-ink bg-surface p-0.5"
          >
            {(["light", "dark", "night"] as const).map((t) => {
              const Icon = t === "light" ? Sun : t === "dark" ? Moon : MoonStar;
              const on = theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={(e) => handleThemeChange(t, e)}
                  aria-pressed={on}
                  aria-label={`${t[0].toUpperCase()}${t.slice(1)} theme`}
                  title={`${t[0].toUpperCase()}${t.slice(1)} theme`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-[7px] border-2 transition-colors cursor-pointer ${
                    on
                      ? "border-border-ink bg-secondary text-secondary-foreground"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </button>
              );
            })}
          </div>
        }
      >
        {!librarySearchQuery && (
          // Full-width field with its label above (user: the selector was "too
          // short", a size="auto" text pill squeezed into the row).
          <div className="mb-4">
            <span className="mb-1.5 block font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
              Semester
            </span>
            <SelectField
              value={settings.currSemesterID || config.semesterIDs[config.semesterIDs.length - 2]}
              // Switching reloads everything, so ask first (critique #26).
              onChange={(val) => {
                if (val !== (settings.currSemesterID || "")) setPendingSemester(val);
              }}
              options={config.semesterIDs.map((semId: string) => ({
                value: semId,
                label: formatSemesterName(semId),
              }))}
              searchable={false}
              role="group"
              aria-label="Current semester"
              size="lg"
              className="w-full sm:w-full [&>button:first-child]:w-full [&>button:first-child_span]:font-bold [&>button:first-child_span]:text-text-heading"
            />
            {pendingSemester ? (
              <div
                role="alertdialog"
                aria-label="Switch semester"
                className="mt-2 rounded-[12px] border-2 border-border-ink bg-highlight p-3 text-highlight-foreground"
              >
                <p className="text-sm font-bold">
                  Switch to {formatSemesterName(pendingSemester)}? This reloads your data.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = pendingSemester;
                      setPendingSemester(null);
                      handleReloadRequest(next);
                    }}
                    className="inline-flex min-h-10 items-center rounded-[8px] border-2 border-obsidian bg-teal px-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-cream cursor-pointer"
                  >
                    Switch
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSemester(null)}
                    className="inline-flex min-h-10 items-center rounded-[8px] border-2 border-obsidian bg-cream px-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-obsidian cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Moved up from the very bottom of the sheet (critique #25). */}
        {!librarySearchQuery && (
          <details className="group/pins mb-4 rounded-[12px] border-2 border-border-muted bg-surface-secondary px-4 py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-heading">
                Bottom bar shortcuts
              </span>
              <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-text-muted">
                {(settings?.pinnedNavTabs ?? []).length}/4
                <ChevronRight className="h-4 w-4 transition-transform group-open/pins:rotate-90" aria-hidden />
              </span>
            </summary>
            <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
              {quickPinTabs.map((tab) => {
                const pinned = settings?.pinnedNavTabs ?? [];
                const isPinned = pinned.includes(tab.id);
                const atLimit = !isPinned && pinned.length >= 4;
                return (
                  <button
                    key={tab.id}
                    disabled={atLimit}
                    onClick={() => togglePin(tab.id)}
                    aria-pressed={isPinned}
                    className={`inline-flex min-h-9 items-center gap-1 px-3 py-1.5 rounded-[10px] border-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors cursor-pointer select-none ${
                      isPinned
                        ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
                        : atLimit
                          ? "bg-surface-secondary border-border-muted text-text-disabled cursor-not-allowed"
                          : "bg-surface border-border-ink text-text-primary hover:bg-surface-secondary"
                    }`}
                  >
                    {isPinned ? "✓ " : "+ "}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </details>
        )}

        {librarySearchQuery ? (
          filteredSearchItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-text-muted">No modules found matching "{librarySearchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="px-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-muted">Results</h3>
              <div className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-6">
                {filteredSearchItems.map((item) => renderItemCard(item))}
              </div>
            </div>
          )
        ) : (
          primaryGroups.map((group) => {
            const segments: Array<
              { type: "items"; items: ModuleEntry[] } | { type: "academics" } | { type: "hostel" }
            > = [];
            let bucket: ModuleEntry[] = [];
            const flush = () => {
              if (bucket.length) {
                segments.push({ type: "items", items: bucket });
                bucket = [];
              }
            };
            for (const item of group.items) {
              if (item.target.kind === "panel" && item.target.panel === "academics") {
                flush();
                segments.push({ type: "academics" });
              } else if (item.target.kind === "panel" && item.target.panel === "hostel") {
                flush();
                segments.push({ type: "hostel" });
              } else {
                bucket.push(item);
              }
            }
            flush();

            return (
              <div key={group.name} className="space-y-3 pb-2">
                <h3 className="flex items-center gap-2 px-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                  {group.name}
                  <span className="h-0.5 flex-1 rounded-full bg-border-muted" aria-hidden />
                </h3>
                <div className="space-y-3">
                  {segments.map((seg, idx) => {
                    if (seg.type === "academics") {
                      return (
                        <div key={`${group.name}-academics-${idx}`} className="space-y-2">
                          <h4 className="px-1 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                            Academics
                          </h4>
                          <div className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-6">
                            {academicsItems.map((sub) =>
                              renderItemCard(sub, {
                                tint: "bg-secondary text-secondary-foreground",
                                subtitle: "Academics Tracker",
                              }),
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (seg.type === "hostel") {
                      return (
                        <div key={`${group.name}-hostel-${idx}`} className="space-y-2">
                          <h4 className="px-1 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                            Hostel
                          </h4>
                          <div className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-6">
                            {hostelItems.map((sub) =>
                              renderItemCard(sub, {
                                cleanPrefix: "Hostel ",
                                tint: "bg-warning-surface text-warning-foreground dark:text-warning-foreground",
                                subtitle: "Hostel Hub",
                              }),
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`${group.name}-items-${idx}`}
                        className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-6"
                      >
                        {seg.items.map((item) =>
                          renderItemCard(item, {
                            tint:
                              group.name === "Study"
                                ? "bg-secondary text-secondary-foreground"
                                : group.name === "Campus"
                                  ? "bg-warning-surface text-warning-foreground dark:text-warning-foreground"
                                  : group.name === "Tools"
                                    ? "bg-success-surface text-success-foreground dark:text-success-foreground"
                                    : "bg-info-surface text-info",
                            subtitle:
                              group.name === "Study"
                                ? "Academic trackers & schedule"
                                : group.name === "Campus"
                                  ? "Campus services"
                                  : "Social & utilities",
                          }),
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </AppLibrary>
    );
  },
);

AppLibraryPortal.displayName = "AppLibraryPortal";
export default AppLibraryPortal;
