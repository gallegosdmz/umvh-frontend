"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PercentageSlider } from "./PercentageSlider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import evaluationPanelStrings from "@/locales/evaluation-panel.json"

export interface EvaluationCriteria {
  attendance: number
  activities: number
  evidence: number
  integrativeProduct: number
  exam: number
}

export interface EvaluationCriteriaPanelProps {
  teacherName?: string
  semester?: number
  subject?: string
  safis?: string
  initialValues?: Partial<EvaluationCriteria>
  onSave?: (values: EvaluationCriteria) => Promise<void> | void
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export function EvaluationCriteriaPanel({
  teacherName = "",
  semester,
  subject = "",
  safis = "",
  initialValues,
  onSave,
  onCancel,
  isLoading = false,
  className,
}: EvaluationCriteriaPanelProps) {
  const [values, setValues] = React.useState<EvaluationCriteria>({
    attendance: initialValues?.attendance ?? 10,
    activities: initialValues?.activities ?? 20,
    evidence: initialValues?.evidence ?? 20,
    integrativeProduct: initialValues?.integrativeProduct ?? 20,
    exam: initialValues?.exam ?? 30,
  })

  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const total = React.useMemo(() => {
    return (
      values.attendance +
      values.activities +
      values.evidence +
      values.integrativeProduct +
      values.exam
    )
  }, [values])

  const isTotalValid = total === 100

  const handleValueChange = (key: keyof EvaluationCriteria) => (newValue: number) => {
    setValues((prev) => ({
      ...prev,
      [key]: newValue,
    }))
    setError(null)
  }

  const handleSave = async () => {
    if (!isTotalValid) {
      setError(evaluationPanelStrings.validation.totalMustBe100)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (onSave) {
        await onSave(values)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : evaluationPanelStrings.messages.error
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {evaluationPanelStrings.evaluation.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información del docente y curso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
          <div className="space-y-2">
            <Label htmlFor="teacher-name">
              {evaluationPanelStrings.labels.teacherName}
            </Label>
            <Input
              id="teacher-name"
              value={teacherName}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">{evaluationPanelStrings.labels.semester}</Label>
            <Input
              id="semester"
              type="number"
              value={semester ?? ""}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">{evaluationPanelStrings.labels.subject}</Label>
            <Input
              id="subject"
              value={subject}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="safis">{evaluationPanelStrings.labels.safis}</Label>
            <Input
              id="safis"
              value={safis}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        {/* Criterios de evaluación */}
        <div className="space-y-6">
          <PercentageSlider
            label={evaluationPanelStrings.evaluation.criteria.attendance}
            value={values.attendance}
            onChange={handleValueChange("attendance")}
            disabled={isLoading || isSaving}
          />
          <PercentageSlider
            label={evaluationPanelStrings.evaluation.criteria.activities}
            value={values.activities}
            onChange={handleValueChange("activities")}
            disabled={isLoading || isSaving}
          />
          <PercentageSlider
            label={evaluationPanelStrings.evaluation.criteria.evidence}
            value={values.evidence}
            onChange={handleValueChange("evidence")}
            disabled={isLoading || isSaving}
          />
          <PercentageSlider
            label={evaluationPanelStrings.evaluation.criteria.integrativeProduct}
            value={values.integrativeProduct}
            onChange={handleValueChange("integrativeProduct")}
            disabled={isLoading || isSaving}
          />
          <PercentageSlider
            label={evaluationPanelStrings.evaluation.criteria.exam}
            value={values.exam}
            onChange={handleValueChange("exam")}
            disabled={isLoading || isSaving}
          />
        </div>

        {/* Total y validación */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Total:</span>
            <span
              className={`text-lg font-bold ${
                isTotalValid ? "text-green-600" : "text-red-600"
              }`}
            >
              {total}%
            </span>
          </div>
          {!isTotalValid && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {evaluationPanelStrings.validation.totalMustBe100}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Mensajes de error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSaving}
            >
              {evaluationPanelStrings.evaluation.cancel}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving || !isTotalValid}
            className="min-w-[100px]"
          >
            {isSaving
              ? evaluationPanelStrings.messages.saving
              : evaluationPanelStrings.evaluation.accept}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

