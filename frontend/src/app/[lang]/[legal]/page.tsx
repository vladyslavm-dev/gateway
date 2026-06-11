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

function isValidLegalSlug(lang: "en" | "de", legal: string) {
  return (
    (lang === "en" && legal === "data-protection") ||
    (lang === "de" && legal === "datenschutz")
  );
}

export async function generateStaticParams() {
  return [
    { lang: "en", legal: "data-protection" },
    { lang: "de", legal: "datenschutz" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; legal: string }>;
}): Promise<Metadata> {
  const { lang, legal } = await params;

  if (!isLang(lang) || !isValidLegalSlug(lang, legal)) {
    return {};
  }

  const dictionary = getDictionary(lang);
  const siteConfig = getSiteConfig();

  return buildPageMetadata({
    siteUrl: siteConfig.siteUrl,
    lang,
    dictionary,
    route: "dataProtection",
  });
}

export default async function LegalSlugPage({
  params,
}: {
  params: Promise<{ lang: string; legal: string }>;
}) {
  const { lang, legal } = await params;

  if (!isLang(lang) || !isValidLegalSlug(lang, legal)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const siteConfig = getSiteConfig();
  const currentPath =
    lang === "de" ? "/de/datenschutz" : "/en/data-protection";

  return (
    <LegalPage
      currentLang={lang}
      currentPath={currentPath}
      dictionary={dictionary}
      title={dictionary.meta.dataProtectionTitle}
      document={getLegalDocument(lang, "dataProtection", siteConfig)}
    />
  );
}
