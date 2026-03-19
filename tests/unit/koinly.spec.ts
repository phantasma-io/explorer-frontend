import { describe, expect, it } from "vitest";
import { buildKoinlyRows, type KoinlyExportOptions } from "@/lib/koinly";
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
