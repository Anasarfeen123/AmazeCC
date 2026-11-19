"use client";
import { ChevronRight, ExternalLink, Link2, MessagesSquare, Shield, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useDashboardNavigator } from "./dashboard/DashboardNavigator";
import quickLinks from "../../data/quickLinks.json";
import Links from "./header/Links";
import { ListRowText, ListShell, SectionHeader } from "./shared/primitives";
import { LIST_ROW } from "@/lib/uiTokens";

type Subpage = "main" | "hallOfFame" | "changelog" | "team";

/**
 * One row, three shapes.
 *
 * The list used to be eight hand-typed blocks that differed only in four
 * variables (icon, title, subtitle, where it goes), which is why two of them
 * had drifted — the privacy and terms rows were `<div onClick={window.open}>`
 * rather than real links, so they had no middle-click, no open-in-new-tab and
 * no link status. The row is now built once and every entry is either a real
 * anchor or a real button.
 */
function ResourceRow({
  icon,
  iconClass,
  title,
  desc,
  href,
  onClick,
}: {
  icon?: ReactNode;
  iconClass?: string;
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {icon ? (
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${iconClass}`}>
          {icon}
        </span>
      ) : null}
      <ListRowText title={title} subtitle={desc} />
      {href ? (
        <ExternalLink className="w-4 h-4 text-text-muted shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
      )}
    </>
  );

  const className = `${LIST_ROW} ${href ? "" : "cursor-pointer"}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export default function ResourcesSection({ setActiveSubpage }: { setActiveSubpage: (page: Subpage) => void }) {
  const { setActiveTab } = useDashboardNavigator();
  const community = quickLinks.communityLinks;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionHeader icon={Link2} title="Important links" count={quickLinks.importantLinks.length} />
        <ListShell>
          {quickLinks.importantLinks.map((link) => (
            <ResourceRow key={link.id} href={link.link} title={link.title} desc={link.desc} />
          ))}
        </ListShell>
      </div>

      <div className="space-y-3">
        <SectionHeader icon={MessagesSquare} title="Community" count={community.length} />
        <ListShell>
          {community.map((link) => (
            <ResourceRow
              key={link.title}
              href={link.link}
              title={link.title}
              desc="VIT community discussion forums and updates"
            />
          ))}
        </ListShell>
      </div>

      <div className="space-y-3">
        <SectionHeader icon={Link2} title="Links" />
        <Links />
      </div>

      <div className="space-y-3">
        <SectionHeader icon={Users} title="Project" />
        <ListShell>
          <ResourceRow
            onClick={() => setActiveTab("feedback")}
            title="Feedback & bugs"
            desc="Send an idea, report a bug, or see replies to what you sent"
          />
          <ResourceRow
            onClick={() => setActiveSubpage("changelog")}
            title="Changelog"
            desc="View latest updates, features and releases in AmazeCC"
          />
          <ResourceRow
            onClick={() => setActiveSubpage("team")}
            title="The Team"
            desc="Meet the Amaze Continuity Projects team"
          />
          <ResourceRow
            onClick={() => setActiveSubpage("hallOfFame")}
            title="Hall of Fame"
            desc="Meet the contributors, developers, and testers of the app"
          />
          <ResourceRow
            href="https://github.com/AmazeContinuityProjects/AmazeCC/"
            title="GitHub Repository"
            desc="Check out code, contribute fixes or report system bugs"
          />
        </ListShell>
      </div>

      <div className="space-y-3">
        <SectionHeader icon={Shield} title="Legal" />
        <ListShell>
          <ResourceRow
            href="/privacy"
            title="Privacy Policy"
            desc="Read about local credentials and encryption safety"
          />
          <ResourceRow
            href="/terms"
            title="Terms of Service"
            desc="Understand guidelines and rules of utilizing AmazeCC services"
          />
        </ListShell>
      </div>
    </div>
  );
}
