'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePeriod } from '@/lib/hooks/usePeriod'
import { useOfflineStorage } from './use-offline-storage'
import { Period } from '@/lib/mock-data'
import { toast } from 'react-toastify'

export function useOfflinePeriod() {
  const {
    loading: periodLoading,
    error: periodError,
    handleGetPeriods
  } = usePeriod()

  const { isOnline } = useOfflineStorage()
  const [offlinePeriods, setOfflinePeriods] = useState<Period[]>([])
  const [periods, setPeriods] = useState<Period[]>([])

  // Cargar períodos offline al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('offline_periods')
    if (saved) {
      const parsed = JSON.parse(saved)
      setOfflinePeriods(parsed)
      setPeriods(parsed)
    }
  }, [])

  // Combinar datos online y offline
  const getCombinedPeriods = useCallback(async () => {
    try {
      if (isOnline) {
        const onlinePeriods = await handleGetPeriods()
        if (Array.isArray(onlinePeriods)) {
          setPeriods(onlinePeriods)
          // Guardar en localStorage para uso offline
          localStorage.setItem('offline_periods', JSON.stringify(onlinePeriods))
          setOfflinePeriods(onlinePeriods)
        }
      } else {
        // Usar datos offline
        setPeriods(offlinePeriods)
      }
    } catch (error) {
      console.error('Error cargando períodos:', error)
      // En caso de error de red, forzar modo offline
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Error de red detectado, usando datos offline')
      }
      // Usar datos offline
      setPeriods(offlinePeriods)
    }
  }, [isOnline, handleGetPeriods, offlinePeriods])

  return {
    loading: periodLoading,
    error: periodError,
    periods,
    getCombinedPeriods,
    isOnline
  }
} 