"use client"

import { useMemo, useState } from "react"
import { Check, X, ArrowRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ParsedSheet } from "@/lib/spreadsheet"
import {
  describeResult,
  evaluateCondition,
  evaluateConditions,
  evaluateMetric,
  tidyNumber,
  type MetricConfig,
} from "@/lib/calculation"

interface FormulaPreviewProps {
  sheet: ParsedSheet
  config: MetricConfig
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode
  tone?: "default" | "column" | "op" | "value"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs",
        tone === "default" && "bg-muted text-muted-foreground",
        tone === "column" && "bg-accent text-accent-foreground",
        tone === "op" && "text-foreground",
        tone === "value" && "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  )
}

export function FormulaPreview({ sheet, config }: FormulaPreviewProps) {
  const [rowIndex, setRowIndex] = useState(0)
  const sampleRows = sheet.rows.slice(0, 25)
  const row = sampleRows[rowIndex] ?? sampleRows[0]

  const matchedRuleId = useMemo(() => {
    if (!row) return null
    for (const rule of config.rules) {
      if (evaluateConditions(rule.conditions, rule.logic, row, sheet.columns))
        return rule.id
    }
    return null
  }, [config.rules, row, sheet.columns])

  const finalValue = row ? evaluateMetric(config, row, sheet.columns) : null

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Logic preview</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Rules evaluate top to bottom. The first match wins.
        </p>

        <div className="mt-3 space-y-1.5">
          {config.rules.map((rule, i) => {
            const matched = matchedRuleId === rule.id
            const dimmed =
              matchedRuleId !== null &&
              config.rules.findIndex((r) => r.id === matchedRuleId) < i
            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-xs leading-relaxed transition-colors",
                  matched
                    ? "border-primary/40 bg-accent/60"
                    : "border-border bg-background",
                  dimmed && "opacity-40",
                )}
              >
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-semibold text-muted-foreground">
                    {i === 0 ? "IF" : "ELSE IF"}
                  </span>
                  {rule.conditions.map((condition, ci) => {
                    const condMatched = row
                      ? evaluateCondition(condition, row, sheet.columns)
                      : null
                    return (
                      <span
                        key={condition.id}
                        className="inline-flex flex-wrap items-center gap-1"
                      >
                        {ci > 0 && (
                          <Chip tone="op">
                            <span className="font-semibold">{rule.logic}</span>
                          </Chip>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            condMatched === false && "opacity-45",
                          )}
                        >
                          <Chip tone="column">{condition.column || "?"}</Chip>
                          <Chip tone="op">{condition.comparator}</Chip>
                          <Chip tone="value">{condition.value || "?"}</Chip>
                        </span>
                      </span>
                    )
                  })}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="font-semibold text-muted-foreground">
                    THEN
                  </span>
                  <Chip tone="value">{describeResult(rule.result)}</Chip>
                  {row && (
                    <span className="ml-auto inline-flex items-center gap-1">
                      {matched ? (
                        <Check className="size-3.5 text-success" />
                      ) : (
                        <X className="size-3.5 text-muted-foreground/60" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          <div className="rounded-md border border-border bg-background px-2.5 py-2 text-xs">
            <span className="font-semibold text-muted-foreground">ELSE </span>
            <Chip tone="value">
              {config.elseValue === null ? "blank" : String(config.elseValue)}
            </Chip>
          </div>
        </div>
      </div>

      {/* Sample evaluation */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Try a row</h3>
          <Select
            value={String(rowIndex)}
            onValueChange={(v) => setRowIndex(Number(v))}
          >
            <SelectTrigger className="h-8 w-[7.5rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sampleRows.map((_, i) => (
                <SelectItem key={i} value={String(i)}>
                  Row {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {row && (
          <div className="mt-3 space-y-3">
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {sheet.columns
                .filter((c) => c.kind === "numeric" || c.kind === "text")
                .map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-muted-foreground">
                      {c.name}
                    </span>
                    <span className="font-mono text-foreground">
                      {String(row[c.name] ?? "")}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <ArrowRight className="size-3.5" />
                {config.name || "Custom score"}
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                {finalValue === null ? "—" : tidyNumber(finalValue)}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
