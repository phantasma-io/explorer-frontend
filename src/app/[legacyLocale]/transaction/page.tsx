import { redirect } from "next/navigation";

interface LegacyTransactionPageProps {
  searchParams: { id?: string | string[]; hash?: string | string[] };
}

export default function LegacyTransactionPage({ searchParams }: LegacyTransactionPageProps) {
  const idParam = searchParams.id ?? searchParams.hash;
  const hash = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!hash) {
    redirect("/");
  }

  redirect(`/tx/${hash}`);
}
