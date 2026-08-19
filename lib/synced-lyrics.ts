export type SyncedLyricLine = {
  startTimeMs: number
  text: string
}

const lineTimestampPattern = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g
const wordTimestampPattern = /<\d{1,3}:\d{2}(?:\.\d{1,3})?>/g

export function parseSyncedLyrics(source: string | null | undefined): SyncedLyricLine[] {
  if (!source) {
    return []
  }

  const offsetMatch = source.match(/\[offset:([+-]?\d+)\]/i)
  const offsetMs = Number(offsetMatch?.[1] ?? 0)
  const linesByTimestamp = new Map<number, string[]>()

  for (const rawLine of source.split(/\r?\n/)) {
    const timestamps = [...rawLine.matchAll(lineTimestampPattern)]
    const text = rawLine
      .replace(lineTimestampPattern, "")
      .replace(wordTimestampPattern, "")
      .trim()

    if (!text || timestamps.length === 0) {
      continue
    }

    for (const timestamp of timestamps) {
      const minutes = Number(timestamp[1])
      const seconds = Number(timestamp[2])

      if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
        continue
      }

      const startTimeMs = Math.max(
        0,
        Math.round((minutes * 60 + seconds) * 1000) + offsetMs,
      )
      const existingLines = linesByTimestamp.get(startTimeMs) ?? []

      if (!existingLines.includes(text)) {
        existingLines.push(text)
        linesByTimestamp.set(startTimeMs, existingLines)
      }
    }
  }

  return [...linesByTimestamp.entries()]
    .sort(([firstTimestamp], [secondTimestamp]) => firstTimestamp - secondTimestamp)
    .map(([startTimeMs, lines]) => ({
      startTimeMs,
      text: lines.join("\n"),
    }))
}

export function findActiveLyricIndex(
  lines: SyncedLyricLine[],
  playbackPositionMs: number,
): number {
  if (lines.length === 0 || playbackPositionMs < lines[0].startTimeMs) {
    return -1
  }

  let lowerBound = 0
  let upperBound = lines.length - 1
  let activeIndex = 0

  while (lowerBound <= upperBound) {
    const middle = Math.floor((lowerBound + upperBound) / 2)

    if (lines[middle].startTimeMs <= playbackPositionMs) {
      activeIndex = middle
      lowerBound = middle + 1
    } else {
      upperBound = middle - 1
    }
  }

  return activeIndex
}
