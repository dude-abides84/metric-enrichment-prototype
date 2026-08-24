import { parseRowsIntoSheet, type ParsedSheet } from "./spreadsheet"

/** A small social-media style dataset for trying the enricher without a file. */
export function buildSampleSheet(): ParsedSheet {
  const sentiments = ["positive", "neutral", "negative"]
  const platforms = ["Instagram", "TikTok", "X", "LinkedIn"]
  const rows: Record<string, unknown>[] = []

  for (let i = 0; i < 24; i++) {
    const likes = Math.floor(Math.random() * 400)
    const comments = Math.floor(Math.random() * 80)
    const shares = Math.floor(Math.random() * 60)
    rows.push({
      Date: new Date(2025, 0, 1 + i).toISOString().slice(0, 10),
      Platform: platforms[i % platforms.length],
      Likes: likes,
      Comments: comments,
      Shares: shares,
      Reach: likes * 12 + Math.floor(Math.random() * 500),
      Sentiment: sentiments[i % sentiments.length],
      Notes: "",
    })
  }

  return parseRowsIntoSheet(rows, "sample-social-metrics.csv")
}
