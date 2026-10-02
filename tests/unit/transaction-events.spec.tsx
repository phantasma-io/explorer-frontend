import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionEvents } from "@/components/transaction-events";

const useApiMock = vi.fn();
const useTableMock = vi.fn();

vi.mock("@/lib/hooks/use-api", () => ({
  useApi: (...args: unknown[]) => useApiMock(...args),
}));

vi.mock("@/lib/hooks/use-table", () => ({
  useTable: (...args: unknown[]) => useTableMock(...args),
}));

const table = (page: number, cursor: string | null) => ({
  page,
  setPage: vi.fn(),
  pageSize: 25,
  setPageSize: vi.fn(),
  orderBy: "id",
  setOrderBy: vi.fn(),
  orderDirection: "desc",
  setOrderDirection: vi.fn(),
  hasNext: false,
  cursor,
  resetPagination: vi.fn(),
  onPageData: vi.fn(),
});

const events = [
  { event_id: 1, event_kind: "TokenSend", address: "P2KSender" },
  { event_id: 2, event_kind: "TokenReceive", address: "P2KRecipient" },
];

describe("TransactionEvents", () => {
  beforeEach(() => {
    useApiMock.mockReset();
    useTableMock.mockReset();
  });

  // The list asks for one page of the transaction's events, sized by the table and
  // continued with its cursor; it never asks for every event at once.
  it("requests one page of the transaction's events with the table cursor", () => {
    useTableMock.mockReturnValue(table(2, "CURSOR2"));
    useApiMock.mockReturnValue({ data: { events, next_cursor: null }, loading: false, error: null });

    render(<TransactionEvents transactionHash="ABC" variant="summary" />);

    const endpoint = useApiMock.mock.calls[0]?.[0] as string;
    expect(endpoint).toContain("/events?");
    expect(endpoint).toContain("transaction_hash=ABC");
    expect(endpoint).toContain("limit=25");
    expect(endpoint).toContain("cursor=CURSOR2");
  });

  // The page controls appear only when the transaction has more than one page, so a
  // short transaction shows its events without empty controls.
  it("shows the page controls only when there is another page", () => {
    useTableMock.mockReturnValue(table(1, null));
    useApiMock.mockReturnValue({ data: { events, next_cursor: null }, loading: false, error: null });
    const { unmount } = render(<TransactionEvents transactionHash="ABC" variant="activity" />);
    expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
    unmount();

    useApiMock.mockReturnValue({ data: { events, next_cursor: "NEXT" }, loading: false, error: null });
    render(<TransactionEvents transactionHash="ABC" variant="activity" />);
    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toHaveProperty("disabled", false);
  });

  // A later page keeps its controls while it loads, as the other tables do: the list
  // does not jump, and "previous" stays usable. "Next" waits for the page to arrive.
  it("keeps the page controls while a later page loads", () => {
    useTableMock.mockReturnValue(table(2, "CURSOR2"));
    useApiMock.mockReturnValue({ data: undefined, loading: true, error: null });

    render(<TransactionEvents transactionHash="ABC" variant="summary" />);

    expect(screen.getByText("loading_events")).toBeTruthy();
    expect(screen.getByRole("button", { name: /prev/i })).toHaveProperty("disabled", false);
    expect(screen.getByRole("button", { name: /next/i })).toHaveProperty("disabled", true);
  });
});
