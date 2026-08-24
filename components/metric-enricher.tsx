"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles, Table2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { ColumnPanel } from "@/components/column-panel"
import { CalculationBuilder } from "@/components/calculation-builder"
import { DataPreview } from "@/components/data-preview"
import { Stepper } from "@/components/stepper"
import { parseSpreadsheet, type ParsedSheet } from "@/lib/spreadsheet"
import {
  enrichSheet,
  makeId,
  type EnrichedSheet,
  type MetricConfig,
} from "@/lib/calculation"
import { buildSampleSheet } from "@/lib/sample-data"

type Step = "upload" | "build" | "result"

function initialConfig(sheet: ParsedSheet): MetricConfig {
  const firstNumeric = sheet.columns.find((c) => c.kind === "numeric")
  return {
    name: "Custom score",
    elseValue: 0,
    rules: [
      {
        id: makeId(),
        condition: {
          column: firstNumeric?.name ?? "",
          comparator: ">",
          value: "100",
        },
        result: {
          baseType: firstNumeric ? "column" : "constant",
          baseColumn: firstNumeric?.name ?? "",
          baseConstant: 100,
          op: "*",
          operand: 2,
        },
      },
    ],
  }
}

export function MetricEnricher() {
  const [step, setStep] = useState<Step>("upload")
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [config, setConfig] = useState<MetricConfig | null>(null)
  const [enriched, setEnriched] = useState<EnrichedSheet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSheet = (parsed: ParsedSheet) => {
    setSheet(parsed)
    setConfig(initialConfig(parsed))
    setEnriched(null)
    setStep("build")
  }

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await parseSpreadsheet(file)
      loadSheet(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.")
    } finally {
      setLoading(false)
    }
  }

  const handleSample = () => {
    setError(null)
    loadSheet(buildSampleSheet())
  }

  const handleEnrich = () => {
    if (!sheet || !config) return
    setEnriched(enrichSheet(sheet, config))
    setStep("result")
  }

  const reset = () => {
    setSheet(null)
    setConfig(null)
    setEnriched(null)
    setError(null)
    setStep("upload")
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Metric Enricher
            </h1>
            <p className="text-xs text-muted-foreground">
              Turn raw spreadsheet columns into a custom scoring metric
            </p>
          </div>
        </div>
      </header>

      <Stepper current={step} />

      <div className="mt-8">
        {step === "upload" && (
          <div className="space-y-6">
            <FileUpload onFile={handleFile} loading={loading} error={error} />
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="h-px w-8 bg-border" />
              no file handy?
              <Button variant="outline" size="sm" onClick={handleSample}>
                <Table2 className="mr-1.5 size-4" />
                Load sample data
              </Button>
            </div>
          </div>
        )}

        {step === "build" && sheet && config && (
          <div className="space-y-8">
            <ColumnPanel columns={sheet.columns} />
            <div className="h-px bg-border" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Build your metric
              </h2>
              <p className="text-sm text-muted-foreground">
                Add conditional rules that calculate a score from your numeric
                and sentiment columns.
              </p>
            </div>
            <CalculationBuilder
              sheet={sheet}
              config={config}
              onChange={setConfig}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={reset} className="gap-2">
                <ArrowLeft className="size-4" />
                Start over
              </Button>
              <Button
                onClick={handleEnrich}
                size="lg"
                className="gap-2"
                disabled={config.rules.length === 0}
              >
                <Sparkles className="size-4" />
                Enrich data
              </Button>
            </div>
          </div>
        )}

        {step === "result" && enriched && sheet && (
          <div className="space-y-6">
            <DataPreview enriched={enriched} fileName={sheet.fileName} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={reset} className="gap-2">
                <ArrowLeft className="size-4" />
                Start over
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("build")}
                className="gap-2"
              >
                <Wand2 className="size-4" />
                Edit metric
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
