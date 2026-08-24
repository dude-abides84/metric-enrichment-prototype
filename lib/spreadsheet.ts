import * as XLSX from "xlsx"

export type ColumnKind = "numeric" | "text" | "date" | "empty"

export interface ColumnInfo {
  name: string
  index: number
  kind: ColumnKind
  /** distinct non-empty string values (only tracked for text columns) */
  distinctValues: string[]
  /** basic numeric summary for numeric columns */
  min?: number
  max?: number
  /** whether this text column looks like a sentiment/emotion field */
  isSentiment: boolean
}

export interface ParsedSheet {
  /** original ordered header names */
  headers: string[]
  /** array of row objects keyed by header */
  rows: Record<string, unknown>[]
  /** per-column analysis */
  columns: ColumnInfo[]
  fileName: string
}

const DATE_HEADER_HINT =
  /\b(date|time|timestamp|day|month|year|created|updated|datetime)\b/i
const SENTIMENT_HINT = /(sentiment|emotion|mood|tone|feeling)/i

function looksLikeDate(value: unknown): boolean {
  if (value instanceof Date) return true
  if (typeof value === "number") return false
  if (typeof value !== "string") return false
  const v = value.trim()
  if (!v) return false
  // ISO-ish or common date formats, avoid matching plain integers
  if (/^\d{4}-\d{1,2}-\d{1,2}([ T].*)?$/.test(v)) return true
  if (/^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/.test(v)) return true
  return false
}

function isNumericValue(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "string") {
    const v = value.trim().replace(/,/g, "")
    if (v === "") return false
    return !Number.isNaN(Number(v))
  }
  return false
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const v = value.trim().replace(/,/g, "")
    if (v === "") return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  }
  return null
}

/** Analyse each column to determine its kind and enrichment eligibility. */
function analyzeColumns(
  headers: string[],
  rows: Record<string, unknown>[],
): ColumnInfo[] {
  return headers.map((name, index) => {
    const values = rows
      .map((r) => r[name])
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")

    const headerIsDate = DATE_HEADER_HINT.test(name)
    const isSentiment = SENTIMENT_HINT.test(name)

    if (values.length === 0) {
      return { name, index, kind: "empty", distinctValues: [], isSentiment }
    }

    const dateCount = values.filter(looksLikeDate).length
    const numericCount = values.filter(isNumericValue).length

    let kind: ColumnKind
    if (isSentiment) {
      // Sentiment/emotion columns hold queryable text even if the header
      // happens to contain a date-like substring.
      kind = "text"
    } else if (headerIsDate || dateCount / values.length > 0.6) {
      kind = "date"
    } else if (numericCount / values.length > 0.8) {
      kind = "numeric"
    } else {
      kind = "text"
    }

    const distinctValues =
      kind === "text"
        ? Array.from(new Set(values.map((v) => String(v).trim()))).slice(0, 50)
        : []

    let min: number | undefined
    let max: number | undefined
    if (kind === "numeric") {
      const nums = values.map(toNumber).filter((n): n is number => n !== null)
      if (nums.length) {
        min = Math.min(...nums)
        max = Math.max(...nums)
      }
    }

    return { name, index, kind, distinctValues, min, max, isSentiment }
  })
}

/** Build a ParsedSheet from in-memory row objects (used for sample data). */
export function parseRowsIntoSheet(
  rows: Record<string, unknown>[],
  fileName: string,
): ParsedSheet {
  const headers: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key)
    }
  }
  const columns = analyzeColumns(headers, rows)
  return { headers, rows, columns, fileName }
}

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error("The file does not contain any sheets.")
  const sheet = workbook.Sheets[firstSheetName]

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  })

  if (raw.length === 0) {
    throw new Error("The sheet appears to be empty.")
  }

  // Preserve column order from the sheet header row.
  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    blankrows: false,
  })[0] as unknown[]
  const headers = (headerRow ?? []).map((h) => String(h))

  // Ensure every header from data is included (fallback).
  for (const row of raw) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key)
    }
  }

  const columns = analyzeColumns(headers, raw)
  return { headers, rows: raw, columns, fileName: file.name }
}
