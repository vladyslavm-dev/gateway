import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/sections/contact-section";
import {
  DeckPushRoot,
  DeckPushWrapper,
} from "@/components/sections/deck-push-wrapper";
import { GraphStageSlabsPushClient } from "@/components/sections/graph-stage-slabs-push-client";
import { HeroBlock } from "@/components/sections/hero-block";
import { ProjectIceDeck } from "@/components/sections/project-ice-deck";
import { getProjects } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { isLang } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!isLang(lang)) {
    return {};
  }

  const dictionary = getDictionary(lang);
  const siteConfig = getSiteConfig();

  return buildPageMetadata({
    siteUrl: siteConfig.siteUrl,
    lang,
    dictionary,
    route: "home",
  });
}

export default async function LangHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLang(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const siteConfig = getSiteConfig();
  const projects = getProjects(lang, dictionary, siteConfig);

  return (
    <main>
      <HeroBlock currentLang={lang} dictionary={dictionary} />
      <DeckPushRoot>
        <GraphStageSlabsPushClient
          dictionary={dictionary}
          projects={projects}
        />
        <DeckPushWrapper />
        <ProjectIceDeck dictionary={dictionary} projects={projects} />
      </DeckPushRoot>
      <ContactSection
        currentLang={lang}
        dictionary={dictionary}
        siteConfig={siteConfig}
      />
    </main>
  );
}
