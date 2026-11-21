import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAppAppearance } from "../components/custom/app/useAppAppearance";
import { StatTile } from "../components/custom/shared/primitives/Surfaces";
import { privacyCategories, setHideAllPrivacy, togglePrivacyCategory } from "../lib/privacyMode";
import { defaultSettings } from "../store/settingsAtoms";

describe("privacy mode", () => {
  it("privacy mode toggles only the CGPA class on <html> (owner: merged with Hide CGPA)", () => {
    const { rerender } = renderHook(({ on }) => useAppAppearance({ privacyMode: on }, "dark"), {
      initialProps: { on: true },
    });
    expect(document.documentElement.classList.contains("privacy-hide-cgpa")).toBe(true);
    expect(document.documentElement.classList.contains("privacy-mode")).toBe(false);
    rerender({ on: false });
    expect(document.documentElement.classList.contains("privacy-hide-cgpa")).toBe(false);
  });

  it("marks stat tile values as private", () => {
    const { getByText } = render(<StatTile label="CGPA" value="8.91" privacyCategory="cgpa" />);
    expect(getByText("8.91").getAttribute("data-private")).toBe("cgpa");
  });

  it("ignores saved non-CGPA categories", () => {
    const { unmount } = renderHook(() => useAppAppearance({ privacyMode: true, privacyCategories: ["fees"] }, "dark"));
    expect(document.documentElement.classList.contains("privacy-hide-fees")).toBe(false);
    expect(document.documentElement.classList.contains("privacy-hide-cgpa")).toBe(true);
    unmount();
  });

  it("migrates legacy privacy choices without exposing their values", () => {
    // User decision (2026-11-19): Privacy Mode hides CGPA unless more is chosen.
    expect(privacyCategories({ privacyMode: true })).toEqual(["cgpa"]);
    expect(privacyCategories({ CGPAHidden: true })).toEqual(["cgpa"]);
  });

  it("every switch is the same CGPA switch", () => {
    expect(setHideAllPrivacy(defaultSettings, true).privacyCategories).toEqual(["cgpa"]);
    expect(togglePrivacyCategory(defaultSettings, "fees", true).privacyMode).toBe(true);
    expect(togglePrivacyCategory({ ...defaultSettings, privacyMode: true }, "cgpa", false).privacyMode).toBe(false);
  });
});

import { setPrivacyMode } from "../lib/privacyMode";

describe("privacy master switch", () => {
  it("on hides CGPA only; off hides nothing", () => {
    const on = setPrivacyMode({ ...defaultSettings, privacyCategories: ["fees"] }, true);
    expect(on.privacyCategories).toEqual(["cgpa"]);
    const off = setPrivacyMode(on, false);
    expect(off.privacyMode).toBe(false);
    expect(privacyCategories(off)).toEqual([]);
  });
});
