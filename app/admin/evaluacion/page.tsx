"use client"

import { useState, useEffect } from "react"
import { EvaluationCriteriaPanel, PercentageSlider, type EvaluationCriteria } from "@/components/evaluation-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "react-toastify"
import { ArrowLeft, BookOpen, FileSpreadsheet, Upload } from "lucide-react"
import Link from "next/link"
import { EvaluationFormData } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

interface CourseGroupOption {
  id: number
  course: { id: number; name: string }
  group: { id: number; name: string; semester: number; period?: { name: string } }
  user: { id: number; fullName: string; email: string }
  schedule?: string
}

export default function EvaluacionPage() {
  const [formData, setFormData] = useState<EvaluationFormData>({
    maestro: '',
    semestre: null,
    asignatura: '',
    safis: '',
    ponderaciones: {
      asistencia: 10,
      actividades: 20,
      evidencias: 20,
      productoIntegrador: 20,
      examen: 30,
    },
    alumnos: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Calcular total de ponderaciones
  const totalPonderaciones =
    formData.ponderaciones.asistencia +
    formData.ponderaciones.actividades +
    formData.ponderaciones.evidencias +
    formData.ponderaciones.productoIntegrador +
    formData.ponderaciones.examen;
  const isPonderacionesValid = totalPonderaciones === 100;

  // Validar formulario completo
  const isFormatValid =
    formData.maestro.trim() !== '' &&
    formData.semestre !== null &&
    formData.asignatura.trim() !== '' &&
    formData.safis.trim() !== '' &&
    isPonderacionesValid &&
    formData.alumnos.length > 0;

  const handleInputChange = (field: keyof EvaluationFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePonderacionChange = (key: keyof EvaluationFormData["ponderaciones"], value: number) => {
    setFormData((prev) => ({
      ...prev,
      ponderaciones: {
        ...prev.ponderaciones,
        [key]: value,
      },
    }));
  };

  const handleGenerarEvaluacion = async () => {
    if (!isFormatValid) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Llamar a la API para generar el Excel
      const response = await fetch('/api/evaluaciones/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok)
        throw new Error("Error al generar el archivo.");

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `evaluacion_${formData.asignatura}_${formData.safis}.xlsx` // Al final me di cuenta que el archivo es un .xlsx
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success("Archivo generado correctamente");

    } catch (e) {
      console.error("Error al generar archivo de evaluación: ", e);
      toast.error("Error al generar el archivo");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Generador de Evaluaciones</h1>
            <p className="text-muted-foreground">
              Genera archivos XLSM para calificación de alumnos
            </p>
          </div>
        </div>
      </div>

      {/* Paso 1: Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              1
            </span>
            Información General
          </CardTitle>
          <CardDescription>
            Ingresa los datos del maestro y la asignatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maestro">Nombre del Maestro</Label>
              <Input
                id="maestro"
                placeholder="Ej: Juan Pérez García"
                value={formData.maestro}
                onChange={(e) => handleInputChange("maestro", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre</Label>
              <Select
                value={formData.semestre?.toString() || ""}
                onValueChange={(value) => handleInputChange("semestre", parseInt(value))}
              >
                <SelectTrigger id="semestre">
                  <SelectValue placeholder="Selecciona el semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      {sem}° Semestre
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asignatura">Asignatura</Label>
              <Input
                id="asignatura"
                placeholder="Ej: Matemáticas Avanzadas"
                value={formData.asignatura}
                onChange={(e) => handleInputChange("asignatura", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safis">SAFIS (Periodo)</Label>
              <Input
                id="safis"
                placeholder="Ej: 2024-1"
                value={formData.safis}
                onChange={(e) => handleInputChange("safis", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paso 2: Ponderaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              2
            </span>
            Ponderaciones
            <span
              className={`ml-auto text-sm font-normal px-2 py-1 rounded ${isPonderacionesValid
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                }`}
            >
              Total: {totalPonderaciones}%
            </span>
          </CardTitle>
          <CardDescription>
            Define los porcentajes de evaluación (deben sumar 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PercentageSlider
            label="Asistencia"
            value={formData.ponderaciones.asistencia}
            onChange={(value) => handlePonderacionChange("asistencia", value)}
          />
          <PercentageSlider
            label="Actividades"
            value={formData.ponderaciones.actividades}
            onChange={(value) => handlePonderacionChange("actividades", value)}
          />
          <PercentageSlider
            label="Evidencias"
            value={formData.ponderaciones.evidencias}
            onChange={(value) => handlePonderacionChange("evidencias", value)}
          />
          <PercentageSlider
            label="Producto Integrador"
            value={formData.ponderaciones.productoIntegrador}
            onChange={(value) => handlePonderacionChange("productoIntegrador", value)}
          />
          <PercentageSlider
            label="Examen"
            value={formData.ponderaciones.examen}
            onChange={(value) => handlePonderacionChange("examen", value)}
          />

          {!isPonderacionesValid && (
            <Alert variant="destructive">
              <AlertDescription>
                Las ponderaciones deben sumar exactamente 100%. Actualmente suman {totalPonderaciones}%.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Paso 3: Lista de Alumnos (placeholder para el siguiente paso) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              3
            </span>
            Lista de Alumnos
            {formData.alumnos.length > 0 && (
              <span className="ml-auto text-sm font-normal px-2 py-1 rounded bg-blue-100 text-blue-700">
                {formData.alumnos.length} alumnos cargados
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Importa un archivo Excel con la lista de alumnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Aquí irá el componente StudentImport */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Arrastra un archivo Excel o haz clic para seleccionar
            </p>
            <Button variant="outline" disabled>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Seleccionar archivo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Formato esperado: .xlsx con columnas Matrícula y Nombre
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botón de generar */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerarEvaluacion}
          disabled={!isFormatValid || isGenerating}
        >
          {isGenerating ? (
            <>Generando...</>
          ) : (
            <>
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Generar Evaluación
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

