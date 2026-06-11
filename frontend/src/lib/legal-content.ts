import type {
  Lang,
  LegalDocument,
  LegalRouteKey,
  SiteConfig,
} from "@/lib/site-config.types";

function addressLines(siteConfig: SiteConfig) {
  const legal = siteConfig.legal;
  return [
    legal.fullName,
    legal.addressLine1,
    legal.addressLine2,
    legal.addressLine3,
    legal.country,
  ].filter(Boolean);
}

function contactLine(siteConfig: SiteConfig) {
  return `E-mail: ${siteConfig.legal.email}`;
}

function kontaktZeile(siteConfig: SiteConfig) {
  return `E-Mail: ${siteConfig.legal.email}`;
}

function processingLocationDe(value: string) {
  return value === "Germany / EU/EEA" ? "Deutschland / EU/EWR" : value;
}

function processingLocationEn(value: string) {
  return value === "Deutschland / EU/EWR" ? "Germany / EU/EEA" : value;
}

function placeholderLegalDocument(lang: Lang, route: LegalRouteKey): LegalDocument {
  const isGerman = lang === "de";
  const title =
    route === "impressum"
      ? isGerman
        ? "Vorlage"
        : "Template"
      : isGerman
        ? "Datenschutzvorlage"
        : "Privacy template";

  return {
    intro: [
      isGerman
        ? "Diese Vorlage enthält keine produktiven rechtlichen Angaben. Fügen Sie vor der Veröffentlichung eigene Angaben ein."
        : "This template does not include production legal information. Add your own details before publishing.",
    ],
    sections: [{ title, paragraphs: [] }],
  };
}

function impressumDe(siteConfig: SiteConfig): LegalDocument {
  const lines = addressLines(siteConfig);

  return {
    sections: [
      {
        title: "Angaben gemäß § 5 DDG",
        items: lines,
        listStyle: "plain",
      },
      {
        title: "Kontakt",
        items: [kontaktZeile(siteConfig)],
        listStyle: "plain",
      },
      {
        title: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
        items: lines,
        listStyle: "plain",
      },
      {
        title: "Hinweis",
        paragraphs: [
          "Diese Website stellt technische Demos, rechtliche Informationen und Kontaktlinks bereit.",
        ],
      },
    ],
  };
}

function impressumEn(siteConfig: SiteConfig): LegalDocument {
  const lines = addressLines(siteConfig);

  return {
    sections: [
      {
        title: "Information pursuant to section 5 DDG",
        items: lines,
        listStyle: "plain",
      },
      {
        title: "Contact",
        items: [contactLine(siteConfig)],
        listStyle: "plain",
      },
      {
        title: "Responsible for content pursuant to section 18(2) MStV",
        items: lines,
        listStyle: "plain",
      },
      {
        title: "Notice",
        paragraphs: [
          "This website provides technical demos, legal information, and contact links.",
        ],
      },
    ],
  };
}

