"use client"

import dynamic from "next/dynamic"

const PdfReportDocument = dynamic(
  () => import("./pdf-report-document").then((module) => module.PdfReportDocument),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[520px] items-center justify-center bg-neutral-950 px-6 text-center text-sm text-neutral-500 md:min-h-[720px]">
        Loading the 26-page report…
      </div>
    ),
  },
)

export function PdfReportReader() {
  return <PdfReportDocument />
}
