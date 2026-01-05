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
import { Alumno, EvaluationFormData } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { StudentImport } from "@/components/evaluation/StudentImport"
import Link from "next/link"

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
    grupo: '',
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
    formData.grupo.trim() !== '' &&
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
      const response = await fetch('/api/generar', {
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

  // Handler para actualizar alumnos desde StudentImport
  const handleStudentsChange = (alumnos: Alumno[]) => {
    setFormData((prev) => ({
      ...prev,
      alumnos,
    }));
  };

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
              <Label htmlFor="grupo">Grupo</Label>
              <Input
                id="grupo"
                placeholder="Ej: 4A, 6B, 2C"
                value={formData.grupo}
                onChange={(e) => handleInputChange("grupo", e.target.value)}
              />
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

      {/* Paso 3: Lista de Alumnos */}
        <div className="relative">
          <div className="absolute -top-3 left-6 z-10">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              3
            </span>
          </div>
          <StudentImport
            alumnos={formData.alumnos}
            onStudentChange={handleStudentsChange}
          />
        </div>


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

