import { describe, expect, it } from "vitest";
import { resolveLegacyRedirect } from "@/lib/legacy-compat/resolve-redirect";

const toUrl = (path: string) => new URL(`https://explorer.example${path}`);

describe("resolveLegacyRedirect", () => {
  it("maps query-based token links to canonical token route and preserves non-id query", () => {
    /* Behavior: old token links use `/token?id=...` + optional tabs.
       Expected: redirect to `/token/<symbol>` while preserving `tab`. */
    const target = resolveLegacyRedirect(toUrl("/token?id=SOUL&tab=holders"));
    expect(target).toEqual({ pathname: "/token/SOUL", search: "?tab=holders" });
  });

  it("maps query-based transaction links to /tx route", () => {
    /* Behavior: old transaction links use `/transaction?id=<hash>`.
       Expected: redirect to canonical `/tx/<hash>`. */
    const target = resolveLegacyRedirect(toUrl("/transaction?id=ABC123"));
    expect(target).toEqual({ pathname: "/tx/ABC123", search: "" });
  });

  it("maps path-style transaction links to /tx route", () => {
    /* Behavior: old links may contain `/transaction/<hash>`.
       Expected: redirect to `/tx/<hash>` and keep query params untouched. */
    const target = resolveLegacyRedirect(toUrl("/transaction/ABC123?tab=overview"));
    expect(target).toEqual({ pathname: "/tx/ABC123", search: "?tab=overview" });
  });

  it("maps locale-prefixed query links and strips locale prefix", () => {
    /* Behavior: legacy localized links were `/<locale>/token?id=...`.
       Expected: locale stripped, canonical route used, extra query retained. */
    const target = resolveLegacyRedirect(toUrl("/de/token?id=soul&tab=overview"));
    expect(target).toEqual({ pathname: "/token/soul", search: "?tab=overview" });
  });

  it("strips locale for already path-based legacy links", () => {
    /* Behavior: localized links can already have canonical path payload.
       Expected: keep route payload and remove only locale prefix. */
    const target = resolveLegacyRedirect(toUrl("/en/token/SOUL?tab=holders"));
    expect(target).toEqual({ pathname: "/token/SOUL", search: "?tab=holders" });
  });

  it("strips legacy locale root to home", () => {
    /* Behavior: old localized home links look like `/en`.
       Expected: redirect to locale-less `/`. */
    const target = resolveLegacyRedirect(toUrl("/en"));
    expect(target).toEqual({ pathname: "/", search: "" });
  });

  it("does not redirect canonical modern links", () => {
    /* Behavior: canonical modern links should pass through untouched.
       Expected: no redirect target. */
    const target = resolveLegacyRedirect(toUrl("/token/SOUL?tab=holders"));
    expect(target).toBeNull();
  });
});

