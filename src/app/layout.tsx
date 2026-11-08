import * as React from "react";
import Script from "next/script";
import { ThemeProvider } from "@amazecontinuityprojects/amazeui";
import { GoogleAnalytics } from "@next/third-parties/google";
import IconUpdater from "../components/custom/IconUpdater";
import ServiceWorkerRegistrar from "../components/custom/ServiceWorkerRegistrar";
import BackgroundPrefetch from "../components/custom/BackgroundPrefetch";
import type { Viewport, Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ weight: "variable", subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  // Phones render at 100%: the Calm Notebook type scale (14–16px body, 12px
  // minimum metadata, 44px touch targets) is sized for 1:1 CSS pixels. An 85%
  // starting zoom was used before and made every screen ~15% smaller than
  // designed, so it was removed. Pinch and browser zoom still work, and
  // desktop browsers ignore this tag.
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
const APP_DESCRIPTION =
  "Elevate your university life with seamless timetable syncing, attendance tracking, and smart grade calculations.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: "%s - AmazeCC App",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
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
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <Script
          id="amaze-session-early-detect"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem("IDs"),u=localStorage.getItem("username"),m=localStorage.getItem("demoMode");var s=false;if(d){try{var p=JSON.parse(d);if(p&&p.VtopUsername&&p.VtopPassword)s=true;}catch(e){}}if(!s&&u&&localStorage.getItem("password"))s=true;if(!s&&m==="true")s=true;if(s){document.documentElement.classList.add("has-stored-session");}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased font-sans">
        <IconUpdater />
        <ServiceWorkerRegistrar />
        <BackgroundPrefetch />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          value={{ light: "light", dark: "dark" }}
        >
          {children}
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-HGB7VDJKX0" />
    </html>
  );
}
