import type { Evaluacion, Ponderacion } from "./mock-data"

export interface PromediosAlumno {
  parcial1: number
  parcial2: number
  parcial3: number
  final: number
}

export function calcularPromedios(evaluaciones: Evaluacion[], ponderaciones: Ponderacion[]): PromediosAlumno {
  const promedios: PromediosAlumno = {
    parcial1: 0,
    parcial2: 0,
    parcial3: 0,
    final: 0,
  }

  // Calcular promedio por parcial
  for (let parcial = 1; parcial <= 3; parcial++) {
    const evaluacionesParcial = evaluaciones.filter((e) => e.parcial === parcial)
    let suma = 0
    let totalPonderacion = 0

    ponderaciones.forEach((pond) => {
      const evaluacion = evaluacionesParcial.find((e) => e.rubro === pond.rubro)
      if (evaluacion && evaluacion.calificacion > 0) {
        suma += evaluacion.calificacion * (pond.porcentaje / 100)
        totalPonderacion += pond.porcentaje
      }
    })

    if (totalPonderacion > 0) {
      const promedioParcial = (suma / totalPonderacion) * 100
      promedios[`parcial${parcial}` as keyof PromediosAlumno] = Math.round(promedioParcial * 10) / 10
    }
  }

  // Calcular promedio final (promedio de los parciales con calificación)
  const parcialesConCalif = [promedios.parcial1, promedios.parcial2, promedios.parcial3].filter((p) => p > 0)
  if (parcialesConCalif.length > 0) {
    promedios.final =
      Math.round((parcialesConCalif.reduce((sum, p) => sum + p, 0) / parcialesConCalif.length) * 10) / 10
  }

  return promedios
}

export function determinarSituacion(promedioFinal: number, valorExencion = 8.0): string {
  if (promedioFinal >= valorExencion) return "exentado"
  if (promedioFinal >= 6.0) return "ordinario"
  if (promedioFinal > 0) return "extraordinario"
  return "na"
}

export function calcularPorcentajeAsistencia(totalClases: number, clasesAsistidas: number): number {
  if (totalClases === 0) return 0
  return Math.round((clasesAsistidas / totalClases) * 100)
}

export function getColorBySituacion(situacion: string): string {
  switch (situacion) {
    case "exentado":
      return "bg-green-100 text-green-800"
    case "ordinario":
      return "bg-blue-100 text-blue-800"
    case "extraordinario":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getVariantBySituacion(situacion: string): "default" | "secondary" | "destructive" | "outline" {
  switch (situacion) {
    case "exentado":
      return "default"
    case "ordinario":
      return "secondary"
    case "extraordinario":
      return "destructive"
    default:
      return "outline"
  }
}
