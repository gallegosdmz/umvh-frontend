'use client'

import { useState, useEffect } from 'react'

export function useInternetConnection() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (online) {
        console.log('✅ Conexión a internet RESTAURADA')
      } else {
        console.log('❌ Conexión a internet PERDIDA')
      }
    }

    // Detectar cambios inmediatos en el estado de conexión
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Verificar estado inicial
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return isOnline
}
