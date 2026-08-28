import "server-only"

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const API_BASE_URL = "https://api.spotify.com"
const REQUEST_TIMEOUT_MS = 5000
const TOKEN_EXPIRY_BUFFER_MS = 30_000

type SpotifyTokenResponse = {
  access_token?: unknown
  expires_in?: unknown
}

type CachedAccessToken = {
  value: string
  expiresAt: number
}

let cachedAccessToken: CachedAccessToken | null = null
let pendingAccessTokenRequest: Promise<string | null> | null = null

async function requestAccessToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    return null
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

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

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as SpotifyTokenResponse

    if (typeof data.access_token !== "string") {
      return null
    }

    const expiresInSeconds = typeof data.expires_in === "number" ? data.expires_in : 3600
    const lifetimeMs = Math.max(10_000, expiresInSeconds * 1000 - TOKEN_EXPIRY_BUFFER_MS)

    cachedAccessToken = {
      value: data.access_token,
      expiresAt: Date.now() + lifetimeMs,
    }

    return data.access_token
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function getAccessToken() {
  const currentAccessToken = cachedAccessToken

  if (currentAccessToken && currentAccessToken.expiresAt > Date.now()) {
    return currentAccessToken.value
  }

  if (!pendingAccessTokenRequest) {
    pendingAccessTokenRequest = requestAccessToken().finally(() => {
      pendingAccessTokenRequest = null
    })
  }

  return pendingAccessTokenRequest
}

async function sendSpotifyRequest(path: string, init: RequestInit, accessToken: string) {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function spotifyApiRequest(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return null
  }

  const response = await sendSpotifyRequest(path, init, accessToken)

  if (response?.status !== 401) {
    return response
  }

  // A different request may already have replaced the rejected token. Only
  // invalidate the exact token that Spotify rejected so concurrent 401s share
  // one refresh instead of repeatedly discarding each other's fresh tokens.
  if (cachedAccessToken?.value === accessToken) {
    cachedAccessToken = null
  }

  const refreshedAccessToken = await getAccessToken()

  if (!refreshedAccessToken) {
    return null
  }

  return sendSpotifyRequest(path, init, refreshedAccessToken)
}
