import { describe, expect, it } from "vitest";
import { buildTransactionNarrative } from "@/lib/tx/transaction-narrative";
import type { Transaction, TransactionSummaryRow } from "@/lib/types/api";

const echo = (key: string) =>
  ({
    transaction: "transaction",
    "desc-sent": "sent",
    "desc-received": "received",
    "desc-staked": "staked",
    "desc-unstaked": "unstaked",
    "desc-claimed": "claimed",
    "desc-burned": "burned",
    "desc-minted": "minted",
    "desc-created": "created",
  })[key] ?? key;

const tx = (sender: string): Transaction => ({
  hash: "0xhash",
  sender: { address: sender },
  gas_payer: { address: sender },
});

// One summary row as the API serves it. `addresses` lists the distinct addresses of
// the row's events; the API names the address only when there is exactly one.
const row = (
  kind: string,
  symbol: string | undefined,
  options: {
    fungible?: boolean;
    events?: number;
    addresses?: string[];
    senderEvents?: number;
    amount?: string;
    senderAmount?: string;
    firstEvent?: TransactionSummaryRow["first_event"];
  } = {},
): TransactionSummaryRow => {
  const addresses = options.addresses ?? [];
  return {
    event_kind: kind,
    token: symbol ? { symbol, fungible: options.fungible ?? true } : undefined,
    event_count: options.events ?? 1,
    address_count: addresses.length,
    address: addresses.length === 1 ? { address: addresses[0] } : undefined,
    sender_event_count: options.senderEvents ?? 0,
    amount: options.amount,
    sender_amount: options.senderAmount,
    first_event: options.firstEvent,
  };
};

const gasRows = (sender: string) => [
  row("GasEscrow", undefined, { addresses: [sender], senderEvents: 1 }),
  row("GasPayment", undefined, { addresses: [sender], senderEvents: 1 }),
];

