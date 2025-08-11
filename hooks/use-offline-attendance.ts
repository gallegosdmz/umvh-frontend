'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOfflineStorage } from './use-offline-storage'
import { toast } from 'react-toastify'

export interface OfflineAttendanceData {
  id?: number
  courseGroupStudentId: number
  date: string
  attend: number // 1=Presente, 2=Ausente, 3=Retardo
  partial: number // 1=Primer Parcial, 2=Segundo Parcial, 3=Tercer Parcial
  isOffline?: boolean
  offlineId?: string
  timestamp?: number
}

export function useOfflineAttendance() {
  const { isOnline, saveOfflineAction } = useOfflineStorage()
  const [offlineAttendances, setOfflineAttendances] = useState<OfflineAttendanceData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Cargar asistencias offline al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('offline_attendances')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setOfflineAttendances(parsed)
      } catch (error) {
        console.error('Error cargando asistencias offline:', error)
        localStorage.removeItem('offline_attendances')
      }
    }
  }, [])

  // Guardar asistencias en localStorage
  const saveOfflineAttendances = useCallback((attendances: OfflineAttendanceData[]) => {
    setOfflineAttendances(attendances)
    localStorage.setItem('offline_attendances', JSON.stringify(attendances))
  }, [])

  // Obtener asistencias offline por grupo, fecha y parcial
  const getOfflineAttendances = useCallback((
    courseGroupId: number, 
    date: string, 
    partial: number
  ): OfflineAttendanceData[] => {
    return offlineAttendances.filter(att => 
      att.courseGroupStudentId && 
      att.date === date && 
      att.partial === partial
    )
  }, [offlineAttendances])

  // Obtener asistencias offline por grupo
  const getOfflineAttendancesByGroup = useCallback((
    courseGroupId: number
  ): OfflineAttendanceData[] => {
    return offlineAttendances.filter(att => 
      att.courseGroupStudentId
    )
  }, [offlineAttendances])

  // Guardar asistencia offline
  const saveAttendanceOffline = useCallback(async (
    attendanceData: Omit<OfflineAttendanceData, 'isOffline' | 'offlineId' | 'timestamp'>
  ): Promise<OfflineAttendanceData> => {
    const offlineAttendance: OfflineAttendanceData = {
      ...attendanceData,
      isOffline: true,
      offlineId: `offline_${Date.now()}_${Math.random()}`,
      timestamp: Date.now()
    }

    // Agregar a la lista offline
    const updatedAttendances = [...offlineAttendances, offlineAttendance]
    saveOfflineAttendances(updatedAttendances)

    // Guardar acción para sincronización
    saveOfflineAction({
      id: offlineAttendance.offlineId!,
      type: 'attendance',
      action: attendanceData.id ? 'update' : 'create',
      data: attendanceData
    })

    console.log('Asistencia guardada offline:', offlineAttendance)
    return offlineAttendance
  }, [offlineAttendances, saveOfflineAttendances, saveOfflineAction])

  // Actualizar asistencia offline
  const updateAttendanceOffline = useCallback(async (
    attendanceId: number,
    attendanceData: Partial<OfflineAttendanceData>
  ): Promise<OfflineAttendanceData | null> => {
    const existingIndex = offlineAttendances.findIndex(att => att.id === attendanceId)
    
    if (existingIndex === -1) {
      console.error('Asistencia no encontrada para actualizar:', attendanceId)
      return null
    }

    const updatedAttendance: OfflineAttendanceData = {
      ...offlineAttendances[existingIndex],
      ...attendanceData,
      isOffline: true,
      timestamp: Date.now()
    }

    const updatedAttendances = [...offlineAttendances]
    updatedAttendances[existingIndex] = updatedAttendance
    saveOfflineAttendances(updatedAttendances)

    // Guardar acción para sincronización
    saveOfflineAction({
      id: attendanceId.toString(),
      type: 'attendance',
      action: 'update',
      data: updatedAttendance
    })

    console.log('Asistencia actualizada offline:', updatedAttendance)
    return updatedAttendance
  }, [offlineAttendances, saveOfflineAttendances, saveOfflineAction])

  // Eliminar asistencia offline
  const deleteAttendanceOffline = useCallback(async (
    attendanceId: number
  ): Promise<boolean> => {
    const existingIndex = offlineAttendances.findIndex(att => att.id === attendanceId)
    
    if (existingIndex === -1) {
      console.error('Asistencia no encontrada para eliminar:', attendanceId)
      return false
    }

    const attendanceToDelete = offlineAttendances[existingIndex]
    const updatedAttendances = offlineAttendances.filter(att => att.id !== attendanceId)
    saveOfflineAttendances(updatedAttendances)

    // Guardar acción para sincronización
    saveOfflineAction({
      id: attendanceId.toString(),
      type: 'attendance',
      action: 'delete',
      data: attendanceToDelete
    })

    console.log('Asistencia eliminada offline:', attendanceId)
    return true
  }, [offlineAttendances, saveOfflineAttendances, saveOfflineAction])

  // Sincronizar asistencias offline cuando hay conexión
  const syncOfflineAttendances = useCallback(async (
    syncFunction: (attendance: OfflineAttendanceData) => Promise<any>
  ) => {
    if (!isOnline || offlineAttendances.length === 0) return

    setIsLoading(true)
    const syncedAttendances: OfflineAttendanceData[] = []
    const failedAttendances: OfflineAttendanceData[] = []

    for (const attendance of offlineAttendances) {
      try {
        if (attendance.isOffline) {
          await syncFunction(attendance)
          syncedAttendances.push(attendance)
          console.log('Asistencia sincronizada:', attendance)
        }
      } catch (error) {
        console.error('Error sincronizando asistencia:', attendance, error)
        failedAttendances.push(attendance)
      }
    }

    // Remover asistencias sincronizadas exitosamente
    if (syncedAttendances.length > 0) {
      const remainingAttendances = offlineAttendances.filter(att => 
        !syncedAttendances.some(synced => synced.offlineId === att.offlineId)
      )
      saveOfflineAttendances(remainingAttendances)
      
      toast.success(`${syncedAttendances.length} asistencias sincronizadas exitosamente`)
    }

    if (failedAttendances.length > 0) {
      toast.warning(`${failedAttendances.length} asistencias no se pudieron sincronizar`)
    }

    setIsLoading(false)
  }, [isOnline, offlineAttendances, saveOfflineAttendances])

  // Limpiar asistencias offline antiguas (más de 30 días)
  const cleanupOldOfflineAttendances = useCallback(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentAttendances = offlineAttendances.filter(att => 
      att.timestamp && att.timestamp > thirtyDaysAgo
    )
    
    if (recentAttendances.length !== offlineAttendances.length) {
      saveOfflineAttendances(recentAttendances)
      console.log('Asistencias offline antiguas limpiadas')
    }
  }, [offlineAttendances, saveOfflineAttendances])

  // Limpiar asistencias offline antiguas cada día
  useEffect(() => {
    const interval = setInterval(cleanupOldOfflineAttendances, 24 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cleanupOldOfflineAttendances])

  return {
    isOnline,
    isLoading,
    offlineAttendances,
    getOfflineAttendances,
    getOfflineAttendancesByGroup,
    saveAttendanceOffline,
    updateAttendanceOffline,
    deleteAttendanceOffline,
    syncOfflineAttendances,
    cleanupOldOfflineAttendances
  }
}
