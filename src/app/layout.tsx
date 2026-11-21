import * as React from "react";
import { ThemeProvider } from "@amazecontinuityprojects/amazeui";
import UiSizeSync from "@/components/custom/theme/UiSizeSync";
import NightThemeSync from "@/components/custom/theme/NightThemeSync";
import GrawlixTagger from "@/components/custom/theme/GrawlixTagger";
import { GoogleAnalytics } from "@next/third-parties/google";
import IconUpdater from "../components/custom/IconUpdater";
import ServiceWorkerRegistrar from "../components/custom/ServiceWorkerRegistrar";
import BackgroundPrefetch from "../components/custom/BackgroundPrefetch";
import type { Viewport, Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { buildContentSecurityPolicy } from "@/lib/csp";

const geist = Geist({ weight: "variable", subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});
// Display face for titles and hero numbers (brand spec). Wired to
// `--font-display` / `font-outfit` in brand.css.
const spaceGrotesk = Space_Grotesk({
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});
// The brand's mono face (titles, hero numbers, labels, metadata), matching the
// user's reference mocks. Wired to --font-display / --font-mono in brand.css.
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-mono",
});
const dmSans = DM_Sans({
  weight: "variable",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F1E6" },
    { media: "(prefers-color-scheme: dark)", color: "#001E1D" },
  ],
  width: "device-width",
  // 1.0 since the brand redesign (was 0.85). At 85% every size in the type
  // scale shrank too: the spec's 12px floor rendered at ~10px and 44px touch
  // targets at ~37px. Density now comes from layout (fewer nested boxes), not
  // from scaling the whole page. Breakpoints are back to stock Tailwind
  // (sm 640 · md 768 · lg 1024) in device px.
  initialScale: 1,
  // Pinching/zooming is left enabled on purpose: locking it (maximumScale 1 /
  // userScalable false) fails WCAG 1.4.4 and iOS ignores the lock anyway —
  // it only ever disabled zoom for Android users.
  // Without this every env(safe-area-inset-*) in the app resolves to 0px on
  // iOS, so the bottom nav, sheets and docked bars can sit under the home
  // indicator and the notch.
  viewportFit: "cover",
};

const APP_NAME = "AmazeCC";
const APP_DESCRIPTION = "Attendance, marks, timetable and campus tools for VIT Chennai students, in one free app.";

// Same prefix as next.config basePath (empty on amazecc.com); metadata URLs
// are not prefixed by Next, so they carry it themselves.
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: "%s - AmazeCC App",
  },
  description: APP_DESCRIPTION,
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon/favicon.ico` },
      { url: `${BASE_PATH}/favicon/favicon-96x96.png`, sizes: "96x96", type: "image/png" },
      { url: `${BASE_PATH}/favicon/favicon.svg`, type: "image/svg+xml" },
    ],
    shortcut: `${BASE_PATH}/favicon/favicon.ico`,
    apple: `${BASE_PATH}/favicon/apple-touch-icon.png`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.className} ${geistMono.className} ${dmSans.className} ${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        {/* AmazeCC has its own light/dark/Night themes. This tells the Dark Reader
            extension to leave the page alone; its rewrites of SVG attributes
            caused hydration-mismatch errors (user report, 2026-11-20). */}
        <meta name="darkreader-lock" />
        {/* Production only: Next.js dev mode needs eval for fast refresh. See lib/csp.ts. */}
        {process.env.NODE_ENV === "production" && (
          <meta httpEquiv="Content-Security-Policy" content={buildContentSecurityPolicy()} />
        )}
        <script
          id="amaze-night-theme-early"
          // Before first paint, so the Night theme does not flash obsidian.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=document.documentElement;var t=localStorage.getItem("theme");if(t==="night"||!t)h.classList.add("night");var st=JSON.parse(localStorage.getItem("settings")||"{}");if(st&&(st.uiSize==="compact"||st.uiSize==="large"))h.setAttribute("data-ui-size",st.uiSize);}catch(e){}})();`,
          }}
        />
        <script
          id="amaze-session-early-detect"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem("IDs"),u=localStorage.getItem("username"),m=localStorage.getItem("demoMode");var s=false;if(d){try{var p=JSON.parse(d);if(p&&p.VtopUsername&&p.VtopPassword)s=true;}catch(e){}}if(!s&&u&&localStorage.getItem("password"))s=true;if(!s&&localStorage.getItem("cred_vault_session")==="1")s=true;if(!s&&m==="true")s=true;if(s){document.documentElement.classList.add("has-stored-session");}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased font-sans">
        <IconUpdater />
        <ServiceWorkerRegistrar />
        <BackgroundPrefetch />
        <ThemeProvider
          attribute="class"
          // New visitors start in Night, the deeper dark (owner, 2026-11-21).
          defaultTheme="night"
          enableSystem={false}
          disableTransitionOnChange
          themes={["light", "dark", "night"]}
          // "night" (super dark) rides on the dark class; NightThemeSync adds
          // the extra `night` class that swaps the page tokens.
          value={{ light: "light", dark: "dark", night: "dark" }}
        >
          <NightThemeSync />
          <UiSizeSync />
          <GrawlixTagger />
          {children}
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-HGB7VDJKX0" />
    </html>
  );
}
