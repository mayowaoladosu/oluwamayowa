import "server-only"

import {
  parseSyncedLyrics,
  type SyncedLyricLine,
} from "@/lib/synced-lyrics"

const LYRICS_ENDPOINT = "https://lrclib.net/api/get"
const LYRICS_CACHE_LIMIT = 100
const LYRICS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const LYRICS_MISS_CACHE_TTL_MS = 5 * 60 * 1000

export type SyncedLyricsLookup = {
  trackId: string
  track: string
  artist: string
  album: string
  durationMs: number
}

type LyricsResponse = {
  syncedLyrics?: string | null
}

type LyricsCacheEntry = {
  expiresAt: number
  request: Promise<SyncedLyricLine[] | null>
}

const lyricsCache = new Map<string, LyricsCacheEntry>()

function getCacheKey({
  trackId,
  track,
  artist,
  album,
  durationMs,
}: SyncedLyricsLookup) {
  return JSON.stringify([trackId, track, artist, album, durationMs])
}

async function fetchSyncedLyrics({
  track,
  artist,
  album,
  durationMs,
}: SyncedLyricsLookup): Promise<SyncedLyricLine[] | null> {
  const query = new URLSearchParams({
    track_name: track,
    artist_name: artist,
    album_name: album,
    duration: String(Math.round(durationMs / 1000)),
  })
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`${LYRICS_ENDPOINT}?${query.toString()}`, {
      headers: {
        "User-Agent": "oluwamayowa-portfolio/1.0",
      },
      next: { revalidate: LYRICS_MISS_CACHE_TTL_MS / 1000 },
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as LyricsResponse
    const lines = parseSyncedLyrics(data.syncedLyrics)

    return lines.length > 0 ? lines : null
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

export function getSyncedLyrics(lookup: SyncedLyricsLookup) {
  const cacheKey = getCacheKey(lookup)
  const cachedLyrics = lyricsCache.get(cacheKey)

  if (cachedLyrics && cachedLyrics.expiresAt > Date.now()) {
    return cachedLyrics.request
  }

  if (cachedLyrics) {
    lyricsCache.delete(cacheKey)
  }

  if (lyricsCache.size >= LYRICS_CACHE_LIMIT) {
    const oldestCacheKey = lyricsCache.keys().next().value

    if (oldestCacheKey) {
      lyricsCache.delete(oldestCacheKey)
    }
  }

  const request = fetchSyncedLyrics(lookup)
  const cacheEntry: LyricsCacheEntry = {
    expiresAt: Number.POSITIVE_INFINITY,
    request,
  }
  lyricsCache.set(cacheKey, cacheEntry)

  void request.then(
    (lyrics) => {
      if (lyricsCache.get(cacheKey) === cacheEntry) {
        cacheEntry.expiresAt =
          Date.now() +
          (lyrics ? LYRICS_CACHE_TTL_MS : LYRICS_MISS_CACHE_TTL_MS)
      }
    },
    () => {
      if (lyricsCache.get(cacheKey) === cacheEntry) {
        lyricsCache.delete(cacheKey)
      }
    },
  )

  return request
}
