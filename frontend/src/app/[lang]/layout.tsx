import { notFound } from "next/navigation";

import { WorldRoot } from "@/components/world/world-root";
import { isLang } from "@/lib/routes";

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "de" }];
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!isLang(lang)) {
    notFound();
  }

  return <WorldRoot>{children}</WorldRoot>;
}
