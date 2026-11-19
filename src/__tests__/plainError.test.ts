import { describe, expect, it } from "vitest";
import { plainErrorMessage } from "@/lib/plainError";

describe("plainErrorMessage", () => {
  it("translates network failures", () => {
    expect(plainErrorMessage(new TypeError("Failed to fetch"))).toMatch(/Couldn't reach the server/);
    expect(plainErrorMessage("Load failed")).toMatch(/Couldn't reach/);
  });
  it("reads status codes before 'failed to fetch'", () => {
    expect(plainErrorMessage(new Error("Server error 500 (club-admin/feed)"))).toMatch(/server had a problem/);
    expect(plainErrorMessage(new Error("Failed to fetch faculty list: API returned 404"))).toMatch(/isn't available/);
    expect(plainErrorMessage("HTTP 401")).toMatch(/sign-in has expired/);
    expect(plainErrorMessage("status 429")).toMatch(/Too many tries/);
  });
  it("hides parse and payload errors", () => {
    expect(plainErrorMessage(new SyntaxError("Unexpected token < in JSON at position 0"))).toMatch(/couldn't read/);
    expect(plainErrorMessage(new Error("Invalid profile payload"))).toMatch(/couldn't read/);
  });
  it("uses the fallback for other technical text", () => {
    expect(plainErrorMessage(new TypeError("Cannot read properties of undefined"), "Could not load.")).toBe(
      "Could not load.",
    );
  });
  it("passes through messages already written for people", () => {
    expect(plainErrorMessage(new Error("That room is already booked."))).toBe("That room is already booked.");
  });
  it("handles empty input", () => {
    expect(plainErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
