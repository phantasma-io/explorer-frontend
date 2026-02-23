import { redirect } from "next/navigation";

interface LegacyBlockPageProps {
  searchParams: Promise<{ id?: string | string[]; height?: string | string[] }>;
}

export default async function LegacyBlockPage({ searchParams }: LegacyBlockPageProps) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams.id ?? resolvedSearchParams.height;
  const blockId = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!blockId) {
    redirect("/");
  }

  redirect(`/block/${blockId}`);
}
