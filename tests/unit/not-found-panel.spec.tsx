import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFoundPanel } from "@/components/not-found-panel";

describe("NotFoundPanel", () => {
  it("renders default text and actions", () => {
    /* Behavior: render not-found UI with default copy and actions.
       Expected: heading uses i18n key, description shown, and action buttons exist. */
    render(<NotFoundPanel />);

    expect(screen.getByRole("heading", { name: "not-found" })).toBeInTheDocument();
    expect(screen.getByText("not_found_generic")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "back_to_home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "refresh" })).toBeInTheDocument();
  });
});
