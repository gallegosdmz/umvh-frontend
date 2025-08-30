"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CourseService } from "@/lib/services/course.service"
import { toast } from 'react-toastify'

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

interface PonderacionesModalProps {
  isOpen: boolean
  onClose: () => void
  courseGroup: any
  onPonderacionesChange?: () => void
}

export function PonderacionesModal({ 
  isOpen, 
  onClose, 
  courseGroup, 
  onPonderacionesChange 
}: PonderacionesModalProps) {
  const [ponderacionesCurso, setPonderacionesCurso] = useState<PonderacionesCurso | null>(null)
  const [ponderacionesIds, setPonderacionesIds] = useState<PonderacionesIds>({})
  const [isLoading, setIsLoading] = useState(false)

  // Cargar ponderaciones cuando se abra el modal
  useEffect(() => {
    if (isOpen && courseGroup) {
      loadPonderaciones()
    }
  }, [isOpen, courseGroup])

  // Cargar las ponderaciones existentes
  const loadPonderaciones = async () => {
    if (!courseGroup?.id) return
    
    setIsLoading(true)
    try {
      // Cargar las ponderaciones usando el endpoint individual
      const courseGroupWithPonderaciones = await CourseService.getCourseGroupIndividual(courseGroup.id)
      
      // Usar las ponderaciones que vienen en el courseGroup
      const gradingschemes = courseGroupWithPonderaciones.coursesGroupsGradingschemes || []
      
      // Mapear las ponderaciones existentes
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
      toast.error('Error al cargar las ponderaciones')
      
      // Si hay error, inicializar con valores por defecto
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

  // Manejar cambio de ponderación (solo estado local)
  const handlePonderacionChange = (type: string, value: number) => {
    if (!courseGroup?.id) return
    
    setPonderacionesCurso(prev => prev ? {
      ...prev,
      [type]: value
    } : null)
  }

  // Manejar tecla Enter para guardar
  const handlePonderacionKeyPress = async (type: string, value: number, event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return
    await handlePonderacionButtonClick(type, value)
  }

  // Manejar clic en botón de ponderación
  const handlePonderacionButtonClick = async (type: string, value: number) => {
    if (!courseGroup?.id) return
    
    try {
      const gradingSchemeData = {
        courseGroupId: courseGroup.id,
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalizar primera letra
        percentage: value
      }
      
      // Verificar si ya existe la ponderación
      const existingId = ponderacionesIds[type as keyof typeof ponderacionesIds]
      
      if (existingId) {
        // Actualizar ponderación existente
        await CourseService.updateGradingScheme(existingId, gradingSchemeData)
        toast.success('Ponderación actualizada correctamente')
      } else {
        // Crear nueva ponderación
        await CourseService.createGradingScheme(gradingSchemeData)
        toast.success('Ponderación creada correctamente')
        
        // Recargar las ponderaciones para obtener los IDs actualizados
        await reloadPonderacionesAfterCreate()
      }
      
      // Notificar al componente padre que las ponderaciones han cambiado
      if (onPonderacionesChange) {
        onPonderacionesChange()
      }
      
    } catch (error) {
      console.error('Error al guardar la ponderación:', error)
      toast.error('Error al guardar la ponderación')
    }
  }

  // Recargar ponderaciones después de crear nuevas
  const reloadPonderacionesAfterCreate = async () => {
    if (!courseGroup?.id) return
    
    try {
      // Recargar el courseGroup individual para obtener las ponderaciones actualizadas
      const updatedCourseGroup = await CourseService.getCourseGroupIndividual(courseGroup.id)
      
      // Usar las ponderaciones que vienen en el courseGroup actualizado
      const gradingschemes = updatedCourseGroup.coursesGroupsGradingschemes || []
      
      // Mapear las ponderaciones actualizadas
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
      console.error('Error al recargar las ponderaciones:', error)
      toast.error('Error al recargar los datos')
    }
  }

  // Cerrar modal y limpiar estados
  const handleClose = () => {
    setPonderacionesCurso(null)
    setPonderacionesIds({})
    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ponderaciones</DialogTitle>
          <DialogDescription>
            Estas son las ponderaciones del curso seleccionado.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p>Cargando ponderaciones...</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <table className="min-w-full w-full border border-gray-300 text-center">
              <thead>
                <tr className="bg-gradient-to-br from-[#bc4b26] to-[#d05f27] text-white">
                  <th className="px-6 py-3">Asistencia</th>
                  <th className="px-6 py-3">Actividades</th>
                  <th className="px-6 py-3">Evidencias</th>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Examen</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-lg">
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ponderacionesCurso?.asistencia ?? 0}
                          onChange={(e) => handlePonderacionChange('asistencia', Number(e.target.value))}
                          onKeyPress={(e) => handlePonderacionKeyPress('asistencia', Number(e.currentTarget.value), e)}
                          className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                        />
                        <span className="ml-1">%</span>
                      </div>
                      <Button
                        size="sm"
                        variant={ponderacionesIds.asistencia ? "outline" : "default"}
                        className={`h-6 px-2 text-xs ${ponderacionesIds.asistencia ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        onClick={() => handlePonderacionButtonClick('asistencia', ponderacionesCurso?.asistencia ?? 0)}
                      >
                        {ponderacionesIds.asistencia ? '✏️ Editar' : '➕ Agregar'}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ponderacionesCurso?.actividades ?? 0}
                          onChange={(e) => handlePonderacionChange('actividades', Number(e.target.value))}
                          onKeyPress={(e) => handlePonderacionKeyPress('actividades', Number(e.currentTarget.value), e)}
                          className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                        />
                        <span className="ml-1">%</span>
                      </div>
                      <Button
                        size="sm"
                        variant={ponderacionesIds.actividades ? "outline" : "default"}
                        className={`h-6 px-2 text-xs ${ponderacionesIds.actividades ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        onClick={() => handlePonderacionButtonClick('actividades', ponderacionesCurso?.actividades ?? 0)}
                      >
                        {ponderacionesIds.actividades ? '✏️ Editar' : '➕ Agregar'}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ponderacionesCurso?.evidencias ?? 0}
                          onChange={(e) => handlePonderacionChange('evidencias', Number(e.target.value))}
                          onKeyPress={(e) => handlePonderacionKeyPress('evidencias', Number(e.currentTarget.value), e)}
                          className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                        />
                        <span className="ml-1">%</span>
                      </div>
                      <Button
                        size="sm"
                        variant={ponderacionesIds.evidencias ? "outline" : "default"}
                        className={`h-6 px-2 text-xs ${ponderacionesIds.evidencias ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        onClick={() => handlePonderacionButtonClick('evidencias', ponderacionesCurso?.evidencias ?? 0)}
                      >
                        {ponderacionesIds.evidencias ? '✏️ Editar' : '➕ Agregar'}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ponderacionesCurso?.producto ?? 0}
                          onChange={(e) => handlePonderacionChange('producto', Number(e.target.value))}
                          onKeyPress={(e) => handlePonderacionKeyPress('producto', Number(e.currentTarget.value), e)}
                          className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                        />
                        <span className="ml-1">%</span>
                      </div>
                      <Button
                        size="sm"
                        variant={ponderacionesIds.producto ? "outline" : "default"}
                        className={`h-6 px-2 text-xs ${ponderacionesIds.producto ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        onClick={() => handlePonderacionButtonClick('producto', ponderacionesCurso?.producto ?? 0)}
                      >
                        {ponderacionesIds.producto ? '✏️ Editar' : '➕ Agregar'}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ponderacionesCurso?.examen ?? 0}
                          onChange={(e) => handlePonderacionChange('examen', Number(e.target.value))}
                          onKeyPress={(e) => handlePonderacionKeyPress('examen', Number(e.currentTarget.value), e)}
                          className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                        />
                        <span className="ml-1">%</span>
                      </div>
                      <Button
                        size="sm"
                        variant={ponderacionesIds.examen ? "outline" : "default"}
                        className={`h-6 px-2 text-xs ${ponderacionesIds.examen ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        onClick={() => handlePonderacionButtonClick('examen', ponderacionesCurso?.examen ?? 0)}
                      >
                        {ponderacionesIds.examen ? '✏️ Editar' : '➕ Agregar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
