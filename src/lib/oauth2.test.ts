import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
vi.mock("./dpop", () => ({
  dpopProof: vi.fn().mockResolvedValue("test-dpop-proof"),
  dpopThumbprint: vi.fn().mockResolvedValue("test-thumbprint"),
}));

import { createPkcePair, getAccessTokenSync, OIDC } from "./oauth2";
import { webcrypto } from "node:crypto";

const fetchMock = vi.fn();

// Node's test environment provides WebCrypto via globalThis.crypto in Node 20+,
// but be explicit so this suite also runs on older engines.
if (!globalThis.crypto?.subtle) {
  (globalThis as Record<string, unknown>).crypto = webcrypto;
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("oauth2 PKCE helpers", () => {
  it("produces a verifier/challenge pair where challenge = base64url(sha256(verifier))", async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{60,70}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const bytes = new Uint8Array(digest);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const expected = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(challenge).toBe(expected);
  });

  it("never produces the same verifier twice", async () => {
    const a = await createPkcePair();
    const b = await createPkcePair();
    expect(a.verifier).not.toBe(b.verifier);
  });

  it("requests only scopes registered for the AmazeCC web client", () => {
    expect(OIDC.scope).toBe("openid profile email offline_access");
  });

  it("getAccessTokenSync returns null when there is no stored token", () => {
    expect(getAccessTokenSync()).toBeNull();
  });

  it("refreshes an expired access token with DPoP and stores the rotated refresh token", async () => {
    localStorage.setItem("amaze_oidc_access_token", "expired-access");
    localStorage.setItem("amaze_oidc_expires_at", String(Date.now() - 1));
    localStorage.setItem("amaze_oidc_refresh_token", "refresh-token");
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "fresh-access",
          refresh_token: "rotated-refresh",
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );

    const { getValidAccessToken } = await import("./oauth2");
    await expect(getValidAccessToken()).resolves.toBe("fresh-access");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(OIDC.tokenEndpoint);
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>).dpop).toBe("test-dpop-proof");
    expect(new URLSearchParams(options.body as string).get("grant_type")).toBe("refresh_token");
    expect(new URLSearchParams(options.body as string).get("refresh_token")).toBe("refresh-token");
    expect(localStorage.getItem("amaze_oidc_access_token")).toBe("fresh-access");
    expect(localStorage.getItem("amaze_oidc_refresh_token")).toBe("rotated-refresh");
  });

  it("clears tokens when the refresh token is rejected", async () => {
    localStorage.setItem("amaze_oidc_access_token", "expired-access");
    localStorage.setItem("amaze_oidc_expires_at", String(Date.now() - 1));
    localStorage.setItem("amaze_oidc_refresh_token", "revoked-refresh");
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    const { getValidAccessToken } = await import("./oauth2");
    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(localStorage.getItem("amaze_oidc_access_token")).toBeNull();
    expect(localStorage.getItem("amaze_oidc_refresh_token")).toBeNull();
  });
});
