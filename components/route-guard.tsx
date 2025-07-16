"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles: ("administrador" | "maestro")[]
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      // Si no hay usuario autenticado, redirigir al login
      if (!user) {
        router.push("/auth/signin")
        return
      }

      // Si el usuario no tiene el rol permitido, redirigir según su rol
      if (!allowedRoles.includes(user.role as "administrador" | "maestro")) {
        if (user.role === "administrador") {
          router.push("/admin/dashboard")
        } else if (user.role === "maestro") {
          router.push("/maestro/dashboard")
        } else {
          router.push("/auth/signin")
        }
        return
      }
    }
  }, [user, loading, allowedRoles, router, pathname])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Si no hay usuario o no tiene el rol correcto, no mostrar contenido
  if (!user || !allowedRoles.includes(user.role as "administrador" | "maestro")) {
    return null
  }

  return <>{children}</>
} 