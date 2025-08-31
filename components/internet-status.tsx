'use client'

import { useRealInternet } from '@/hooks/use-real-internet'
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function InternetStatus() {
  const isOnline = useRealInternet()
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [showReconnectAlert, setShowReconnectAlert] = useState(false)

  useEffect(() => {
    if (!isOnline && !showOfflineAlert) {
      // Mostrar alerta de sin conexión
      setShowOfflineAlert(true)
      setShowReconnectAlert(false)
    } else if (isOnline && showOfflineAlert) {
      // Ocultar alerta de sin conexión y mostrar alerta de reconexión
      setShowOfflineAlert(false)
      setShowReconnectAlert(true)
      
      // Ocultar alerta de reconexión después de 3 segundos
      setTimeout(() => {
        setShowReconnectAlert(false)
      }, 3000)
    }
  }, [isOnline, showOfflineAlert])

  return (
    <>
      {/* Indicador de estado de conexión */}
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">En línea</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Sin conexión</span>
          </>
        )}
      </div>

      {/* Alerta fija de sin conexión */}
      {showOfflineAlert && (
        <div className="fixed bottom-4 left-4 z-[60] bg-red-600 text-white p-4 rounded-lg shadow-2xl max-w-sm border-2 border-red-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-200 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-1">¡Sin conexión a Internet!</h3>
              <p className="text-xs text-red-100">
                No tienes internet. <strong>No cierres las ventanas</strong> para que se guarden tus cambios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta temporal de reconexión */}
      {showReconnectAlert && (
        <div className="fixed bottom-4 left-4 z-[60] bg-green-600 text-white p-4 rounded-lg shadow-2xl max-w-sm border-2 border-green-700 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-200 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-1">¡Internet reconectado!</h3>
              <p className="text-xs text-green-100">
                Tu conexión ha sido restaurada exitosamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
