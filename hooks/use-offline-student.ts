'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStudent } from '@/lib/hooks/useStudent'
import { useOfflineStorage } from './use-offline-storage'
import { Student } from '@/lib/mock-data'
import { toast } from 'react-toastify'

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

  const { isOnline, saveOfflineAction } = useOfflineStorage()
  const [offlineStudents, setOfflineStudents] = useState<Student[]>([])
  const [students, setStudents] = useState<Student[]>([])

  // Cargar estudiantes offline al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('offline_students')
    if (saved) {
      const parsed = JSON.parse(saved)
      setOfflineStudents(parsed)
      setStudents(parsed)
    }
  }, [])

  // Combinar datos online y offline
  const getCombinedStudents = useCallback(async () => {
    try {
      if (isOnline) {
        const onlineStudents = await handleGetStudents()
        if (Array.isArray(onlineStudents)) {
          setStudents(onlineStudents)
          // Guardar en localStorage para uso offline
          localStorage.setItem('offline_students', JSON.stringify(onlineStudents))
          setOfflineStudents(onlineStudents)
        }
      } else {
        // Usar datos offline
        setStudents(offlineStudents)
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
      // En caso de error, usar datos offline
      setStudents(offlineStudents)
    }
  }, [isOnline, handleGetStudents, offlineStudents])

  // Crear estudiante con soporte offline
  const createStudent = useCallback(async (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now() // Usar timestamp como ID temporal
    }

    if (isOnline) {
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
      // Guardar offline
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
  }, [isOnline, handleCreateStudent, students, saveOfflineAction, getCombinedStudents])

  // Actualizar estudiante con soporte offline
  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    if (isOnline) {
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
      // Guardar offline
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
  }, [isOnline, handleUpdateStudent, students, saveOfflineAction, getCombinedStudents])

  // Eliminar estudiante con soporte offline
  const deleteStudent = useCallback(async (id: string) => {
    if (isOnline) {
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
        
        // Remover de lista local
        const updatedStudents = students.filter(student => student.id?.toString() !== id)
        setStudents(updatedStudents)
        setOfflineStudents(updatedStudents)
        localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
        
        toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline
      saveOfflineAction({
        id,
        type: 'student',
        action: 'delete',
        data: { id }
      })
      
      // Remover de lista local
      const updatedStudents = students.filter(student => student.id?.toString() !== id)
      setStudents(updatedStudents)
      setOfflineStudents(updatedStudents)
      localStorage.setItem('offline_students', JSON.stringify(updatedStudents))
      
      toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleDeleteStudent, students, saveOfflineAction, getCombinedStudents])

  return {
    // Estados
    students,
    loading: studentLoading,
    error: studentError,
    totalItems: studentTotalItems,
    isOnline,
    
    // Métodos
    getStudents: getCombinedStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    
    // Métodos originales para compatibilidad
    handleGetStudents,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteStudent
  }
} 