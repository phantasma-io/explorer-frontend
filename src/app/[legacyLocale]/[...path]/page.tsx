import { redirect } from "next/navigation";
import { objToQuery } from "@/lib/api/query";

interface LegacyLocaleCatchAllProps {
  params: { legacyLocale: string; path: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LegacyLocaleCatchAll({
  params,
  searchParams,
}: LegacyLocaleCatchAllProps) {
  const path = params.path?.length ? `/${params.path.join("/")}` : "/";
  // Preserve legacy query strings when stripping the locale prefix.
  const query = objToQuery(searchParams ?? {});
  redirect(`${path}${query}`);
}
