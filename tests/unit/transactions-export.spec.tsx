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
      expect((screen.getByLabelText(/from \(utc\)/i) as HTMLInputElement).value).not.toBe("");
      expect((screen.getByLabelText(/to \(utc\)/i) as HTMLInputElement).value).not.toBe("");
    });

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^export$/i }));

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
      expect((screen.getByLabelText(/from \(utc\)/i) as HTMLInputElement).value).not.toBe("");
      expect((screen.getByLabelText(/to \(utc\)/i) as HTMLInputElement).value).not.toBe("");
    });

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^export$/i }));

    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalled());

    const requestUrl = String(fetchJsonMock.mock.calls[0][0]);
    expect(requestUrl).toContain("chain=main-generation-1");
  });
});
