import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/locales";

interface LegacyTransactionPageProps {
  params: { legacyLocale: string };
  searchParams: { id?: string | string[]; hash?: string | string[] };
}

export default function LegacyTransactionPage({ params, searchParams }: LegacyTransactionPageProps) {
  if (!isLocale(params.legacyLocale)) {
    notFound();
  }

  const idParam = searchParams.id ?? searchParams.hash;
  const hash = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!hash) {
    redirect("/");
  }

  redirect(`/tx/${hash}`);
}
