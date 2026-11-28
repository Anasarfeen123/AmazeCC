import { describe, expect, it, vi } from "vitest";

// The op calls the social client (Amaze ID token + VTOP session) rather than
// the engine's generic request; mock that boundary.
const syncIdentity = vi.fn();
vi.mock("../lib/social/client", () => ({ syncIdentity: (...a: unknown[]) => syncIdentity(...a) }));

import { getOp } from "../lib/sync-engine/operation-registry";
import "../lib/sync-engine/operations";
import {
  appendSyncLine,
  ensureSyncSession,
  getSyncSessionSnapshot,
  handleEngineProgressEvent,
} from "../lib/sync-engine/sync-session";

/**
 * The `social` op is the only one that sits in the middle of both `Main.tsx`
 * background chains, which `await` ops sequentially inside a single `try`. If it
 * threw, every op after it would be skipped — in chain 1 that was still `buses`
 * and `bulk`. So "never throws" is a contract, not a style preference, and it is
 * asserted here rather than left to review.
 */
function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    ids: { VtopUsername: "realuser", VtopPassword: "x" },
    emit: vi.fn(),
    bridge: { setAtom: vi.fn(), getAtom: vi.fn() },
    request: vi.fn(),
    ...overrides,
  } as never;
}

const OK_RESPONSE = {
  success: true,
  identity: {
    ownerKey: "abc123",
    handle: "AMZ-7K2P-9RTW",
    displayName: "Test Student",
    semesterId: "CH20262701",
    semesterLabel: "Fall Semester 2026-27",
    derivedAt: "2026-01-01T00:00:00.000Z",
    slotmapVersion: "da7f36288409c5fa",
  },
  semesterSource: "proposed_validated",
  version: 4,
  busyMap: { "MON:A1": { c: "BACSE101", t: "Course", v: "AB1-607" } },
  courses: [],
  peers: [
    {
      handle: "AMZ-AAAA-BBBB",
      name: "Peer",
      visibility: "coarse",
      shared: true,
      lastPublishedAt: null,
      semesterId: null,
      isSelf: false,
    },
  ],
  grantSecrets: [
    {
      grantId: "gr_1",
      secret: "s".repeat(43),
      peerHandle: "AMZ-AAAA-BBBB",
      visibility: "coarse",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

describe("social op registration", () => {
  it("is registered under the name the chains call", () => {
    expect(getOp("social")).toBeDefined();
    expect(getOp("social")?.auth).toBe("vtop");
  });
});

describe("social op demo guard", () => {
  it("bails without a request when the username is demo", async () => {
    const ctx = makeCtx({ ids: { VtopUsername: "demo", VtopPassword: "x" } });
    const res = await getOp("social")!.run(ctx, {});
    expect(res).toBeNull();
    // DEMO123 is not a real session, so calling through would 401.
    expect((ctx as never as { request: ReturnType<typeof vi.fn> }).request).not.toHaveBeenCalled();
  });

  it("bails when demoMode is passed even with a real username", async () => {
    const ctx = makeCtx();
    const res = await getOp("social")!.run(ctx, { demoMode: true });
    expect(res).toBeNull();
    expect((ctx as never as { request: ReturnType<typeof vi.fn> }).request).not.toHaveBeenCalled();
  });

  it("bails on the DEMO123 authorized id", async () => {
    const ctx = makeCtx({ ids: { VtopUsername: "DEMO123", VtopPassword: "" } });
    expect(await getOp("social")!.run(ctx, {})).toBeNull();
  });
});

describe("social op request", () => {
  it("sends the proposed semester", async () => {
    syncIdentity.mockResolvedValue(OK_RESPONSE);
    await getOp("social")!.run(makeCtx(), { proposedSemesterId: "CH20262701" });
    expect(syncIdentity).toHaveBeenLastCalledWith("CH20262701");
  });

  it("accepts semesterId as an alias, since the chains disagree on the name", async () => {
    syncIdentity.mockResolvedValue(OK_RESPONSE);
    await getOp("social")!.run(makeCtx(), { semesterId: "CH20262701" });
    expect(syncIdentity).toHaveBeenLastCalledWith("CH20262701");
  });

  it("sends no term rather than a malformed one when none is known", async () => {
    syncIdentity.mockResolvedValue(OK_RESPONSE);
    await getOp("social")!.run(makeCtx(), {});
    expect(syncIdentity).toHaveBeenLastCalledWith(undefined);
  });
});

describe("social op never throws", () => {
  it("returns null on a network failure instead of rejecting", async () => {
    syncIdentity.mockImplementation(async () => {
      throw new Error("ECONNRESET");
    });
    await expect(getOp("social")!.run(makeCtx(), {})).resolves.toBeNull();
  });

  it("returns null on a 401 and keeps the cached copy", async () => {
    syncIdentity.mockImplementation(async () => {
      throw new Error("vtop_session_expired");
    });
    const setAtom = vi.fn();
    await expect(getOp("social")!.run(makeCtx({ bridge: { setAtom, getAtom: vi.fn() } }), {})).resolves.toBeNull();
    // A failed push must not read as "you have no friends": the error is
    // recorded, but no atom is blanked.
    expect(setAtom).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ lastError: expect.any(String) }));
  });

  it("returns null when the server reports failure", async () => {
    syncIdentity.mockResolvedValue({ success: false, error: "vtop_identity_unresolved" });
    await expect(getOp("social")!.run(makeCtx(), {})).resolves.toBeNull();
  });

  it("returns null when the payload has no identity", async () => {
    syncIdentity.mockResolvedValue({ success: true });
    await expect(getOp("social")!.run(makeCtx(), {})).resolves.toBeNull();
  });
});

