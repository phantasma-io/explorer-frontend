import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFoundPanel } from "@/components/not-found-panel";

describe("NotFoundPanel", () => {
  it("renders default text and actions", () => {
    /* Behavior: render not-found UI with default copy and actions.
       Expected: heading uses i18n key, description shown, and action buttons exist. */
    render(<NotFoundPanel />);

    expect(screen.getByRole("heading", { name: "not-found" })).toBeInTheDocument();
    expect(screen.getByText("The requested item could not be found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });
});
