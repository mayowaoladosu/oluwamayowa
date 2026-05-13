import { NextResponse } from "next/server"

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing"
const LYRICS_ENDPOINT = "https://lrclib.net/api/get"

type SpotifyNowPlaying = {
  is_playing: boolean
  progress_ms: number
  item: {
    name: string
    duration_ms: number
    external_urls: { spotify: string }
    artists: Array<{ name: string }>
    album: { images: Array<{ url: string }> }
  } | null
}

type LyricsResponse = {
  plainLyrics?: string
  syncedLyrics?: string
}

async function getAccessToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) return null

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  })

  if (!response.ok) return null
  const data = await response.json()
  return data.access_token as string
}

async function getLyrics(track: string, artist: string) {
  const query = new URLSearchParams({ track_name: track, artist_name: artist })

  try {
    const response = await fetch(`${LYRICS_ENDPOINT}?${query.toString()}`, {
      cache: "no-store",
      headers: { "User-Agent": "portfolio-now-playing-widget/1.0" },
    })
    if (!response.ok) return { plainLyrics: null, syncedLyrics: null }

    const data = (await response.json()) as LyricsResponse
    return {
      plainLyrics: data.plainLyrics ?? null,
      syncedLyrics: data.syncedLyrics ?? null,
    }
  } catch {
    return { plainLyrics: null, syncedLyrics: null }
  }
}

export async function GET() {
  const accessToken = await getAccessToken()
  if (!accessToken) return NextResponse.json({ isPlaying: false }, { status: 200 })

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (response.status === 204 || response.status >= 400) {
    return NextResponse.json({ isPlaying: false }, { status: 200 })
  }

  const song = (await response.json()) as SpotifyNowPlaying
  if (!song.is_playing || !song.item) {
    return NextResponse.json({ isPlaying: false }, { status: 200 })
  }

  const artist = song.item.artists.map((item) => item.name).join(", ")
  const lyrics = await getLyrics(song.item.name, artist)

  return NextResponse.json({
    isPlaying: true,
    title: song.item.name,
    artist,
    songUrl: song.item.external_urls.spotify,
    albumArtUrl: song.item.album.images[0]?.url ?? null,
    progressMs: song.progress_ms,
    durationMs: song.item.duration_ms,
    plainLyrics: lyrics.plainLyrics,
    syncedLyrics: lyrics.syncedLyrics,
    fetchedAt: Date.now(),
  })
}
