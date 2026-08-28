"use client"

import Image from "next/image"
import { LoaderCircle, Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { findActiveLyricIndex, type SyncedLyricLine } from "@/lib/synced-lyrics"

const LYRICS_RETRY_DELAY_MS = 5 * 60 * 1000

type NowPlayingData = {
  hasTrack: boolean
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

type PlaybackAction = "previous" | "play" | "pause" | "next"

type PlaybackControlResponse = {
  error?: string
  ok?: boolean
  retryAfterMs?: number
}

export function NowPlaying() {
  const [track, setTrack] = useState<NowPlayingData>({
    hasTrack: false,
    isPlaying: false,
  })
  const [lyrics, setLyrics] = useState<LyricsState>({
    trackId: null,
    lines: null,
    isLoading: false,
  })
  const [snapshotReceivedAt, setSnapshotReceivedAt] = useState(0)
  const [activeLineIndex, setActiveLineIndex] = useState(-1)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [pendingAction, setPendingAction] = useState<PlaybackAction | null>(null)
  const [controlError, setControlError] = useState<string | null>(null)
  const [controlCooldownUntil, setControlCooldownUntil] = useState(0)
  const snapshotReceivedAtRef = useRef(0)
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
          const receivedAt = performance.now()
          setTrack(data)
          snapshotReceivedAtRef.current = receivedAt
          setSnapshotReceivedAt(receivedAt)
        }
      } catch {
        if (isMounted) {
          setTrack({ hasTrack: false, isPlaying: false })
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
  }, [refreshSignal])

  useEffect(() => {
    if (
      !track.hasTrack ||
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
    track.hasTrack,
    track.primaryArtist,
    track.title,
    track.trackId,
  ])

  const hasCurrentTrackLyrics = lyrics.trackId === track.trackId
  const syncedLyrics = hasCurrentTrackLyrics ? lyrics.lines : null
  const isLyricsLoading =
    track.hasTrack && Boolean(track.trackId) && (!hasCurrentTrackLyrics || lyrics.isLoading)

  useEffect(() => {
    if (
      !track.hasTrack ||
      !syncedLyrics?.length ||
      track.progressMs === undefined ||
      snapshotReceivedAt === 0
    ) {
      setActiveLineIndex(-1)
      return
    }

    const updateActiveLine = () => {
      const elapsedSinceSnapshot = track.isPlaying
        ? Math.max(0, performance.now() - snapshotReceivedAt)
        : 0
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

    if (!track.isPlaying) {
      return
    }

    const intervalId = window.setInterval(updateActiveLine, 100)

    return () => window.clearInterval(intervalId)
  }, [
    snapshotReceivedAt,
    track.durationMs,
    track.hasTrack,
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
        viewport.scrollTop + lineOffset - viewport.clientHeight / 2 + lineBounds.height / 2
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      viewport.scrollTo({
        top: centeredScrollTop,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      })
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [activeLineIndex, track.trackId])

  useEffect(() => {
    const remainingMs = controlCooldownUntil - Date.now()

    if (remainingMs <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => setControlCooldownUntil(0), remainingMs)

    return () => window.clearTimeout(timeoutId)
  }, [controlCooldownUntil])

  const controlPlayback = async (action: PlaybackAction) => {
    if (pendingAction || controlCooldownUntil > Date.now()) {
      return
    }

    setPendingAction(action)
    setControlError(null)

    try {
      const response = await fetch("/api/spotify/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = (await response.json().catch(() => ({}))) as PlaybackControlResponse

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterSeconds = Number(response.headers.get("Retry-After"))
          const retryAfterMs =
            typeof data.retryAfterMs === "number" && data.retryAfterMs > 0
              ? data.retryAfterMs
              : Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? retryAfterSeconds * 1000
                : 5000

          setControlCooldownUntil(Date.now() + retryAfterMs)
        }

        throw new Error(data.error ?? "Spotify could not apply that control.")
      }

      if (action === "play" || action === "pause") {
        const receivedAt = performance.now()
        const previousSnapshotReceivedAt = snapshotReceivedAtRef.current

        setTrack((currentTrack) => {
          if (!currentTrack.hasTrack) {
            return currentTrack
          }

          const elapsedBeforePause =
            action === "pause" && currentTrack.isPlaying && currentTrack.progressMs !== undefined
              ? Math.max(0, receivedAt - previousSnapshotReceivedAt)
              : 0

          return {
            ...currentTrack,
            isPlaying: action === "play",
            progressMs:
              currentTrack.progressMs === undefined
                ? undefined
                : Math.min(
                    currentTrack.durationMs ?? Number.POSITIVE_INFINITY,
                    currentTrack.progressMs + elapsedBeforePause,
                  ),
          }
        })
        snapshotReceivedAtRef.current = receivedAt
        setSnapshotReceivedAt(receivedAt)
      }

      setRefreshSignal((currentSignal) => currentSignal + 1)
    } catch (error) {
      setControlError(
        error instanceof Error ? error.message : "Spotify could not apply that control.",
      )
    } finally {
      setPendingAction(null)
    }
  }

  const controlsDisabled = pendingAction !== null || controlCooldownUntil > Date.now()

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-sm font-normal">Now Playing</h2>
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="space-y-3">
          {track.hasTrack ? (
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
          ) : (
            <p className="text-sm text-neutral-400">Not playing anything on Spotify right now.</p>
          )}

          <div className="flex flex-col gap-3 border-t border-neutral-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Remote control</p>
              <p className="mt-1 text-xs text-neutral-600">
                Controls Oluwamayowa&apos;s active Spotify device
              </p>
            </div>
            <div
              role="group"
              aria-label="Spotify playback controls"
              className="flex items-center gap-2"
            >
              <button
                type="button"
                aria-label="Play previous track"
                disabled={controlsDisabled}
                onClick={() => void controlPlayback("previous")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendingAction === "previous" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <SkipBack className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label={track.isPlaying ? "Pause playback" : "Resume playback"}
                aria-busy={pendingAction === "play" || pendingAction === "pause"}
                disabled={controlsDisabled}
                onClick={() => void controlPlayback(track.isPlaying ? "pause" : "play")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-400 text-black transition-colors hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingAction === "play" || pendingAction === "pause" ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : track.isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="Play next track"
                disabled={controlsDisabled}
                onClick={() => void controlPlayback("next")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendingAction === "next" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {controlError ? (
            <p role="alert" className="text-xs leading-5 text-amber-300">
              {controlError}
            </p>
          ) : null}

          {track.hasTrack ? (
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
                <p className="py-2 text-xs text-neutral-500">Loading synced lyrics&hellip;</p>
              ) : (
                <p className="py-2 text-xs text-neutral-500">
                  Synced lyrics aren&apos;t available for this track.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
