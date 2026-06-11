import type { SiteConfig } from "@/lib/site-config.types";

const DEFAULT_CONFIG: SiteConfig = {
  placeholderMode: true,
  siteUrl: "https://example.com",
  contact: {
    email: "name@example.com",
    linkedinUrl: "https://linkedin.com/",
    githubUrl: "https://github.com/",
  },
  legal: {
    fullName: "Your Legal Name",
    addressLine1: "Street 1",
    addressLine2: "12345 City",
    addressLine3: "",
    country: "Country",
    email: "name@example.com",
    hostingProvider: "Hosting Provider",
    processingLocation: "EU/EEA",
  },
};

function requireValue(
  value: string | undefined,
  key: string,
  placeholderMode: boolean,
  fallback: string,
): string {
  if (value) {
    return value;
  }

  if (placeholderMode) {
    return fallback;
  }

  throw new Error(`Missing required environment value: ${key}`);
}

export function resolveSiteConfig(
  env: Record<string, string | undefined> = process.env,
): SiteConfig {
  const placeholderMode = env.PLACEHOLDER_MODE !== "false";

  return {
    placeholderMode,
    siteUrl: requireValue(
      env.SITE_URL,
      "SITE_URL",
      placeholderMode,
      DEFAULT_CONFIG.siteUrl,
    ),
    contact: {
      email: requireValue(
        env.CONTACT_EMAIL,
        "CONTACT_EMAIL",
        placeholderMode,
        DEFAULT_CONFIG.contact.email,
      ),
      linkedinUrl: requireValue(
        env.CONTACT_LINKEDIN_URL,
        "CONTACT_LINKEDIN_URL",
        placeholderMode,
        DEFAULT_CONFIG.contact.linkedinUrl,
      ),
      githubUrl: requireValue(
        env.CONTACT_GITHUB_URL,
        "CONTACT_GITHUB_URL",
        placeholderMode,
        DEFAULT_CONFIG.contact.githubUrl,
      ),
    },
    legal: {
      fullName: requireValue(
        env.LEGAL_FULL_NAME,
        "LEGAL_FULL_NAME",
        placeholderMode,
        DEFAULT_CONFIG.legal.fullName,
      ),
      addressLine1: requireValue(
        env.LEGAL_ADDRESS_LINE_1,
        "LEGAL_ADDRESS_LINE_1",
        placeholderMode,
        DEFAULT_CONFIG.legal.addressLine1,
      ),
      addressLine2: requireValue(
        env.LEGAL_ADDRESS_LINE_2,
        "LEGAL_ADDRESS_LINE_2",
        placeholderMode,
        DEFAULT_CONFIG.legal.addressLine2,
      ),
      addressLine3: requireValue(
        env.LEGAL_ADDRESS_LINE_3,
        "LEGAL_ADDRESS_LINE_3",
        placeholderMode,
        DEFAULT_CONFIG.legal.addressLine3,
      ),
      country: requireValue(
        env.LEGAL_COUNTRY,
        "LEGAL_COUNTRY",
        placeholderMode,
        DEFAULT_CONFIG.legal.country,
      ),
      email: requireValue(
        env.LEGAL_EMAIL,
        "LEGAL_EMAIL",
        placeholderMode,
        DEFAULT_CONFIG.legal.email,
      ),
      hostingProvider: requireValue(
        env.LEGAL_HOSTING_PROVIDER,
        "LEGAL_HOSTING_PROVIDER",
        placeholderMode,
        DEFAULT_CONFIG.legal.hostingProvider,
      ),
      processingLocation: requireValue(
        env.LEGAL_PROCESSING_LOCATION,
        "LEGAL_PROCESSING_LOCATION",
        placeholderMode,
        DEFAULT_CONFIG.legal.processingLocation,
      ),
    },
  };
}
