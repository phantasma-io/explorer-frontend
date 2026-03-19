import { describe, expect, it } from "vitest";
import { buildTransactionNarrative } from "@/lib/tx/transaction-narrative";
import type { EventResult, Transaction } from "@/lib/types/api";

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

const fungibleEvent = (
  kind: "TokenSend" | "TokenReceive" | "TokenStake",
  address: string,
  symbol: string,
  value: string,
): EventResult => ({
  event_kind: kind,
  address,
  token_event: {
    token: { symbol, fungible: true },
    value,
    value_raw: value,
  },
});

describe("buildTransactionNarrative", () => {
  it("keeps the historical single-action summary for a plain transfer", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KSender"),
      [
        fungibleEvent("TokenSend", "P2KSender", "SOUL", "55"),
        fungibleEvent("TokenReceive", "P2KReceiver", "SOUL", "55"),
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

  it("switches to initiator-perspective flow summary for swap-like fungible transactions", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KUser"),
      [
        fungibleEvent("TokenSend", "P2KUser", "KCAL", "4.5"),
        fungibleEvent("TokenReceive", "P2KRouter", "KCAL", "4.5"),
        fungibleEvent("TokenSend", "P2KUser", "KCAL", "4995.5"),
        fungibleEvent("TokenReceive", "S3d8Pool", "KCAL", "4995.5"),
        fungibleEvent("TokenSend", "S3d8Pool", "SOUL", "56.14928433"),
        fungibleEvent("TokenReceive", "P2KUser", "SOUL", "56.14928433"),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("initiator-fungible-flows");
    expect(narrative?.from).toBe("P2KUser");
    expect(narrative?.to).toBe("");
    expect(narrative?.toCount).toBe(0);
    expect(narrative?.actions).toHaveLength(2);
    expect(narrative?.actions).toMatchObject([
      {
        kind: "TokenSend",
        amount: "5,000",
        symbol: "KCAL",
        verb: "Sent",
      },
      {
        kind: "TokenReceive",
        amount: "56.14928433",
        symbol: "SOUL",
        verb: "Received",
      },
    ]);
  });

  it("shows separate sent and received initiator legs for the same symbol", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KUser"),
      [
        fungibleEvent("TokenSend", "P2KUser", "SOUL", "54.9505"),
        fungibleEvent("TokenSend", "P2KUser", "SOUL", "0.0495"),
        fungibleEvent("TokenReceive", "P2KUser", "SOUL", "3.00148242"),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("initiator-fungible-flows");
    expect(narrative?.actions).toHaveLength(2);
    expect(narrative?.actions).toMatchObject([
      {
        kind: "TokenSend",
        amount: "55",
        symbol: "SOUL",
        verb: "Sent",
      },
      {
        kind: "TokenReceive",
        amount: "3.00148242",
        symbol: "SOUL",
        verb: "Received",
      },
    ]);
  });

  it("does not enable initiator netting when explicit action kinds are present", () => {
    const narrative = buildTransactionNarrative(
      tx("P2KUser"),
      [
        fungibleEvent("TokenSend", "P2KUser", "SOUL", "100"),
        fungibleEvent("TokenReceive", "P2KUser", "SOUL", "1"),
        fungibleEvent("TokenStake", "P2KUser", "SOUL", "99"),
      ],
      echo,
    );

    expect(narrative?.mode).toBe("default");
  });
});
