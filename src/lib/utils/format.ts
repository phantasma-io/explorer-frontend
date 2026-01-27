const extractOptionalDecimals = (pattern: string): number => {
  const match = pattern.match(/\[(0+)]/);
  return match?.[1]?.length ?? 0;
};

export const numberFormat = (
  value: number | string,
  pattern = "0,0.[00000000]",
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return `${value}`;
  }

  const maximumFractionDigits = extractOptionalDecimals(pattern);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(parsed);
};

export const stringTruncate = (value: string, length: number) => {
  if (!value || value.length <= length) {
    return value;
  }

  return `${value.slice(0, length)}...`;
};

export const stringTruncateMiddle = (value: string, head = 8, tail = 6) => {
  if (!value || value.length <= head + tail + 1) {
    return value;
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};

export const formatBytes = (value: number | string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return `${value}`;
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = parsed;
  let unitIndex = 0;

  // Scale bytes into human-friendly units without losing small-value precision.
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};
