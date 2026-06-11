import "server-only";

import { resolveSiteConfig } from "@/lib/site-config.core";

export { resolveSiteConfig } from "@/lib/site-config.core";

export function getSiteConfig() {
  return resolveSiteConfig();
}
