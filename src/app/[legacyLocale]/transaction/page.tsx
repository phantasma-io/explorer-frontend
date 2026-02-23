import { redirect } from "next/navigation";

interface LegacyTransactionPageProps {
  searchParams: Promise<{ id?: string | string[]; hash?: string | string[] }>;
}

export default async function LegacyTransactionPage({ searchParams }: LegacyTransactionPageProps) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams.id ?? resolvedSearchParams.hash;
  const hash = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!hash) {
    redirect("/");
  }

  redirect(`/tx/${hash}`);
}
