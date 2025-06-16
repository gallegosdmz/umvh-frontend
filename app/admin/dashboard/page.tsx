"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar, GraduationCap, TrendingUp, Award, Clock, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface DashboardStats {
  totalMaestros: number
  totalAsignaturas: number
  totalGrupos: number
  totalAlumnos: number
  periodosActivos: number
  gruposActivos: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalMaestros: 0,
    totalAsignaturas: 0,
    totalGrupos: 0,
    totalAlumnos: 0,
    periodosActivos: 0,
    gruposActivos: 0,
  })

  useEffect(() => {
    // Calcular estadísticas desde los datos mock
    //const maestros = mockUsuarios.filter((u) => u.rol === "maestro")
    //const asignaturas = mockAsignaturas
    //const grupos = mockGrupos.filter((g) => g.activo)
    //const alumnos = mockAlumnos.filter((a) => a.activo)
    //const periodosActivos = mockPeriodos.filter((p) => p.activo)

    setStats({
      totalMaestros: 2,
      totalAsignaturas: 4,
      totalGrupos: 4,
      totalAlumnos: 1000,
      periodosActivos: 1,
      gruposActivos: 20,
    })
  }, [])

  const quickActions = [
    {
      title: "Registrar Maestro",
      description: "Agregar nuevo maestro al sistema",
      href: "/admin/maestros/nuevo",
      icon: Users,
      color: "from-[#bc4b26] to-[#d05f27]",
      bgColor: "bg-orange-50",
      textColor: "text-[#bc4b26]",
    },
    {
      title: "Gestionar Asignaturas y Maestros",
      description: "Adminstrar asignaturas académicas",
      href: "/admin/asignaturas/",
      icon: BookOpen,
      color: "from-[#d05f27] to-[#bc4b26]",
      bgColor: "bg-red-50",
      textColor: "text-[#d05f27]",
    },
    {
      title: "Gestionar Periodos",
      description: "Administrar periodos académicos",
      href: "/admin/periodos",
      icon: Calendar,
      color: "from-[#003d5c] to-[#004a73]",
      bgColor: "bg-blue-50",
      textColor: "text-[#003d5c]",
    },
    {
      title: "Gestionar Alumnos y Grupos",
      description: "Asignar asignaturas a grupos y maestros",
      href: "/admin/alumnos",
      icon: GraduationCap,
      color: "from-[#bc4b26] to-[#003d5c]",
      bgColor: "bg-slate-50",
      textColor: "text-[#bc4b26]",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "Nuevo maestro registrado",
      description: "Ana Rodríguez Silva se unió al sistema",
      time: "Hace 2 horas",
      type: "user",
      color: "bg-green-100 text-green-800",
    },
    {
      id: 2,
      action: "Periodo académico creado",
      description: "Primavera 2025 configurado correctamente",
      time: "Hace 1 día",
      type: "period",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: 3,
      action: "Asignatura actualizada",
      description: "Cálculo Diferencial - Créditos modificados",
      time: "Hace 2 días",
      type: "subject",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: 4,
      action: "Grupo asignado",
      description: "Matemáticas I asignada al Grupo A",
      time: "Hace 3 días",
      type: "assignment",
      color: "bg-orange-100 text-orange-800",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
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
              <CardTitle className="text-sm font-medium opacity-90">Maestros</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMaestros}</div>
              <p className="text-xs opacity-90 mt-1">Activos en el sistema</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#d05f27] to-[#bc4b26] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Asignaturas</CardTitle>
              <BookOpen className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAsignaturas}</div>
              <p className="text-xs opacity-90 mt-1">Disponibles</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#003d5c] to-[#004a73] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Grupos</CardTitle>
              <GraduationCap className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalGrupos}</div>
              <p className="text-xs opacity-90 mt-1">Activos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#bc4b26] to-[#003d5c] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Alumnos</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAlumnos}</div>
              <p className="text-xs opacity-90 mt-1">Registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#d05f27] to-[#003d5c] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Periodos</CardTitle>
              <Calendar className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.periodosActivos}</div>
              <p className="text-xs opacity-90 mt-1">Activos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#003d5c] to-[#bc4b26] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Asignaciones</CardTitle>
              <Award className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{10}</div>
              <p className="text-xs opacity-90 mt-1">Configuradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
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

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <TrendingUp className="h-5 w-5 mr-2 text-[#bc4b26]" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#bc4b26] mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                    <Badge className={activity.color} variant="secondary">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <Settings className="h-5 w-5 mr-2 text-[#003d5c]" />
                Configuración Rápida
              </CardTitle>
              <CardDescription>Accesos directos a configuraciones importantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start h-12" asChild>
                <Link href="/admin/usuarios">
                  <Users className="h-4 w-4 mr-3" />
                  Gestionar Usuarios
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12" asChild>
                <Link href="/admin/periodos">
                  <Calendar className="h-4 w-4 mr-3" />
                  Configurar Periodos
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12" asChild>
                <Link href="/admin/reportes">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Ver Reportes Generales
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12" asChild>
                <Link href="/admin/configuracion">
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración del Sistema
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