function dataProtectionDe(siteConfig: SiteConfig): LegalDocument {
  const legal = siteConfig.legal;

  return {
    sections: [
      {
        title: "1. Verantwortlicher",
        paragraphs: [
          "Verantwortlicher für die Datenverarbeitung auf dieser Website und in den bereitgestellten Demo-Anwendungen ist:",
        ],
        items: [...addressLines(siteConfig), kontaktZeile(siteConfig)],
        listStyle: "plain",
      },
      {
        title: "2. Geltungsbereich",
        paragraphs: [
          "Diese Datenschutzerklärung gilt für diese Gateway-Website sowie für die über sie verlinkten Demo-Anwendungen. Die Demo-Anwendungen dienen ausschließlich der technischen Demonstration und Evaluation. Es werden keine echten Vermögenswerte verwaltet und kein echtes Geld verarbeitet.",
        ],
      },
      {
        title: "3. Zwecke und Rechtsgrundlagen der Verarbeitung",
        paragraphs: [
          "Die Verarbeitung personenbezogener Daten erfolgt in begrenztem Umfang zum technischen Betrieb der Website und der Demo-Anwendungen, zur Bereitstellung angeforderter Demo-Funktionen, zur Authentifizierung, zur Missbrauchsabwehr, zur Fehleranalyse sowie zur Wahrung der Integrität und Sicherheit der Systeme.",
          "Rechtsgrundlagen sind insbesondere:",
        ],
        items: [
          "Art. 6 Abs. 1 lit. b DSGVO, soweit die Verarbeitung zur Bereitstellung angeforderter Demo-Funktionen und Benutzerkonten erforderlich ist;",
          "Art. 6 Abs. 1 lit. f DSGVO für den sicheren Betrieb der Website und Demo-Anwendungen, die Missbrauchsabwehr, die Rate-Limitierung, die Fehleranalyse sowie die IT-Sicherheit.",
        ],
      },
      {
        title: "4. Kategorien verarbeiteter Daten",
        paragraphs: ["Je nach Nutzung werden insbesondere folgende Daten verarbeitet:"],
        items: [
          "Anzeigenamen, Benutzernamen und sonstige Konto-Kennungen",
          "Passwort-Hashes",
          "Sitzungs- und Authentifizierungsdaten",
          "technisch notwendige Cookie-Informationen und vergleichbare Speichermechanismen",
          "Workspace-IDs und sonstige technisch notwendige Demo-Kennungen",
          "anwendungsbezogene Demo-Daten, zum Beispiel Benachrichtigungen, Audit- und Freigabedaten sowie Auktions-, Gebots- und Wallet-Daten",
          "technische IP-Daten zur serverseitigen Rate-Limitierung und Missbrauchsabwehr",
        ],
      },
      {
        title: "5. Empfänger",
        paragraphs: [
          "Empfänger der Daten sind die von mir eingesetzten technischen Dienstleister, soweit dies für Hosting, Netzwerkbetrieb, Sicherheit und die Bereitstellung der Anwendungen erforderlich ist. Eine Weitergabe zu Werbe- oder Trackingzwecken erfolgt nicht.",
          `Zum Hosting wird ${legal.hostingProvider} als technischer Hosting-Dienstleister eingesetzt.`,
        ],
      },
      {
        title: "6. Ort der Verarbeitung",
        paragraphs: [
          `Ort der Verarbeitung: ${processingLocationDe(legal.processingLocation)}.`,
        ],
      },
      {
        title: "7. Speicherdauer",
        paragraphs: [
          "Die Demo-Anwendungen sind als isolierte Sandbox-Umgebungen ausgestaltet. Anwendungsbezogene Demo-Daten werden automatisiert nach 24 Stunden gelöscht. Backups solcher Demo-Daten werden nicht vorgehalten.",
          "Hiervon unberührt bleiben technisch erforderliche, kurzzeitig verarbeitete Sicherheits- und Verbindungsdaten, soweit deren Verarbeitung für den sicheren Betrieb notwendig ist.",
        ],
      },
      {
        title: "8. Cookies und vergleichbare Technologien",
        paragraphs: [
          "Je nach genutztem Dienst werden ausschließlich technisch notwendige Cookies bzw. vergleichbare Speichermechanismen verwendet. Diese dienen insbesondere der Authentifizierung, der Sitzungsverwaltung sowie der Speicherung nutzerbezogener Oberflächenpräferenzen wie dem Theme-Modus.",
          "Es werden keine Drittanbieter-Tracking-Cookies und keine Analyse-Tools eingesetzt.",
        ],
      },
      {
        title: "9. Automatisierte Entscheidungen",
        paragraphs: [
          "Eine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne des Art. 22 DSGVO findet nicht statt.",
        ],
      },
      {
        title: "10. Rechte der betroffenen Personen",
        paragraphs: [
          "Betroffene Personen haben im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft über die verarbeiteten personenbezogenen Daten, auf Berichtigung unrichtiger Daten, auf Löschung, auf Einschränkung der Verarbeitung, auf Widerspruch gegen die Verarbeitung sowie - soweit anwendbar - auf Datenübertragbarkeit.",
          "Zur Ausübung dieser Rechte genügt eine formlose Mitteilung an die oben genannte Kontaktadresse.",
        ],
      },
      {
        title: "11. Beschwerderecht",
        paragraphs: [
          "Betroffene Personen haben zudem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthaltsorts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.",
        ],
      },
      {
        title: "12. Produktspezifische Hinweise",
        paragraphs: [
          "Die verlinkten Demo-Anwendungen enthalten zusätzliche technische Hinweise, insbesondere zu Demo-Betrieb, Datenisolation, Löschfristen, technisch notwendigen Cookies und serverseitiger Rate-Limitierung.",
        ],
        items: [
          "Demo privacy page: https://example.com",
        ],
      },
      {
        title: "13. DOMgeist Browser-Extension",
        paragraphs: [
          "DOMgeist ist eine lokal arbeitende Browser-Erweiterung zur Analyse der aktuell geöffneten Seite. Die Erweiterung prüft auf Wunsch des Nutzers technische Signale zu Barrierefreiheit, Performance, Sicherheits-Headern, SEO, Browser-Speicher und erkannten Web-Technologien.",
          "Scan-Ergebnisse, Seiten-Snapshots, Browser-Aktivität, Cookies, Browser-Speicher-Daten und exportierte Berichte werden nicht an den Entwickler übermittelt. Die Verarbeitung findet lokal im Browser des Nutzers statt.",
          "Local AI ist standardmäßig deaktiviert. Wenn der Nutzer Local AI aktiviert, kann DOMgeist minimierte Scan-Daten an den lokalen Ollama-Endpunkt des Nutzers senden. DOMgeist sendet diese Daten nicht an den Entwickler und nicht an einen von DOMgeist betriebenen Cloud-Dienst.",
        ],
      },
    ],
  };
}

