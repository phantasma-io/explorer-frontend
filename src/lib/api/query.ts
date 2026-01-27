type QueryRecord = Record<string, string | number | boolean | undefined | null>;

export const objToQuery = (obj: QueryRecord) => {
  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};
