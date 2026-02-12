"use client";

import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type {
  BlockResults,
  OverviewStatsResult,
  TokenResults,
  TransactionResults,
} from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { formatNumberString, formatNumberStringWhole, stringTruncateMiddle } from "@/lib/utils/format";

export function useOverviewStats() {
  const { data: blockData } = useApi<BlockResults>(
    endpoints.blocks({ limit: 1, order_direction: "desc" }),
  );
  const { data: txData } = useApi<TransactionResults>(
    endpoints.transactions({ chain: "main", limit: 1, order_direction: "desc" }),
  );
  const { data: overviewStats } = useApi<OverviewStatsResult>(
    endpoints.overviewStats({
      chain: "main",
      include_burned: 1,
      include_legacy_transactions: 1,
    }),
  );
  const { data: soulSupplyData } = useApi<TokenResults>(
    endpoints.tokens({
      symbol: "SOUL",
      limit: 1,
      offset: 0,
      with_total: 0,
    }),
  );
  const { data: kcalSupplyData } = useApi<TokenResults>(
    endpoints.tokens({
      symbol: "KCAL",
      limit: 1,
      offset: 0,
      with_total: 0,
    }),
  );
  const totalNftCount = typeof overviewStats?.nfts_total === "number" ? overviewStats.nfts_total : null;
  const soulMasterCount =
    typeof overviewStats?.soul_masters_total === "number"
      ? overviewStats.soul_masters_total
      : null;

  const latestBlock = blockData?.blocks?.[0];
  const latestTx = txData?.transactions?.[0];
  const soulToken = soulSupplyData?.tokens?.[0];
  const kcalToken = kcalSupplyData?.tokens?.[0];

  return {
    latestBlockHeight: latestBlock?.height
      ? formatNumberString(latestBlock.height)
      : null,
    latestBlockTime: latestBlock?.date
      ? formatDateTime(unixToDate(latestBlock.date))
      : null,
    latestTxHash: latestTx?.hash
      ? `Latest tx ${stringTruncateMiddle(latestTx.hash, 8, 6)}`
      : null,
    totalTransactions: overviewStats?.transactions_total?.toLocaleString("en-US") ?? null,
    totalTokens: overviewStats?.tokens_total?.toLocaleString("en-US") ?? null,
    totalNfts: totalNftCount?.toLocaleString("en-US") ?? null,
    totalContracts: overviewStats?.contracts_total?.toLocaleString("en-US") ?? null,
    totalAddresses: overviewStats?.addresses_total?.toLocaleString("en-US") ?? null,
    soulMasters: soulMasterCount?.toLocaleString("en-US") ?? null,
    soulCirculationSupply: soulToken?.current_supply
      ? formatNumberStringWhole(soulToken.current_supply)
      : null,
    kcalCirculationSupply: kcalToken?.current_supply
      ? formatNumberStringWhole(kcalToken.current_supply)
      : null,
    burnedKcal: kcalToken?.burned_supply
      ? formatNumberStringWhole(kcalToken.burned_supply)
      : null,
  };
}
