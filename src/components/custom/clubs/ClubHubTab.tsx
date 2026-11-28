"use client";

import { useEffect, useMemo, useState } from "react";
import { isDemoSession } from "@/lib/demoDates";
import { useSetAtom } from "jotai";
import { activeTabAtom } from "@/store";
import { api } from "@/lib/sync-engine";
import { Skeleton, cn } from "@amazecontinuityprojects/amazeui";
import { Search, X, LayoutGrid, Users, Layers, RefreshCcw, ChevronRight, SearchX, Rss, WifiOff } from "lucide-react";
import { LIST_ROW, SEARCH_FIELD, TONE_BADGE, TONE_ICON_TILE, CHIP } from "@/lib/uiTokens";
import ClubDetailsModal from "./ClubDetailsModal";
import {
  EmptyPanel,
  GhostButton,
  IconButton,
  InsightCarousel,
  ListRowText,
  ListShell,
  ListSkeleton,
  PageShell,
  SectionHeader,
  StatTile,
  useCarousel,
  type InsightSlide,
} from "../shared/primitives";

/**
 * The club directory.
 *
 * The public directory is the supported source:
 *
 *  - `clubs/details` is a public table. It carries the part a reader actually
 *    wants — logo, mission, contacts, recruitment — and needs no credentials.
 *
 * The removed `club-enrollment` API is not called. The public route still needs
 * to be deployed for this directory to load in production.
 */

interface ClubEntry {
  /** VTOP's row number, or the public `club_id`. Only a display fallback. */
  id: string;
  name: string;
  /** `CLUB` / `CHAPTER` from VTOP; empty when we fell back to the public list. */
  type: string;
  detail: any | null;
}

const ROW_CAP = 50;

const DEMO_CLUBS = [
  "VOICE-IT VIT CHENNAI'S RADIO",
  "DANCE CLUB",
  "VITC DEBATE SOCIETY",
  "DRAMATICS CLUB",
  "FINE ARTS CLUB (TFAC)",
  "ACM STUDENT CHAPTER",
  "IEEE STUDENT CHAPTER",
];

/** Compare on letters and digits only, so a display name can be distinguished from its identifier. */
const normalise = (value: string): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const isChapter = (type: string): boolean => /chapter/i.test(String(type ?? ""));
const toneFor = (type: string): string => (isChapter(type) ? "violet" : type ? "indigo" : "sky");
const IconFor = (type: string) => (isChapter(type) ? Layers : Users);

