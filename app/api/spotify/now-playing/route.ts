import { NextResponse } from "next/server"

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing"

type SpotifyNowPlaying = {
  is_playing: boolean
  currently_playing_type: string
  progress_ms: number | null
  item: {
    id: string
    name: string
    duration_ms: number
    external_urls: { spotify: string }
    artists: Array<{ name: string }>
    album: {
      name: string
      images: Array<{ url: string }>
    }
  } | null
}

async function getAccessToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    return null
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
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
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.access_token as string
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

export async function GET() {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return NextResponse.json({ isPlaying: false }, { status: 200 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 204 || response.status >= 400) {
      return NextResponse.json({ isPlaying: false }, { status: 200 })
    }

    const song = (await response.json()) as SpotifyNowPlaying

    if (!song.is_playing || !song.item) {
      return NextResponse.json({ isPlaying: false }, { status: 200 })
    }

    if (song.currently_playing_type !== "track") {
      return NextResponse.json({ isPlaying: false }, { status: 200 })
    }

    const playbackCapturedAt = Date.now()
    const artist = song.item.artists.map((item) => item.name).join(", ")
    const primaryArtist = song.item.artists[0]?.name ?? artist
    const responseCreatedAt = Date.now()
    const progressMs = Math.min(
      song.item.duration_ms,
      (song.progress_ms ?? 0) + (responseCreatedAt - playbackCapturedAt),
    )

    return NextResponse.json({
      isPlaying: true,
      trackId: song.item.id,
      title: song.item.name,
      artist,
      primaryArtist,
      album: song.item.album.name,
      songUrl: song.item.external_urls.spotify,
      albumArtUrl: song.item.album.images[0]?.url ?? null,
      durationMs: song.item.duration_ms,
      progressMs,
    })
  } catch {
    clearTimeout(timeoutId)
    return NextResponse.json({ isPlaying: false }, { status: 200 })
  }
}
