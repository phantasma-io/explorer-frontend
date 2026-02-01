import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrimaryNav } from "@/components/primary-nav";

let currentPath = "/blocks";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
}));

describe("PrimaryNav", () => {
  it("renders the main navigation links", () => {
    /* Behavior: nav renders every primary list route.
       Expected: links for blocks, transactions, events, contracts, tokens, series, and NFTs exist. */
    currentPath = "/blocks";
    render(<PrimaryNav />);

    expect(screen.getByRole("link", { name: "blocks" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "transactions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "events" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "contracts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "tokens" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "series" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "nfts" })).toBeInTheDocument();
  });

  it("highlights the active route", () => {
    /* Behavior: current path matches one nav item.
       Expected: that link is styled as active while others are muted. */
    currentPath = "/blocks";
    render(<PrimaryNav />);

    const activeLink = screen.getByRole("link", { name: "blocks" });
    const inactiveLink = screen.getByRole("link", { name: "transactions" });

    expect(activeLink.className).toContain("text-foreground");
    expect(inactiveLink.className).toContain("text-muted-foreground");
  });
});
