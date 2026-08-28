import { NextResponse } from "next/server"
import { spotifyApiRequest } from "@/lib/spotify"

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

function noCurrentTrackResponse() {
  return NextResponse.json({ hasTrack: false, isPlaying: false }, { status: 200 })
}

export async function GET() {
  try {
    const response = await spotifyApiRequest("/v1/me/player/currently-playing")

    if (!response || response.status === 204 || response.status >= 400) {
      return noCurrentTrackResponse()
    }

    const song = (await response.json()) as SpotifyNowPlaying

    if (!song.item) {
      return noCurrentTrackResponse()
    }

    if (song.currently_playing_type !== "track") {
      return noCurrentTrackResponse()
    }

    const playbackCapturedAt = Date.now()
    const artist = song.item.artists.map((item) => item.name).join(", ")
    const primaryArtist = song.item.artists[0]?.name ?? artist
    const responseCreatedAt = Date.now()
    const progressMs = Math.min(
      song.item.duration_ms,
      (song.progress_ms ?? 0) + (song.is_playing ? responseCreatedAt - playbackCapturedAt : 0),
    )

    return NextResponse.json({
      hasTrack: true,
      isPlaying: song.is_playing,
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
    return noCurrentTrackResponse()
  }
}
