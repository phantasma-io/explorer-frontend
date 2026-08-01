import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetadataBlock } from "@/components/metadata-block";
import { vmValueText } from "@/lib/utils/vm-value";

describe("VM value rendering", () => {
  it("renders a struct's fields instead of a serialized document", () => {
    // SOUL's `_ia` is an array of inflation targets. Printing it as JSON would hand the
    // reader a blob for exactly the value that carries the most meaning, so every field
    // has to be reachable as its own labelled entry.
    render(
      <MetadataBlock
        title="Token metadata"
        metadata={{
          _ia: [{ mul: "25", div: "10000", who: ["64D5"] }],
          name: "Phantasma Stake",
        }}
      />,
    );

    expect(screen.getByText("mul")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("div")).toBeInTheDocument();
    expect(screen.getByText("10000")).toBeInTheDocument();
    expect(screen.getByText("64D5")).toBeInTheDocument();
    expect(screen.getByText("Phantasma Stake")).toBeInTheDocument();
    // A struct rendered as text would show up with its punctuation intact.
    expect(screen.queryByText(/^\{"mul"/)).toBeNull();
  });

  it("reports a scalar only for a scalar value", () => {
    // Callers feed URLs and numeric parses; a struct has no faithful string form, so it
    // must read as absent rather than as a serialized document.
    expect(vmValueText("https://example.test/nft.png")).toBe("https://example.test/nft.png");
    expect(vmValueText("  ")).toBeNull();
    expect(vmValueText(["first", "second"])).toBeNull();
    expect(vmValueText({ mul: "25" })).toBeNull();
    expect(vmValueText(undefined)).toBeNull();
  });
});
