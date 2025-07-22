'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react'
import { offlineSyncService } from '@/lib/services/offline-sync.service'

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(offlineSyncService.getOnlineStatus())
      setPendingActions(offlineSyncService.getPendingActions().length)
    }

    // Actualizar estado inicial
    updateStatus()

    // Actualizar cada 5 segundos
    const interval = setInterval(updateStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleForceSync = async () => {
    setIsSyncing(true)
    try {
      await offlineSyncService.forceSync()
      setLastSync(new Date())
      setPendingActions(offlineSyncService.getPendingActions().length)
    } catch (error) {
      console.error('Error en sincronización forzada:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // No mostrar si no hay acciones pendientes y está online
  if (pendingActions === 0 && isOnline) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Alert className="border-gray-200 bg-white shadow-lg max-w-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <div>
              <AlertDescription className="text-sm">
                <strong>
                  {isOnline ? 'Conectado' : 'Sin conexión'}
                </strong>
              </AlertDescription>
              {pendingActions > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {pendingActions} pendiente{pendingActions !== 1 ? 's' : ''}
                  </Badge>
                  {isSyncing && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                  )}
                </div>
              )}
              {lastSync && (
                <div className="text-xs text-gray-500 mt-1">
                  Última sincronización: {lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          {pendingActions > 0 && isOnline && (
            <Button
              onClick={handleForceSync}
              size="sm"
              disabled={isSyncing}
              className="ml-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}

// Componente más simple para mostrar solo el badge de estado
export function SyncBadge() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState(0)

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(offlineSyncService.getOnlineStatus())
      setPendingActions(offlineSyncService.getPendingActions().length)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  if (pendingActions === 0 && isOnline) {
    return null
  }

  return (
    <div className="flex items-center space-x-1">
      {isOnline ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-600" />
      )}
      {pendingActions > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pendingActions}
        </Badge>
      )}
    </div>
  )
} 