"use client"

import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RuleEditor } from "@/components/rule-editor"
import { FormulaPreview } from "@/components/formula-preview"
import type { ColumnInfo, ParsedSheet } from "@/lib/spreadsheet"
import { makeId, type MetricConfig, type Rule } from "@/lib/calculation"

interface CalculationBuilderProps {
  sheet: ParsedSheet
  config: MetricConfig
  onChange: (config: MetricConfig) => void
}

function defaultRule(columns: ColumnInfo[]): Rule {
  const firstNumeric = columns.find((c) => c.kind === "numeric")
  return {
    id: makeId(),
    logic: "AND",
    conditions: [
      {
        id: makeId("cond"),
        column: firstNumeric?.name ?? "",
        comparator: ">",
        value: "",
      },
    ],
    result: {
      baseType: firstNumeric ? "column" : "constant",
      baseColumn: firstNumeric?.name ?? "",
      baseConstant: 100,
      op: "none",
      operand: 2,
    },
  }
}

export function CalculationBuilder({
  sheet,
  config,
  onChange,
}: CalculationBuilderProps) {
  const updateRule = (id: string, rule: Rule) =>
    onChange({
      ...config,
      rules: config.rules.map((r) => (r.id === id ? rule : r)),
    })

  const removeRule = (id: string) =>
    onChange({ ...config, rules: config.rules.filter((r) => r.id !== id) })

  const addRule = () =>
    onChange({ ...config, rules: [...config.rules, defaultRule(sheet.columns)] })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="metric-name" className="flex items-center gap-1.5">
            <Pencil className="size-3.5 text-muted-foreground" />
            Metric name
          </Label>
          <Input
            id="metric-name"
            value={config.name}
            onChange={(e) => onChange({ ...config, name: e.target.value })}
            placeholder="Custom score"
            className="max-w-sm font-medium"
          />
        </div>

        <div className="space-y-3">
          {config.rules.map((rule, i) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              index={i}
              columns={sheet.columns}
              onChange={(r) => updateRule(rule.id, r)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
          {config.rules.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No rules yet. Add a rule to start building your metric.
            </p>
          )}
        </div>

        <Button variant="outline" onClick={addRule} className="gap-2">
          <Plus className="size-4" />
          Add rule
        </Button>

        {/* Else / default */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            Otherwise, set the score to
          </span>
          <Input
            type="number"
            inputMode="decimal"
            className="w-28"
            placeholder="blank"
            value={config.elseValue === null ? "" : config.elseValue}
            onChange={(e) =>
              onChange({
                ...config,
                elseValue: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
          <span className="text-xs text-muted-foreground">
            leave empty to output nothing
          </span>
        </div>
      </div>

      <FormulaPreview sheet={sheet} config={config} />
    </div>
  )
}
