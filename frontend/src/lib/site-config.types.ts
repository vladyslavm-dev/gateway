export type Lang = "en" | "de";

export type LegalRouteKey = "impressum" | "dataProtection";

export type ProjectId = "vault" | "auction" | "extension" | "gateway";

export type CategoryId =
  | "category-1"
  | "category-2"
  | "category-3"
  | "category-4"
  | "category-5";

export type LegalListStyle = "bullet" | "plain";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
  listStyle?: LegalListStyle;
}

export interface LegalDocument {
  intro?: string[];
  sections: LegalSection[];
}

export interface SiteConfig {
  placeholderMode: boolean;
  siteUrl: string;
  contact: {
    email: string;
    linkedinUrl: string;
    githubUrl: string;
  };
  legal: {
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    country: string;
    email: string;
    hostingProvider: string;
    processingLocation: string;
  };
}

export interface LinkItem {
  label: string;
  href: string;
}

export type ProjectCardLinkKind = "demo" | "repository" | "video";

export interface ProjectCardLink {
  label: string;
  href: string;
  kind: ProjectCardLinkKind;
}

export interface CategoryContent {
  id: CategoryId;
  label: string;
  skills: string[];
  detail: string;
}

export interface ProjectContent {
  id: ProjectId;
  title: string;
  summary: string;
  imageAlt: string;
  imageBasePath?: string;
  iconPath?: string;
  comingSoon?: boolean;
  links: ProjectCardLink[];
  categories: CategoryContent[];
}

export interface LocaleDictionary {
  localeName: string;
  meta: {
    siteTitle: string;
    siteDescription: string;
    legalTitle: string;
    dataProtectionTitle: string;
  };
  hero: {
    name: string;
    role: string;
    line: string;
    languageLabel: string;
  };
  sections: {
    graphEyebrow: string;
    cardsEyebrow: string;
    cardsSummary: string;
    contactEyebrow: string;
  };
  labels: {
    demo: string;
    repository: string;
    video: string;
    category: string;
    skill: string;
    project: string;
    comingSoon: string;
    dataProtection: string;
    impressum: string;
    email: string;
    linkedin: string;
    github: string;
  };
  legal: {
    legalNoticeSummary: string;
    dataProtectionNoticeSummary: string;
  };
}
