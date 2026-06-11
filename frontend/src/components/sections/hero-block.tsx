import { LanguageSwitch } from "@/components/layout/language-switch";
import type { Lang, LocaleDictionary } from "@/lib/site-config.types";

interface HeroBlockProps {
  currentLang: Lang;
  dictionary: LocaleDictionary;
}

export function HeroBlock({ currentLang, dictionary }: HeroBlockProps) {
  const [credentialLine, skillsLine = ""] = dictionary.hero.line.split(" · ");

  return (
    <section
      className="relative"
      style={{
        paddingInline: "var(--slab-gutter)",
        paddingTop: "clamp(48px, 10dvh, 120px)",
        paddingBottom: "var(--slab-gap)",
      }}
    >
      <div
        className="relative mx-auto flex flex-col items-center space-y-8 text-center"
        style={{
          width: "100%",
          maxWidth: "min(var(--slab-width), 640px)",
        }}
      >
        <div className="space-y-5">
          <h1
            className="font-semibold text-slate-50 [text-wrap:balance]"
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: "1.05",
            }}
          >
            {dictionary.hero.name}
          </h1>
          <p
            className="text-white/90"
            style={{ fontSize: "clamp(16px, 2.2vw, 22px)" }}
          >
            {dictionary.hero.role}
          </p>
          <p
            className="max-w-2xl leading-7 text-cyan-50/92"
            style={{ fontSize: "clamp(14px, 1.4vw, 18px)" }}
          >
            <span className="block">{credentialLine}</span>
            {skillsLine ? <span className="block">{skillsLine}</span> : null}
          </p>
        </div>
        <LanguageSwitch
          currentLang={currentLang}
          currentPath={`/${currentLang}`}
          ariaLabel={dictionary.hero.languageLabel}
        />
      </div>
    </section>
  );
}
