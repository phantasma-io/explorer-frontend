import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Column } from "@/components/data-table";
import { DataTable } from "@/components/data-table";

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [
  {
    id: "name",
    label: "Name",
    render: (row) => row.name,
  },
];

const rows: Row[] = [{ id: 1, name: "Alpha" }];

describe("DataTable pagination", () => {
  it("renders pagination controls above and below the table", () => {
    /* Behavior: table with controls renders top + bottom pagination.
       Expected: both pagers show the same page indicator. */
    const setPage = vi.fn();

    render(
      <DataTable
        tableId="test-table"
        columns={columns}
        rows={rows}
        controls={{
          page: 2,
          setPage,
          pageSize: 10,
          setPageSize: vi.fn(),
          hasNext: true,
        }}
      />
    );

    expect(screen.getAllByText(/Page 2/i)).toHaveLength(2);
    expect(screen.getAllByLabelText("Previous page")).toHaveLength(2);
    expect(screen.getAllByLabelText("Next page")).toHaveLength(2);
  });

  it("wires next/prev actions to the shared page handler", async () => {
    /* Behavior: user clicks pager buttons.
       Expected: setPage receives the correct next/previous page values. */
    const setPage = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        tableId="test-table"
        columns={columns}
        rows={rows}
        controls={{
          page: 2,
          setPage,
          pageSize: 10,
          setPageSize: vi.fn(),
          hasNext: true,
        }}
      />
    );

    const prevButtons = screen.getAllByLabelText("Previous page");
    const nextButtons = screen.getAllByLabelText("Next page");

    expect(prevButtons[1]).not.toBeDisabled();
    expect(nextButtons[1]).not.toBeDisabled();

    await user.click(prevButtons[1]);
    await user.click(nextButtons[1]);

    expect(setPage).toHaveBeenCalledWith(1);
    expect(setPage).toHaveBeenCalledWith(3);
  });
});
