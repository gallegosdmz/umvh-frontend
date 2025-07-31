'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { WifiOff } from 'lucide-react'
import { useOfflineStorage } from '@/hooks/use-offline-storage'

export function OfflineIndicator() {
  const { isOnline } = useOfflineStorage()

  // Solo mostrar el indicador cuando está offline
  // Las sincronizaciones se harán automáticamente cuando vuelva la conexión
  if (isOnline) {
    return null // No mostrar nada si está online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Modo offline:</strong> Los cambios se guardarán localmente y se sincronizarán automáticamente cuando regrese la conexión.
        </AlertDescription>
      </Alert>
    </div>
  )
} 