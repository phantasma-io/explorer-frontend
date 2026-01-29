type QueryValue = string | number | boolean | undefined | null;
type QueryRecord = Record<string, QueryValue | QueryValue[]>;

export const objToQuery = (obj: QueryRecord) => {
  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const values = Array.isArray(value) ? value : [value];
    values.forEach((entry) => {
      if (entry === undefined || entry === null) return;
      params.append(key, String(entry));
    });
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};
