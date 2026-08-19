import { type NextRequest, NextResponse } from "next/server"
import { getSyncedLyrics } from "@/lib/lrclib"

const MAX_QUERY_LENGTH = 300
const MAX_TRACK_DURATION_MS = 24 * 60 * 60 * 1000

function getQueryValue(searchParams: URLSearchParams, name: string) {
  const value = searchParams.get(name)?.trim()

  if (!value || value.length > MAX_QUERY_LENGTH) {
    return null
  }

  return value
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const trackId = getQueryValue(searchParams, "trackId")
  const track = getQueryValue(searchParams, "track")
  const artist = getQueryValue(searchParams, "artist")
  const album = getQueryValue(searchParams, "album")
  const durationMs = Number(searchParams.get("durationMs"))

  if (
    !trackId ||
    !track ||
    !artist ||
    !album ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    durationMs > MAX_TRACK_DURATION_MS
  ) {
    return NextResponse.json({ error: "Invalid lyrics query." }, { status: 400 })
  }

  const syncedLyrics = await getSyncedLyrics({
    trackId,
    track,
    artist,
    album,
    durationMs,
  })

  return NextResponse.json({ syncedLyrics })
}
