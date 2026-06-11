import { getPlaceholderProjects } from "@/lib/placeholder-content";
import { getProductionProjects } from "@/lib/production-content";
import type {
  Lang,
  LocaleDictionary,
  ProjectContent,
  SiteConfig,
} from "@/lib/site-config.types";

export function getProjects(
  lang: Lang,
  dictionary: LocaleDictionary,
  siteConfig: SiteConfig,
): ProjectContent[] {
  return siteConfig.placeholderMode
    ? getPlaceholderProjects(lang, dictionary)
    : getProductionProjects(lang, dictionary);
}
