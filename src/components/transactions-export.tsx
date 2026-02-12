"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import csvDownload from "json-to-csv-export";
import { endpoints } from "@/lib/api/endpoints";
import { fetchJson } from "@/lib/api/fetcher";
import { useEcho } from "@/lib/i18n/use-echo";
import type { Transaction, TransactionParams, TransactionResults } from "@/lib/types/api";
import {
  DEFAULT_PRESET,
  buildKoinlyRows,
  formatUtcInputValue,
  getPresetRange,
  parseUtcInputValue,
  type DatePreset,
  type ExportFormat,
} from "@/lib/koinly";
import { Modal } from "@/components/modal";
import { ComboSelect } from "@/components/ui/combo-select";

interface TransactionsExportButtonProps {
  address: string;
  rawTransactions: Transaction[];
}

export function TransactionsExportButton({ address, rawTransactions }: TransactionsExportButtonProps) {
  const { echo } = useEcho();

  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("koinly");
  const [preset, setPreset] = useState<DatePreset>(DEFAULT_PRESET);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includeFungible, setIncludeFungible] = useState(true);
  const [includeNft, setIncludeNft] = useState(false);
  const [groupSwap, setGroupSwap] = useState(true);
  const [includeFees, setIncludeFees] = useState(true);
  const [includeFeeOnly, setIncludeFeeOnly] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    if (!exporting) {
      setExportError(null);
      setOpen(false);
    }
  }, [exporting]);

  useEffect(() => {
    if (from && to) return;
    const presetRange = getPresetRange(DEFAULT_PRESET);
    const range = presetRange ?? {
      from: formatUtcInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      to: formatUtcInputValue(new Date()),
    };
    setFrom(range.from);
    setTo(range.to);
  }, [from, to]);

  const applyPreset = useCallback((value: DatePreset) => {
    const range = getPresetRange(value);
    if (!range) return;
    setFrom(range.from);
    setTo(range.to);
  }, []);

  const normalizeFilenameAddress = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, "");
  const toFilenameDate = (value: string) => value.replace(/[^0-9]/g, "");

  const fetchTransactions = useCallback(async (params: TransactionParams) => {
    const transactions: Transaction[] = [];
    let cursor: string | undefined;
    let safetyCounter = 0;

    // Follow cursor pagination until exhausted, with a safety cap to avoid infinite loops.
    do {
      const data = await fetchJson<TransactionResults>(
        endpoints.transactions({
          ...params,
          chain: params.chain ?? "main",
          cursor,
        }),
        60_000,
      );
      if (data?.transactions?.length) {
        transactions.push(...data.transactions);
      }
      cursor = data?.next_cursor || undefined;
      safetyCounter += 1;
    } while (cursor && safetyCounter < 1000);

    return transactions;
  }, []);

  const handleExport = useCallback(async () => {
    setExportError(null);

    if (format === "raw") {
      const filename = `PhantasmaExplorer-Transactions-${nanoid()}.csv`;
      csvDownload(rawTransactions, filename, ",");
      setOpen(false);
      return;
    }

    const fromUnix = parseUtcInputValue(from);
    const toUnix = parseUtcInputValue(to);
    if (!fromUnix || !toUnix || !Number.isFinite(Number(fromUnix)) || !Number.isFinite(Number(toUnix))) {
      setExportError("Select a valid date range.");
      return;
    }
    if (Number(fromUnix) > Number(toUnix)) {
      setExportError("Start date must be before end date.");
      return;
    }

    setExporting(true);
    try {
      const transactions = await fetchTransactions({
        address,
        date_greater: fromUnix,
        date_less: toUnix,
        limit: 100,
        order_by: "date",
        order_direction: "asc",
        with_events: 1,
        with_event_data: 1,
        with_nft: includeNft ? 1 : 0,
      });
      const rows = buildKoinlyRows(transactions, {
        address,
        includeFungible,
        includeNft,
        groupSwap,
        includeFees,
        includeFeeOnly,
      });
      if (!rows.length) {
        setExportError("No transactions found for the selected range.");
        return;
      }
      const filename = `PhantasmaExplorer-Transactions-Koinly-${normalizeFilenameAddress(
        address,
      )}-${toFilenameDate(from)}-${toFilenameDate(to)}.csv`;
      csvDownload(rows, filename, ",");
      setOpen(false);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [
    address,
    fetchTransactions,
    format,
    from,
    to,
    rawTransactions,
    includeFungible,
    includeNft,
    groupSwap,
    includeFees,
    includeFeeOnly,
  ]);

  const formatOptions = useMemo(
    () => [
      { value: "koinly" as const, label: "Koinly (universal)" },
      { value: "raw" as const, label: "Raw (current page)" },
    ],
    [],
  );

  const presetOptions = useMemo(
    () => [
      { value: "custom" as const, label: "Custom range" },
      { value: "last-7-days" as const, label: "Last 7 days" },
      { value: "last-30-days" as const, label: "Last 30 days" },
      { value: "previous-month" as const, label: "Previous month" },
      { value: "year-to-date" as const, label: "Year to date" },
      { value: "previous-year" as const, label: "Previous calendar year" },
    ],
    [],
  );

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        data-testid="koinly-export-button"
      >
        <Download className="h-4 w-4" /> {echo("table-exportCsv")}
      </button>
      <Modal
        open={open}
        title={echo("table-exportCsv")}
        onClose={closeDialog}
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </button>
        }
      >
        <div className="grid gap-4">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Format
            <ComboSelect
              value={format}
              onChange={(value) => setFormat(value as ExportFormat)}
              options={formatOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              triggerClassName="w-full justify-between border border-border/70 bg-card/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              contentClassName="min-w-[12rem]"
            />
          </label>

          {format === "raw" ? (
            <div className="text-xs text-muted-foreground">
              Raw export downloads only the current page from the table.
            </div>
          ) : null}

          {format === "koinly" ? (
            <>
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Preset
                <ComboSelect
                  value={preset}
                  onChange={(value) => {
                    const nextValue = value as DatePreset;
                    setPreset(nextValue);
                    if (nextValue !== "custom") {
                      applyPreset(nextValue);
                    }
                  }}
                  options={presetOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  triggerClassName="w-full justify-between border border-border/70 bg-card/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  contentClassName="min-w-[14rem]"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  From (UTC)
                  <input
                    type="datetime-local"
                    value={from}
                    onChange={(event) => {
                      setFrom(event.target.value);
                      setPreset("custom");
                    }}
                    className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  To (UTC)
                  <input
                    type="datetime-local"
                    value={to}
                    onChange={(event) => {
                      setTo(event.target.value);
                      setPreset("custom");
                    }}
                    className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeFungible}
                  onChange={(event) => setIncludeFungible(event.target.checked)}
                  className="h-4 w-4"
                />
                Include fungible tokens
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeNft}
                  onChange={(event) => setIncludeNft(event.target.checked)}
                  className="h-4 w-4"
                />
                Include NFTs (uses NFT placeholders)
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={groupSwap}
                  onChange={(event) => setGroupSwap(event.target.checked)}
                  className="h-4 w-4"
                />
                Group 1:1 swaps as a single row (Label=Swap)
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeFees}
                  onChange={(event) => setIncludeFees(event.target.checked)}
                  className="h-4 w-4"
                />
                Include fees (KCAL)
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeFeeOnly}
                  onChange={(event) => setIncludeFeeOnly(event.target.checked)}
                  className="h-4 w-4"
                  disabled={!includeFees}
                />
                Include fee-only transactions
              </label>
            </>
          ) : null}

          {exportError ? <div className="text-xs text-destructive">{exportError}</div> : null}
        </div>
      </Modal>
    </>
  );
}
