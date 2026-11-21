import type { ReactNode } from "react";

type GuidedPhaseTone = "indigo" | "purple" | "amber" | "rose" | "emerald";

interface GuidedPhaseHeadingProps {
  variant?: "hero" | "portrait";
  tone: GuidedPhaseTone;
  icon: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description: ReactNode;
}

const toneClasses: Record<GuidedPhaseTone, { tile: string; text: string }> = {
  indigo: { tile: "bg-secondary border-border-ink", text: "text-primary" },
  purple: { tile: "bg-secondary border-border-ink", text: "text-primary" },
  amber: { tile: "bg-warning-surface border-border-ink", text: "text-warning-foreground" },
  rose: { tile: "bg-danger-surface border-border-ink", text: "text-danger-foreground" },
  emerald: { tile: "bg-success-surface border-border-ink", text: "text-success-foreground" },
};

export function GuidedPhaseHeading({
  variant = "hero",
  tone,
  icon,
  eyebrow,
  title,
  description,
}: GuidedPhaseHeadingProps) {
  const iconClasses = `w-12 h-12 rounded-[12px] border-2 flex items-center justify-center shadow-brutal-sm ${toneClasses[tone].tile} ${toneClasses[tone].text}`;

  if (variant === "portrait") {
    return (
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className={iconClasses}>{icon}</div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase leading-tight text-text-heading">
          {title}
        </h1>
        <p className="text-sm text-text-muted max-w-xs sm:max-w-md">{description}</p>
      </div>
    );
  }

  return (
    <>
      <div className={iconClasses}>{icon}</div>
      <div>
        <span className={`text-xs font-bold uppercase tracking-wider font-outfit ${toneClasses[tone].text}`}>
          {eyebrow}
        </span>
        <h1 className="font-display text-2xl lg:text-3xl font-bold uppercase leading-tight text-text-heading">
          {title}
        </h1>
      </div>
      <p className="text-xs text-text-muted font-medium leading-relaxed">{description}</p>
    </>
  );
}
