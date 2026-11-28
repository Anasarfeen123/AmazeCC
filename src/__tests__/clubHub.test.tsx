import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sync-engine", () => ({ api }));
vi.mock("@/lib/demoDates", () => ({ isDemoSession: () => false }));

import ClubHubTab from "../components/custom/clubs/ClubHubTab";

describe("Club Hub public directory", () => {
  beforeEach(() => api.mockReset());
  afterEach(cleanup);

  it("uses the supported public endpoint without calling the removed enrollment route", async () => {
    api.mockResolvedValue({
      success: true,
      clubs: [{ club_id: "club-1", club_name: "Debate Society", mission: "Debate together" }],
    });

    render(<ClubHubTab IDs={{ VtopUsername: "student" }} />);

    expect(await screen.findByText("Debate Society")).toBeTruthy();
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith("clubs/details");
  });

  it("surfaces API error envelopes rather than showing an empty directory", async () => {
    api.mockResolvedValue({ success: false, error: "Club database unavailable" });

    render(<ClubHubTab IDs={{ VtopUsername: "student" }} />);

    expect(await screen.findByText("Couldn't load the club directory")).toBeTruthy();
    expect(screen.getByText("Club database unavailable")).toBeTruthy();
  });
});
