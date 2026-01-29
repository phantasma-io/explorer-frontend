import { redirect } from "next/navigation";

interface LegacyBlockPageProps {
  searchParams: { id?: string | string[]; height?: string | string[] };
}

export default function LegacyBlockPage({ searchParams }: LegacyBlockPageProps) {
  const idParam = searchParams.id ?? searchParams.height;
  const blockId = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!blockId) {
    redirect("/");
  }

  redirect(`/block/${blockId}`);
}
