"use client";
import { useState } from "react";
import { Github } from "lucide-react";
import data from "@/data/contributors.json";
import { IconLink, ListRowText, ListShell } from "../shared/primitives";
import { LIST_ROW, TONE_ICON_TILE } from "@/lib/uiTokens";

export const CONTRIBUTORS = [...data.contributors].sort((a, b) => b.commits - a.commits);
export const CONTRIBUTORS_AS_OF = data.asOf;

/** GitHub avatar, or the initial when offline or blocked. */
function Avatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <span
        aria-hidden
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border-ink font-display text-sm font-bold ${TONE_ICON_TILE.indigo}`}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-full border-2 border-border-ink object-cover"
    />
  );
}

/**
 * The people who wrote AmazeCC, most commits first (owner: list the
 * contributors, at least the top five). A snapshot of the GitHub contributor
 * lists in `data/contributors.json`, so the page works offline and makes no
 * call to GitHub on open.
 */
export default function ContributorList({ limit }: { limit?: number }) {
  const list = limit ? CONTRIBUTORS.slice(0, limit) : CONTRIBUTORS;
  return (
    <ListShell>
      {list.map((c, i) => (
        <div key={c.login} className={LIST_ROW}>
          <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-text-muted" aria-hidden>
            {i + 1}
          </span>
          <Avatar src={c.avatar} name={c.name} />
          <ListRowText title={c.name} subtitle={`${c.role} · ${c.commits.toLocaleString("en-IN")} commits`} />
          <IconLink
            href={`https://github.com/${c.login}`}
            title={`@${c.login} on GitHub`}
            ariaLabel={`Open ${c.name}'s GitHub profile`}
          >
            <Github className="h-4 w-4" />
          </IconLink>
        </div>
      ))}
    </ListShell>
  );
}
