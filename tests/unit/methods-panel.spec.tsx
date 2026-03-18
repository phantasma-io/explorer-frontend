import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MethodsPanel } from "@/components/methods-panel";

describe("MethodsPanel", () => {
  it("renders ABI-style signatures with parameter names and types", () => {
    render(
      <MethodsPanel
        methods={[
          {
            name: "transfer",
            returnType: "Bool",
            parameters: [
              { name: "from", type: "Address" },
              { name: "to", type: "Address" },
              { name: "amount", type: "Number" },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByText((_, node) =>
        node?.textContent === "transfer(from: Address, to: Address, amount: Number)"
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Bool")).toBeInTheDocument();
    expect(screen.getAllByText("from")).toHaveLength(2);
    expect(screen.getAllByText("Address")).toHaveLength(4);
    expect(screen.getAllByText("amount")).toHaveLength(2);
    expect(screen.getAllByText("Number")).toHaveLength(2);
  });

  it("renders contract-specific empty state when no methods are available", () => {
    render(<MethodsPanel methods={[]} />);

    expect(screen.getByText("no_methods")).toBeInTheDocument();
  });
});
