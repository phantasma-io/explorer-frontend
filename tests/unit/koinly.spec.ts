import { describe, expect, it } from "vitest";
import {
  attachEventsToTransactions,
  buildKoinlyRows,
  rawAmountToDecimal,
  type KoinlyExportOptions,
} from "@/lib/koinly";
import type { EventResult, Transaction } from "@/lib/types/api";

const TEST_ADDRESS = "P2KAddress";

const baseOptions: KoinlyExportOptions = {
  address: TEST_ADDRESS,
  includeFungible: true,
  includeNft: true,
  groupSwap: true,
  includeFees: true,
  includeFeeOnly: true,
};

const createEvent = ({
  eventKind,
  symbol,
  value,
  payloadJson,
}: {
  eventKind: string;
  symbol: string;
  value: string;
  payloadJson?: string;
}): EventResult => ({
  address: TEST_ADDRESS,
  event_kind: eventKind,
  transaction_hash: "0xtx",
  payload_json:
    payloadJson ??
    JSON.stringify({
      address: TEST_ADDRESS,
      event_kind: eventKind,
      token_event: {
        token: symbol,
        value,
      },
    }),
  token_event: {
    token: {
      symbol,
      fungible: true,
    },
    value,
  },
});

const createTransaction = ({
  chain = "main",
  blockHeight = "7000000",
  fee = "0",
  events,
}: {
  chain?: string;
  blockHeight?: string;
  fee?: string;
  events: EventResult[];
}): Transaction => ({
  hash: "0xtx",
  date: "1755176408",
  fee,
  chain,
  block_height: blockHeight,
  events,
});

describe("buildKoinlyRows", () => {
  it("normalizes raw KCAL fee values before writing fee-only fallback rows", () => {
    const rows = buildKoinlyRows(
      [
        createTransaction({
          fee: "228100000",
          events: [],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["Sent Amount"]).toBe("0.02281");
    expect(rows[0]["Sent Currency"]).toBe("KCAL");
    expect(rows[0].Description).toBe("Network fee");
  });

  it("normalizes raw KCAL fee values before assigning fee columns", () => {
    const rows = buildKoinlyRows(
      [
        createTransaction({
          fee: "1019200000",
          events: [createEvent({ eventKind: "TokenReceive", symbol: "KCAL", value: "4.09808" })],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["Received Amount"]).toBe("4.09808");
    expect(rows[0]["Fee Amount"]).toBe("0.10192");
    expect(rows[0]["Fee Currency"]).toBe("KCAL");
  });

  it("includes standalone SOUL claim events as received rows", () => {
    // Standalone SOUL claims are real balance increases and must not disappear from export.
    const rows = buildKoinlyRows(
      [
        createTransaction({
          events: [createEvent({ eventKind: "TokenClaim", symbol: "SOUL", value: "541.31513751" })],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["Received Amount"]).toBe("541.31513751");
    expect(rows[0]["Received Currency"]).toBe("SOUL");
    expect(rows[0].Description).toBe("Claimed");
  });

  it("keeps TokenMint and suppresses companion TokenClaim for the same token in one tx", () => {
    // Reward txs can emit both Mint and Claim; export must count the asset only once.
    const rows = buildKoinlyRows(
      [
        createTransaction({
          events: [
            createEvent({ eventKind: "TokenMint", symbol: "KCAL", value: "4106.291760787" }),
            createEvent({ eventKind: "TokenClaim", symbol: "KCAL", value: "4106.290640787" }),
          ],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["Received Amount"]).toBe("4106.291760787");
    expect(rows[0]["Received Currency"]).toBe("KCAL");
    expect(rows[0].Description).toBe("Minted");
  });

  it("deduplicates identical legacy main events at the gen3 boundary or earlier", () => {
    // Historical main data up to the gen3 cutover can contain duplicate event rows.
    const duplicateEvent = createEvent({
      eventKind: "TokenReceive",
      symbol: "KCAL",
      value: "1",
      payloadJson: "{\"token\":\"KCAL\",\"value\":\"1\",\"legacy\":true}",
    });
    const rows = buildKoinlyRows(
      [
        createTransaction({
          blockHeight: "6422526",
          events: [duplicateEvent, { ...duplicateEvent, event_id: 2 }],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["Received Amount"]).toBe("1");
  });

  it("deduplicates identical main-generation-1 events", () => {
    // Gen1 also belongs to the historical duplicate-event scope.
    const duplicateEvent = createEvent({
      eventKind: "TokenReceive",
      symbol: "SOUL",
      value: "2",
      payloadJson: "{\"token\":\"SOUL\",\"value\":\"2\",\"legacy_gen1\":true}",
    });
    const rows = buildKoinlyRows(
      [
        createTransaction({
          chain: "main-generation-1",
          blockHeight: "410367",
          events: [duplicateEvent, { ...duplicateEvent, event_id: 2 }],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]["Received Amount"]).toBe("2");
  });

  it("does not deduplicate identical post-gen3 events", () => {
    // Post-boundary data must keep repeated rows intact unless we have proof they are legacy duplicates.
    const duplicateEvent = createEvent({
      eventKind: "TokenReceive",
      symbol: "KCAL",
      value: "3",
      payloadJson: "{\"token\":\"KCAL\",\"value\":\"3\",\"post_gen3\":true}",
    });
    const rows = buildKoinlyRows(
      [
        createTransaction({
          blockHeight: "6422527",
          events: [duplicateEvent, { ...duplicateEvent, event_id: 2 }],
        }),
      ],
      baseOptions,
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]["Received Amount"]).toBe("3");
    expect(rows[1]["Received Amount"]).toBe("3");
  });
});

describe("rawAmountToDecimal", () => {
  it("converts raw KCAL-style integers into exact decimal strings", () => {
    expect(rawAmountToDecimal("228100000", 10)).toBe("0.02281");
    expect(rawAmountToDecimal("563800000", 10)).toBe("0.05638");
    expect(rawAmountToDecimal("1019200000", 10)).toBe("0.10192");
  });

  it("preserves integer strings when decimals are zero", () => {
    expect(rawAmountToDecimal("20", 0)).toBe("20");
    expect(rawAmountToDecimal("-3", 0)).toBe("-3");
  });
});

describe("attachEventsToTransactions", () => {
  // The export reads the address's events as their own list and joins them to the
  // transactions on the transaction hash and the block hash. Some transactions of gen1
  // and of the main chain up to block 6,422,526 appear in more than one block, and the
  // events of each block must stay with the transaction of that block.
  it("joins events to their transaction by hash and block hash", () => {
    const transactions: Transaction[] = [
      { hash: "0xsame", block_hash: "0xblock1" },
      { hash: "0xsame", block_hash: "0xblock2" },
      { hash: "0xquiet", block_hash: "0xblock3" },
    ];
    const events: EventResult[] = [
      { event_id: 1, transaction_hash: "0xsame", block_hash: "0xblock1" },
      { event_id: 2, transaction_hash: "0xsame", block_hash: "0xblock2" },
      { event_id: 3, transaction_hash: "0xsame", block_hash: "0xblock1" },
    ];

    const joined = attachEventsToTransactions(transactions, events);

    expect(joined.map((tx) => tx.events?.map((event) => event.event_id))).toEqual([
      [1, 3],
      [2],
      [],
    ]);
  });
});
