import { redirect } from "next/navigation";
import { objToQuery } from "@/lib/api/query";

interface LegacyLocaleCatchAllProps {
  params: Promise<{ legacyLocale: string; path: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyLocaleCatchAll({
  params,
  searchParams,
}: LegacyLocaleCatchAllProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const path = resolvedParams.path?.length ? `/${resolvedParams.path.join("/")}` : "/";
  // Preserve legacy query strings when stripping the locale prefix.
  const query = objToQuery(resolvedSearchParams);
  redirect(`${path}${query}`);
}
