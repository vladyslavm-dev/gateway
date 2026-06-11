"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";

import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/layout/icons";
import { PreservingLink } from "@/components/layout/preserving-link";
import { frostBurst } from "@/components/sections/project-ice-deck";
import { getLegalLinks } from "@/lib/placeholder-content";
import type {
  Lang,
  LocaleDictionary,
  SiteConfig,
} from "@/lib/site-config.types";

interface ContactSectionProps {
  currentLang: Lang;
  dictionary: LocaleDictionary;
  siteConfig: SiteConfig;
}

export function ContactSection({
  currentLang,
  dictionary,
  siteConfig,
}: ContactSectionProps) {
  const legalLinks = getLegalLinks(currentLang, dictionary);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const handlePress = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const host = hostRef.current;
    if (!host) return;
    frostBurst(event.currentTarget, host);
  }, []);

  const contactItems = [
    {
      key: "email",
      label: dictionary.labels.email,
      href: `mailto:${siteConfig.contact.email}`,
      icon: <MailIcon className="h-7 w-7" aria-hidden="true" />,
    },
    {
      key: "linkedin",
      label: dictionary.labels.linkedin,
      href: siteConfig.contact.linkedinUrl,
      icon: <LinkedInIcon className="h-7 w-7" aria-hidden="true" />,
    },
    {
      key: "github",
      label: dictionary.labels.github,
      href: siteConfig.contact.githubUrl,
      icon: <GitHubIcon className="h-7 w-7" aria-hidden="true" />,
    },
  ];

  return (
    <section
      aria-label={dictionary.sections.contactEyebrow}
      className="relative"
      style={{
        paddingInline: "var(--slab-gutter)",
        paddingTop: "calc(3rem + var(--slab-gap))",
        paddingBottom: "var(--slab-gap)",
      }}
    >
      <div
        ref={hostRef}
        className="relative mx-auto flex w-full flex-col items-center gap-7"
        style={{ overflow: "visible", maxWidth: "clamp(320px, 92vw, 960px)" }}
      >
        <div
          className="flex items-center gap-5"
          role="group"
          aria-label={dictionary.sections.contactEyebrow}
        >
          {contactItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              target={item.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
              aria-label={item.label}
              title={item.label}
              onClick={handlePress}
              className="btn-nav btn-nav--icon btn-nav--lift"
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="contact-legal">
          {legalLinks.map((item) => (
            <PreservingLink
              key={item.label}
              href={item.href}
              className="contact-legal__link"
            >
              {item.label}
            </PreservingLink>
          ))}
        </div>
      </div>
    </section>
  );
}
