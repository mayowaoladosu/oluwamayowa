"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import {
  findActiveLyricIndex,
  type SyncedLyricLine,
} from "@/lib/synced-lyrics"

const LYRICS_RETRY_DELAY_MS = 5 * 60 * 1000

type NowPlayingData = {
  isPlaying: boolean
  trackId?: string
  title?: string
  artist?: string
  primaryArtist?: string
  album?: string
  songUrl?: string
  albumArtUrl?: string | null
  durationMs?: number
  progressMs?: number
}

type LyricsData = {
  syncedLyrics?: SyncedLyricLine[] | null
}

type LyricsState = {
  trackId: string | null
  lines: SyncedLyricLine[] | null
  isLoading: boolean
}

export function NowPlaying() {
  const [track, setTrack] = useState<NowPlayingData>({ isPlaying: false })
  const [lyrics, setLyrics] = useState<LyricsState>({
    trackId: null,
    lines: null,
    isLoading: false,
  })
  const [snapshotReceivedAt, setSnapshotReceivedAt] = useState(0)
  const [activeLineIndex, setActiveLineIndex] = useState(-1)
  const lyricsViewportRef = useRef<HTMLDivElement>(null)
  const lyricLineRefs = useRef<Array<HTMLParagraphElement | null>>([])

  useEffect(() => {
    let isMounted = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let controller: AbortController | null = null

    const getNowPlaying = async () => {
      try {
        controller?.abort()
        controller = new AbortController()
        const response = await fetch("/api/spotify/now-playing", {
          cache: "no-store",
          signal: controller.signal,
        })
        const data = (await response.json()) as NowPlayingData
        if (isMounted) {
          setTrack(data)
          setSnapshotReceivedAt(performance.now())
        }
      } catch {
        if (isMounted) {
          setTrack({ isPlaying: false })
        }
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(getNowPlaying, 3000)
        }
      }
    }

    getNowPlaying()

    return () => {
      controller?.abort()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (
      !track.isPlaying ||
      !track.trackId ||
      !track.title ||
      !track.primaryArtist ||
      !track.album ||
      !track.durationMs
    ) {
      return
    }

    const controller = new AbortController()
    let retryTimeoutId: number | null = null
    const trackId = track.trackId
    const query = new URLSearchParams({
      trackId,
      track: track.title,
      artist: track.primaryArtist,
      album: track.album,
      durationMs: String(track.durationMs),
    })

    async function loadLyrics() {
      setLyrics({ trackId, lines: null, isLoading: true })

      try {
        const response = await fetch(`/api/spotify/lyrics?${query.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Lyrics request failed")
        }

        const data = (await response.json()) as LyricsData

        if (!controller.signal.aborted) {
          const lines = data.syncedLyrics ?? null
          setLyrics({
            trackId,
            lines,
            isLoading: false,
          })

          if (!lines?.length) {
            retryTimeoutId = window.setTimeout(loadLyrics, LYRICS_RETRY_DELAY_MS)
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setLyrics({ trackId, lines: null, isLoading: false })
          retryTimeoutId = window.setTimeout(loadLyrics, LYRICS_RETRY_DELAY_MS)
        }
      }
    }

    loadLyrics()

    return () => {
      controller.abort()

      if (retryTimeoutId !== null) {
        window.clearTimeout(retryTimeoutId)
      }
    }
  }, [
    track.album,
    track.durationMs,
    track.isPlaying,
    track.primaryArtist,
    track.title,
    track.trackId,
  ])

  const hasCurrentTrackLyrics = lyrics.trackId === track.trackId
  const syncedLyrics = hasCurrentTrackLyrics ? lyrics.lines : null
  const isLyricsLoading =
    track.isPlaying &&
    Boolean(track.trackId) &&
    (!hasCurrentTrackLyrics || lyrics.isLoading)

  useEffect(() => {
    if (
      !track.isPlaying ||
      !syncedLyrics?.length ||
      track.progressMs === undefined ||
      snapshotReceivedAt === 0
    ) {
      setActiveLineIndex(-1)
      return
    }

    const updateActiveLine = () => {
      const elapsedSinceSnapshot = Math.max(0, performance.now() - snapshotReceivedAt)
      const playbackPosition = Math.min(
        track.durationMs ?? Number.POSITIVE_INFINITY,
        track.progressMs! + elapsedSinceSnapshot,
      )
      const nextActiveLine = findActiveLyricIndex(syncedLyrics, playbackPosition)

      setActiveLineIndex((currentLine) =>
        currentLine === nextActiveLine ? currentLine : nextActiveLine,
      )
    }

    updateActiveLine()
    const intervalId = window.setInterval(updateActiveLine, 100)

    return () => window.clearInterval(intervalId)
  }, [
    snapshotReceivedAt,
    track.durationMs,
    track.isPlaying,
    track.progressMs,
    syncedLyrics,
  ])

  useEffect(() => {
    if (activeLineIndex < 0) {
      return
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const viewport = lyricsViewportRef.current
      const activeLine = lyricLineRefs.current[activeLineIndex]

      if (!viewport || !activeLine) {
        return
      }

      const viewportBounds = viewport.getBoundingClientRect()
      const lineBounds = activeLine.getBoundingClientRect()
      const lineOffset = lineBounds.top - viewportBounds.top
      const centeredScrollTop =
        viewport.scrollTop +
        lineOffset -
        viewport.clientHeight / 2 +
        lineBounds.height / 2
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches

      viewport.scrollTo({
        top: centeredScrollTop,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      })
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [activeLineIndex, track.trackId])

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-sm font-normal">Now Playing</h2>
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        {track.isPlaying ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {track.albumArtUrl ? (
                <Image
                  src={track.albumArtUrl}
                  alt={`${track.title} album art`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-md object-cover"
                  unoptimized
                />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{track.title}</p>
                <p className="truncate text-sm text-neutral-400">{track.artist}</p>
                {track.songUrl ? (
                  <a
                    href={track.songUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-green-400 hover:underline"
                  >
                    Listen on Spotify
                  </a>
                ) : null}
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-3">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                Live lyrics
              </p>
              {syncedLyrics?.length ? (
                <div className="relative">
                  <div
                    ref={lyricsViewportRef}
                    role="region"
                    aria-label="Synced lyrics"
                    className="h-44 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <div className="space-y-4 px-1 py-16">
                      {syncedLyrics.map((line, index) => {
                        const isActive = index === activeLineIndex

                        return (
                          <p
                            key={`${line.startTimeMs}-${index}`}
                            ref={(element) => {
                              lyricLineRefs.current[index] = element
                            }}
                            aria-current={isActive ? "true" : undefined}
                            className={`whitespace-pre-line leading-relaxed transition-all duration-500 motion-reduce:transition-none ${
                              isActive
                                ? "translate-x-1 text-base font-medium text-white opacity-100 sm:text-lg"
                                : "text-sm text-neutral-500 opacity-45"
                            }`}
                          >
                            {line.text}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-neutral-950 to-transparent"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-neutral-950 to-transparent"
                  />
                </div>
              ) : isLyricsLoading ? (
                <p className="py-2 text-xs text-neutral-500">
                  Loading synced lyrics&hellip;
                </p>
              ) : (
                <p className="py-2 text-xs text-neutral-500">
                  Synced lyrics aren&apos;t available for this track.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Not playing anything on Spotify right now.</p>
        )}
      </div>
    </section>
  )
}
