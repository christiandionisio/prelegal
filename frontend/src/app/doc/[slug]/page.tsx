import { DOCUMENT_CONFIGS, getDocConfig } from "@/lib/document-configs";
import NDAShell from "@/components/NDAShell";
import GenericDocShell from "@/components/GenericDocShell";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return DOCUMENT_CONFIGS.map((doc) => ({ slug: doc.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const config = getDocConfig(slug);
  if (!config) notFound();

  if (slug === "mutual-nda") {
    return <NDAShell />;
  }

  return <GenericDocShell config={config} />;
}
