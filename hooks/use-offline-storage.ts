'use client'

import { useState, useEffect, useCallback, act } from 'react'

interface OfflineData {
  id: string
  type: 'student' | 'teacher' | 'course' | 'group' | 'period' | 'attendance' | 'grade' | 'partial_grade' | 'final_grade'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem("currentUser");
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
    'Content-Type': 'application/json',
    'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
};

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState<OfflineData[]>([])

  // Verificar estado de conexión simplificado
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Verificar estado inicial
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cargar acciones pendientes del localStorage al iniciar
  useEffect(() => {
    const savedActions = localStorage.getItem('offlineActions')
    if (savedActions) {
      try {
        const actions = JSON.parse(savedActions)
        setPendingActions(actions)
      } catch (error) {
        console.error('Error al cargar acciones offline:', error)
        localStorage.removeItem('offlineActions')
      }
    }
  }, [])

  // Guardar acción offline
  const saveOfflineAction = useCallback((action: Omit<OfflineData, 'timestamp'>) => {
    const offlineAction: OfflineData = {
      ...action,
      timestamp: Date.now()
    }

    // Guardar en localStorage para persistencia
    const existing = JSON.parse(localStorage.getItem('offlineActions') || '[]')
    const updated = [...existing, offlineAction]
    localStorage.setItem('offlineActions', JSON.stringify(updated))
    
    setPendingActions(updated)
    console.log('Acción guardada offline:', offlineAction)
  }, [])

  // Verificar conectividad real al servidor
  const checkServerConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Intentar hacer una llamada simple al servidor
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

  // Sincronizar acciones cuando vuelve la conexión
  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return

    // Verificar conectividad real al servidor antes de sincronizar
    const serverAvailable = await checkServerConnectivity()
    if (!serverAvailable) {
      console.log('Servidor no disponible, manteniendo acciones offline')
      return
    }

    console.log('Sincronizando acciones offline...')
    
    for (const action of pendingActions) {
      try {
        console.log('Sincronizando:', action)
        
        // Hacer las llamadas reales a la API según el tipo de acción
        switch (action.type) {
          case 'student':
            const { studentService } = await import('@/lib/services/student.service')
            if (action.action === 'create') {
              await studentService.createStudent(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await studentService.updateStudent(id, updateData)
            } else if (action.action === 'delete') {
              await studentService.deleteStudent(action.data.id)
            }
            break
            
          case 'teacher':
            const { UserService } = await import('@/lib/services/user.service')
            if (action.action === 'create') {
              await UserService.create(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await UserService.update(id, updateData)
            } else if (action.action === 'delete') {
              await UserService.delete(action.data.id)
            }
            break
            
          case 'course':
            const { CourseService } = await import('@/lib/services/course.service')
            if (action.action === 'create') {
              await CourseService.create(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await CourseService.update(id, updateData)
            } else if (action.action === 'delete') {
              await CourseService.delete(action.data.id)
            }
            break
            
          case 'group':
            const { groupService } = await import('@/lib/services/group.service')
            if (action.action === 'create') {
              await groupService.createGroup(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await groupService.updateGroup(id, updateData)
            } else if (action.action === 'delete') {
              await groupService.deleteGroup(action.data.id)
            }
            break
            
          case 'period':
            const { periodService } = await import('@/lib/services/period.service')
            if (action.action === 'create') {
              await periodService.createPeriod(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await periodService.updatePeriod(id, updateData)
            } else if (action.action === 'delete') {
              await periodService.deletePeriod(action.data.id)
            }
            break
            
          case 'attendance':
            const { CourseService: courseService } = await import('@/lib/services/course.service')
            if (action.action === 'create') {
              await courseService.createAttendance(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await courseService.updateAttendance(id, updateData)
            } else if (action.action === 'delete') {
              await courseService.deleteAttendance(action.data.id)
            }
            break
            
          case 'grade':
            const { CourseService: gradeService } = await import('@/lib/services/course.service')
            if (action.action === 'create') {
              await gradeService.createPartialEvaluationGrade(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await gradeService.updatePartialEvaluationGrade(id, updateData)
            } else if (action.action === 'delete') {
              await gradeService.deletePartialEvaluationGrade(action.data.id)
            }
            break
            
          case 'partial_grade':
            const { CourseService: partialGradeService } = await import('@/lib/services/course.service')
            if (action.action === 'create') {
              await partialGradeService.createPartialGrade(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await partialGradeService.updatePartialGrade(id, updateData)
            } else if (action.action === 'delete') {
              await partialGradeService.deletePartialGrade(action.data.id)
            }
            break
            
          case 'final_grade':
            const { CourseService: finalGradeService } = await import('@/lib/services/course.service')
            if (action.action === 'create') {
              await finalGradeService.createFinalGrade(action.data)
            } else if (action.action === 'update') {
              const { id, ...updateData } = action.data
              await finalGradeService.updateFinalGrade(id, updateData)
            } else if (action.action === 'delete') {
              await finalGradeService.deleteFinalGrade(action.data.id)
            }
            break
        }
        
        console.log('Acción sincronizada exitosamente:', action)
        
      } catch (error) {
        console.error('Error al sincronizar acción:', action, error)
        // La acción permanece en la lista para reintentar
        return
      }
    }

    // Si todas las acciones se sincronizaron exitosamente, limpiar
    localStorage.removeItem('offlineActions')
    setPendingActions([])
    console.log('Todas las acciones sincronizadas exitosamente')
  }, [isOnline, pendingActions, checkServerConnectivity])

  // Intentar sincronizar cuando vuelve la conexión
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncOfflineActions()
    }
  }, [isOnline, pendingActions.length, syncOfflineActions])

  return {
    isOnline,
    pendingActions,
    saveOfflineAction,
    syncOfflineActions
  }
}

// Hook para manejar datos offline específicos
export function useOfflineData<T>(key: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData)

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem(`offline_${key}`)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setData(parsedData)
      } catch (error) {
        console.error(`Error al cargar datos offline para ${key}:`, error)
      }
    }
  }, [key])

  // Guardar datos en localStorage
  const saveData = useCallback((newData: T[]) => {
    setData(newData)
    localStorage.setItem(`offline_${key}`, JSON.stringify(newData))
  }, [key])

  // Agregar un elemento
  const addItem = useCallback((item: T) => {
    const newData = [...data, item]
    saveData(newData)
  }, [data, saveData])

  // Actualizar un elemento
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const newData = data.map(item => 
      (item as any).id === id ? { ...item, ...updates } : item
    )
    saveData(newData)
  }, [data, saveData])

  // Eliminar un elemento
  const removeItem = useCallback((id: string) => {
    const newData = data.filter(item => (item as any).id !== id)
    saveData(newData)
  }, [data, saveData])

  return {
    data,
    setData: saveData,
    addItem,
    updateItem,
    removeItem
  }
} 