"use client";

import AppLoading from "@/components/custom/shared/AppLoading";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { demoModeAtom, isLoggedInAtom, showIntroAtom } from "@/store";
import AppIntroExperience from "./AppIntroExperience";
import { useDashboardScreenHistory } from "../dashboard/useDashboardScreenHistory";
import type { IntroLogin } from "../onboarding/OnboardingIntro";
import { SIGN_IN_PARAM } from "@/lib/signInReturn";
import { getAssetPath } from "@/lib/utils";
import AppIconBadge from "./AppIconBadge";

function WorkspaceLoading() {
  return <AppLoading />;
}

const DashboardContent = dynamic(() => import("../Dashboard"), { loading: WorkspaceLoading });

interface AuthenticatedWorkspaceProps {
  handleLogOutRequest: () => void;
  handleReloadRequest: (semesterId?: string, modeId?: string) => Promise<void>;
  loginToVTOP: () => Promise<any>;
  handleLogin: (semesterId?: string, ids?: any) => Promise<any>;
  onOpenCommandPalette: () => void;
  onOpenShortcutsHelp: () => void;
  onRunSyncMode: (modeId: string) => void;
  /** First-run sign-in / sync / welcome screens that precede the onboarding steps. */
  intro?: {
    initialPhase: "login" | "welcome";
    login: IntroLogin;
  };
}

/** Owns the signed-in experience boundary and its dashboard history wiring. */
export default function AuthenticatedWorkspace(props: AuthenticatedWorkspaceProps) {
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const demoMode = useAtomValue(demoModeAtom);
  const showIntro = useAtomValue(showIntroAtom);
  const { goBack, collapseLastScreenChange } = useDashboardScreenHistory();

  // The intro hero owns sign-in, the first full sync and onboarding, so it is
  // shown whenever there is no session yet — not only on a literal first run
  // (`showIntro`). "Get Started" therefore lands straight on it.
  const runIntro = showIntro === true || (!isLoggedIn && !demoMode);

  // Once the hero has taken over it must not be yanked away mid-flight: the
  // first login flips `isLoggedIn`, which would otherwise swap the sync screen
  // for the dashboard. Only the hero's own completion hands control back.
  const [introActive, setIntroActive] = useState(false);
  useEffect(() => {
    if (runIntro) setIntroActive(true);
  }, [runIntro]);
  const showHero = runIntro || introActive;

  if (showHero) {
    return (
      <AppIntroExperience
        handleReloadRequest={props.handleReloadRequest}
        onOpenCommandPalette={props.onOpenCommandPalette}
        intro={props.intro}
        onFinished={() => setIntroActive(false)}
      />
    );
  }

  return (
    <>
      {demoMode && (
        // The demo banner carries the way out (user: "the top bar should have
        // option to sign in or leave demo"). Leaving clears the demo through the
        // normal sign-out (back to the landing page); Sign in does the same,
        // then opens the sign-in form (/?signin=1).
        <div
          role="status"
          className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b-2 sm:justify-center border-border-ink bg-highlight px-3 py-2 text-sm text-highlight-foreground md:pl-[88px] lg:pl-[296px]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded-[6px] border-2 border-border-ink bg-text-primary px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-background">
              Demo
            </span>
            <span className="text-[13px] leading-tight">
              Sample data<span className="hidden sm:inline">, not your records</span>.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                props.handleLogOutRequest();
                window.location.assign(getAssetPath(`/?${SIGN_IN_PARAM}=1`));
              }}
              className="inline-flex min-h-9 items-center rounded-[8px] border-2 border-border-ink bg-primary px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-sm brutal-press"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => props.handleLogOutRequest()}
              className="inline-flex min-h-9 items-center rounded-[8px] border-2 border-border-ink bg-surface px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-primary"
            >
              Leave demo
            </button>
          </span>
        </div>
      )}
      <DashboardContent
        demoMode={demoMode}
        handleLogOutRequest={props.handleLogOutRequest}
        handleReloadRequest={props.handleReloadRequest}
        loginToVTOP={props.loginToVTOP}
        handleLogin={props.handleLogin}
        onOpenCommandPalette={props.onOpenCommandPalette}
        onOpenShortcutsHelp={props.onOpenShortcutsHelp}
        onSystemBack={goBack}
        onCollapseScreenChange={collapseLastScreenChange}
        onRunSyncMode={props.onRunSyncMode}
      />
      {/* Number on the installed app icon (renders nothing). */}
      <AppIconBadge />
    </>
  );
}
