"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, LoaderCircle, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const PDF_PATH =
  "/research/frontier-model-deployment-study/behavior-strength-deployment-readiness.pdf"
const MIN_SCALE = 0.65
const MAX_SCALE = 1.6
const SCALE_STEP = 0.15

export function PdfReportDocument() {
  const [numberOfPages, setNumberOfPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [loadError, setLoadError] = useState("")

  function previousPage() {
    setPageNumber((current) => Math.max(1, current - 1))
  }

  function nextPage() {
    setPageNumber((current) => Math.min(numberOfPages, current + 1))
  }

  function zoomOut() {
    setScale((current) => Math.max(MIN_SCALE, Number((current - SCALE_STEP).toFixed(2))))
  }

  function zoomIn() {
    setScale((current) => Math.min(MAX_SCALE, Number((current + SCALE_STEP).toFixed(2))))
  }

  return (
    <div className="bg-neutral-950">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/95 px-3 py-3 backdrop-blur md:px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={previousPage}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="sr-only">Current page</span>
            <input
              type="number"
              min={1}
              max={numberOfPages || 1}
              value={pageNumber}
              onChange={(event) => {
                const nextValue = Number(event.target.value)
                if (Number.isFinite(nextValue)) {
                  setPageNumber(Math.min(numberOfPages || 1, Math.max(1, nextValue)))
                }
              }}
              className="w-12 rounded border border-neutral-700 bg-black px-2 py-1 text-center text-white"
            />
            <span>of {numberOfPages || "—"}</span>
          </label>
          <button
            type="button"
            onClick={nextPage}
            disabled={numberOfPages === 0 || pageNumber >= numberOfPages}
            aria-label="Next page"
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            aria-label="Zoom out"
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-12 text-center text-xs text-neutral-500">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            aria-label="Zoom in"
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            aria-label="Reset zoom"
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="max-h-[78vh] min-h-[520px] overflow-auto p-3 md:min-h-[720px] md:p-6">
        <Document
          file={PDF_PATH}
          onLoadSuccess={({ numPages }) => {
            setLoadError("")
            setNumberOfPages(numPages)
            setPageNumber((current) => Math.min(current, numPages))
          }}
          onLoadError={(error) => setLoadError(error.message)}
          loading={
            <div className="flex min-h-[500px] items-center justify-center gap-3 text-sm text-neutral-500">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading report…
            </div>
          }
          error={
            <div className="flex min-h-[500px] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-neutral-400">The report reader could not start.</p>
              {loadError ? <p className="max-w-xl text-xs text-neutral-600">{loadError}</p> : null}
              <a href={PDF_PATH} className="text-sm text-white underline underline-offset-4">
                Open the PDF directly
              </a>
            </div>
          }
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            loading={
              <div className="flex min-h-[500px] items-center justify-center gap-3 text-sm text-neutral-500">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Rendering page {pageNumber}…
              </div>
            }
            className="overflow-hidden rounded-sm shadow-2xl shadow-black"
          />
        </Document>
      </div>
    </div>
  )
}