export default function ClubHubTab({ IDs, onBack }: { IDs: any; onBack?: () => void }) {
  const [clubs, setClubs] = useState<ClubEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any | null>(null);

  const setActiveTab = useSetAtom(activeTabAtom);

  const load = async () => {
    setLoading(true);
    setError("");
    setShowAll(false);

    if (isDemoSession(IDs)) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setClubs(
        DEMO_CLUBS.map((name, i) => ({
          id: String(i + 1),
          name,
          type: i >= 5 ? "CHAPTER" : "CLUB",
          detail: null,
        })),
      );
      setLoading(false);
      return;
    }

    try {
      const data = await api("clubs/details");
      if (!data || data.success === false) {
        throw new Error(typeof data?.error === "string" ? data.error : "The club directory returned an error.");
      }
      if (!Array.isArray(data.clubs)) {
        throw new Error("The club directory returned an invalid response.");
      }
      const directory: ClubEntry[] = data.clubs.map((club: unknown) => {
        if (
          !club ||
          typeof club !== "object" ||
          !("club_name" in club) ||
          typeof club.club_name !== "string" ||
          !club.club_name.trim()
        ) {
          throw new Error("The club directory contains an invalid entry.");
        }
        return {
          id: "club_id" in club && typeof club.club_id === "string" ? club.club_id : "",
          name: club.club_name.trim(),
          type: "",
          detail: club,
        };
      });
      setClubs(directory);
    } catch (cause) {
      setClubs([]);
      setError(cause instanceof Error ? cause.message : "Couldn't reach the club database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: clubs.length,
      withLogo: clubs.filter((c) => c.detail?.logo_url).length,
      recruiting: clubs.filter((c) => c.detail?.recruitment_link || c.detail?.hiring_process).length,
      reachable: clubs.filter((c) => c.detail?.poc || c.detail?.whatsapp || c.detail?.instagram).length,
    };
  }, [clubs]);

  /**
   * One measurement per slide, and a slide with nothing to say is left out
   * rather than shown as a zero — same rule as the Event Hub and OD hero tiles.
   */
  const insightSlides = useMemo<InsightSlide[]>(() => {
    const slides: InsightSlide[] = [];
    if (summary.withLogo > 0) {
      slides.push({
        id: "logos",
        label: "With a logo",
        value: `${summary.withLogo}/${summary.total}`,
        sub: "Profiles with artwork",
        badge: "Profiles",
        tone: "emerald",
      });
    }
    if (summary.recruiting > 0) {
      slides.push({
        id: "hiring",
        label: "Recruiting",
        value: summary.recruiting,
        sub: "Accepting new members",
        badge: "Hiring",
        tone: "amber",
      });
    }
    if (summary.reachable > 0) {
      slides.push({
        id: "contact",
        label: "Reachable",
        value: summary.reachable,
        sub: "Have a contact or a handle",
        badge: "Contact",
        tone: "sky",
      });
    }
    return slides;
  }, [summary]);

  const carousel = useCarousel(insightSlides.length);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return clubs.filter((club) => !query || club.name.toLowerCase().includes(query));
  }, [clubs, searchQuery]);

  const visible = showAll ? filtered : filtered.slice(0, ROW_CAP);
  const hiddenCount = filtered.length - visible.length;

  return (
    <PageShell
      onBack={onBack}
      eyebrow="Club Hub"
      title="Clubs & Chapters"
      subtitle="Browse published student organisation profiles at VIT."
      actions={
        <IconButton title="Reload clubs" onClick={load} disabled={loading}>
          <RefreshCcw className={loading ? "animate-spin" : ""} />
        </IconButton>
      }
      selectable
    >
      {/* ── HERO STATS ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Skeleton className="h-32 sm:h-36 rounded-[14px]" />
          <Skeleton className="h-32 sm:h-36 rounded-[14px]" />
        </div>
      ) : error ? null : (
        <>
          <div className="summary-row grid grid-cols-2 gap-3 sm:gap-4">
            <StatTile
              label="Public directory"
              value={summary.total}
              sub={`${summary.withLogo} with a published profile`}
              badge="Published"
              tone="sky"
            />
            <InsightCarousel slides={insightSlides} carousel={carousel} height="h-36" ariaLabel="Club insights" />
          </div>

          <p className="px-1 -mt-3 text-xs leading-relaxed text-text-muted font-medium">
            Profiles are published by each club&apos;s representatives. The directory does not yet include VTOP&apos;s
            membership list or a CLUB/CHAPTER split. Tap one for its mission, contacts and recruitment.
          </p>
        </>
      )}

      {/* ── DIRECTORY ── */}
      {error ? (
        <EmptyPanel
          tone="red"
          icon={<WifiOff className="w-7 h-7" />}
          title={
            /\b404\b|not found|isn't available/i.test(error)
              ? "Club directory isn't available yet"
              : "Couldn't load the club directory"
          }
          // The public club route is not deployed to the live API.
          // See docs/redesign/BACKEND_GAPS.md.
          description={
            /\b404\b|not found|isn't available/i.test(error)
              ? "It needs a server update first. Nothing is wrong on your side."
              : error
          }
          action={
            <GhostButton onClick={load}>
              <RefreshCcw className="w-3.5 h-3.5" />
              Try again
            </GhostButton>
          }
        />
      ) : loading ? (
        <ListSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyPanel
          icon={<SearchX className="w-7 h-7" />}
          title={clubs.length === 0 ? "No clubs are published yet" : "No clubs match your search"}
          description={
            clubs.length === 0
              ? "Check back after clubs publish their profiles."
              : "Try a different search term to see more profiles."
          }
        />
      ) : (
        <div className="space-y-4">
          <SectionHeader
            icon={LayoutGrid}
            title="Directory"
            count={filtered.length}
            right={
              <GhostButton onClick={() => setActiveTab("community")} title="Open the community feed">
                <Rss className="w-3.5 h-3.5" />
                Feed
              </GhostButton>
            }
          />

          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clubs..."
                aria-label="Search clubs"
                className={cn(SEARCH_FIELD, "pl-10 pr-10")}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 hit-expand p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <ListShell>
            {visible.map((club) => {
              const tone = toneFor(club.type);
              const Icon = IconFor(club.type);
              // A row number is not an identifier, so it is only worth showing
              // when the id says something the name does not.
              const subtitle =
                club.id && normalise(club.id) !== normalise(club.name)
                  ? club.id
                  : club.detail
                    ? "Profile published"
                    : "No profile yet";

              return (
                <button
                  key={`${club.id}-${club.name}`}
                  type="button"
                  onClick={() => setSelectedClub({ ...club, club_name: club.name, ...club.detail })}
                  className={cn(LIST_ROW, "gap-3 cursor-pointer active:bg-surface-secondary ")}
                >
                  {club.detail?.logo_url ? (
                    <img
                      src={club.detail.logo_url}
                      alt=""
                      loading="lazy"
                      className="w-10 h-10 rounded-2xl object-cover shrink-0 border-2 border-border-ink"
                    />
                  ) : (
                    <span
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                        TONE_ICON_TILE[tone] ?? TONE_ICON_TILE.sky,
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                  )}

                  <ListRowText title={club.name} subtitle={subtitle} />

                  {club.type ? (
                    <span className={cn(CHIP, TONE_BADGE[tone] ?? TONE_BADGE.zinc, "shrink-0")}>{club.type}</span>
                  ) : null}

                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                </button>
              );
            })}
          </ListShell>

          {hiddenCount > 0 && (
            <div className="flex justify-center">
              <GhostButton onClick={() => setShowAll(true)}>
                Show all {filtered.length} clubs
                <ChevronRight className="w-3.5 h-3.5" />
              </GhostButton>
            </div>
          )}
        </div>
      )}

      <ClubDetailsModal isOpen={!!selectedClub} onClose={() => setSelectedClub(null)} club={selectedClub} />
    </PageShell>
  );
}
