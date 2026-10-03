import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventLine } from "@/components/event-line";

describe("EventLine", () => {
  // A TokenCreate event of the main chain up to block 6,422,526 has the token symbol in
  // `string_event` and in `token_create_event.token`. The details show the symbol once.
  it("shows a text once when two fields of the event carry it", () => {
    render(
      <EventLine
        event={{
          event_kind: "TokenCreate",
          address: "P2KCreator",
          string_event: { string_value: "OLDTOKEN" },
          token_create_event: { token: { symbol: "OLDTOKEN" } },
        }}
      />,
    );

    expect(screen.getByText("OLDTOKEN")).toBeTruthy();
  });
});
