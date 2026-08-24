"use client"

import { Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { EnrichedSheet } from "@/lib/calculation"

interface DataPreviewProps {
  enriched: EnrichedSheet
  fileName: string
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "")
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(escape).join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","))
  }
  return lines.join("\n")
}

export function DataPreview({ enriched, fileName }: DataPreviewProps) {
  const { headers, rows, targetColumn, reusedEmptyColumn } = enriched
  const preview = rows.slice(0, 100)

  const handleDownload = () => {
    const csv = toCsv(headers, rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const base = fileName.replace(/\.(csv|xlsx|xls)$/i, "")
    a.href = url
    a.download = `${base}-enriched.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-success/15 text-success">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Data enriched
            </p>
            <p className="text-xs text-muted-foreground">
              {rows.length.toLocaleString()} rows scored ·{" "}
              {reusedEmptyColumn
                ? `written to first empty column "${targetColumn}"`
                : `new column "${targetColumn}" appended`}
            </p>
          </div>
        </div>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="size-4" />
          Download CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="max-h-[28rem] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-12 text-right font-mono text-xs text-muted-foreground">
                  #
                </TableHead>
                {headers.map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      "whitespace-nowrap",
                      h === targetColumn && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {h}
                      {h === targetColumn && (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-primary text-primary-foreground"
                        >
                          <Sparkles className="size-3" />
                          new
                        </Badge>
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  {headers.map((h) => (
                    <TableCell
                      key={h}
                      className={cn(
                        "whitespace-nowrap font-mono text-xs",
                        h === targetColumn &&
                          "bg-accent/40 font-semibold text-foreground",
                      )}
                    >
                      {String(row[h] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {rows.length > preview.length && (
        <p className="text-center text-xs text-muted-foreground">
          Showing first {preview.length} of {rows.length.toLocaleString()} rows.
          Download to get the full enriched file.
        </p>
      )}
    </div>
  )
}
