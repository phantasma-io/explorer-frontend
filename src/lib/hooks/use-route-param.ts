import { useParams } from "next/navigation";

/*
  Client pages in the App Router do not receive `params` as props.
  Normalize route params here so dynamic pages render stable IDs on the client.
*/
export function useRouteParam(key: string): string {
  const params = useParams<Record<string, string | string[]>>();
  const value = params?.[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
