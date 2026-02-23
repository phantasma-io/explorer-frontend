import { redirect } from "next/navigation";
import { objToQuery } from "@/lib/api/query";

interface LegacyLocaleIndexProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyLocaleIndex({ searchParams }: LegacyLocaleIndexProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  // Preserve legacy query strings when stripping the locale prefix.
  const query = objToQuery(resolvedSearchParams);
  redirect(`/${query}`);
}
