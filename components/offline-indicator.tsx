'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react'
import { useOfflineStorage } from '@/hooks/use-offline-storage'

export function OfflineIndicator() {
  const { isOnline, pendingActions, syncOfflineActions } = useOfflineStorage()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncOfflineActions()
    } catch (error) {
      console.error('Error en sincronización manual:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isOnline && pendingActions.length === 0) {
    return null // No mostrar nada si está online y no hay acciones pendientes
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {!isOnline && (
        <Alert className="border-orange-200 bg-orange-50 mb-2">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Modo offline:</strong> Los cambios se guardarán localmente.
          </AlertDescription>
        </Alert>
      )}
      
      {pendingActions.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>{pendingActions.length} acción(es) pendiente(s)</strong>
                <p className="text-sm mt-1">
                  {isOnline 
                    ? 'Se sincronizarán automáticamente' 
                    : 'Se sincronizarán cuando haya conexión'
                  }
                </p>
              </div>
              {isOnline && (
                <Button 
                  size="sm" 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="ml-2"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 