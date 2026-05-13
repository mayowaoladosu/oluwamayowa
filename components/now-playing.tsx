"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

type NowPlayingData = {
  isPlaying: boolean
  title?: string
  artist?: string
  songUrl?: string
  albumArtUrl?: string | null
}

export function NowPlaying() {
  const [track, setTrack] = useState<NowPlayingData>({ isPlaying: false })

  useEffect(() => {
    let isMounted = true

    const getNowPlaying = async () => {
      try {
        const response = await fetch("/api/spotify/now-playing", { cache: "no-store" })
        const data = (await response.json()) as NowPlayingData
        if (isMounted) {
          setTrack(data)
        }
      } catch {
        if (isMounted) {
          setTrack({ isPlaying: false })
        }
      }
    }

    getNowPlaying()
    const interval = setInterval(getNowPlaying, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-sm font-normal">Now Playing</h2>
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        {track.isPlaying ? (
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
      </div>
    </section>
  )
}
