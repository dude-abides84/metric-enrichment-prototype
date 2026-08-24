"use client"

import { Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ColumnInfo } from "@/lib/spreadsheet"
import {
  ARITH_OPS,
  COMPARATORS,
  type Rule,
  type Comparator,
  type ArithOp,
} from "@/lib/calculation"

interface RuleEditorProps {
  rule: Rule
  index: number
  columns: ColumnInfo[]
  onChange: (rule: Rule) => void
  onRemove: () => void
}

export function RuleEditor({
  rule,
  index,
  columns,
  onChange,
  onRemove,
}: RuleEditorProps) {
  const conditionColumns = columns.filter(
    (c) => c.kind === "numeric" || c.kind === "text",
  )
  const numericColumns = columns.filter((c) => c.kind === "numeric")

  const conditionCol = columns.find((c) => c.name === rule.condition.column)
  const conditionIsText = conditionCol?.kind === "text"

  const update = (patch: Partial<Rule>) => onChange({ ...rule, ...patch })
  const updateCondition = (patch: Partial<Rule["condition"]>) =>
    update({ condition: { ...rule.condition, ...patch } })
  const updateResult = (patch: Partial<Rule["result"]>) =>
    update({ result: { ...rule.result, ...patch } })

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-accent font-mono text-[11px] text-accent-foreground">
            {index + 1}
          </span>
          {index === 0 ? "If" : "Else if"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={`Remove rule ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Condition row */}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Column</Label>
          <Select
            value={rule.condition.column}
            onValueChange={(v) => updateCondition({ column: v, value: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {conditionColumns.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                  {c.isSentiment ? "  (sentiment)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Operator</Label>
          <Select
            value={rule.condition.comparator}
            onValueChange={(v) =>
              updateCondition({ comparator: v as Comparator })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARATORS.filter((c) =>
                conditionIsText ? c.value === "=" || c.value === "!=" : true,
              ).map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Value</Label>
          {conditionIsText && conditionCol ? (
            <Select
              value={rule.condition.value}
              onValueChange={(v) => updateCondition({ value: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                {conditionCol.distinctValues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 100"
              value={rule.condition.value}
              onChange={(e) => updateCondition({ value: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* Result row */}
      <div className="mt-4 rounded-md bg-secondary/60 p-3">
        <Label className="text-xs font-medium text-secondary-foreground">
          then set the score to
        </Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex gap-2">
            <Select
              value={rule.result.baseType}
              onValueChange={(v) =>
                updateResult({ baseType: v as "column" | "constant" })
              }
            >
              <SelectTrigger className="w-[7.5rem] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="constant">a number</SelectItem>
                <SelectItem value="column">a column</SelectItem>
              </SelectContent>
            </Select>
            {rule.result.baseType === "column" ? (
              <Select
                value={rule.result.baseColumn}
                onValueChange={(v) => updateResult({ baseColumn: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                inputMode="decimal"
                placeholder="value"
                value={Number.isNaN(rule.result.baseConstant) ? "" : rule.result.baseConstant}
                onChange={(e) =>
                  updateResult({ baseConstant: Number(e.target.value) })
                }
              />
            )}
          </div>

          <Select
            value={rule.result.op}
            onValueChange={(v) => updateResult({ op: v as ArithOp })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARITH_OPS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            inputMode="decimal"
            placeholder="operand"
            disabled={rule.result.op === "none"}
            value={Number.isNaN(rule.result.operand) ? "" : rule.result.operand}
            onChange={(e) => updateResult({ operand: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
