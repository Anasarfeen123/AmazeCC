"use client";

import { Children, Fragment, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { MoreHorizontal, X } from "lucide-react";
import BrandBackButton from "./BrandBackButton";
import TitleBlock from "./TitleBlock";
import LastSynced from "../LastSynced";

/**
 * Page shell + page header.
 *
 * Every "real" page in the app opens with the same chrome: a max-width column
 * with a fixed vertical rhythm, a small eyebrow above a heavy title, an
 * optional session/subtitle line, and a cluster of icon actions with an
 * optional back button. That chrome used to be copy-pasted per page (nine
 * copies of the shell string alone), so it lives here now.
 *
 * The line block itself is `TitleBlock`; this owns the column, the action row
 * and the two header arrangements. Surface tokens live in `@/lib/uiTokens`.
 */

const SHELL_BASE = "w-full max-w-4xl mx-auto space-y-6 pt-3 sm:pt-5 md:pb-8 animate-in fade-in duration-300 text-left";

const HEADER_ROOT = "px-1";
const ACTION_ROW = "flex items-start justify-between gap-3";
const ACTION_CLUSTER = "flex items-center gap-2 pt-0.5 shrink-0";

export type PageHeaderLayout =
  /** Back + actions on their own row, title block underneath (curriculum). */
  | "actions-above"
  /** Title block and actions sharing one row (mobile home). */
  | "title-inline";

export interface PageShellProps {
  /** Small kicker above the title, e.g. "Academics" or "Attendance · On-Duty". */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Icon buttons / ghost actions. Kept on one shrink-0 cluster. */
  actions?: ReactNode;
  /**
   * Renders a back button to the left of the action cluster. Omit to render
   * the cluster flush right.
   */
  onBack?: () => void;
  /** Where the back button goes, shown on it ("Academics"). Defaults to "Back". */
  backLabel?: string;
  /** Custom leading element (e.g. AmazeCC Logo) to render instead of BackButton. */
  leading?: ReactNode;
  layout?: PageHeaderLayout;
  /**
   * Let the title wrap instead of truncating. For pages whose title is user
   * data (an event name, a course title) rather than a fixed noun, a one-line
   * ellipsis throws away the thing the reader came for.
   */
  wrap?: boolean;
  /**
   * Most pages block text selection (`select-none`) because they are dense
   * stat surfaces. Set this on pages that were not doing that, so adopting the
   * shell does not quietly make their copy unselectable.
   */
  selectable?: boolean;
  /**
   * Sync ops whose data this page shows. Adds an "Updated 5 min ago" line
   * under the title (see lib/syncTimes.ts).
   */
  syncedOps?: readonly string[];
  /** Extra classes merged onto the shell (the app sets `text-center` globally). */
  className?: string;
  children: ReactNode;
}

export default function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  onBack,
  backLabel,
  leading,
  layout = "actions-above",
  wrap = false,
  selectable = false,
  syncedOps,
  className = "",
  children,
}: PageShellProps) {
  const shell = selectable ? `${SHELL_BASE} select-text` : `${SHELL_BASE} select-none`;
  const block = <TitleBlock eyebrow={eyebrow} title={title} subtitle={subtitle} wrap={wrap} />;
  // One element either way, so the inline layout's flex row keeps its shape.
  const titleBlock = syncedOps?.length ? (
    <div className="min-w-0 flex-1">
      {block}
      <LastSynced ops={syncedOps} />
    </div>
  ) : (
    block
  );

  // Back is always far left, the action cluster always far right and
  // shrink-0, so a long title can truncate but never squeeze a button.
  const back =
    leading !== undefined ? (
      leading
    ) : onBack ? (
      <BrandBackButton onClick={onBack} label={backLabel} className="self-start" />
    ) : null;
  // Phones: with more than two actions, the first stays and the rest fold
  // behind "More" (user: header buttons overflowed the screen, e.g. the
  // Exam schedule's five). The folded ones open as a labelled row under the
  // header. sm and up: every action inline, as before.
  const [moreOpen, setMoreOpen] = useState(false);
  const items = flattenActions(actions);
  const folds = items.length > 2;
  const cluster = actions ? (
    folds ? (
      <>
        <div className={`${ACTION_CLUSTER} hidden sm:flex`}>{items}</div>
        <div className={`${ACTION_CLUSTER} sm:hidden`}>
          {items[0]}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label={moreOpen ? "Close more actions" : `More actions (${items.length - 1})`}
            title="More actions"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press cursor-pointer"
          >
            {moreOpen ? <X className="h-4 w-4" aria-hidden /> : <MoreHorizontal className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </>
    ) : (
      <div className={ACTION_CLUSTER}>{items}</div>
    )
  ) : null;
  const moreRow =
    folds && moreOpen ? (
      <div
        className="mb-4 grid grid-cols-4 gap-2 rounded-[14px] border-2 border-border-ink bg-surface p-3 shadow-brutal-sm sm:hidden"
        role="group"
        aria-label="More actions"
      >
        {items.slice(1).map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1 text-center">
            {item}
            <span className="line-clamp-2 text-xs leading-tight text-text-muted">{actionLabel(item)}</span>
          </div>
        ))}
      </div>
    ) : null;

  if (layout === "actions-above") {
    return (
      <div className={`${shell} ${className}`.trim()}>
        <div className={HEADER_ROOT}>
          {leading !== undefined || onBack || actions ? (
            <div className={`${ACTION_ROW} mb-4 sm:mb-5`}>
              {back ? back : <span />}
              {cluster}
            </div>
          ) : null}
          {moreRow}
          {titleBlock}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={`${shell} ${className}`.trim()}>
      <div className={`${HEADER_ROOT} ${ACTION_ROW}`}>
        {back}
        {titleBlock}
        {cluster}
      </div>
      {moreRow ? <div className={HEADER_ROOT}>{moreRow}</div> : null}
      {children}
    </div>
  );
}

/** The action nodes as a flat list (fragments unwrapped, empty slots dropped). */
function flattenActions(actions: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.forEach(actions, (child) => {
    if (child === null || child === undefined || child === false || child === "") return;
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...flattenActions((child as ReactElement<{ children?: ReactNode }>).props.children));
    } else out.push(child);
  });
  return out.map((c, i) => (isValidElement(c) && c.key == null ? <Fragment key={i}>{c}</Fragment> : c));
}

/** A folded action's caption: its title or aria-label (IconButton sets both). */
function actionLabel(node: ReactNode): string {
  if (!isValidElement(node)) return "";
  const props = node.props as { title?: string; "aria-label"?: string; children?: ReactNode };
  if (props.title || props["aria-label"]) return String(props.title || props["aria-label"]);
  if (node.type === Fragment) return actionLabel(Children.toArray(props.children)[0]);
  return "";
}
