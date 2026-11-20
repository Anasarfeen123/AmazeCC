"use client";

import { useEffect, useState } from "react";
import GenericApiView from "../exams/GenericApiView";
import { Skeleton } from "@amazecontinuityprojects/amazeui";
import { Sparkles } from "lucide-react";

interface CounsellingProps {
  loginToVTOP: () => Promise<any>;
  refreshKey: number;
}

export default function HostelCounsellingView({ loginToVTOP, refreshKey }: CounsellingProps) {
  const [creds, setCreds] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loginToVTOP()
      .then(setCreds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey, loginToVTOP]);

  if (loading || !creds) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <p className="inline-flex items-center rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 mb-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-secondary-foreground leading-none">
          Hostel · Rooms
        </p>
        <h1 className="font-display text-[28px] sm:text-[36px] font-bold uppercase text-text-heading tracking-tight leading-[1.05] break-words">
          Room counselling
        </h1>
        <p className="text-xs text-text-muted mt-1">Your room selection status, group requests and leader OTPs.</p>
      </div>

      {/* Info card */}
      <div className="bg-secondary border border-border-ink rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-secondary text-secondary-foreground rounded-full shrink-0">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1 text-xs">
          <h2 className="font-bold text-text-heading">Room Selection Information</h2>
          <p className="text-text-muted leading-relaxed">
            Ensure your group leader validates the registered OTP to complete your room basket selection. Once
            confirmed, your room allocation will be locked.
          </p>
        </div>
      </div>

      {/* VTOP Counselling Live Table wrapper */}
      <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 shadow-2xs">
        <GenericApiView endpoint="hostel-counselling" title="" creds={creds} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
