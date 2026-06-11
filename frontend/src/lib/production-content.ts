import { getPlaceholderProjects } from "@/lib/placeholder-content";
import type {
  Lang,
  LocaleDictionary,
  ProjectContent,
} from "@/lib/site-config.types";

export function getProductionProjects(
  lang: Lang,
  dictionary: LocaleDictionary,
): ProjectContent[] {
  return getPlaceholderProjects(lang, dictionary);
}
