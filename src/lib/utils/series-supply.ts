export interface SeriesSupplyMetrics {
  current: number | null;
  max: number | null;
  remaining: number | null;
  percent: number | null;
}

const toSupplyNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  const parsed =
    typeof value === "number" ? value : Number(value.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
};

export const buildSeriesSupplyMetrics = (
  currentValue: number | string | null | undefined,
  maxValue: number | string | null | undefined,
): SeriesSupplyMetrics => {
  const current = toSupplyNumber(currentValue);
  const max = toSupplyNumber(maxValue);

  const hasBoundedMax = max !== null && max > 0;
  const safeCurrent = current ?? 0;

  if (!hasBoundedMax) {
    return {
      current,
      max,
      remaining: null,
      percent: null,
    };
  }

  const remaining = Math.max(max - safeCurrent, 0);
  const percent = Math.min((safeCurrent / max) * 100, 100);

  return {
    current,
    max,
    remaining,
    percent,
  };
};
