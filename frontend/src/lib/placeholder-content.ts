import { getLegalPath } from "@/lib/routes";
import type {
  CategoryId,
  Lang,
  LocaleDictionary,
  ProjectContent,
  ProjectId,
} from "@/lib/site-config.types";

const PROJECT_IDS: ProjectId[] = ["auction", "vault", "extension", "gateway"];
const CATEGORY_IDS: CategoryId[] = [
  "category-1",
  "category-2",
  "category-3",
  "category-4",
  "category-5",
];

const PROJECT_LINKS = [
  { labelKey: "demo", href: "https://example.com", kind: "demo" as const },
  { labelKey: "repository", href: "https://github.com", kind: "repository" as const },
  { labelKey: "video", href: "https://youtube.com", kind: "video" as const },
] as const;

export function getPlaceholderProjects(
  lang: Lang,
  dictionary: LocaleDictionary,
): ProjectContent[] {
  return PROJECT_IDS.map((id, index) => {
    const projectIndex = index + 1;
    const title = `${dictionary.labels.project} ${String(projectIndex).padStart(2, "0")}`;

    return {
      id,
      title,
      summary:
        index === 2 ? dictionary.labels.comingSoon : dictionary.sections.cardsSummary,
      imageAlt: title,
      comingSoon: id === "extension",
      links:
        id === "extension"
          ? []
          : PROJECT_LINKS.map((link) => ({
              label:
                dictionary.labels[
                  link.labelKey as "demo" | "repository" | "video"
                ],
              href: link.href,
              kind: link.kind,
            })),
      categories: CATEGORY_IDS.map((categoryId, categoryIndex) => ({
        id: categoryId,
        label: `${dictionary.labels.category} ${categoryIndex + 1}`,
        skills: [
          `${dictionary.labels.skill} 1`,
          `${dictionary.labels.skill} 2`,
          `${dictionary.labels.skill} 3`,
        ],
        detail: "",
      })),
    };
  });
}

export function getLegalLinks(lang: Lang, dictionary: LocaleDictionary) {
  return [
    {
      label: dictionary.labels.dataProtection,
      href: getLegalPath(lang, "dataProtection"),
    },
    {
      label: dictionary.labels.impressum,
      href: getLegalPath(lang, "impressum"),
    },
  ];
}
