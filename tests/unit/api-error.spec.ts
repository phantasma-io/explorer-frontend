import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExplorerConfig } from "@/lib/config";
import { ApiError, fetchJson, isNotFoundError } from "@/lib/api/fetcher";

vi.mock("@/lib/config", async () => {
  const actual = await vi.importActual<typeof import("@/lib/config")>("@/lib/config");
  return {
    ...actual,
    getExplorerConfig: vi.fn(async () =>
      ({
        ...actual.DEFAULT_EXPLORER_CONFIG,
        apiBaseUrl: "http://localhost:8000/api/v1",
      }) as ExplorerConfig
    ),
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("throws ApiError with status for non-OK responses", async () => {
    /* Behavior: fetchJson receives a non-OK response.
       Expected: it throws ApiError carrying status and resolved URL. */
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchJson("/transactions")).rejects.toMatchObject({
      status: 404,
      url: "http://localhost:8000/api/v1/transactions",
    });
  });

  it("recognizes not-found errors explicitly", () => {
    /* Behavior: code inspects ApiError instances.
       Expected: 404 errors are tagged as not-found while others are not. */
    const notFound = new ApiError("Missing", 404, "http://localhost:8000/api/v1/tx/1");
    const serverError = new ApiError("Server", 500, "http://localhost:8000/api/v1/tx/1");

    expect(isNotFoundError(notFound)).toBe(true);
    expect(isNotFoundError(serverError)).toBe(false);
  });
});
