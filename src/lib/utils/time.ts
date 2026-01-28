const utcFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const utcFormatterWithSeconds = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const formatUtcParts = (date: Date, withSeconds: boolean) => {
  const formatter = withSeconds ? utcFormatterWithSeconds : utcFormatter;
  const parts = formatter.formatToParts(date);
  return parts.reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
};

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
  return `${utcFormatter.format(date)} UTC`;
};

export const formatDateTimeWithSeconds = (date: Date) => {
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const parts = formatUtcParts(date, true);
  const time = [parts.hour, parts.minute, parts.second].filter(Boolean).join(":");
  const suffix = parts.dayPeriod ? ` ${parts.dayPeriod}` : "";
  return `${parts.month}-${parts.day}-${parts.year} ${time}${suffix} UTC`.trim();
};

export const formatRelativeAge = (date: Date, now: Date = new Date()) => {
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  // Match common explorer UX: report the closest whole unit (secs → mins → hrs → days → mos → yrs).
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;

  if (diffSeconds < minute) {
    const value = diffSeconds;
    return `${value} ${value === 1 ? "sec" : "secs"} ago`;
  }
  if (diffSeconds < hour) {
    const value = Math.floor(diffSeconds / minute);
    return `${value} ${value === 1 ? "min" : "mins"} ago`;
  }
  if (diffSeconds < day) {
    const value = Math.floor(diffSeconds / hour);
    return `${value} ${value === 1 ? "hr" : "hrs"} ago`;
  }
  if (diffSeconds < month) {
    const value = Math.floor(diffSeconds / day);
    return `${value} ${value === 1 ? "day" : "days"} ago`;
  }
  if (diffSeconds < year) {
    const value = Math.floor(diffSeconds / month);
    return `${value} ${value === 1 ? "mo" : "mos"} ago`;
  }
  const value = Math.floor(diffSeconds / year);
  return `${value} ${value === 1 ? "yr" : "yrs"} ago`;
};

export const formatDateTimeWithRelative = (date: Date) => {
  const absolute = formatDateTimeWithSeconds(date);
  if (absolute === "—") {
    return absolute;
  }
  const relative = formatRelativeAge(date);
  if (relative === "—") {
    return absolute;
  }
  return `${absolute} · ${relative}`;
};
