import { ChevronLeftIcon } from "@/components/layout/icons";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { PreservingLink } from "@/components/layout/preserving-link";
import { getHomePath } from "@/lib/routes";
import type {
  Lang,
  LegalDocument,
  LegalSection,
  LocaleDictionary,
} from "@/lib/site-config.types";

interface LegalPageProps {
  currentLang: Lang;
  currentPath: string;
  dictionary: LocaleDictionary;
  title: string;
  document: LegalDocument;
}

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-100 md:text-xl">
        {section.title}
      </h2>
      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph}
          className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base"
        >
          {paragraph}
        </p>
      ))}
      {section.items ? (
        section.listStyle === "plain" ? (
          <div className="space-y-1 text-sm leading-7 text-slate-300 md:text-base">
            {section.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : (
          <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300 md:text-base">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

export function LegalPage({
  currentLang,
  currentPath,
  dictionary,
  title,
  document,
}: LegalPageProps) {
  const isImpressum = currentPath.includes("impressum");
  const articleWidthClass = isImpressum ? "max-w-xl" : "max-w-3xl";

  return (
    <main className="min-h-screen bg-[#091420] px-5 py-8 text-slate-100 md:px-8 md:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <PreservingLink
            href={getHomePath(currentLang)}
            aria-label={currentLang === "de" ? "Zurück zur Startseite" : "Back to home"}
            title={currentLang === "de" ? "Zurück zur Startseite" : "Back to home"}
            className="btn-nav btn-nav--icon-sm"
          >
            <ChevronLeftIcon width={12} height={12} aria-hidden="true" />
          </PreservingLink>
          <LanguageSwitch
            currentLang={currentLang}
            currentPath={currentPath}
            ariaLabel={dictionary.hero.languageLabel}
          />
        </div>

        <article className={`mx-auto w-full ${articleWidthClass} space-y-8 text-left`}>
          <header className="space-y-6">
            <h1 className="text-center text-3xl font-semibold text-slate-50 md:text-5xl">
              {title}
            </h1>
            {document.intro?.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </header>

          {document.sections.map((section) => (
            <LegalSectionBlock key={section.title} section={section} />
          ))}
        </article>
      </div>
    </main>
  );
}
