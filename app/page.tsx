"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.rol === "administrador") {
          router.push("/admin/dashboard")
        } else {
          router.push("/maestro/dashboard")
        }
      } else {
        router.push("/auth/signin")
      }
    }
  }, [user, loading, router])

  // Mostrar pantalla de carga mientras se verifica la autenticación
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando sistema...</p>
      </div>
    </div>
  )
}
