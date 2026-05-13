import { NextResponse } from "next/server"

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing"
const LYRICS_ENDPOINT = "https://lrclib.net/api/get"

type SpotifyNowPlaying = {
  is_playing: boolean
  currently_playing_type: string
  item: {
    name: string
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

async function getLyrics(track: string, artist: string) {
  const query = new URLSearchParams({
    track_name: track,
    artist_name: artist,
  })

  try {
    const response = await fetch(`${LYRICS_ENDPOINT}?${query.toString()}`, {
      cache: "no-store",
      headers: {
        "User-Agent": "portfolio-now-playing-widget/1.0",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as LyricsResponse
    return data.plainLyrics ?? data.syncedLyrics ?? null
  } catch {
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

    const artist = song.item.artists.map((item) => item.name).join(", ")
    const lyrics = await getLyrics(song.item.name, artist)

    return NextResponse.json({
      isPlaying: true,
      title: song.item.name,
      artist,
      songUrl: song.item.external_urls.spotify,
      albumArtUrl: song.item.album.images[0]?.url ?? null,
      lyrics,
    })
  } catch {
    clearTimeout(timeoutId)
    return NextResponse.json({ isPlaying: false }, { status: 200 })
  }
}