function dataProtectionEn(siteConfig: SiteConfig): LegalDocument {
  const legal = siteConfig.legal;

  return {
    sections: [
      {
        title: "1. Controller",
        paragraphs: [
          "The controller responsible for data processing on this website and in the provided demo applications is:",
        ],
        items: [...addressLines(siteConfig), contactLine(siteConfig)],
        listStyle: "plain",
      },
      {
        title: "2. Scope",
        paragraphs: [
          "This privacy policy applies to this Gateway website and to the demo applications linked from it. The linked demo applications are provided exclusively for technical demonstration and evaluation purposes. No real assets are managed and no real money is processed.",
        ],
      },
      {
        title: "3. Purposes and Legal Bases of Processing",
        paragraphs: [
          "Personal data are processed on a limited basis for the technical operation of the website and the demo applications, for providing requested demo functionality, for authentication, abuse prevention, error analysis, and for maintaining the integrity and security of the systems.",
          "The legal bases are, in particular:",
        ],
        items: [
          "Article 6(1)(b) GDPR insofar as processing is necessary to provide requested demo functionality and user accounts;",
          "Article 6(1)(f) GDPR for the secure operation of the website and demo applications, abuse prevention, rate limiting, error analysis, and IT security.",
        ],
      },
      {
        title: "4. Categories of Data Processed",
        paragraphs: [
          "Depending on the service used, the following categories of data may be processed:",
        ],
        items: [
          "display names, usernames, and other account identifiers",
          "password hashes",
          "session and authentication data",
          "strictly necessary cookie information and comparable storage mechanisms",
          "workspace IDs and other technically necessary demo identifiers",
          "application-specific demo data, for example notifications, audit and approval data, as well as auction, bid, and wallet data",
          "technical IP data for server-side rate limiting and abuse prevention",
        ],
      },
      {
        title: "5. Recipients",
        paragraphs: [
          "Data may be disclosed to technical service providers engaged by me insofar as this is necessary for hosting, network operation, security, and the provision of the applications. No disclosure takes place for advertising or tracking purposes.",
          `${legal.hostingProvider} is used as the technical hosting provider.`,
        ],
      },
      {
        title: "6. Place of Processing",
        paragraphs: [
          `Processing location: ${processingLocationEn(legal.processingLocation)}.`,
        ],
      },
      {
        title: "7. Retention Period",
        paragraphs: [
          "The demo applications are designed as isolated sandbox environments. Application-specific demo data are automatically deleted after 24 hours. Backups of such demo data are not retained.",
          "This does not affect temporary security-related and connection-related data that must be processed for the secure operation of the services.",
        ],
      },
      {
        title: "8. Cookies and Comparable Technologies",
        paragraphs: [
          "Depending on the service used, only strictly necessary cookies or comparable storage mechanisms are used. These serve, in particular, authentication, session management, and the storage of user interface preferences such as theme mode.",
          "No third-party tracking cookies and no analytics tools are used.",
        ],
      },
      {
        title: "9. Automated Decision-Making",
        paragraphs: [
          "No automated decision-making, including profiling within the meaning of Article 22 GDPR, takes place.",
        ],
      },
      {
        title: "10. Rights of Data Subjects",
        paragraphs: [
          "Subject to the applicable legal requirements, data subjects have the right to obtain access to their personal data, to request rectification of inaccurate data, erasure, restriction of processing, to object to processing, and - where applicable - to data portability.",
          "To exercise these rights, an informal message to the contact address stated above is sufficient.",
        ],
      },
      {
        title: "11. Right to Lodge a Complaint",
        paragraphs: [
          "Data subjects also have the right to lodge a complaint with a data protection supervisory authority, in particular in the Member State of their habitual residence, place of work, or the place of the alleged infringement.",
        ],
      },
      {
        title: "12. Product-Specific Information",
        paragraphs: [
          "The linked demo applications contain additional technical information, in particular regarding demo operation, data isolation, deletion periods, strictly necessary cookies, and server-side rate limiting.",
        ],
        items: [
          "Demo privacy page: https://example.com",
        ],
      },
      {
        title: "13. DOMgeist Browser Extension",
        paragraphs: [
          "DOMgeist is a local-first browser extension for auditing the currently open page. At the user's request, the extension checks technical signals for accessibility, performance, security headers, SEO, storage, and detected web technologies.",
          "Scan results, page snapshots, browsing activity, cookies, storage data, and exported reports are not transmitted to the developer. Processing takes place locally in the user's browser.",
          "Local AI is disabled by default. When the user enables Local AI, DOMgeist can send minimized scan data to the user's local Ollama endpoint. DOMgeist does not send this data to the developer or to a cloud service operated by DOMgeist.",
        ],
      },
    ],
  };
}

export function getLegalDocument(
  lang: Lang,
  route: LegalRouteKey,
  siteConfig: SiteConfig,
): LegalDocument {
  if (siteConfig.placeholderMode) {
    return placeholderLegalDocument(lang, route);
  }

  if (route === "impressum") {
    return lang === "de" ? impressumDe(siteConfig) : impressumEn(siteConfig);
  }

  return lang === "de"
    ? dataProtectionDe(siteConfig)
    : dataProtectionEn(siteConfig);
}
