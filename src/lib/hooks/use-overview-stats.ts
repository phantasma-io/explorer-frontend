"use client";

import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type {
  AddressResults,
  BlockResults,
  ContractResults,
  NftResults,
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
    endpoints.transactions({ chain: "main", limit: 1, order_direction: "desc", with_total: 1 }),
  );
  const { data: tokenData } = useApi<TokenResults>(
    endpoints.tokens({ limit: 1, with_total: 1 }),
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
  const { data: nftData } = useApi<NftResults>(
    endpoints.nfts({ limit: 1, with_total: 1 }),
  );
  const { data: contractData } = useApi<ContractResults>(
    endpoints.contracts({ limit: 1, with_total: 1 }),
  );
  const { data: addressData } = useApi<AddressResults>(
    endpoints.addresses({ limit: 1, with_total: 1 }),
  );
  const { data: soulMasterData } = useApi<AddressResults>(
    endpoints.addresses({
      limit: 1,
      with_total: 1,
      organization_name: "masters",
    }),
  );

  // TODO: We need to upload legacy chain NFTs to explorer's database and remove this manual tweak.
  const legacyNftOffset = 400000;
  const totalNftCount =
    typeof nftData?.total_results === "number"
      ? nftData.total_results + legacyNftOffset
      : null;
  const soulMasterCount =
    typeof soulMasterData?.total_results === "number"
      ? soulMasterData.total_results
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
    totalTransactions: txData?.total_results?.toLocaleString("en-US") ?? null,
    totalTokens: tokenData?.total_results?.toLocaleString("en-US") ?? null,
    totalNfts: totalNftCount?.toLocaleString("en-US") ?? null,
    totalContracts: contractData?.total_results?.toLocaleString("en-US") ?? null,
    totalAddresses: addressData?.total_results?.toLocaleString("en-US") ?? null,
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
