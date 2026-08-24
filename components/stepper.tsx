import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: "upload", label: "Upload data" },
  { id: "build", label: "Build metric" },
  { id: "result", label: "Enrich & export" },
] as const

interface StepperProps {
  current: "upload" | "build" | "result"
}

export function Stepper({ current }: StepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-accent text-primary",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-px flex-1",
                  i < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
