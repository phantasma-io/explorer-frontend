import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/locales";

interface LegacyBlockPageProps {
  params: { legacyLocale: string };
  searchParams: { id?: string | string[]; height?: string | string[] };
}

export default function LegacyBlockPage({ params, searchParams }: LegacyBlockPageProps) {
  if (!isLocale(params.legacyLocale)) {
    notFound();
  }

  const idParam = searchParams.id ?? searchParams.height;
  const blockId = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!blockId) {
    redirect("/");
  }

  redirect(`/block/${blockId}`);
}
