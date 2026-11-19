import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import IconUpdater from "../components/custom/IconUpdater";

vi.mock("@/lib/storage", () => ({ getTypedStorageItem: () => "fire" }));

afterEach(() => {
  cleanup();
  document.head.innerHTML = "";
  window.history.replaceState({}, "", "/");
});

describe("app icons", () => {
  it("uses matching brand assets and the FFCS manifest on the planner", () => {
    window.history.replaceState({}, "", "/ffcs/");
    document.head.innerHTML =
      '<link rel="icon" type="image/svg+xml"><link rel="icon" sizes="96x96" type="image/png"><link rel="apple-touch-icon"><link rel="manifest">';
    render(<IconUpdater />);
    expect(document.querySelector('link[type="image/svg+xml"]')?.getAttribute("href")).toBe("/favicon/favicon.svg");
    expect(document.querySelector('link[sizes="96x96"]')?.getAttribute("href")).toBe("/favicon/favicon-96x96.png");
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href")).toBe(
      "/favicon/apple-touch-icon.png",
    );
    expect(document.querySelector('link[rel="manifest"]')?.getAttribute("href")).toBe("/ffcs-manifest.json");
  });

  it("retains the chosen alternate icon on the main app", () => {
    document.head.innerHTML = '<link rel="icon"><link rel="manifest">';
    render(<IconUpdater />);
    expect(document.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe("/images/icons/fire.png");
    expect(document.querySelector('link[rel="manifest"]')?.getAttribute("href")).toBe("/manifest-fire.json");
  });
});
