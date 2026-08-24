import { toNumber, type ColumnInfo, type ParsedSheet } from "./spreadsheet"

export type Comparator = ">" | "<" | "=" | ">=" | "<=" | "!="
export type ArithOp = "none" | "+" | "-" | "*" | "/"

export const COMPARATORS: { value: Comparator; label: string }[] = [
  { value: ">", label: "greater than  ( > )" },
  { value: "<", label: "less than  ( < )" },
  { value: ">=", label: "at least  ( ≥ )" },
  { value: "<=", label: "at most  ( ≤ )" },
  { value: "=", label: "equals  ( = )" },
  { value: "!=", label: "not equal  ( ≠ )" },
]

export const ARITH_OPS: { value: ArithOp; label: string; symbol: string }[] = [
  { value: "none", label: "no operation", symbol: "" },
  { value: "+", label: "add", symbol: "+" },
  { value: "-", label: "subtract", symbol: "−" },
  { value: "*", label: "multiply", symbol: "×" },
  { value: "/", label: "divide", symbol: "÷" },
]

export function opSymbol(op: ArithOp): string {
  return ARITH_OPS.find((o) => o.value === op)?.symbol ?? ""
}

/** The value produced when a rule matches: base [op operand]. */
export interface ResultExpr {
  baseType: "column" | "constant"
  baseColumn: string
  baseConstant: number
  op: ArithOp
  operand: number
}

export interface Condition {
  column: string
  comparator: Comparator
  /** compared as number for numeric columns, string for text columns */
  value: string
}

export interface Rule {
  id: string
  condition: Condition
  result: ResultExpr
}

export interface MetricConfig {
  name: string
  rules: Rule[]
  /** output used when no rule matches; null => leave blank */
  elseValue: number | null
}

export function evaluateCondition(
  condition: Condition,
  row: Record<string, unknown>,
  columns: ColumnInfo[],
): boolean {
  const col = columns.find((c) => c.name === condition.column)
  const raw = row[condition.column]

  const isText = col?.kind === "text"

  if (isText) {
    const left = String(raw ?? "").trim().toLowerCase()
    const right = condition.value.trim().toLowerCase()
    switch (condition.comparator) {
      case "=":
        return left === right
      case "!=":
        return left !== right
      default:
        // ordering comparators fall back to string comparison
        if (condition.comparator === ">") return left > right
        if (condition.comparator === "<") return left < right
        if (condition.comparator === ">=") return left >= right
        if (condition.comparator === "<=") return left <= right
        return false
    }
  }

  const left = toNumber(raw)
  const right = toNumber(condition.value)
  if (left === null || right === null) return false
  switch (condition.comparator) {
    case ">":
      return left > right
    case "<":
      return left < right
    case ">=":
      return left >= right
    case "<=":
      return left <= right
    case "=":
      return left === right
    case "!=":
      return left !== right
    default:
      return false
  }
}

export function evaluateResult(
  result: ResultExpr,
  row: Record<string, unknown>,
): number | null {
  let base: number | null
  if (result.baseType === "constant") {
    base = result.baseConstant
  } else {
    base = toNumber(row[result.baseColumn])
  }
  if (base === null) return null

  switch (result.op) {
    case "+":
      return base + result.operand
    case "-":
      return base - result.operand
    case "*":
      return base * result.operand
    case "/":
      return result.operand === 0 ? null : base / result.operand
    default:
      return base
  }
}

/** Evaluate the whole metric for a single row. */
export function evaluateMetric(
  config: MetricConfig,
  row: Record<string, unknown>,
  columns: ColumnInfo[],
): number | null {
  for (const rule of config.rules) {
    if (evaluateCondition(rule.condition, row, columns)) {
      return evaluateResult(rule.result, row)
    }
  }
  return config.elseValue
}

/** Round to at most 4 decimals for display / output. */
export function tidyNumber(n: number | null): string {
  if (n === null) return ""
  return String(Math.round(n * 10000) / 10000)
}

let idCounter = 0
export function makeId(prefix = "rule"): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export interface EnrichedSheet {
  headers: string[]
  rows: Record<string, unknown>[]
  /** the header name the metric was written to */
  targetColumn: string
  /** whether an existing empty column was reused (vs. a new column appended) */
  reusedEmptyColumn: boolean
}

/**
 * Apply the metric to every row. The result is written into the first
 * available empty column (titled with the metric name); if none exists a new
 * column is appended.
 */
export function enrichSheet(
  sheet: ParsedSheet,
  config: MetricConfig,
): EnrichedSheet {
  const metricName = config.name.trim() || "Custom score"

  const emptyColumn = sheet.columns.find((c) => c.kind === "empty")
  const reusedEmptyColumn = Boolean(emptyColumn)
  const targetColumn = metricName

  const headers = [...sheet.headers]
  if (emptyColumn) {
    headers[emptyColumn.index] = targetColumn
  } else if (!headers.includes(targetColumn)) {
    headers.push(targetColumn)
  }

  const oldEmptyName = emptyColumn?.name
  const rows = sheet.rows.map((row) => {
    const value = evaluateMetric(config, row, sheet.columns)
    const next: Record<string, unknown> = { ...row }
    if (oldEmptyName && oldEmptyName !== targetColumn) {
      delete next[oldEmptyName]
    }
    next[targetColumn] = value === null ? "" : tidyNumber(value)
    return next
  })

  return { headers, rows, targetColumn, reusedEmptyColumn }
}

export function describeResult(result: ResultExpr): string {
  const base =
    result.baseType === "constant"
      ? String(result.baseConstant)
      : result.baseColumn || "?"
  if (result.op === "none") return base
  return `${base} ${opSymbol(result.op)} ${result.operand}`
}
