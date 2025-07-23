'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStudent } from '@/lib/hooks/useStudent'
import { useOfflineStorage } from './use-offline-storage'
import { Student } from '@/lib/mock-data'
import { toast } from 'react-toastify'

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem('currentUser');
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
      'Content-Type': 'application/json',
      'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
}

export function useOfflineStudent() {
  const {
    loading: studentLoading,
    error: studentError,
    totalItems: studentTotalItems,
    handleGetStudents,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteStudent
  } = useStudent()

  const { isOnline, saveOfflineAction, syncOfflineActions } = useOfflineStorage()
  const [offlineStudents, setOfflineStudents] = useState<Student[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar estudiantes offline al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('offline_students')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setOfflineStudents(parsed)
        setStudents(parsed)
      } catch (error) {
        console.error('Error cargando estudiantes offline:', error)
      }
    }
  }, [])

  // Verificar conectividad real al servidor
  const checkServerConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://uamvh.cloud'}/students`, {
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

  // Combinar datos online y offline
  const getCombinedStudents = useCallback(async () => {
    setLoading(true)
    try {
      if (isOnline) {
        // Verificar conectividad real al servidor
        const serverAvailable = await checkServerConnectivity()
        if (serverAvailable) {
          // Solo intentar cargar del servidor si está disponible
          const onlineStudents = await handleGetStudents()
          if (Array.isArray(onlineStudents)) {
            setStudents(onlineStudents)
            // Guardar en localStorage para uso offline
            localStorage.setItem('offline_students', JSON.stringify(onlineStudents))
            setOfflineStudents(onlineStudents)
          }
        } else {
          // Servidor no disponible, usar datos offline
          console.log('Servidor no disponible, usando datos offline')
          setStudents(offlineStudents)
        }
      } else {
        // Usar datos offline sin hacer llamadas al servidor
        console.log('Modo offline: usando datos locales')
        setStudents(offlineStudents)
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
      // En caso de error, usar datos offline
      setStudents(offlineStudents)
    } finally {
      setLoading(false)
    }
  }, [isOnline, handleGetStudents, offlineStudents, checkServerConnectivity])

  // Crear estudiante con soporte offline
  const createStudent = useCallback(async (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now() // Usar timestamp como ID temporal
    }

    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await handleCreateStudent(studentData)
          toast.success('Estudiante creado exitosamente')
          await getCombinedStudents()
        } catch (error) {
          console.error('Error creando estudiante online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: newStudent.id!.toString(),
            type: 'student',
            action: 'create',
            data: studentData
          })
          
          // Agregar a lista local
          const updatedStudents = [...students, newStudent]
          setStudents(updatedStudents)
          setOfflineStudents(updatedStudents)
          localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
          
          toast.info('Estudiante guardado offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: newStudent.id!.toString(),
          type: 'student',
          action: 'create',
          data: studentData
        })
        
        // Agregar a lista local
        const updatedStudents = [...students, newStudent]
        setStudents(updatedStudents)
        setOfflineStudents(updatedStudents)
        localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
        
        toast.info('Estudiante guardado offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: newStudent.id!.toString(),
        type: 'student',
        action: 'create',
        data: studentData
      })
      
      // Agregar a lista local
      const updatedStudents = [...students, newStudent]
      setStudents(updatedStudents)
      setOfflineStudents(updatedStudents)
      localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
      
      toast.info('Estudiante guardado offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleCreateStudent, students, saveOfflineAction, getCombinedStudents, checkServerConnectivity])

  // Actualizar estudiante con soporte offline
  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await handleUpdateStudent(id, updates)
          toast.success('Estudiante actualizado exitosamente')
          await getCombinedStudents()
        } catch (error) {
          console.error('Error actualizando estudiante online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id,
            type: 'student',
            action: 'update',
            data: { id, ...updates }
          })
          
          // Actualizar lista local
          const updatedStudents = students.map(student => 
            student.id?.toString() === id ? { ...student, ...updates } : student
          )
          setStudents(updatedStudents)
          setOfflineStudents(updatedStudents)
          localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
          
          toast.info('Cambios guardados offline. Se sincronizarán cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id,
          type: 'student',
          action: 'update',
          data: { id, ...updates }
        })
        
        // Actualizar lista local
        const updatedStudents = students.map(student => 
          student.id?.toString() === id ? { ...student, ...updates } : student
        )
        setStudents(updatedStudents)
        setOfflineStudents(updatedStudents)
        localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
        
        toast.info('Cambios guardados offline. Se sincronizarán cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id,
        type: 'student',
        action: 'update',
        data: { id, ...updates }
      })
      
      // Actualizar lista local
      const updatedStudents = students.map(student => 
        student.id?.toString() === id ? { ...student, ...updates } : student
      )
      setStudents(updatedStudents)
      setOfflineStudents(updatedStudents)
      localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
      
      toast.info('Cambios guardados offline. Se sincronizarán cuando haya conexión.')
    }
  }, [isOnline, handleUpdateStudent, students, saveOfflineAction, getCombinedStudents, checkServerConnectivity])

  // Eliminar estudiante con soporte offline
  const deleteStudent = useCallback(async (id: string) => {
    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await handleDeleteStudent(id)
          toast.success('Estudiante eliminado exitosamente')
          await getCombinedStudents()
        } catch (error) {
          console.error('Error eliminando estudiante online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id,
            type: 'student',
            action: 'delete',
            data: { id }
          })
          
          // Actualizar lista local
          const updatedStudents = students.filter(student => student.id?.toString() !== id)
          setStudents(updatedStudents)
          setOfflineStudents(updatedStudents)
          localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
          
          toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id,
          type: 'student',
          action: 'delete',
          data: { id }
        })
        
        // Actualizar lista local
        const updatedStudents = students.filter(student => student.id?.toString() !== id)
        setStudents(updatedStudents)
        setOfflineStudents(updatedStudents)
        localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
        
        toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id,
        type: 'student',
        action: 'delete',
        data: { id }
      })
      
      // Actualizar lista local
      const updatedStudents = students.filter(student => student.id?.toString() !== id)
      setStudents(updatedStudents)
      setOfflineStudents(updatedStudents)
      localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
      
      toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleDeleteStudent, students, saveOfflineAction, getCombinedStudents, checkServerConnectivity])

  // Sincronizar acciones offline cuando vuelve la conexión
  useEffect(() => {
    if (isOnline) {
      syncOfflineActions()
    }
  }, [isOnline, syncOfflineActions])

  return {
    students,
    loading: loading || studentLoading,
    error: studentError,
    totalItems: students.length, // Usar la longitud del estado local en lugar de studentTotalItems
    isOnline,
    getCombinedStudents,
    createStudent,
    updateStudent,
    deleteStudent
  }
} 