import { de } from "@/locales/de";
import { en } from "@/locales/en";
import { isLang } from "@/lib/routes";
import type { Lang, LocaleDictionary } from "@/lib/site-config.types";

const DICTIONARIES: Record<Lang, LocaleDictionary> = {
  en,
  de,
};

export function getDictionary(lang: string): LocaleDictionary {
  if (!isLang(lang)) {
    return en;
  }

  return DICTIONARIES[lang];
}

export function getSupportedLangs(): Lang[] {
  return ["en", "de"];
}
