"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const success = await login(email, password)

      if (success) {
        // Redirigir según el rol del usuario
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
        if (user.role === "administrador") {
          router.push("/admin/dashboard")
        } else {
          router.push("/maestro/dashboard")
        }
      } else {
        setError("Credenciales inválidas. Verifica tu email y contraseña.")
      }
    } catch (error) {
      console.log(error);
      setError("Error al iniciar sesión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (role: "admin" | "maestro") => {
    if (role === "admin") {
      setEmail("admin@escuela.com")
    } else {
      setEmail("maria.garcia@escuela.com")
    }
    setPassword("Juvencio12")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-2xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#bc4b26] to-[#d05f27] bg-clip-text text-transparent">
              Sistema Escolar
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="pl-10 h-12 border-gray-200 focus:border-[#bc4b26] focus:ring-[#bc4b26]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#bc4b26] focus:ring-[#bc4b26]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Usuarios de prueba</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fillDemoCredentials("admin")}
                className="h-10 text-xs border-[#bc4b26] text-[#bc4b26] hover:bg-orange-50"
              >
                👨‍💼 Administrador
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fillDemoCredentials("maestro")}
                className="h-10 text-xs border-[#003d5c] text-[#003d5c] hover:bg-blue-50"
              >
                👩‍🏫 Maestro
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>
                💡 <strong>Tip:</strong> Haz clic en los botones de arriba para llenar automáticamente
              </p>
              <p>Cualquier contraseña funciona para la demo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
