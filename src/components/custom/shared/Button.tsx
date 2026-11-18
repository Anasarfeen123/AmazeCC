import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button as BaseButton } from "@amazecontinuityprojects/amazeui";

/**
 * The app's button, brand version.
 *
 * Was a thin wrapper over AmazeUI 1.6's react-native-web `Button`, which drew
 * soft round pills with no edge (and could swallow the icon). Now a native
 * `<button>` with the brand shape: 10px corners, 2px ink edge, hard shadow,
 * mono uppercase label, 44px tall by default. Same props as before, so call
 * sites did not change. `asChild` still falls back to AmazeUI's Slot.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "default" | "destructive" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "default" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border-2 border-border-ink font-mono font-semibold uppercase tracking-[0.06em] transition-[transform,box-shadow,background-color] duration-100 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0";

const VARIANT: Record<string, string> = {
  primary: "bg-primary text-primary-foreground shadow-brutal-sm brutal-press",
  default: "bg-primary text-primary-foreground shadow-brutal-sm brutal-press",
  secondary: "bg-secondary text-secondary-foreground shadow-brutal-sm brutal-press",
  outline: "bg-surface text-text-primary shadow-brutal-sm brutal-press",
  ghost: "border-transparent bg-transparent text-text-primary hover:bg-surface-secondary",
  danger: "bg-danger-surface text-danger-foreground shadow-brutal-sm brutal-press",
  destructive: "bg-danger-surface text-danger-foreground shadow-brutal-sm brutal-press",
  success: "bg-success-surface text-success-foreground shadow-brutal-sm brutal-press",
  link: "border-transparent bg-transparent px-0 text-primary underline-offset-4 hover:underline normal-case tracking-normal",
};

const SIZE: Record<string, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-[13px]",
  default: "min-h-11 px-4 text-[13px]",
  lg: "min-h-12 px-5 text-sm",
  icon: "h-11 w-11 p-0",
};

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  asChild,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(BASE, VARIANT[variant] ?? VARIANT.primary, SIZE[size] ?? SIZE.md, className);

  if (asChild) {
    return (
      <BaseButton asChild className={classes} {...(props as any)}>
        {children}
      </BaseButton>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
