"use client"

import Image from "next/image"
import { useState } from "react"
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
} from "lucide-react"

import { PdfReportReader } from "@/components/research/pdf-report-reader"

const DOI_URL = "https://doi.org/10.5281/zenodo.21707500"
const PDF_PATH =
  "/research/frontier-model-deployment-study/behavior-strength-deployment-readiness.pdf"
const CITATION =
  "Oladosu, M. (2026). Behavior strength and deployment readiness across six frontier-model deployments: A first-party observational study in Microsoft Foundry (LayerRail Technical Report No. 2026-01). LayerRail, Inc. https://doi.org/10.5281/zenodo.21707500"

const tabs = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "evidence", label: "Evidence", icon: BarChart3 },
  { id: "report", label: "Read report", icon: FileText },
] as const

type TabId = (typeof tabs)[number]["id"]

type Figure = {
  src: string
  width: number
  height: number
  alt: string
  title: string
  caption: string
}

const figures: Figure[] = [
  {
    src: "/research/frontier-model-deployment-study/deployment-readiness.png",
    width: 2388,
    height: 1299,
    alt: "Deployment readiness ranking for six frontier-model deployments",
    title: "Deployment readiness",
    caption:
      "Claude Sonnet 5 led the caller-experience metric by combining strong eligible answers with 173 unblocked calls out of 174.",
  },
  {
    src: "/research/frontier-model-deployment-study/strength-heatmap.png",
    width: 2648,
    height: 1423,
    alt: "Behavior-strength dimension heatmap for six frontier-model deployments",
    title: "Behavior-strength profile",
    caption:
      "The dimension view makes model-specific tradeoffs visible instead of compressing every behavior into one score.",
  },
  {
    src: "/research/frontier-model-deployment-study/provider-intervention.png",
    width: 2320,
    height: 1419,
    alt: "Provider intervention counts across six frontier-model deployments",
    title: "Provider intervention",
    caption:
      "Provider blocks are reported separately from target-model behavior because callers still experience them as missing answers.",
  },
  {
    src: "/research/frontier-model-deployment-study/latency.png",
    width: 2227,
    height: 1339,
    alt: "Median and 95th-percentile latency across six frontier-model deployments",
    title: "Observed latency",
    caption:
      "Latency produced a different ordering from answer quality, reinforcing the need to evaluate the deployed endpoint as a system.",
  },
  {
    src: "/research/frontier-model-deployment-study/observed-cost.png",
    width: 2263,
    height: 1365,
    alt: "Observed list-rate cost per 100 calls across six frontier-model deployments",
    title: "Observed list-rate cost",
    caption:
      "Cost estimates are tied to the collection window and reported alongside performance rather than folded into the quality score.",
  },
]

const metrics = [
  { value: "1,044", label: "target calls" },
  { value: "6", label: "deployments" },
  { value: "9", label: "dimensions" },
  { value: "174", label: "cases per model" },
]

export function StudyReader() {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [citationCopied, setCitationCopied] = useState(false)

  async function copyCitation() {
    await navigator.clipboard.writeText(CITATION)
    setCitationCopied(true)
  }

  return (
    <div className="mt-12">
      <div className="flex flex-col gap-4 border-y border-neutral-800 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Study sections"
          className="grid grid-cols-3 rounded-lg border border-neutral-800 bg-neutral-950 p-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs transition-colors sm:text-sm ${
                  isActive
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyCitation}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-800 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
          >
            {citationCopied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {citationCopied ? "Citation copied" : "Copy citation"}
          </button>
          <a
            href={DOI_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs text-black transition-colors hover:bg-neutral-200"
          >
            DOI record
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {activeTab === "overview" ? (
        <section
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className="pt-10"
        >
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800 md:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-black p-5">
                <p className="text-2xl tracking-tight text-white">{metric.value}</p>
                <p className="mt-1 text-xs text-neutral-500">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-[1.35fr_0.65fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Abstract</p>
              <p className="mt-4 text-base leading-8 text-neutral-300">
                Model benchmarks usually score answers after a response exists. Production
                applications face another question: how often does a usable answer reach the
                caller? This first-party observational study evaluates six frontier-model
                deployments accessed through Microsoft Foundry and separates behavior strength on
                eligible answers from deployment readiness across the full caller-experienced
                matrix.
              </p>
              <p className="mt-5 text-base leading-8 text-neutral-300">
                Claude Sonnet 5 achieved the highest deployment readiness at 89.85. GPT-5.6 Sol
                achieved 100.00 behavior strength on eligible answers, but 41 provider blocks
                reduced its readiness to 76.44. The result shows why answer quality and reliable
                delivery should be measured separately.
              </p>
            </div>

            <aside className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Study boundary</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-400">
                <li>One repetition per logical case.</li>
                <li>Six managed deployments in one collection window.</li>
                <li>Provider blocks separated from model-answer scores.</li>
                <li>First-party industry research; not peer reviewed.</li>
                <li>Safety-sensitive raw evidence remains withheld.</li>
              </ul>
            </aside>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800 md:grid-cols-3">
            <div className="bg-neutral-950 p-6">
              <p className="text-sm text-white">Answer behavior</p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Eight dimensions contribute equally to behavior strength on eligible model
                answers.
              </p>
            </div>
            <div className="bg-neutral-950 p-6">
              <p className="text-sm text-white">Endpoint delivery</p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Deployment readiness applies the unblocked served-call rate to behavior strength.
              </p>
            </div>
            <div className="bg-neutral-950 p-6">
              <p className="text-sm text-white">Operational context</p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Latency, provider intervention, and list-rate cost remain visible as separate
                decision variables.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "evidence" ? (
        <section
          id="panel-evidence"
          role="tabpanel"
          aria-labelledby="tab-evidence"
          className="space-y-6 pt-10"
        >
          {figures.map((figure) => (
            <figure
              key={figure.title}
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:p-6"
            >
              <div className="overflow-hidden rounded-lg bg-white">
                <Image
                  src={figure.src}
                  alt={figure.alt}
                  width={figure.width}
                  height={figure.height}
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="mt-5 grid gap-2 md:grid-cols-[180px_1fr]">
                <span className="text-sm text-white">{figure.title}</span>
                <span className="text-sm leading-6 text-neutral-400">{figure.caption}</span>
              </figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      {activeTab === "report" ? (
        <section
          id="panel-report"
          role="tabpanel"
          aria-labelledby="tab-report"
          className="pt-10"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white">LayerRail Technical Report No. 2026-01</p>
              <p className="mt-1 text-xs text-neutral-500">26 pages · APA 7 · Version 1.0.0</p>
            </div>
            <a
              href={PDF_PATH}
              download
              className="inline-flex w-fit items-center gap-2 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download PDF
            </a>
          </div>

          <div
            aria-label="Full technical report PDF"
            className="overflow-hidden rounded-xl border border-neutral-800"
          >
            <PdfReportReader />
          </div>
        </section>
      ) : null}
    </div>
  )
}
