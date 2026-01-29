import { redirect } from "next/navigation";
import { objToQuery } from "@/lib/api/query";

interface LegacyLocaleIndexProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LegacyLocaleIndex({ searchParams }: LegacyLocaleIndexProps) {
  // Preserve legacy query strings when stripping the locale prefix.
  const query = objToQuery(searchParams ?? {});
  redirect(`/${query}`);
}
