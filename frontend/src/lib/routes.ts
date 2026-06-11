import type { Lang, LegalRouteKey } from "@/lib/site-config.types";

export const SUPPORTED_LANGS = ["en", "de"] as const;

export function isLang(value: string): value is Lang {
  return SUPPORTED_LANGS.includes(value as Lang);
}

export function getHomePath(lang: Lang): string {
  return `/${lang}`;
}

export function getLegalPath(lang: Lang, key: LegalRouteKey): string {
  if (key === "impressum") {
    return `/${lang}/impressum`;
  }

  return lang === "de" ? "/de/datenschutz" : "/en/data-protection";
}

export function getAlternateLocalePath(
  lang: Lang,
  pathname: string,
): string {
  if (pathname.includes("/impressum")) {
    return getLegalPath(lang, "impressum");
  }

  if (
    pathname.includes("/data-protection") ||
    pathname.includes("/datenschutz")
  ) {
    return getLegalPath(lang, "dataProtection");
  }

  return getHomePath(lang);
}
