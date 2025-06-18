"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Calendar, GraduationCap, Plus, BarChart3, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useGroup } from "@/lib/hooks/useGroup"
import { useCourse } from "@/lib/hooks/useCourse"
import { usePeriod } from "@/lib/hooks/usePeriod"
import { Group, Course } from "@/lib/mock-data"
import { CourseService } from "@/lib/services/course.service"

interface MaestroStats {
  misGrupos: number
  misAsignaturas: number
  totalAlumnos: number
  evaluacionesPendientes: number
}

interface GrupoInfo {
  id: number
  nombre: string
  periodo: string
  asignaturas: Array<{
    id: number
    nombre: string
    alumnos: number
  }>
  totalAlumnos: number
}

interface Assignment {
  id: number
  courseId: number
  students?: any[]
}

export default function MaestroDashboard() {
  const { user } = useAuth()
  const { handleGetGroups } = useGroup()
  const { handleGetCourses } = useCourse()
  const { handleGetPeriods } = usePeriod()
  const [stats, setStats] = useState<MaestroStats>({
    misGrupos: 0,
    misAsignaturas: 0,
    totalAlumnos: 0,
    evaluacionesPendientes: 0,
  })
  const [grupos, setGrupos] = useState<GrupoInfo[]>([])

  useEffect(() => {
    if (user?.id) {
      loadMaestroData()
    }
  }, [user])

  const loadMaestroData = async () => {
    try {
      const maestroId = user?.id || 0
      const gruposData = await handleGetGroups(100, 0)
      const periodosData = await handleGetPeriods(100, 0)
      const cursosData = await handleGetCourses(100, 0)

      const gruposInfo: GrupoInfo[] = await Promise.all(
        gruposData.map(async (grupo: Group) => {
          const asignaturasGrupo = await CourseService.getAssignments(grupo.id!, 100, 0)
          const periodo = periodosData.find((p) => p.id === grupo.periodId)

          const asignaturasInfo = await Promise.all(
            asignaturasGrupo.map(async (ag: Assignment) => {
              const asignatura = cursosData.find((c: Course) => c.id === ag.courseId)
              return {
                id: ag.id,
                nombre: asignatura?.name || "Sin nombre",
                alumnos: ag.students?.length || 0,
              }
            })
          )

          const totalAlumnos = asignaturasInfo.reduce((sum, a) => sum + a.alumnos, 0)

          return {
            id: grupo.id!,
            nombre: grupo.name,
            periodo: periodo?.name || "Sin periodo",
            asignaturas: asignaturasInfo,
            totalAlumnos,
          }
        })
      )

      setGrupos(gruposInfo)

      // Calcular estadísticas
      const totalGrupos = gruposInfo.length
      const totalAsignaturas = gruposInfo.reduce((sum, g) => sum + g.asignaturas.length, 0)
      const totalAlumnos = gruposInfo.reduce((sum, g) => sum + g.totalAlumnos, 0)

      setStats({
        misGrupos: totalGrupos,
        misAsignaturas: totalAsignaturas,
        totalAlumnos: totalAlumnos,
        evaluacionesPendientes: Math.floor(Math.random() * 15) + 5, // Simulado
      })
    } catch (error) {
      console.error('Error al cargar los datos del maestro:', error)
    }
  }

  const quickActions = [
    {
      title: "Gestionar Asignaturas",
      description: "Administrar asignaturas académicas",
      href: "/maestro/asignaturas",
      icon: Users,
      color: "from-[#bc4b26] to-[#d05f27]",
    },
    {
      title: "Gestionar Alumnos",
      description: "Administrar alumnos de mis grupos",
      href: "/maestro/alumnos",
      icon: GraduationCap,
      color: "from-[#d05f27] to-[#bc4b26]",
    },
    {
      title: "Calificaciones",
      description: "Registrar y consultar calificaciones",
      href: "/maestro/calificaciones",
      icon: BookOpen,
      color: "from-[#003d5c] to-[#004a73]",
    },
    {
      title: "Reportes",
      description: "Generar reportes y estadísticas",
      href: "/maestro/reportes",
      icon: BarChart3,
      color: "from-[#bc4b26] to-[#003d5c]",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel del Maestro</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#bc4b26] to-[#d05f27] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Mis Grupos</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.misGrupos}</div>
              <p className="text-xs opacity-90 mt-1">Grupos activos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#d05f27] to-[#bc4b26] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Asignaturas</CardTitle>
              <BookOpen className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.misAsignaturas}</div>
              <p className="text-xs opacity-90 mt-1">Que imparto</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#003d5c] to-[#004a73] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Alumnos</CardTitle>
              <GraduationCap className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAlumnos}</div>
              <p className="text-xs opacity-90 mt-1">Total en mis grupos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#bc4b26] to-[#003d5c] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Pendientes</CardTitle>
              <Calendar className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.evaluacionesPendientes}</div>
              <p className="text-xs opacity-90 mt-1">Evaluaciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white group hover:scale-105">
                  <CardHeader className="pb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-[#bc4b26] transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Mis Grupos */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <TrendingUp className="h-5 w-5 mr-2 text-[#bc4b26]" />
                Mis Grupos
              </CardTitle>
              <CardDescription>Grupos que tienes asignados actualmente</CardDescription>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26]"
            >
              <Link href="/maestro/grupos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Grupo
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {grupos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-12 w-12 text-[#bc4b26]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes grupos asignados</h3>
                <p className="text-gray-500 mb-6">
                  Comienza creando tu primer grupo para gestionar alumnos y calificaciones
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26]"
                >
                  <Link href="/maestro/grupos/nuevo">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear mi primer grupo
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {grupos.map((grupo) => (
                  <Card
                    key={grupo.id}
                    className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-[#bc4b26]"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{grupo.nombre}</CardTitle>
                          <p className="text-sm text-gray-600 mb-3">{grupo.periodo}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {grupo.totalAlumnos} alumno{grupo.totalAlumnos !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Asignaturas:</p>
                        <div className="flex flex-wrap gap-2">
                          {grupo.asignaturas.map((asignatura) => (
                            <Badge key={asignatura.id} variant="secondary" className="text-xs">
                              {asignatura.nombre} ({asignatura.alumnos})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/maestro/grupos/${grupo.id}`}>Ver detalles</Link>
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26]"
                          asChild
                        >
                          <Link href={`/maestro/calificaciones?grupo=${grupo.id}`}>Calificaciones</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}