'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react'

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)

  useEffect(() => {
    // Verificar si la PWA está instalada
    const checkPWAInstallation = () => {
      if (typeof window !== 'undefined') {
        // Verificar si se ejecuta en modo standalone (PWA instalada)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        setIsPWAInstalled(isStandalone)
      }
    }

    // Verificar estado de conexión
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Eventos para detectar cambios de conexión
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Verificar estado inicial
    updateOnlineStatus()
    checkPWAInstallation()

    // Verificar periódicamente si la PWA se instaló
    const interval = setInterval(checkPWAInstallation, 5000)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  if (isOnline && isPWAInstalled) {
    return null // No mostrar nada si está online y la PWA está instalada
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {!isOnline && (
        <Alert className="border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Modo offline:</strong> Algunas funciones pueden no estar disponibles sin conexión a internet.
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && !isPWAInstalled && (
        <Alert className="border-blue-200 bg-blue-50">
          <Wifi className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Consejo:</strong> Instala esta aplicación para mejor experiencia offline.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Hook para manejar el estado offline en otros componentes
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)

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

  return { isOnline }
} 