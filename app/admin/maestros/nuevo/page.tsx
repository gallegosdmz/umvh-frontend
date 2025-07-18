"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Mail, Lock, Save, Eye, EyeOff, RefreshCw } from "lucide-react"
import Link from "next/link"
import { UserService } from "@/lib/services/user.service"

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}


export default function NuevoMaestro() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const generatePassword = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    let password = ""
    
    // Asegurar al menos 2 números
    for (let i = 0; i < 2; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }
    
    // Completar con letras hasta llegar a 12 caracteres
    for (let i = 0; i < 10; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    
    // Mezclar los caracteres para que no estén todos los números juntos
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    
    setFormData({ ...formData, password, confirmPassword: password })
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    } //else if (mockUsuarios.some((u) => u.email === formData.email)) {
    //newErrors.email = "Este email ya está registrado"
    //}

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Agregar el nuevo maestro a los datos mock (en una app real esto iría al backend)
      const user = await UserService.create({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 'maestro',
      });

      // Verificar que el objeto `user` contenga las propiedades esperadas
      const isValidUser =
        user &&
        typeof user === 'object' &&
        'id' in user &&
        'email' in user &&
        'fullName' in user &&
        'role' in user;

      if (!isValidUser) {
        console.error("Respuesta inválida del servidor:", user);
        return; // Detener ejecución
      }

      setSuccess(true)

      // Redirigir después de un momento
      setTimeout(() => {
        router.push("/admin/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error al registrar maestro:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Maestro Registrado!</h2>
            <p className="text-gray-600 mb-6">
              El maestro <strong>{formData.fullName}</strong> ha sido registrado exitosamente en el sistema.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>📧 Email: {formData.email}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">Redirigiendo al dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 hover:bg-orange-50">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-xl shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Registrar Nuevo Maestro</h1>
              <p className="text-gray-600 text-lg mt-1">Completa la información para agregar un maestro al sistema</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Información del Maestro</CardTitle>
                <CardDescription>Ingresa los datos básicos del nuevo maestro</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2 text-[#bc4b26]" />
                      Información Personal
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                          Nombre Completo *
                        </Label>
                        <Input
                          id="nombre"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          placeholder="Ej: María García López"
                          className={`h-12 ${errors.fullName ? "border-red-500" : "border-gray-200"}`}
                        />
                        {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                      </div>


                    </div>
                  </div>

                  {/* Información de Acceso */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-purple-600" />
                      Información de Acceso
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Correo Electrónico *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="maestro@escuela.com"
                          className={`pl-10 h-12 ${errors.email ? "border-red-500" : "border-gray-200"}`}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Contraseña *
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 h-12 ${errors.password ? "border-red-500" : "border-gray-200"}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                          Confirmar Contraseña *
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 h-12 ${errors.confirmPassword ? "border-red-500" : "border-gray-200"}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                      </div>
                    </div>

                    <Button type="button" variant="outline" onClick={generatePassword} className="w-full md:w-auto">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generar Contraseña Automática
                    </Button>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Registrando...
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Registrar Maestro
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" className="flex-1 h-12" asChild>
                      <Link href="/admin/dashboard">Cancelar</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Información */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Información Importante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#bc4b26] rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                      El maestro recibirá sus credenciales de acceso por correo electrónico
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#d05f27] rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">Podrá cambiar su contraseña en el primer inicio de sesión</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#003d5c] rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">La especialidad ayuda a asignar materias automáticamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Próximos Pasos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      1
                    </Badge>
                    <span>Registrar al maestro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      2
                    </Badge>
                    <span>Asignar grupos y materias</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      3
                    </Badge>
                    <span>Configurar ponderaciones</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      4
                    </Badge>
                    <span>Registrar alumnos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
