import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsExportButton } from "@/components/transactions-export";

const fetchJsonMock = vi.fn();
const csvDownloadMock = vi.fn();

vi.mock("@/lib/api/fetcher", () => ({
  fetchJson: (...args: unknown[]) => fetchJsonMock(...args),
}));

vi.mock("json-to-csv-export", () => ({
  default: (...args: unknown[]) => csvDownloadMock(...args),
}));

vi.mock("nanoid", () => ({
  nanoid: () => "test-id",
}));

describe("TransactionsExportButton", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    csvDownloadMock.mockReset();
    fetchJsonMock.mockResolvedValue({
      transactions: [{ hash: "0xabc", date: "1", fee: "1" }],
      next_cursor: null,
    });
  });

  it("does not inject chain=main when export scope is all-chains", async () => {
    const user = userEvent.setup();

    render(<TransactionsExportButton address="P2KAddress" chain="" rawTransactions={[]} />);

    await user.click(screen.getByRole("button", { name: /table-exportcsv/i }));

    await waitFor(() => {
      expect((screen.getByLabelText("export_from_utc") as HTMLInputElement).value).not.toBe("");
      expect((screen.getByLabelText("export_to_utc") as HTMLInputElement).value).not.toBe("");
    });

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "export_action" }));

    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalled());

    const requestUrl = String(fetchJsonMock.mock.calls[0][0]);
    expect(requestUrl).not.toContain("chain=main");
    expect(requestUrl).not.toContain("chain=");
  });

  it("preserves an explicit chain scope in export requests", async () => {
    const user = userEvent.setup();

    render(
      <TransactionsExportButton
        address="P2KAddress"
        chain="main-generation-1"
        rawTransactions={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /table-exportcsv/i }));

    await waitFor(() => {
      expect((screen.getByLabelText("export_from_utc") as HTMLInputElement).value).not.toBe("");
      expect((screen.getByLabelText("export_to_utc") as HTMLInputElement).value).not.toBe("");
    });

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "export_action" }));

    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalled());

    const requestUrl = String(fetchJsonMock.mock.calls[0][0]);
    expect(requestUrl).toContain("chain=main-generation-1");
  });

  // A transaction response carries one page of events, so the export reads the
  // address's own events page by page and joins them to the transactions: every row
  // of the address ends up in the file, however many events a transaction has.
  it("builds the rows from the address's events read page by page", async () => {
    const user = userEvent.setup();
    fetchJsonMock.mockImplementation(async (url: string) => {
      if (url.includes("/transactions?")) {
        return {
          transactions: [
            { hash: "0xabc", block_hash: "0xblock", date: "1700000000", fee: "0.01", chain: "main" },
          ],
          next_cursor: null,
        };
      }
      const event = (kind: string, symbol: string, value: string) => ({
        event_kind: kind,
        address: "P2KAddress",
        transaction_hash: "0xabc",
        block_hash: "0xblock",
        token_event: { token: { symbol, fungible: true }, value },
      });
      return url.includes("cursor=")
        ? { events: [event("TokenSend", "KCAL", "2")], next_cursor: null }
        : { events: [event("TokenReceive", "SOUL", "5")], next_cursor: "EVENTS2" };
    });

    render(<TransactionsExportButton address="P2KAddress" chain="" rawTransactions={[]} />);
    await user.click(screen.getByRole("button", { name: /table-exportcsv/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "export_action" }));

    await waitFor(() => expect(csvDownloadMock).toHaveBeenCalled());
    const urls = fetchJsonMock.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain("/transactions?");
    expect(urls[0]).not.toContain("with_events");
    expect(urls.filter((url) => url.includes("/events?"))).toHaveLength(2);
    expect(urls[2]).toContain("cursor=EVENTS2");
    const rows = csvDownloadMock.mock.calls[0][0].data;
    expect(rows).toMatchObject([
      { "Sent Amount": "2", "Sent Currency": "KCAL", "Received Amount": "5", "Received Currency": "SOUL" },
    ]);
  });

  // A list whose cursor does not advance would make the export stop early; it fails
  // with the export error instead of saving a file that silently misses rows.
  it("fails the export instead of saving a partial file when a list does not advance", async () => {
    const user = userEvent.setup();
    fetchJsonMock.mockImplementation(async (url: string) =>
      url.includes("/transactions?")
        ? { transactions: [{ hash: "0xabc", block_hash: "0xblock", date: "1700000000" }], next_cursor: "STUCK" }
        : { events: [], next_cursor: null },
    );

    render(<TransactionsExportButton address="P2KAddress" chain="" rawTransactions={[]} />);
    await user.click(screen.getByRole("button", { name: /table-exportcsv/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "export_action" }));

    await waitFor(() => expect(within(dialog).getByText("export_error_failed")).toBeTruthy());
    expect(csvDownloadMock).not.toHaveBeenCalled();
  });
});