describe("buildTransactionNarrative", () => {
  it("describes a plain transfer once, by what was sent, from the sender to the recipient", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KSender"),
      [
        ...gasRows("P2KSender"),
        row("TokenSend", "SOUL", { addresses: ["P2KSender"], senderEvents: 1, amount: "55" }),
        row("TokenReceive", "SOUL", { addresses: ["P2KReceiver"], amount: "55" }),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("default");
    expect(narrative?.actions).toHaveLength(1);
    expect(narrative?.actions[0]).toMatchObject({
      kind: "TokenSend",
      amount: "55",
      symbol: "SOUL",
      verb: "Sent",
    });
    expect(narrative?.from).toBe("P2KSender");
    expect(narrative?.to).toBe("P2KReceiver");
    expect(narrative?.toCount).toBe(1);
  });

  it("switches to the sender's view for swap-like fungible transactions", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KUser"),
      [
        row("TokenSend", "KCAL", {
          events: 2,
          addresses: ["P2KUser"],
          senderEvents: 2,
          amount: "5000",
          senderAmount: "5000",
        }),
        row("TokenReceive", "KCAL", {
          events: 2,
          addresses: ["P2KRouter", "S3d8Pool"],
          amount: "5000",
          senderAmount: "0",
        }),
        row("TokenSend", "SOUL", {
          addresses: ["S3d8Pool"],
          amount: "56.14928433",
          senderAmount: "0",
        }),
        row("TokenReceive", "SOUL", {
          addresses: ["P2KUser"],
          senderEvents: 1,
          amount: "56.14928433",
          senderAmount: "56.14928433",
        }),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("initiator-fungible-flows");
    expect(narrative?.from).toBe("P2KUser");
    expect(narrative?.to).toBe("");
    expect(narrative?.toCount).toBe(0);
    expect(narrative?.actions).toMatchObject([
      { kind: "TokenSend", amount: "5,000", symbol: "KCAL", verb: "Sent" },
      { kind: "TokenReceive", amount: "56.14928433", symbol: "SOUL", verb: "Received" },
    ]);
  });

  it("shows the sender's sent and received parts of the same symbol separately", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KUser"),
      [
        row("TokenSend", "SOUL", {
          events: 2,
          addresses: ["P2KUser"],
          senderEvents: 2,
          amount: "55",
          senderAmount: "55",
        }),
        row("TokenReceive", "SOUL", {
          addresses: ["P2KUser"],
          senderEvents: 1,
          amount: "3.00148242",
          senderAmount: "3.00148242",
        }),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("initiator-fungible-flows");
    expect(narrative?.actions).toMatchObject([
      { kind: "TokenSend", amount: "55", symbol: "SOUL", verb: "Sent" },
      { kind: "TokenReceive", amount: "3.00148242", symbol: "SOUL", verb: "Received" },
    ]);
  });

  it("keeps the default view when the transaction has an action kind of its own", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KUser"),
      [
        row("TokenSend", "SOUL", { addresses: ["P2KUser"], senderEvents: 1, amount: "100", senderAmount: "100" }),
        row("TokenReceive", "SOUL", { addresses: ["P2KUser"], senderEvents: 1, amount: "1", senderAmount: "1" }),
        row("TokenStake", "SOUL", { addresses: ["P2KUser"], senderEvents: 1, amount: "99", senderAmount: "99" }),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("default");
  });

  // 78 NFTs sent in a transaction of 159 events. The count comes from the summary, so it
  // is exact for any number of events.
  it("counts every NFT of a transfer and names the single recipient", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KSender"),
      [
        ...gasRows("P2KSender"),
        row("TokenBurn", "KCAL", { addresses: ["P2KSender"], senderEvents: 1, amount: "0.02073" }),
        row("TokenSend", "BRC", {
          fungible: false,
          events: 78,
          addresses: ["P2KSender"],
          senderEvents: 78,
        }),
        row("TokenReceive", "BRC", { fungible: false, events: 78, addresses: ["P2KRecipient"] }),
      ],
      echo,
    );

    expect(narrative?.actions).toHaveLength(1);
    expect(narrative?.actions[0]).toMatchObject({
      kind: "TokenSend",
      verb: "Sent",
      symbol: "BRC",
      count: 78,
      isNft: true,
      toAddress: "P2KRecipient",
    });
    expect(narrative?.from).toBe("P2KSender");
    expect(narrative?.to).toBe("P2KRecipient");
  });

  it("counts the recipients of an NFT transfer to several addresses instead of listing them", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KSender"),
      [
        row("TokenSend", "BRC", { fungible: false, events: 5, addresses: ["P2KSender"], senderEvents: 5 }),
        row("TokenReceive", "BRC", {
          fungible: false,
          events: 5,
          addresses: ["P2KFirst", "P2KSecond", "P2KThird"],
        }),
      ],
      echo,
    );

    expect(narrative?.actions).toHaveLength(1);
    expect(narrative?.actions[0]).toMatchObject({ count: 5, recipientCount: 3 });
    expect(narrative?.actions[0].toAddress).toBeUndefined();
    expect(narrative?.to).toBe("");
    expect(narrative?.toCount).toBe(3);
    expect(narrative?.hasRecipientBreakdown).toBe(true);
  });

  it("counts a mass mint as one action and names a single minted NFT", () => {
    const mass = buildTransactionNarrative(
      tx("P2KMinter"),
      [row("TokenMint", "GHOST", { fungible: false, events: 2500, addresses: ["P2KMinter"], senderEvents: 2500 })],
      echo,
    );
    expect(mass?.actions).toHaveLength(1);
    expect(mass?.actions[0]).toMatchObject({ kind: "TokenMint", count: 2500, isNft: true });
    expect(mass?.actions[0].nftId).toBeUndefined();

    const single = buildTransactionNarrative(
      tx("P2KMinter"),
      [
        row("TokenMint", "GHOST", {
          fungible: false,
          addresses: ["P2KMinter"],
          senderEvents: 1,
          firstEvent: { event_kind: "TokenMint", token_id: "12345", nft_metadata: { name: "Ghost #1" } },
        }),
      ],
      echo,
    );
    expect(single?.actions[0]).toMatchObject({ count: 1, nftId: "12345", nftLabel: "Ghost #1" });
  });

  it("leaves out the routine KCAL fee burn and keeps a real burn", () => {
    const fee = buildTransactionNarrative(
      tx("P2KUser"),
      [row("TokenBurn", "KCAL", { addresses: ["P2KUser"], senderEvents: 1, amount: "0.2073" })],
      echo,
    );
    expect(fee?.actions).toHaveLength(0);

    const burn = buildTransactionNarrative(
      tx("P2KUser"),
      [row("TokenBurn", "KCAL", { addresses: ["P2KUser"], senderEvents: 1, amount: "1500.5" })],
      echo,
    );
    expect(burn?.actions[0]).toMatchObject({ kind: "TokenBurn", amount: "1,500.5", symbol: "KCAL" });
  });

  it("never turns gas events into actions and falls back to the headline", () => {
    const narrative = buildTransactionNarrative(tx("P2KUser"), gasRows("P2KUser"), echo);

    expect(narrative?.actions).toHaveLength(0);
    expect(narrative?.headline).toBe("transaction");
  });
});
