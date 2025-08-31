'use client'

import { useEffect } from 'react'

export function useSimpleConnection() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Conexión a internet RESTAURADA')
    }

    const handleOffline = () => {
      console.log('❌ Conexión a internet PERDIDA')
    }

    // Detectar cambios inmediatos
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Verificar estado inicial
    if (navigator.onLine) {
      console.log('✅ Conexión a internet ACTIVA')
    } else {
      console.log('❌ Conexión a internet INACTIVA')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
}
