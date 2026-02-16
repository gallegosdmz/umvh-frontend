"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, Users, ArrowRight, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Panel de Administración
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona una opción para continuar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Card Evaluación */}
          <Link href="/admin/evaluacion" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-[#bc4b26] cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-lg">
                    <FileSpreadsheet className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#bc4b26] group-hover:translate-x-2 transition-all" />
                </div>
                <CardTitle className="text-2xl mt-4">Evaluación</CardTitle>
                <CardDescription className="text-base">
                  Genera archivos XLSM para calificación de alumnos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Crea y gestiona evaluaciones para tus grupos de estudiantes
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Alumnos */}
          <Link href="/admin/alumnos" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-[#bc4b26] cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#bc4b26] group-hover:translate-x-2 transition-all" />
                </div>
                <CardTitle className="text-2xl mt-4">Alumnos</CardTitle>
                <CardDescription className="text-base">
                  Gestiona alumnos y grupos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Administra la información de estudiantes y grupos
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Estadísticas */}
          <Link href="/admin/estadisticas" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-[#bc4b26] cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#bc4b26] group-hover:translate-x-2 transition-all" />
                </div>
                <CardTitle className="text-2xl mt-4">Estadísticas</CardTitle>
                <CardDescription className="text-base">
                  Gráficas de promedios y reprobación por semestre
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Carga concentrados de calificaciones y genera reportes visuales
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
