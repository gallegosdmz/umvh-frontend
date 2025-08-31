'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOfflineStorage } from './use-offline-storage'
import { CourseService } from '@/lib/services/course.service'
import { toast } from 'react-toastify'

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem('currentUser');
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
      'Content-Type': 'application/json',
      'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
}

interface GradeData {
  id: number | null;
  grade: number;
  partialEvaluationId: number;
  courseGroupStudentId: number;
}

interface PartialGradeData {
  id: number | null;
  partial: number;
  grade: number;
  date: string;
  courseGroupStudentId: number;
}

interface FinalGradeData {
  id: number | null;
  grade: number;
  gradeOrdinary: number;
  gradeExtraordinary: number;
  date: string;
  type: string;
  courseGroupStudentId: number;
}

export function useOfflineGrades() {
  const { isOnline, saveOfflineAction, syncOfflineActions } = useOfflineStorage()
  const [offlineGrades, setOfflineGrades] = useState<{[key: number]: GradeData[]}>({})
  const [offlinePartialGrades, setOfflinePartialGrades] = useState<{[key: number]: PartialGradeData}>({})
  const [offlineFinalGrades, setOfflineFinalGrades] = useState<{[key: number]: FinalGradeData}>({})
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const lastLoadRef = useRef<{ courseGroupId?: number; timestamp: number }>({ timestamp: 0 })

  // Cargar calificaciones offline al inicializar
  useEffect(() => {
    const savedGrades = localStorage.getItem('offline_grades')
    const savedPartialGrades = localStorage.getItem('offline_partial_grades')
    const savedFinalGrades = localStorage.getItem('offline_final_grades')
    
    if (savedGrades) {
      try {
        const parsed = JSON.parse(savedGrades)
        setOfflineGrades(parsed)
      } catch (error) {
        console.error('Error cargando calificaciones offline:', error)
      }
    }
    
    if (savedPartialGrades) {
      try {
        const parsed = JSON.parse(savedPartialGrades)
        setOfflinePartialGrades(parsed)
      } catch (error) {
        console.error('Error cargando calificaciones parciales offline:', error)
      }
    }
    
    if (savedFinalGrades) {
      try {
        const parsed = JSON.parse(savedFinalGrades)
        setOfflineFinalGrades(parsed)
      } catch (error) {
        console.error('Error cargando calificaciones finales offline:', error)
      }
    }
    
    setIsInitialized(true)
  }, [])

  // Verificar conectividad real al servidor
  const checkServerConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://uamvh.cloud'}/students?limit=1`, {
        method: 'HEAD',
        headers: getAuthHeaders(),
        cache: 'no-cache'
      })
      return response.ok
    } catch (error) {
      console.log('Servidor no disponible:', error)
      return false
    }
  }, [])

  // Guardar calificación de actividad/evidencia/producto/examen
  const saveGrade = useCallback(async (gradeData: Omit<GradeData, 'id'>) => {
    const newGrade: GradeData = {
      ...gradeData,
      id: Date.now() // ID temporal
    }

    if (isOnline) {
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          // Crear nueva calificación
          const result = await CourseService.createPartialEvaluationGrade(gradeData)
          toast.success('Calificación guardada exitosamente')
          return result
        } catch (error) {
          console.error('Error guardando calificación online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: newGrade.id!.toString(),
            type: 'grade',
            action: 'create',
            data: gradeData
          })
          
          // Agregar a lista local
          const updatedGrades = { ...offlineGrades }
          if (!updatedGrades[gradeData.courseGroupStudentId]) {
            updatedGrades[gradeData.courseGroupStudentId] = []
          }
          updatedGrades[gradeData.courseGroupStudentId].push(newGrade)
          setOfflineGrades(updatedGrades)
          localStorage.setItem('offline_grades', JSON.stringify(updatedGrades))
          
          toast.info('Calificación guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: newGrade.id!.toString(),
          type: 'grade',
          action: 'create',
          data: gradeData
        })
        
        // Agregar a lista local
        const updatedGrades = { ...offlineGrades }
        if (!updatedGrades[gradeData.courseGroupStudentId]) {
          updatedGrades[gradeData.courseGroupStudentId] = []
        }
        updatedGrades[gradeData.courseGroupStudentId].push(newGrade)
        setOfflineGrades(updatedGrades)
        localStorage.setItem('offline_grades', JSON.stringify(updatedGrades))
        
        toast.info('Calificación guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: newGrade.id!.toString(),
        type: 'grade',
        action: 'create',
        data: gradeData
      })
      
      // Agregar a lista local
      const updatedGrades = { ...offlineGrades }
      if (!updatedGrades[gradeData.courseGroupStudentId]) {
        updatedGrades[gradeData.courseGroupStudentId] = []
      }
      updatedGrades[gradeData.courseGroupStudentId].push(newGrade)
      setOfflineGrades(updatedGrades)
      localStorage.setItem('offline_grades', JSON.stringify(updatedGrades))
      
      toast.info('Calificación guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, saveOfflineAction, offlineGrades, checkServerConnectivity])

  // Actualizar calificación existente
  const updateGrade = useCallback(async (id: number, gradeData: Omit<GradeData, 'id'>) => {
    if (isOnline) {
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await CourseService.updatePartialEvaluationGrade(id, gradeData)
          toast.success('Calificación actualizada exitosamente')
        } catch (error) {
          console.error('Error actualizando calificación online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: id.toString(),
            type: 'grade',
            action: 'update',
            data: { id, ...gradeData }
          })
          
          toast.info('Actualización guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: id.toString(),
          type: 'grade',
          action: 'update',
          data: { id, ...gradeData }
        })
        
        toast.info('Actualización guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: id.toString(),
        type: 'grade',
        action: 'update',
        data: { id, ...gradeData }
      })
      
      toast.info('Actualización guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, saveOfflineAction, checkServerConnectivity])

  // Guardar calificación parcial
  const savePartialGrade = useCallback(async (partialGradeData: Omit<PartialGradeData, 'id'>) => {
    const newPartialGrade: PartialGradeData = {
      ...partialGradeData,
      id: Date.now() // ID temporal
    }

    if (isOnline) {
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          if (partialGradeData.id) {
            // Actualizar calificación parcial existente
            await CourseService.updatePartialGrade(partialGradeData.id, partialGradeData)
            toast.success('Calificación parcial actualizada exitosamente')
          } else {
            // Crear nueva calificación parcial
            const result = await CourseService.createPartialGrade(partialGradeData)
            toast.success('Calificación parcial guardada exitosamente')
            return result
          }
        } catch (error) {
          console.error('Error guardando calificación parcial online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: newPartialGrade.id!.toString(),
            type: 'partial_grade',
            action: 'create',
            data: partialGradeData
          })
          
          // Agregar a lista local
          const updatedPartialGrades = { ...offlinePartialGrades }
          updatedPartialGrades[partialGradeData.courseGroupStudentId] = newPartialGrade
          setOfflinePartialGrades(updatedPartialGrades)
          localStorage.setItem('offline_partial_grades', JSON.stringify(updatedPartialGrades))
          
          toast.info('Calificación parcial guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: newPartialGrade.id!.toString(),
          type: 'partial_grade',
          action: 'create',
          data: partialGradeData
        })
        
        // Agregar a lista local
        const updatedPartialGrades = { ...offlinePartialGrades }
        updatedPartialGrades[partialGradeData.courseGroupStudentId] = newPartialGrade
        setOfflinePartialGrades(updatedPartialGrades)
        localStorage.setItem('offline_partial_grades', JSON.stringify(updatedPartialGrades))
        
        toast.info('Calificación parcial guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: newPartialGrade.id!.toString(),
        type: 'partial_grade',
        action: 'create',
        data: partialGradeData
      })
      
      // Agregar a lista local
      const updatedPartialGrades = { ...offlinePartialGrades }
      updatedPartialGrades[partialGradeData.courseGroupStudentId] = newPartialGrade
      setOfflinePartialGrades(updatedPartialGrades)
      localStorage.setItem('offline_partial_grades', JSON.stringify(updatedPartialGrades))
      
      toast.info('Calificación parcial guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, saveOfflineAction, offlinePartialGrades, checkServerConnectivity])

  // Guardar calificación final
  const saveFinalGrade = useCallback(async (finalGradeData: Omit<FinalGradeData, 'id'>) => {
    const newFinalGrade: FinalGradeData = {
      ...finalGradeData,
      id: Date.now() // ID temporal
    }

    if (isOnline) {
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          if (finalGradeData.id) {
            // Actualizar calificación final existente
            await CourseService.updateFinalGrade(finalGradeData.id, finalGradeData)
            toast.success('Calificación final actualizada exitosamente')
          } else {
            // Crear nueva calificación final
            const result = await CourseService.createFinalGrade(finalGradeData)
            toast.success('Calificación final guardada exitosamente')
            return result
          }
        } catch (error) {
          console.error('Error guardando calificación final online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: newFinalGrade.id!.toString(),
            type: 'final_grade',
            action: 'create',
            data: finalGradeData
          })
          
          // Agregar a lista local
          const updatedFinalGrades = { ...offlineFinalGrades }
          updatedFinalGrades[finalGradeData.courseGroupStudentId] = newFinalGrade
          setOfflineFinalGrades(updatedFinalGrades)
          localStorage.setItem('offline_final_grades', JSON.stringify(updatedFinalGrades))
          
          toast.info('Calificación final guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: newFinalGrade.id!.toString(),
          type: 'final_grade',
          action: 'create',
          data: finalGradeData
        })
        
        // Agregar a lista local
        const updatedFinalGrades = { ...offlineFinalGrades }
        updatedFinalGrades[finalGradeData.courseGroupStudentId] = newFinalGrade
        setOfflineFinalGrades(updatedFinalGrades)
        localStorage.setItem('offline_final_grades', JSON.stringify(updatedFinalGrades))
        
        toast.info('Calificación final guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: newFinalGrade.id!.toString(),
        type: 'final_grade',
        action: 'create',
        data: finalGradeData
      })
      
      // Agregar a lista local
      const updatedFinalGrades = { ...offlineFinalGrades }
      updatedFinalGrades[finalGradeData.courseGroupStudentId] = newFinalGrade
      setOfflineFinalGrades(updatedFinalGrades)
      localStorage.setItem('offline_final_grades', JSON.stringify(updatedFinalGrades))
      
      toast.info('Calificación final guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, saveOfflineAction, offlineFinalGrades, checkServerConnectivity])

  // Obtener calificaciones offline para un estudiante
  const getOfflineGrades = useCallback((courseGroupStudentId: number): GradeData[] => {
    return offlineGrades[courseGroupStudentId] || []
  }, [offlineGrades])

  // Obtener calificación parcial offline para un estudiante
  const getOfflinePartialGrade = useCallback((courseGroupStudentId: number): PartialGradeData | null => {
    return offlinePartialGrades[courseGroupStudentId] || null
  }, [offlinePartialGrades])

  // Obtener calificación final offline para un estudiante
  const getOfflineFinalGrade = useCallback((courseGroupStudentId: number): FinalGradeData | null => {
    return offlineFinalGrades[courseGroupStudentId] || null
  }, [offlineFinalGrades])

  // Sincronizar acciones offline cuando vuelve la conexión
  useEffect(() => {
    if (isOnline) {
      syncOfflineActions()
    }
  }, [isOnline, syncOfflineActions])

  return {
    isOnline,
    loading,
    saveGrade,
    updateGrade,
    savePartialGrade,
    saveFinalGrade,
    getOfflineGrades,
    getOfflinePartialGrade,
    getOfflineFinalGrade,
    offlineGrades,
    offlinePartialGrades,
    offlineFinalGrades
  }
}
