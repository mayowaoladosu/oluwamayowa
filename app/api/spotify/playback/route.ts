import { type NextRequest, NextResponse } from "next/server"
import { spotifyApiRequest } from "@/lib/spotify"

const CLIENT_WINDOW_MS = 10_000
const CLIENT_REQUEST_LIMIT = 5
const GLOBAL_WINDOW_MS = 60_000
const GLOBAL_REQUEST_LIMIT = 30
const MAX_CLIENTS = 1000

const playbackActions = {
  previous: { method: "POST", path: "/v1/me/player/previous" },
  play: { method: "PUT", path: "/v1/me/player/play" },
  pause: { method: "PUT", path: "/v1/me/player/pause" },
  next: { method: "POST", path: "/v1/me/player/next" },
} as const

type PlaybackAction = keyof typeof playbackActions

type RequestWindow = {
  count: number
  startedAt: number
}

const clientWindows = new Map<string, RequestWindow>()
let globalWindow: RequestWindow = { count: 0, startedAt: 0 }

// These counters are a first line of defense for local and single-instance
// deployments. A scaled deployment should also rate-limit this route at the
// hosting edge so every function instance shares the same visitor budget.

function isPlaybackAction(value: unknown): value is PlaybackAction {
  return typeof value === "string" && Object.hasOwn(playbackActions, value)
}

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  )
}

function getRetryAfterMs(window: RequestWindow, durationMs: number) {
  return Math.max(1, window.startedAt + durationMs - Date.now())
}

function consumeRequestWindow(
  currentWindow: RequestWindow | undefined,
  durationMs: number,
  limit: number,
) {
  const now = Date.now()
  const window =
    !currentWindow || now - currentWindow.startedAt >= durationMs
      ? { count: 0, startedAt: now }
      : currentWindow

  if (window.count >= limit) {
    return { allowed: false as const, window }
  }

  window.count += 1
  return { allowed: true as const, window }
}

function checkRateLimit(clientKey: string) {
  const clientResult = consumeRequestWindow(
    clientWindows.get(clientKey),
    CLIENT_WINDOW_MS,
    CLIENT_REQUEST_LIMIT,
  )
  clientWindows.set(clientKey, clientResult.window)

  // Keep the in-process limiter bounded even while the global window is full.
  if (clientWindows.size > MAX_CLIENTS) {
    const oldestClientKey = clientWindows.keys().next().value

    if (oldestClientKey) {
      clientWindows.delete(oldestClientKey)
    }
  }

  if (!clientResult.allowed) {
    return getRetryAfterMs(clientResult.window, CLIENT_WINDOW_MS)
  }

  const globalResult = consumeRequestWindow(globalWindow, GLOBAL_WINDOW_MS, GLOBAL_REQUEST_LIMIT)
  globalWindow = globalResult.window

  if (!globalResult.allowed) {
    return getRetryAfterMs(globalWindow, GLOBAL_WINDOW_MS)
  }

  return null
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!origin) {
    return false
  }

  const expectedHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host")
  const expectedProtocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "")

  try {
    return (
      Boolean(expectedHost) && new URL(origin).origin === `${expectedProtocol}://${expectedHost}`
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  // This endpoint is intentionally available to anonymous site visitors. The
  // action allowlist, same-origin browser check, rate limits, and kill switch
  // bound what visitors can do without ever exposing the owner's credentials.
  if (process.env.SPOTIFY_PUBLIC_CONTROLS_ENABLED === "false") {
    return NextResponse.json(
      { error: "Spotify controls are temporarily disabled." },
      { status: 403 },
    )
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
  }

  let action: unknown

  try {
    const body = (await request.json()) as { action?: unknown }
    action = body.action
  } catch {
    return NextResponse.json({ error: "Invalid playback request." }, { status: 400 })
  }

  if (!isPlaybackAction(action)) {
    return NextResponse.json({ error: "Unknown playback action." }, { status: 400 })
  }

  const retryAfterMs = checkRateLimit(getClientKey(request))

  if (retryAfterMs !== null) {
    return NextResponse.json(
      {
        error: "Too many controls at once. Please wait a moment.",
        retryAfterMs,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    )
  }

  const control = playbackActions[action]
  const response = await spotifyApiRequest(control.path, {
    method: control.method,
  })

  if (!response) {
    return NextResponse.json({ error: "Spotify is temporarily unavailable." }, { status: 503 })
  }

  if (response.ok) {
    return NextResponse.json({ ok: true, action })
  }

  if (response.status === 404) {
    return NextResponse.json(
      {
        error: "No active Spotify device was found. Try again when Spotify is open.",
      },
      { status: 409 },
    )
  }

  if (response.status === 403) {
    return NextResponse.json(
      {
        error: "Spotify rejected this control. Check the account permission and device.",
      },
      { status: 409 },
    )
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after") ?? "5"

    return NextResponse.json(
      { error: "Spotify is receiving too many controls. Please wait." },
      { status: 429, headers: { "Retry-After": retryAfter } },
    )
  }

  return NextResponse.json({ error: "Spotify could not apply that control." }, { status: 502 })
}
