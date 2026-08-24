"use client"

import { useCallback, useRef, useState } from "react"
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFile: (file: File) => void
  loading?: boolean
  error?: string | null
}

const ACCEPT = ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export function FileUpload({ onFile, loading, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card px-6 py-16 text-center transition-colors",
        dragging && "border-primary bg-accent/50",
        loading && "pointer-events-none opacity-70",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary transition-transform group-hover:scale-105">
        {loading ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <UploadCloud className="size-6" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">
          {loading ? "Reading your spreadsheet…" : "Drop a CSV or Excel file"}
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse — .csv, .xlsx and .xls are supported
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
        <FileSpreadsheet className="size-3.5" />
        Data stays in your browser
      </div>
      {error && (
        <p className="max-w-sm text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
