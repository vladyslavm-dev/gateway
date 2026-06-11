import type { Metadata } from "next";

import { getLegalPath } from "@/lib/routes";
import type { Lang, LocaleDictionary } from "@/lib/site-config.types";

function createAlternates(siteUrl: string, lang: Lang, route: string) {
  const enHref = `${siteUrl}${route === "home" ? "/en" : getLegalPath("en", route as "impressum" | "dataProtection")}`;
  const deHref = `${siteUrl}${route === "home" ? "/de" : getLegalPath("de", route as "impressum" | "dataProtection")}`;

  return {
    canonical: lang === "en" ? enHref : deHref,
    languages: {
      en: enHref,
      de: deHref,
    },
  };
}

export function buildPageMetadata(options: {
  siteUrl: string;
  lang: Lang;
  dictionary: LocaleDictionary;
  route: "home" | "impressum" | "dataProtection";
}): Metadata {
  const titleMap = {
    home: options.dictionary.meta.siteTitle,
    impressum: options.dictionary.meta.legalTitle,
    dataProtection: options.dictionary.meta.dataProtectionTitle,
  } as const;

  const descriptionMap = {
    home: options.dictionary.meta.siteDescription,
    impressum: options.dictionary.legal.legalNoticeSummary,
    dataProtection: options.dictionary.legal.dataProtectionNoticeSummary,
  } as const;

  const title = titleMap[options.route];
  const description = descriptionMap[options.route];

  return {
    title,
    description,
    alternates: createAlternates(options.siteUrl, options.lang, options.route),
    openGraph: {
      title,
      description,
      type: "website",
      url:
        options.route === "home"
          ? `${options.siteUrl}/${options.lang}`
          : `${options.siteUrl}${getLegalPath(
              options.lang,
              options.route as "impressum" | "dataProtection",
            )}`,
      locale: options.lang,
    },
  };
}
