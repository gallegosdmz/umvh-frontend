'use client'

import { useState, useEffect, useCallback } from 'react'

interface OfflineData {
  id: string
  type: 'student' | 'teacher' | 'course' | 'group' | 'period'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState<OfflineData[]>([])

  // Verificar estado de conexión
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
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
  }, [])

  // Sincronizar acciones cuando vuelve la conexión
  const syncOfflineActions = useCallback(async () => {
    if (!isOnline) return

    const actions = JSON.parse(localStorage.getItem('offlineActions') || '[]')
    if (actions.length === 0) return

    try {
      // Aquí implementarías la lógica para sincronizar con el servidor
      // Por ahora solo simulamos la sincronización
      console.log('Sincronizando acciones offline:', actions)
      
      // Limpiar acciones después de sincronizar
      localStorage.removeItem('offlineActions')
      setPendingActions([])
    } catch (error) {
      console.error('Error sincronizando acciones offline:', error)
    }
  }, [isOnline])

  // Cargar acciones pendientes al inicializar
  useEffect(() => {
    const actions = JSON.parse(localStorage.getItem('offlineActions') || '[]')
    setPendingActions(actions)
  }, [])

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

// Hook para manejar datos específicos offline
export function useOfflineData<T>(key: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData)

  // Cargar datos del localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`offline_${key}`)
    if (saved) {
      setData(JSON.parse(saved))
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
    addItem,
    updateItem,
    removeItem,
    saveData
  }
} 