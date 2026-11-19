"use client";

/**
 * The App Library portal. Navigation/search items come from the unified
 * module registry (`src/lib/navigation/registry.tsx`) so they stay in sync
 * with other surfaces (sidebar, command palette).
 */

import { memo, useEffect, useMemo, useState } from "react";
import SelectField from "../shared/primitives/SelectField";
import { formatSemesterName } from "@/lib/formatSemesterName";
import { ChevronRight, ExternalLink, Home, Moon, Pin, Sun } from "lucide-react";
import { BrandSheet as AppLibrary } from "../shared/primitives/BrandSheet";
import config from "../../../../config.json";
import {
  activateEntry,
  getModuleRegistry,
  getPinId,
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

    const renderItemCard = (item: ModuleEntry, opts?: { cleanPrefix?: string; subtitle?: string; tint?: string }) => {
      const Icon = item.icon || Home;
      const isPanelTrigger = item.target.kind === "panel";
      const pinId = getPinId(item);
      const pinned = settings?.pinnedNavTabs ?? [];
      const isPinned = pinId ? pinned.includes(pinId) : false;
      const atLimit = !isPinned && pinned.length >= 4;
      const label = opts?.cleanPrefix ? item.label.replace(opts.cleanPrefix, "") : item.label;

      return (
        <div
          key={item.id}
          className="group/item relative flex min-h-16 w-full items-center justify-between gap-2 rounded-[10px] border-2 border-border-ink bg-surface p-2.5 transition-colors hover:bg-surface-secondary"
        >
          <button
            onClick={() => runEntry(item)}
            className="flex flex-1 min-w-0 min-h-11 items-center gap-3 text-left cursor-pointer rounded-[8px]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-2 border-border-ink bg-secondary text-secondary-foreground">
              <Icon className="h-5 w-5 stroke-[2.2]" aria-hidden />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-semibold leading-tight text-text-heading">{label}</span>
              {opts?.subtitle ? <span className="truncate text-xs text-text-muted">{opts.subtitle}</span> : null}
              {item.target.kind === "external" ? (
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-[6px] border-2 border-border-ink bg-surface-secondary px-1 font-mono text-xs font-semibold uppercase text-text-muted">
                  New tab
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </span>
              ) : null}
            </div>
          </button>

          {pinId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(pinId);
              }}
              disabled={atLimit}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border-2 transition-colors cursor-pointer ${
                isPinned
                  ? "bg-highlight border-border-ink text-highlight-foreground"
                  : atLimit
                    ? "border-transparent text-text-disabled cursor-not-allowed"
                    : "border-transparent text-text-muted hover:text-text-primary hover:border-border-ink"
              }`}
              title={isPinned ? "Unpin from bottom bar" : "Pin to bottom bar"}
              aria-label={isPinned ? `Unpin ${label}` : `Pin ${label}`}
              aria-pressed={isPinned}
            >
              <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} aria-hidden />
            </button>
          )}

          {isPanelTrigger && !pinId && <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />}
        </div>
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
      >
        {!librarySearchQuery && (
          <div className="flex items-center gap-1.5 px-1 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Sem:</span>
            <div className="relative flex items-center">
              <SelectField
                value={settings.currSemesterID || config.semesterIDs[config.semesterIDs.length - 2]}
                onChange={(val) => {
                  handleReloadRequest(val);
                }}
                options={config.semesterIDs.map((semId: string) => ({
                  value: semId,
                  label: formatSemesterName(semId),
                }))}
                searchable={false}
                role="group"
                aria-label="Current semester"
                size="auto"
                className="w-full [&>button:first-child]:border-none [&>button:first-child]:bg-transparent [&>button:first-child]:pr-5 [&>button:first-child]:text-info [&>button:first-child]:hover:underline"
              />
            </div>
          </div>
        )}

        {librarySearchQuery ? (
          filteredSearchItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-text-muted">No modules found matching "{librarySearchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-text-muted">Search Results</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <div key={group.name} className="space-y-3">
                <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-text-muted">{group.name}</h3>
                <div className="space-y-3">
                  {segments.map((seg, idx) => {
                    if (seg.type === "academics") {
                      return (
                        <div key={`${group.name}-academics-${idx}`} className="space-y-2">
                          <h4 className="px-1 text-xs font-bold uppercase tracking-wider text-text-muted">Academics</h4>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {academicsItems.map((sub) =>
                              renderItemCard(sub, {
                                tint: "bg-purple-50 text-purple-650 dark:bg-purple-950/30 text-primary",
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
                          <h4 className="px-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                            Hostel Hub
                          </h4>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      <div key={`${group.name}-items-${idx}`} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {seg.items.map((item) =>
                          renderItemCard(item, {
                            tint:
                              group.name === "Study"
                                ? "bg-purple-50 text-purple-650 dark:bg-purple-950/30 text-primary"
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

        <div className="shrink-0 space-y-3 border-t-2 border-border-ink bg-surface-secondary px-5 py-4 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="px-0.5 text-xs font-bold uppercase tracking-widest text-text-muted font-outfit">
              Quick Pin tabs (Max 4)
            </h4>
            <span className="text-xs font-bold text-primary uppercase">
              {(settings?.pinnedNavTabs ?? []).length}/4 selected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
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
        </div>

        <div
          className="shrink-0 space-y-2 border-t-2 border-border-ink bg-surface-secondary px-5 py-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          <h4 className="px-0.5 text-xs font-bold uppercase tracking-widest text-text-muted font-outfit">
            Interface Theme
          </h4>
          <div className="flex w-full gap-1 rounded-[10px] border-2 border-border-ink bg-surface p-1">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                onClick={(e) => handleThemeChange(t, e)}
                aria-pressed={theme === t}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] border-2 py-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors cursor-pointer ${
                  theme === t
                    ? "bg-secondary border-border-ink text-secondary-foreground shadow-brutal-sm"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {t === "light" && <Sun className="h-4 w-4" aria-hidden />}
                {t === "dark" && <Moon className="h-4 w-4" aria-hidden />}
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      </AppLibrary>
    );
  },
);

AppLibraryPortal.displayName = "AppLibraryPortal";
export default AppLibraryPortal;
