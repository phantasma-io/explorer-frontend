import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HoldersTable } from "@/components/holders-table";

const useApiMock = vi.fn();
const useTableMock = vi.fn();

vi.mock("@/lib/hooks/use-api", () => ({
  useApi: (...args: unknown[]) => useApiMock(...args),
}));

vi.mock("@/lib/hooks/use-table", () => ({
  useTable: (...args: unknown[]) => useTableMock(...args),
}));

describe("HoldersTable", () => {
  beforeEach(() => {
    useApiMock.mockReset();
    useTableMock.mockReset();
    useTableMock.mockReturnValue({
      page: 2,
      setPage: vi.fn(),
      pageSize: 25,
      setPageSize: vi.fn(),
      orderBy: "id",
      setOrderBy: vi.fn(),
      orderDirection: "desc",
      setOrderDirection: vi.fn(),
      hasNext: true,
      cursor: "CURSOR2",
      resetPagination: vi.fn(),
      onPageData: vi.fn(),
    });
    useApiMock.mockReturnValue({
      data: {
        addresses: [
          { address: "P2KHolder", balances: [{ token: { symbol: "SOUL" }, amount: "10" }] },
        ],
        next_cursor: "CURSOR3",
      },
      loading: false,
      error: null,
    });
  });

  // The table asks for one page of holders, ordered by balance, and goes on with the
  // cursor of the table. A token can have any number of holders. The request asks for
  // holders only. Without that, the API goes on after the last holder with every other
  // address, and those pages would show empty.
  it("requests one page of holders with the table cursor and shows the page controls", () => {
    render(<HoldersTable symbol="SOUL" />);

    const endpoint = useApiMock.mock.calls[0]?.[0] as string;
    expect(endpoint).toContain("/addresses?");
    expect(endpoint).toContain("order_by=balance");
    expect(endpoint).toContain("symbol=SOUL");
    expect(endpoint).toContain("holders_only=1");
    expect(endpoint).toContain("limit=25");
    expect(endpoint).toContain("cursor=CURSOR2");
    expect(screen.getAllByRole("button", { name: /next/i }).length).toBeGreaterThan(0);
  });
});