describe("social op writes", () => {
  it("pushes identity, peers and grants into atoms", async () => {
    const setAtom = vi.fn();
    syncIdentity.mockResolvedValue(OK_RESPONSE);
    await getOp("social")!.run(makeCtx({ bridge: { setAtom, getAtom: vi.fn() } }), {});
    const values = setAtom.mock.calls.map((c) => c[1]);
    expect(values).toContainEqual(OK_RESPONSE.identity);
    expect(values).toContainEqual(OK_RESPONSE.peers);
    expect(values).toContainEqual(OK_RESPONSE.grantSecrets);
    expect(values).toContainEqual(OK_RESPONSE.busyMap);
  });

  it("records the version and a clean error state on success", async () => {
    const setAtom = vi.fn();
    syncIdentity.mockResolvedValue(OK_RESPONSE);
    await getOp("social")!.run(makeCtx({ bridge: { setAtom, getAtom: vi.fn() } }), {});
    const state = setAtom.mock.calls
      .map((c) => c[1])
      .filter((v) => v && "version" in v)
      .at(-1);
    expect(state.version).toBe(4);
    expect(state.lastError).toBeNull();
    expect(state.lastSyncedAt).toEqual(expect.any(String));
  });
});

describe("social op label", () => {
  it("shows a human label rather than the raw op name", () => {
    ensureSyncSession("VTOP Sync");
    handleEngineProgressEvent({ op: "social", phase: "done" });
    const lines = getSyncSessionSnapshot().lines;
    const last = lines[lines.length - 1];
    // Without an OP_LABELS entry the sheet prints the literal string "social".
    expect(last.text).toContain("Friends & groups");
    expect(last.text).not.toContain("social fetched");
  });

  it("surfaces a failure without wiping the sheet", () => {
    ensureSyncSession("VTOP Sync");
    appendSyncLine("earlier line", "success");
    handleEngineProgressEvent({
      op: "social",
      phase: "error",
      error: { kind: "transient", message: "HTTP 500", retryAfterMs: 1000 },
    });
    const lines = getSyncSessionSnapshot().lines;
    expect(lines[lines.length - 1].status).toBe("error");
    expect(lines.some((l) => l.text === "earlier line")).toBe(true);
  });
});
