'use client'

import { useState, useEffect } from 'react'

export function useRealInternet() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let isChecking = false

    const checkInternet = async () => {
      if (isChecking) return
      isChecking = true

      try {
        // Intentar múltiples servidores para mayor precisión
        const servers = [
          'https://www.google.com/favicon.ico',
          'https://www.cloudflare.com/favicon.ico',
          'https://httpbin.org/status/200'
        ]

        let hasInternet = false
        
        for (const server of servers) {
          try {
            const response = await fetch(server, {
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-cache',
              signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
            })
            
            hasInternet = true
            break
          } catch (error) {
            continue
          }
        }

        if (hasInternet && !isOnline) {
          setIsOnline(true)
        } else if (!hasInternet && isOnline) {
          setIsOnline(false)
        }
      } catch (error) {
        if (isOnline) {
          setIsOnline(false)
        }
      } finally {
        isChecking = false
      }
    }

    // Verificar cada 2 segundos para mayor responsividad
    intervalId = setInterval(checkInternet, 2000)
    
    // Verificar inmediatamente al cargar
    checkInternet()

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOnline])

  return isOnline
}
