"use client"

import { Hash, Type, Calendar, CircleOff, Smile } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ColumnInfo } from "@/lib/spreadsheet"

interface ColumnPanelProps {
  columns: ColumnInfo[]
}

function KindIcon({ column }: { column: ColumnInfo }) {
  if (column.kind === "numeric") return <Hash className="size-3.5" />
  if (column.kind === "date") return <Calendar className="size-3.5" />
  if (column.kind === "empty") return <CircleOff className="size-3.5" />
  if (column.isSentiment) return <Smile className="size-3.5" />
  return <Type className="size-3.5" />
}

function kindMeta(column: ColumnInfo): {
  label: string
  usable: boolean
  tone: string
} {
  if (column.kind === "numeric")
    return { label: "Numeric", usable: true, tone: "text-primary" }
  if (column.isSentiment && column.kind === "text")
    return { label: "Sentiment", usable: true, tone: "text-chart-3" }
  if (column.kind === "text")
    return { label: "Text", usable: true, tone: "text-chart-3" }
  if (column.kind === "date")
    return { label: "Date · excluded", usable: false, tone: "text-muted-foreground" }
  return { label: "Empty · excluded", usable: false, tone: "text-muted-foreground" }
}

export function ColumnPanel({ columns }: ColumnPanelProps) {
  const usable = columns.filter((c) => kindMeta(c).usable)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Detected columns
        </h3>
        <span className="text-xs text-muted-foreground">
          {usable.length} of {columns.length} usable for enrichment
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {columns.map((column) => {
          const meta = kindMeta(column)
          return (
            <li
              key={column.name}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
                !meta.usable && "opacity-60",
              )}
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {column.name || "(unnamed)"}
                </p>
                {column.kind === "numeric" &&
                  column.min !== undefined &&
                  column.max !== undefined && (
                    <p className="font-mono text-xs text-muted-foreground">
                      range {column.min} – {column.max}
                    </p>
                  )}
                {column.kind === "text" && column.distinctValues.length > 0 && (
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {column.distinctValues.slice(0, 4).join(", ")}
                    {column.distinctValues.length > 4 ? "…" : ""}
                  </p>
                )}
              </div>
              <Badge
                variant="secondary"
                className={cn("shrink-0 gap-1 font-medium", meta.tone)}
              >
                <KindIcon column={column} />
                {meta.label}
              </Badge>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
