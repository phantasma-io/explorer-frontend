import type { EventResult, Transaction } from "@/lib/types/api";

export type ExportFormat = "raw" | "koinly";
export type DatePreset =
  | "custom"
  | "last-7-days"
  | "last-30-days"
  | "previous-month"
  | "year-to-date"
  | "previous-year";

export const KOINLY_COLUMNS = [
  "Date",
  "Sent Amount",
  "Sent Currency",
  "Received Amount",
  "Received Currency",
  "Fee Amount",
  "Fee Currency",
  "Net Worth Amount",
  "Net Worth Currency",
  "Label",
  "Description",
  "TxHash",
] as const;

export type KoinlyRow = Record<(typeof KOINLY_COLUMNS)[number], string>;

type ExportEvent = {
  amount: string;
  currency: string;
  description: string;
  isNft: boolean;
};

export type KoinlyExportOptions = {
  address: string;
  includeFungible: boolean;
  includeNft: boolean;
  groupSwap: boolean;
  includeFees: boolean;
  includeFeeOnly: boolean;
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

export const DEFAULT_PRESET: DatePreset = "previous-year";

export const formatUtcInputValue = (date: Date) =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;

const toUtcDate = (year: number, monthIndex: number, day: number, hour = 0, minute = 0) =>
  new Date(Date.UTC(year, monthIndex, day, hour, minute, 0));

export const getPresetRange = (preset: DatePreset) => {
  if (preset === "custom") return null;

  // Use UTC calendar boundaries to avoid local timezone shifts in exports.
  const now = new Date();
  const nowUtc = toUtcDate(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
  );

  switch (preset) {
    case "last-7-days": {
      const from = new Date(nowUtc.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        from: formatUtcInputValue(from),
        to: formatUtcInputValue(nowUtc),
      };
    }
    case "last-30-days": {
      const from = new Date(nowUtc.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        from: formatUtcInputValue(from),
        to: formatUtcInputValue(nowUtc),
      };
    }
    case "previous-month": {
      const year = nowUtc.getUTCFullYear();
      const month = nowUtc.getUTCMonth();
      const from = toUtcDate(year, month - 1, 1, 0, 0);
      const to = toUtcDate(year, month, 0, 23, 59);
      return {
        from: formatUtcInputValue(from),
        to: formatUtcInputValue(to),
      };
    }
    case "year-to-date": {
      const year = nowUtc.getUTCFullYear();
      const from = toUtcDate(year, 0, 1, 0, 0);
      return {
        from: formatUtcInputValue(from),
        to: formatUtcInputValue(nowUtc),
      };
    }
    case "previous-year": {
      const year = nowUtc.getUTCFullYear() - 1;
      const from = toUtcDate(year, 0, 1, 0, 0);
      const to = toUtcDate(year, 11, 31, 23, 59);
      return {
        from: formatUtcInputValue(from),
        to: formatUtcInputValue(to),
      };
    }
    default:
      return null;
  }
};

export const parseUtcInputValue = (value: string) => {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [yearText, monthText, dayText] = datePart.split("-");
  const [hourText, minuteText, secondText] = timePart.split(":");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  // `datetime-local` omits seconds, so default to 0 to avoid Date.UTC NaN.
  const second = secondText === undefined ? 0 : Number(secondText);
  if ([year, month, day, hour, minute, second].some((item) => Number.isNaN(item))) {
    return null;
  }
  const utc = Date.UTC(year, month - 1, day, hour, minute, second);
  if (!Number.isFinite(utc)) return null;
  return Math.floor(utc / 1000).toString();
};

export const formatKoinlyDate = (unixSeconds?: string) => {
  if (!unixSeconds) return "";
  const parsed = Number(unixSeconds);
  if (!Number.isFinite(parsed)) return "";
  const date = new Date(parsed * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )} ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(
    date.getUTCSeconds(),
  )}`;
};

const normalizeAddress = (value: string) => value.trim().toLowerCase();

const isNftEvent = (event: EventResult) =>
  Boolean(event.nft_metadata) || (event.token_event?.token ? !event.token_event.token.fungible : false);

const createKoinlyRow = (tx: Transaction): KoinlyRow => ({
  Date: formatKoinlyDate(tx.date),
  "Sent Amount": "",
  "Sent Currency": "",
  "Received Amount": "",
  "Received Currency": "",
  "Fee Amount": "",
  "Fee Currency": "",
  "Net Worth Amount": "",
  "Net Worth Currency": "",
  Label: "",
  Description: "",
  TxHash: tx.hash ?? "",
});

export const buildKoinlyRows = (transactions: Transaction[], options: KoinlyExportOptions) => {
  const rows: KoinlyRow[] = [];
  const addressNormalized = normalizeAddress(options.address);
  const nftPlaceholders = new Map<string, string>();
  let nftIndex = 1;

  const getNftPlaceholder = (key: string) => {
    if (!nftPlaceholders.has(key)) {
      nftPlaceholders.set(key, `NFT${nftIndex}`);
      nftIndex += 1;
    }
    return nftPlaceholders.get(key) ?? `NFT${nftIndex}`;
  };

  const toExportEvent = (event: EventResult): ExportEvent | null => {
    const nft = isNftEvent(event);
    if (nft && !options.includeNft) return null;
    if (!nft && !options.includeFungible) return null;

    if (nft) {
      const nftKey =
        event.token_id || event.nft_metadata?.name || `${event.transaction_hash ?? ""}:${event.event_id ?? ""}`;
      const currency = getNftPlaceholder(nftKey);
      // Koinly expects NFT placeholders to use amount=1; token_event.value is often the token id.
      const amount = "1";
      const description = event.nft_metadata?.name || event.token_id || "";
      return {
        amount,
        currency,
        description,
        isNft: true,
      };
    }

    const amount = event.token_event?.value ?? "";
    const currency = event.token_event?.token?.symbol || event.token_id || "";
    if (!amount || !currency) return null;
    return {
      amount,
      currency,
      description: "",
      isNft: false,
    };
  };

  for (const tx of transactions) {
    const date = formatKoinlyDate(tx.date);
    if (!date) continue;

    const feeAmount = options.includeFees ? tx.fee ?? "" : "";
    const feeCurrency = feeAmount ? "KCAL" : "";
    const sentEvents: ExportEvent[] = [];
    const receivedEvents: ExportEvent[] = [];

    // Limit to explicit transfer events to avoid misclassifying other on-chain actions in Koinly.
    for (const event of tx.events ?? []) {
      if (!event.event_kind) continue;
      const eventAddress = normalizeAddress(event.address ?? "");
      const eventName = normalizeAddress(event.address_name ?? "");
      if (eventAddress !== addressNormalized && eventName !== addressNormalized) continue;
      if (event.event_kind !== "TokenSend" && event.event_kind !== "TokenReceive") continue;

      const exportEvent = toExportEvent(event);
      if (!exportEvent) continue;
      if (event.event_kind === "TokenSend") {
        sentEvents.push(exportEvent);
      } else {
        receivedEvents.push(exportEvent);
      }
    }

    let rowsAdded = 0;
    let feeAssigned = false;

    const assignFee = (row: KoinlyRow) => {
      // Apply fee once per transaction to avoid double counting on multi-transfer rows.
      if (feeAssigned || !feeAmount) return;
      row["Fee Amount"] = feeAmount;
      row["Fee Currency"] = feeCurrency;
      feeAssigned = true;
    };

    if (
      options.groupSwap &&
      sentEvents.length === 1 &&
      receivedEvents.length === 1 &&
      !sentEvents[0].isNft &&
      !receivedEvents[0].isNft
    ) {
      const row = createKoinlyRow(tx);
      row["Sent Amount"] = sentEvents[0].amount;
      row["Sent Currency"] = sentEvents[0].currency;
      row["Received Amount"] = receivedEvents[0].amount;
      row["Received Currency"] = receivedEvents[0].currency;
      row.Label = "Swap";
      assignFee(row);
      rows.push(row);
      rowsAdded += 1;
      continue;
    }

    for (const event of sentEvents) {
      const row = createKoinlyRow(tx);
      row["Sent Amount"] = event.amount;
      row["Sent Currency"] = event.currency;
      row.Description = event.description;
      assignFee(row);
      rows.push(row);
      rowsAdded += 1;
    }

    for (const event of receivedEvents) {
      const row = createKoinlyRow(tx);
      row["Received Amount"] = event.amount;
      row["Received Currency"] = event.currency;
      row.Description = event.description;
      assignFee(row);
      rows.push(row);
      rowsAdded += 1;
    }

    if (rowsAdded === 0 && options.includeFeeOnly && feeAmount) {
      const row = createKoinlyRow(tx);
      row["Sent Amount"] = feeAmount;
      row["Sent Currency"] = "KCAL";
      row.Description = "Network fee";
      rows.push(row);
    }
  }

  return rows;
};
