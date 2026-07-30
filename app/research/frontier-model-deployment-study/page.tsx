import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

import { StudyReader } from "@/components/research/study-reader"

const SITE_URL = "https://oluwamayowa.vercel.app"
const PAGE_PATH = "/research/frontier-model-deployment-study"
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const PDF_URL = `${SITE_URL}${PAGE_PATH}/behavior-strength-deployment-readiness.pdf`
const DOI = "10.5281/zenodo.21707500"
const DOI_URL = `https://doi.org/${DOI}`
const ORCID_ID = "0009-0004-0439-7647"
const ORCID_URL = `https://orcid.org/${ORCID_ID}`
const RESEARCHGATE_URL =
  "https://www.researchgate.net/publication/411012631_Behavior_Strength_and_Deployment_Readiness_Across_Six_Frontier-Model_Deployments_A_First-Party_Observational_Study_in_Microsoft_Foundry"
const TITLE =
  "Behavior Strength and Deployment Readiness Across Six Frontier-Model Deployments: A First-Party Observational Study in Microsoft Foundry"
const DESCRIPTION =
  "A first-party observational study of six frontier-model deployments across 1,044 target calls, separating behavior strength from deployment readiness."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: "Mayowa Oladosu", url: ORCID_URL }],
  creator: "Mayowa Oladosu",
  publisher: "LayerRail, Inc.",
  keywords: [
    "large language models",
    "model evaluation",
    "deployment readiness",
    "prompt injection",
    "grounding",
    "Microsoft Foundry",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "article",
    url: PAGE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Oluwamayowa Oladosu",
    publishedTime: "2026-07-30T00:00:00.000Z",
    authors: ["Mayowa Oladosu"],
    images: [
      {
        url: "/research/frontier-model-deployment-study/deployment-readiness.png",
        alt: "Deployment readiness ranking across six frontier-model deployments",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/research/frontier-model-deployment-study/deployment-readiness.png"],
  },
  other: {
    citation_title: TITLE,
    citation_author: "Mayowa Oladosu",
    citation_publication_date: "2026/07/30",
    citation_online_date: "2026/07/30",
    citation_technical_report_institution: "LayerRail, Inc.",
    citation_technical_report_number: "2026-01",
    citation_doi: DOI,
    citation_pdf_url: PDF_URL,
    citation_fulltext_html_url: PAGE_URL,
    citation_language: "en",
    citation_keywords:
      "large language models; model evaluation; deployment readiness; prompt injection; grounding; Microsoft Foundry",
    citation_abstract: DESCRIPTION,
    "DC.title": TITLE,
    "DC.creator": "Mayowa Oladosu",
    "DC.date": "2026-07-30",
    "DC.identifier": DOI_URL,
    "DC.type": "Technical report",
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  name: TITLE,
  headline: TITLE,
  description: DESCRIPTION,
  abstract: DESCRIPTION,
  datePublished: "2026-07-30",
  version: "1.0.0",
  inLanguage: "en",
  isAccessibleForFree: true,
  url: PAGE_URL,
  sameAs: [DOI_URL, RESEARCHGATE_URL],
  identifier: [
    {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: DOI,
      url: DOI_URL,
    },
    {
      "@type": "PropertyValue",
      propertyID: "Technical report number",
      value: "LayerRail Technical Report No. 2026-01",
    },
  ],
  author: {
    "@type": "Person",
    name: "Mayowa Oladosu",
    url: SITE_URL,
    identifier: ORCID_ID,
    sameAs: ORCID_URL,
    affiliation: {
      "@type": "Organization",
      name: "LayerRail, Inc.",
      url: "https://www.layerrail.com/",
    },
  },
  publisher: {
    "@type": "Organization",
    name: "LayerRail, Inc.",
    url: "https://www.layerrail.com/",
  },
  license: "https://creativecommons.org/licenses/by/4.0/",
  keywords: [
    "large language models",
    "model evaluation",
    "deployment readiness",
    "prompt injection",
    "grounding",
    "Microsoft Foundry",
  ],
  encoding: {
    "@type": "MediaObject",
    contentUrl: PDF_URL,
    encodingFormat: "application/pdf",
  },
}

export default function FrontierModelStudyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Oluwamayowa Oladosu
        </Link>

        <article className="mt-16">
          <header>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
              <span>Research</span>
              <span aria-hidden="true">/</span>
              <span>Technical report 2026-01</span>
              <span aria-hidden="true">/</span>
              <span>Version 1.0.0</span>
            </div>

            <h1 className="mt-6 max-w-4xl text-3xl leading-tight font-normal tracking-tight text-balance md:text-5xl md:leading-[1.12]">
              {TITLE}
            </h1>

            <div className="mt-8 flex flex-col gap-4 border-l border-neutral-700 pl-5 text-sm sm:flex-row sm:items-end sm:justify-between">
              <div>
                <a
                  href={ORCID_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white transition-colors hover:text-neutral-300"
                >
                  Mayowa Oladosu
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <p className="mt-1 text-neutral-500">LayerRail, Inc. · July 30, 2026</p>
              </div>
              <a
                href={DOI_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1 text-neutral-400 transition-colors hover:text-white"
              >
                {DOI}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </header>

          <StudyReader />

          <footer className="mt-16 border-t border-neutral-800 pt-8">
            <div className="grid gap-6 text-sm md:grid-cols-[1fr_auto] md:items-start">
              <p className="max-w-2xl leading-6 text-neutral-500">
                This is LayerRail-authored first-party industry research. It is not peer reviewed,
                independently certified, or a universal model ranking. Raw prompts, model outputs,
                attack strings, canary values, and private operational logs remain withheld for
                safety and security reasons.
              </p>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <a
                  href={ORCID_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-neutral-400 transition-colors hover:text-white"
                >
                  ORCID {ORCID_ID}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <a
                  href={RESEARCHGATE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-neutral-400 transition-colors hover:text-white"
                >
                  View on ResearchGate
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <a
                  href="https://github.com/Layerrail/frontier-model-study-2026-07"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-neutral-400 transition-colors hover:text-white"
                >
                  Reproducibility package
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <a
                  href="https://www.layerrail.com/blog/claude-opus-5-under-load"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-neutral-400 transition-colors hover:text-white"
                >
                  Read the LayerRail article
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </main>
  )
}
