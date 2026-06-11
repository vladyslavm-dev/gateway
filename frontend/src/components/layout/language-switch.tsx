import { PreservingLink } from "@/components/layout/preserving-link";
import { getAlternateLocalePath } from "@/lib/routes";
import type { Lang } from "@/lib/site-config.types";

interface LanguageSwitchProps {
  currentLang: Lang;
  currentPath: string;
  ariaLabel: string;
}

export function LanguageSwitch({
  currentLang,
  currentPath,
  ariaLabel,
}: LanguageSwitchProps) {
  const enHref = getAlternateLocalePath("en", currentPath);
  const deHref = getAlternateLocalePath("de", currentPath);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative inline-grid grid-cols-2 rounded-full border border-white/40 bg-white/20 p-1 text-sm text-white shadow-[0_16px_50px_rgba(2,8,20,0.28)] backdrop-blur-md md:backdrop-blur-xl"
    >
      <span
        className={`absolute left-1.5 inset-y-1.5 w-[calc(50%-0.375rem)] rounded-full bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(2,8,20,0.25)] transition-transform duration-300 ${
          currentLang === "en" ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden="true"
      />
      <PreservingLink
        href={enHref}
        className={`relative z-10 flex min-h-[44px] items-center justify-center rounded-full px-5 py-2 text-center font-mono tracking-[0.18em] transition-colors md:min-h-0 ${
          currentLang === "en" ? "text-slate-900" : "text-white/90 hover:text-white"
        }`}
        aria-current={currentLang === "en" ? "page" : undefined}
      >
        EN
      </PreservingLink>
      <PreservingLink
        href={deHref}
        className={`relative z-10 flex min-h-[44px] items-center justify-center rounded-full px-5 py-2 text-center font-mono tracking-[0.18em] transition-colors md:min-h-0 ${
          currentLang === "de" ? "text-slate-900" : "text-white/90 hover:text-white"
        }`}
        aria-current={currentLang === "de" ? "page" : undefined}
      >
        DE
      </PreservingLink>
    </div>
  );
}
