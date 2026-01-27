export const unixToDate = (ts?: string | number | null) => {
  if (ts === undefined || ts === null) {
    return new Date(NaN);
  }
  const parsed = typeof ts === "string" ? parseInt(ts, 10) : ts;
  if (!Number.isFinite(parsed)) {
    return new Date(NaN);
  }
  return new Date(parsed * 1000);
};

export const formatDateTime = (date: Date) => {
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
