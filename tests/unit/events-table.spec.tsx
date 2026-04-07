import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventsTable } from "@/components/events-table";

const useApiMock = vi.fn();
const useEventKindOptionsMock = vi.fn();
const useTableMock = vi.fn();

vi.mock("@/lib/hooks/use-api", () => ({
  useApi: (...args: unknown[]) => useApiMock(...args),
}));

vi.mock("@/lib/hooks/use-event-kind-options", () => ({
  useEventKindOptions: (...args: unknown[]) => useEventKindOptionsMock(...args),
}));

vi.mock("@/lib/hooks/use-table", () => ({
  useTable: (...args: unknown[]) => useTableMock(...args),
}));

describe("EventsTable", () => {
  beforeEach(() => {
    useApiMock.mockReset();
    useEventKindOptionsMock.mockReset();
    useTableMock.mockReset();

    useApiMock.mockReturnValue({
      data: { events: [], next_cursor: null },
      loading: false,
      error: null,
    });
    useEventKindOptionsMock.mockReturnValue({ options: [] });
    useTableMock.mockReturnValue({
      page: 1,
      setPage: vi.fn(),
      pageSize: 25,
      setPageSize: vi.fn(),
      orderBy: "date",
      setOrderBy: vi.fn(),
      orderDirection: "desc",
      setOrderDirection: vi.fn(),
      hasNext: false,
      cursor: null,
      resetPagination: vi.fn(),
      onPageData: vi.fn(),
    });
  });

  it("requests list events without extended payloads", () => {
    render(<EventsTable eventKind="SpecialResolution" showSearch={false} showEventKindFilter={false} />);

    const endpoint = useApiMock.mock.calls[0]?.[0] as string;

    expect(endpoint).toContain("/events?");
    expect(endpoint).toContain("event_kind=SpecialResolution");
    expect(endpoint).toContain("with_event_data=0");
    expect(endpoint).not.toContain("with_event_data=1");
  });
});
