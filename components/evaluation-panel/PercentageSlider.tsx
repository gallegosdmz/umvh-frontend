"use client"

import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PercentageSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function PercentageSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
}: PercentageSliderProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleSliderChange = (newValue: number[]) => {
    const clampedValue = Math.max(min, Math.min(max, newValue[0]))
    setLocalValue(clampedValue)
    onChange(clampedValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = Number(e.target.value)
    if (!isNaN(inputValue)) {
      const clampedValue = Math.max(min, Math.min(max, inputValue))
      setLocalValue(clampedValue)
      onChange(clampedValue)
    }
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, localValue + step)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, localValue - step)
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={localValue}
              onChange={handleInputChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="w-16 h-8 text-center text-sm"
            />
            <span className="text-sm font-medium text-muted-foreground">%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabled || localValue >= max}
              className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded hover:bg-muted"
              aria-label="Incrementar"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabled || localValue <= min}
              className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded hover:bg-muted"
              aria-label="Decrementar"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
      <Slider
        value={[localValue]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full"
      />
    </div>
  )
}

