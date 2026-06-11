import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import { getLegalDocument } from "@/lib/legal-content";
import { buildPageMetadata } from "@/lib/metadata";
import { isLang } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site-config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#091420",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!isLang(lang)) {
    return {};
  }

  const dictionary = getDictionary(lang);
  const siteConfig = getSiteConfig();

  return buildPageMetadata({
    siteUrl: siteConfig.siteUrl,
    lang,
    dictionary,
    route: "impressum",
  });
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLang(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const siteConfig = getSiteConfig();

  return (
    <LegalPage
      currentLang={lang}
      currentPath={`/${lang}/impressum`}
      dictionary={dictionary}
      title={dictionary.meta.legalTitle}
      document={getLegalDocument(lang, "impressum", siteConfig)}
    />
  );
}
