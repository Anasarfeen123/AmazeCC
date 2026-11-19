import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings, settingsStorage } from "@/store/settingsAtoms";

// Students dislike their VTOP photo: the logo is the default, and a saved
// `showProfilePhoto: true` from the old default does not count as a choice.
describe("profile photo default", () => {
  beforeEach(() => localStorage.clear());
  const read = () => settingsStorage.getItem("settings", defaultSettings);

  it("is off for a new install", () => {
    expect(read().showProfilePhoto).toBe(false);
  });

  it("ignores the old default true when the student never chose", () => {
    localStorage.setItem("settings", JSON.stringify({ showProfilePhoto: true }));
    expect(read().showProfilePhoto).toBe(false);
  });

  it("keeps an explicit choice", () => {
    localStorage.setItem("settings", JSON.stringify({ showProfilePhoto: true, profilePhotoChosen: true }));
    expect(read().showProfilePhoto).toBe(true);
  });
});
