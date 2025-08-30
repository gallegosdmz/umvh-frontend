import { useState, useEffect } from 'react'
import { CourseService } from '@/lib/services/course.service'

interface PonderacionesCurso {
  asistencia: number
  actividades: number
  evidencias: number
  producto: number
  examen: number
}

interface PonderacionesIds {
  asistencia?: number
  actividades?: number
  evidencias?: number
  producto?: number
  examen?: number
}

export function usePonderaciones(courseGroupId?: number) {
  const [ponderacionesCurso, setPonderacionesCurso] = useState<PonderacionesCurso | null>(null)
  const [ponderacionesIds, setPonderacionesIds] = useState<PonderacionesIds>({})
  const [isLoading, setIsLoading] = useState(false)

  const loadPonderaciones = async () => {
    if (!courseGroupId) return
    
    setIsLoading(true)
    try {
      const courseGroupWithPonderaciones = await CourseService.getCourseGroupIndividual(courseGroupId)
      const gradingschemes = courseGroupWithPonderaciones.coursesGroupsGradingschemes || []
      
      const ponderaciones: PonderacionesCurso = {
        asistencia: 0,
        actividades: 0,
        evidencias: 0,
        producto: 0,
        examen: 0
      }
      
      const ids: PonderacionesIds = {}
      
      gradingschemes.forEach((scheme: any) => {
        const type = scheme.type.toLowerCase()
        if (type === 'asistencia') {
          ponderaciones.asistencia = scheme.percentage
          ids.asistencia = scheme.id
        } else if (type === 'actividades') {
          ponderaciones.actividades = scheme.percentage
          ids.actividades = scheme.id
        } else if (type === 'evidencias') {
          ponderaciones.evidencias = scheme.percentage
          ids.evidencias = scheme.id
        } else if (type === 'producto') {
          ponderaciones.producto = scheme.percentage
          ids.producto = scheme.id
        } else if (type === 'examen') {
          ponderaciones.examen = scheme.percentage
          ids.examen = scheme.id
        }
      })
      
      setPonderacionesCurso(ponderaciones)
      setPonderacionesIds(ids)
      
    } catch (error) {
      console.error('Error al cargar las ponderaciones:', error)
      setPonderacionesCurso({
        asistencia: 0,
        actividades: 0,
        evidencias: 0,
        producto: 0,
        examen: 0
      })
      setPonderacionesIds({})
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (courseGroupId) {
      loadPonderaciones()
    }
  }, [courseGroupId])

  return {
    ponderacionesCurso,
    ponderacionesIds,
    isLoading,
    loadPonderaciones
  }
}
