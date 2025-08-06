"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar, GraduationCap, TrendingUp, Award, Clock, BarChart3, Eye, FileText } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface DashboardStats {
  totalAlumnos: number
  totalGrupos: number
  totalAsignaturas: number
  promedioGeneral: number
  alumnosAprobados: number
  alumnosReprobados: number
}

export default function DirectorDashboard() {
  const { user } = useAuth()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalAlumnos: 0,
    totalGrupos: 0,
    totalAsignaturas: 0,
    promedioGeneral: 0,
    alumnosAprobados: 0,
    alumnosReprobados: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setStats({
        totalAlumnos: 245,
        totalGrupos: 12,
        totalAsignaturas: 18,
        promedioGeneral: 8.5,
        alumnosAprobados: 198,
        alumnosReprobados: 47,
      })
      setLoading(false)
    }, 1000)
  }, [])

  const quickActions = [
    {
      title: "Ver Alumnos",
      description: "Visualizar lista completa de alumnos",
      href: "/director/alumnos",
      icon: Users,
      color: "from-[#bc4b26] to-[#d05f27]",
      bgColor: "bg-orange-50",
      textColor: "text-[#bc4b26]",
    },
    {
      title: "Calificaciones",
      description: "Revisar calificaciones por grupo",
      href: "/director/calificaciones",
      icon: Award,
      color: "from-[#d05f27] to-[#bc4b26]",
      bgColor: "bg-red-50",
      textColor: "text-[#d05f27]",
    },
    {
      title: "Reportes",
      description: "Generar reportes académicos",
      href: "/director/reportes",
      icon: BarChart3,
      color: "from-[#003d5c] to-[#004a73]",
      bgColor: "bg-blue-50",
      textColor: "text-[#003d5c]",
    },
    {
      title: "Análisis",
      description: "Análisis detallado de rendimiento",
      href: "/director/analisis",
      icon: TrendingUp,
      color: "from-[#bc4b26] to-[#003d5c]",
      bgColor: "bg-slate-50",
      textColor: "text-[#bc4b26]",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel del Director</h1>
              <p className="text-gray-600 text-lg">
                Bienvenido, <span className="font-semibold text-[#bc4b26]">{user?.fullName}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#bc4b26] to-[#d05f27] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Alumnos</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <div className="animate-pulse bg-white/20 rounded h-8 w-16"></div>
                ) : (
                  stats.totalAlumnos
                )}
              </div>
              <p className="text-xs opacity-90 mt-1">Matriculados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#d05f27] to-[#bc4b26] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Grupos</CardTitle>
              <GraduationCap className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <div className="animate-pulse bg-white/20 rounded h-8 w-16"></div>
                ) : (
                  stats.totalGrupos
                )}
              </div>
              <p className="text-xs opacity-90 mt-1">Activos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#003d5c] to-[#004a73] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Asignaturas</CardTitle>
              <BookOpen className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <div className="animate-pulse bg-white/20 rounded h-8 w-16"></div>
                ) : (
                  stats.totalAsignaturas
                )}
              </div>
              <p className="text-xs opacity-90 mt-1">Impartidas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#bc4b26] to-[#003d5c] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Promedio</CardTitle>
              <Award className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <div className="animate-pulse bg-white/20 rounded h-8 w-16"></div>
                ) : (
                  stats.promedioGeneral
                )}
              </div>
              <p className="text-xs opacity-90 mt-1">General</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#d05f27] to-[#003d5c] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Aprobados</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <div className="animate-pulse bg-white/20 rounded h-8 w-16"></div>
                ) : (
                  stats.alumnosAprobados
                )}
              </div>
              <p className="text-xs opacity-90 mt-1">Alumnos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#003d5c] to-[#bc4b26] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Reprobados</CardTitle>
              <BarChart3 className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <div className="animate-pulse bg-white/20 rounded h-8 w-16"></div>
                ) : (
                  stats.alumnosReprobados
                )}
              </div>
              <p className="text-xs opacity-90 mt-1">Alumnos</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white group hover:scale-105 h-[200px]">
                  <CardHeader className="pb-4 h-full flex flex-col">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-[#bc4b26] transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 flex-grow">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Accesos Directos y Reportes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <Eye className="h-5 w-5 mr-2 text-[#bc4b26]" />
                Visualización Rápida
              </CardTitle>
              <CardDescription>Acceso directo a información académica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center p-4 hover:bg-orange-50 hover:border-orange-300 transition-colors" asChild>
                  <Link href="/director/alumnos">
                    <Users className="h-6 w-6 mb-2 text-orange-600" />
                    <span className="text-sm font-medium">Ver Alumnos</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors" asChild>
                  <Link href="/director/calificaciones">
                    <Award className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm font-medium">Calificaciones</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center p-4 hover:bg-green-50 hover:border-green-300 transition-colors" asChild>
                  <Link href="/director/grupos">
                    <GraduationCap className="h-6 w-6 mb-2 text-green-600" />
                    <span className="text-sm font-medium">Por Grupos</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center p-4 hover:bg-purple-50 hover:border-purple-300 transition-colors" asChild>
                  <Link href="/director/asignaturas">
                    <BookOpen className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="text-sm font-medium">Por Asignatura</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <FileText className="h-5 w-5 mr-2 text-[#003d5c]" />
                Reportes Académicos
              </CardTitle>
              <CardDescription>Informes detallados de rendimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-red-50 hover:border-red-300 transition-colors" asChild>
                  <Link href="/director/reportes/rendimiento">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    Reporte de Rendimiento General
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-yellow-50 hover:border-yellow-300 transition-colors" asChild>
                  <Link href="/director/reportes/comparativo">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    Análisis Comparativo
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-300 transition-colors" asChild>
                  <Link href="/director/reportes/tendencias">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Tendencias Académicas
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-green-50 hover:border-green-300 transition-colors" asChild>
                  <Link href="/director/reportes/exportar">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    Exportar Datos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 