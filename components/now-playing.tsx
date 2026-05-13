"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

type NowPlayingData = {
  isPlaying: boolean
  title?: string
  artist?: string
  songUrl?: string
  albumArtUrl?: string | null
  progressMs?: number
  durationMs?: number
  plainLyrics?: string | null
  syncedLyrics?: string | null
  fetchedAt?: number
}

type LyricLine = { timeMs: number; text: string }

function parseSyncedLyrics(raw?: string | null): LyricLine[] {
  if (!raw) return []

  return raw
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/)
      if (!match) return null
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const millis = Number((match[3] ?? "0").padEnd(3, "0"))
      const text = match[4].trim()
      return { timeMs: minutes * 60000 + seconds * 1000 + millis, text }
    })
    .filter((line): line is LyricLine => Boolean(line && line.text.length > 0))
}

export function NowPlaying() {
  const [track, setTrack] = useState<NowPlayingData>({ isPlaying: false })
  const [elapsedMs, setElapsedMs] = useState(0)
  const activeLineRef = useRef<HTMLParagraphElement | null>(null)

  const syncedLines = useMemo(() => parseSyncedLyrics(track.syncedLyrics), [track.syncedLyrics])

  const activeLineIndex = useMemo(() => {
    if (!syncedLines.length) return -1
    let currentIndex = -1
    for (let i = 0; i < syncedLines.length; i += 1) {
      if (elapsedMs >= syncedLines[i].timeMs) currentIndex = i
      else break
    }
    return currentIndex
  }, [elapsedMs, syncedLines])

  useEffect(() => {
    let isMounted = true

    const getNowPlaying = async () => {
      try {
        const response = await fetch("/api/spotify/now-playing", { cache: "no-store" })
        const data = (await response.json()) as NowPlayingData
        if (!isMounted) return
        setTrack(data)
        if (data.isPlaying && typeof data.progressMs === "number") {
          setElapsedMs(data.progressMs)
        }
      } catch {
        if (isMounted) setTrack({ isPlaying: false })
      }
    }

    getNowPlaying()
    const interval = setInterval(getNowPlaying, 500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!track.isPlaying) return
    const timer = setInterval(() => {
      setElapsedMs((prev) => prev + 100)
    }, 100)

    return () => clearInterval(timer)
  }, [track.isPlaying])

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [activeLineIndex])

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-sm font-normal">Now Playing</h2>
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/90 p-3 sm:p-4">
        {track.isPlaying ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {track.albumArtUrl ? (
                <Image
                  src={track.albumArtUrl}
                  alt={`${track.title} album art`}
                  width={56}
                  height={56}
                  className="h-12 w-12 rounded-md object-cover sm:h-14 sm:w-14"
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

            <div className="max-h-52 overflow-y-auto rounded-lg bg-black/40 px-3 py-2 sm:max-h-56 sm:px-4 sm:py-3">
              {syncedLines.length > 0 ? (
                <div className="space-y-2">
                  {syncedLines.map((line, index) => {
                    const isActive = index === activeLineIndex
                    return (
                      <p
                        key={`${line.timeMs}-${index}`}
                        ref={isActive ? activeLineRef : null}
                        className={`text-sm leading-relaxed transition-all break-words ${
                          isActive
                            ? "scale-[1.01] text-white"
                            : index < activeLineIndex
                              ? "text-neutral-500"
                              : "text-neutral-400"
                        }`}
                      >
                        {line.text}
                      </p>
                    )
                  })}
                </div>
              ) : track.plainLyrics ? (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                  {track.plainLyrics}
                </pre>
              ) : (
                <p className="text-sm text-neutral-500">No lyrics found for this track.</p>
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
