import { useState, useEffect } from "react";
import { Skeleton } from "@amazecontinuityprojects/amazeui";
import { syncEngine } from "@/lib/sync-engine";
import { ChevronRight } from "lucide-react";

export default function ProfileStatusCards({
  creds,
  refreshKey,
  onCardClick,
}: {
  creds: any;
  refreshKey: number;
  onCardClick: (id: string) => void;
}) {
  const [whoami, setWhoami] = useState<any>(null);
  const [reg, setReg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creds) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        let w: any = null;
        if (refreshKey === 0) {
          try {
            const cached = localStorage.getItem("cache_whoami") || localStorage.getItem("uni_cc_generic_whoami:{}");
            if (cached) w = JSON.parse(cached);
          } catch {}
        }
        if (!w || refreshKey > 0) {
          try {
            w = await syncEngine.sync("whoami");
          } catch {
            w = null;
          }
          if (w && !w.error) {
            try {
              localStorage.setItem("cache_whoami", JSON.stringify(w));
            } catch {}
          }
        }
        if (cancelled) return;
        setWhoami(w);

        // registration schedule comes from unified FFCS op (single ffcs all call + adapters/distribution).
        // Mount reads the cache only — /api/ffcs costs a VTOP round trip, so it must never fire just
        // because the profile page mounted. An explicit refresh (refreshKey > 0) always fetches fresh.
        const readCachedReg = () => {
          try {
            const cachedReg =
              localStorage.getItem("cache_registration_schedule") ||
              localStorage.getItem("cache_registration-schedule");
            return cachedReg ? JSON.parse(cachedReg) : null;
          } catch {
            return null;
          }
        };
        let regRes: any = refreshKey === 0 ? readCachedReg() : null;
        if (refreshKey > 0) {
          try {
            const ffcsRes: any = await syncEngine.sync("ffcs", {});
            regRes = ffcsRes?.registrationSchedule || ffcsRes;
          } catch {
            regRes = readCachedReg();
          }
        }
        if (!cancelled) setReg(regRes);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, creds]);

  const ept = whoami?.eptSchedule ?? null;
  const day = whoami?.dayboarder ?? null;
  const rank = whoami?.ranks?.[0]?.rank != null ? String(whoami.ranks[0].rank) : null;
  const apaar = whoami?.apaar ?? null;
  const bank = whoami?.bank ?? null;

  const hasEpt = ept?.tables?.length > 0 && ept.tables.some((t: any) => t.rows?.length > 0);
  const hasReg = reg?.tables?.length > 0 && reg.tables.some((t: any) => t.rows?.length > 0);
  const hasBank = !!(
    bank?.name ||
    bank?.branch ||
    bank?.address ||
    (Array.isArray(bank?.fields) && bank.fields.some((f: any) => f?.value && String(f.value).trim().length > 0))
  );
  const hasDay = !!(
    day?.fields && Object.values(day.fields).some((f: any) => f?.value && String(f.value).trim().length > 0)
  );
  const hasApaar =
    apaar?.hasApaar === true ||
    (Array.isArray(apaar?.fields) && apaar.fields.length > 0) ||
    (Array.isArray(apaar?.tables) && apaar.tables.some((t: any) => t.rows?.length > 0));

  const eptCount = hasEpt ? ept.tables.reduce((sum: number, t: any) => sum + (t.rows?.length || 0), 0) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-[14px] border-2 border-border-ink card-surface shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "ept",
      label: "EPT Schedule",
      subtitle: "English Proficiency Test",
      value: hasEpt ? `${eptCount} Scheduled Exam${eptCount > 1 ? "s" : ""}` : "No Active Exams",
      color: hasEpt ? "text-primary" : "text-text-muted",
      badgeColor: hasEpt
        ? "bg-secondary text-secondary-foreground border-border-ink"
        : "bg-surface-secondary text-text-muted border-border-ink",
    },
    {
      id: "reg",
      label: "Course Registration",
      subtitle: "Course selection schedule",
      value: hasReg ? "Schedule Active" : "Not Scheduled",
      color: hasReg ? "text-success-foreground" : "text-text-muted",
      badgeColor: hasReg
        ? "bg-success-surface text-success-foreground border-border-ink"
        : "bg-surface-secondary text-text-muted border-border-ink",
    },
    {
      id: "bank",
      label: "Bank Details",
      subtitle: "Fee refund & direct deposit",
      value: hasBank ? "Verified & On File" : "Action Required",
      color: hasBank ? "text-success-foreground" : "text-warning-foreground",
      badgeColor: hasBank
        ? "bg-success-surface text-success-foreground border-border-ink"
        : "bg-warning-surface text-warning-foreground border-border-ink",
    },
    {
      id: "day",
      label: "Dayboarder Info",
      subtitle: "Non-hosteller campus status",
      value: hasDay ? "Profile Verified" : "Not Provided",
      color: hasDay ? "text-primary" : "text-warning-foreground",
      badgeColor: hasDay
        ? "bg-secondary text-secondary-foreground border-border-ink"
        : "bg-warning-surface text-warning-foreground border-border-ink",
    },
    {
      id: "apaar",
      label: "APAAR / ABC ID",
      subtitle: "Academic Bank of Credits",
      value: hasApaar ? "Linked to Portal" : "Not Linked",
      color: hasApaar ? "text-primary" : "text-text-muted",
      badgeColor: hasApaar
        ? "bg-secondary text-secondary-foreground border-border-ink"
        : "bg-surface-secondary text-text-muted border-border-ink",
    },
    rank
      ? {
          id: "rank",
          label: "VITEEE Entrance Rank",
          subtitle: "Merit examination rank",
          value: `AIR ${rank}`,
          color: "text-warning-foreground",
          badgeColor: "bg-warning-surface text-warning-foreground border-border-ink",
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
      {cards.map((card: any) => {
        const isClickable = card.id !== "rank" && card.id !== "apaar";

        return (
          <button
            key={card.id}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onCardClick(card.id)}
            className={`p-4 sm:p-5 rounded-[14px] border-2 border-border-ink card-surface shadow-2xs transition-all duration-200 flex items-center justify-between gap-3.5 group select-none text-left w-full ${
              isClickable
                ? "hover:bg-surface hover:shadow-md hover:border-border-ink dark:hover:border-border-ink cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="min-w-0">
                <p className="text-xs font-bold font-outfit text-text-heading truncate">{card.label}</p>
                <p className="text-xs text-text-muted truncate mt-0.5">{card.subtitle}</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${card.badgeColor}`}
                  >
                    {card.value}
                  </span>
                </div>
              </div>
            </div>

            {isClickable && (
              <div className="p-1 rounded-lg text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
