import { ReactNode } from "react";
import clsx from "clsx";
import { TableControls, TablePagination } from "@/components/table-controls";

export interface Column<T> {
  id: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  tableId: string;
  columns: Column<T>[];
  rows: T[];
  raw?: unknown[];
  loading?: boolean;
  error?: boolean;
  controls?: {
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    hasNext: boolean;
    orderBy?: string;
    setOrderBy?: (value: string) => void;
    orderDirection?: "asc" | "desc";
    setOrderDirection?: (value: "asc" | "desc") => void;
    orderByOptions?: { label: string; value: string }[];
    exporter?: ReactNode;
  };
  hideControls?: boolean;
  header?: ReactNode;
}

export function DataTable<T>({
  tableId,
  columns,
  rows,
  raw,
  loading,
  error,
  controls,
  hideControls = false,
  header,
}: DataTableProps<T>) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {header ? (
        <div className="mb-6">
          {/* Header slot keeps title/search inside the same frame as table controls. */}
          {header}
        </div>
      ) : null}
      {!hideControls && controls ? (
        <TableControls tableId={tableId} raw={raw} {...controls} />
      ) : null}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm tabular-nums">
          <thead className="bg-muted/50 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`whitespace-nowrap px-3 py-2 text-left sm:px-4 sm:py-3 ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-sm text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-sm text-destructive"
                >
                  Failed to load data.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-sm text-muted-foreground"
                >
                  No results.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={clsx(
                    "transition-colors hover:bg-muted/80",
                    rowIndex % 2 === 0 && "bg-muted/5",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-3 py-3 align-top sm:px-4 ${col.className ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!hideControls && controls ? (
        <div className="mt-4 flex justify-end">
          <TablePagination
            page={controls.page}
            setPage={controls.setPage}
            hasNext={controls.hasNext}
          />
        </div>
      ) : null}
    </div>
  );
}
