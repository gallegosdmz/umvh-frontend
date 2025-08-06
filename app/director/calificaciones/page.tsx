"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, ArrowLeft, Filter, TrendingUp, TrendingDown, BarChart3, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface Calificacion {
  alumnoId: string
  alumnoNombre: string
  alumnoApellido: string
  asignatura: string
  calificacion: number
  estado: "aprobado" | "reprobado"
  periodo: string
}

interface GrupoCalificaciones {
  grupo: string
  asignaturas: string[]
  alumnos: {
    id: string
    nombre: string
    apellido: string
    calificaciones: {
      asignatura: string
      calificacion: number
      estado: "aprobado" | "reprobado"
    }[]
    promedio: number
  }[]
}

export default function CalificacionesPage() {
  const { user } = useAuth()
  const [selectedGrupo, setSelectedGrupo] = useState("1A")
  const [selectedAsignatura, setSelectedAsignatura] = useState("todas")
  const [loading, setLoading] = useState(true)
  const [grupoData, setGrupoData] = useState<GrupoCalificaciones | null>(null)

  // Datos mock para mostrar el diseño
  const mockGruposData: GrupoCalificaciones[] = [
    {
      grupo: "1A",
      asignaturas: ["Matemáticas", "Español", "Ciencias", "Historia"],
      alumnos: [
        {
          id: "1",
          nombre: "María",
          apellido: "García López",
          promedio: 8.7,
          calificaciones: [
            { asignatura: "Matemáticas", calificacion: 9.0, estado: "aprobado" },
            { asignatura: "Español", calificacion: 8.5, estado: "aprobado" },
            { asignatura: "Ciencias", calificacion: 8.8, estado: "aprobado" },
            { asignatura: "Historia", calificacion: 8.2, estado: "aprobado" },
          ]
        },
        {
          id: "2",
          nombre: "Carlos",
          apellido: "Rodríguez Martínez",
          promedio: 7.2,
          calificaciones: [
            { asignatura: "Matemáticas", calificacion: 6.5, estado: "aprobado" },
            { asignatura: "Español", calificacion: 7.8, estado: "aprobado" },
            { asignatura: "Ciencias", calificacion: 7.0, estado: "aprobado" },
            { asignatura: "Historia", calificacion: 7.5, estado: "aprobado" },
          ]
        },
        {
          id: "3",
          nombre: "Ana",
          apellido: "Hernández Silva",
          promedio: 9.1,
          calificaciones: [
            { asignatura: "Matemáticas", calificacion: 9.5, estado: "aprobado" },
            { asignatura: "Español", calificacion: 9.0, estado: "aprobado" },
            { asignatura: "Ciencias", calificacion: 9.2, estado: "aprobado" },
            { asignatura: "Historia", calificacion: 8.8, estado: "aprobado" },
          ]
        }
      ]
    },
    {
      grupo: "1B",
      asignaturas: ["Matemáticas", "Español", "Ciencias", "Historia"],
      alumnos: [
        {
          id: "4",
          nombre: "Luis",
          apellido: "Fernández Torres",
          promedio: 6.8,
          calificaciones: [
            { asignatura: "Matemáticas", calificacion: 5.5, estado: "reprobado" },
            { asignatura: "Español", calificacion: 7.0, estado: "aprobado" },
            { asignatura: "Ciencias", calificacion: 7.5, estado: "aprobado" },
            { asignatura: "Historia", calificacion: 7.0, estado: "aprobado" },
          ]
        },
        {
          id: "5",
          nombre: "Sofía",
          apellido: "Morales Vega",
          promedio: 8.9,
          calificaciones: [
            { asignatura: "Matemáticas", calificacion: 9.2, estado: "aprobado" },
            { asignatura: "Español", calificacion: 8.8, estado: "aprobado" },
            { asignatura: "Ciencias", calificacion: 9.0, estado: "aprobado" },
            { asignatura: "Historia", calificacion: 8.5, estado: "aprobado" },
          ]
        }
      ]
    }
  ]

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const grupo = mockGruposData.find(g => g.grupo === selectedGrupo)
      setGrupoData(grupo || null)
      setLoading(false)
    }, 1000)
  }, [selectedGrupo])

  const grupos = mockGruposData.map(g => g.grupo)

  const getEstadoColor = (calificacion: number) => {
    if (calificacion >= 8.0) return "bg-green-100 text-green-800"
    if (calificacion >= 7.0) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getPromedioAsignatura = (asignatura: string) => {
    if (!grupoData) return 0
    const calificaciones = grupoData.alumnos.flatMap(alumno => 
      alumno.calificaciones.filter(cal => cal.asignatura === asignatura)
    )
    if (calificaciones.length === 0) return 0
    return calificaciones.reduce((sum, cal) => sum + cal.calificacion, 0) / calificaciones.length
  }

  const getPromedioGrupo = () => {
    if (!grupoData) return 0
    return grupoData.alumnos.reduce((sum, alumno) => sum + alumno.promedio, 0) / grupoData.alumnos.length
  }

  const getAlumnosAprobados = () => {
    if (!grupoData) return 0
    return grupoData.alumnos.filter(alumno => alumno.promedio >= 7.0).length
  }

  const getAlumnosReprobados = () => {
    if (!grupoData) return 0
    return grupoData.alumnos.filter(alumno => alumno.promedio < 7.0).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/director/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Calificaciones</h1>
                <p className="text-gray-600 text-lg">
                  Revisión detallada de calificaciones por grupo
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Award className="h-3 w-3 mr-1" />
                Grupo {selectedGrupo}
              </Badge>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <Filter className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Grupo</label>
                <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo} value={grupo}>
                        Grupo {grupo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Asignatura</label>
                <Select value={selectedAsignatura} onValueChange={setSelectedAsignatura}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las asignaturas</SelectItem>
                    {grupoData?.asignaturas.map((asignatura) => (
                      <SelectItem key={asignatura} value={asignatura}>
                        {asignatura}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas del Grupo */}
        {grupoData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Promedio del Grupo</p>
                    <p className="text-3xl font-bold">{getPromedioGrupo().toFixed(1)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 opacity-90" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Alumnos Aprobados</p>
                    <p className="text-3xl font-bold">{getAlumnosAprobados()}</p>
                  </div>
                  <Award className="h-8 w-8 opacity-90" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Alumnos Reprobados</p>
                    <p className="text-3xl font-bold">{getAlumnosReprobados()}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 opacity-90" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Alumnos</p>
                    <p className="text-3xl font-bold">{grupoData.alumnos.length}</p>
                  </div>
                  <Users className="h-8 w-8 opacity-90" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Promedios por Asignatura */}
        {grupoData && (
          <Card className="mb-6 border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <BarChart3 className="h-5 w-5 mr-2 text-[#bc4b26]" />
                Promedios por Asignatura
              </CardTitle>
              <CardDescription>
                Rendimiento promedio del grupo en cada asignatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {grupoData.asignaturas.map((asignatura) => {
                  const promedio = getPromedioAsignatura(asignatura)
                  return (
                    <div key={asignatura} className="text-center p-4 border rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{asignatura}</h3>
                      <div className="text-3xl font-bold text-[#bc4b26]">{promedio.toFixed(1)}</div>
                      <Badge className={getEstadoColor(promedio)}>
                        {promedio >= 8.0 ? "Excelente" : promedio >= 7.0 ? "Bueno" : "Necesita mejorar"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Calificaciones */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <Award className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Calificaciones Detalladas
            </CardTitle>
            <CardDescription>
              Calificaciones individuales de cada alumno
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bc4b26]"></div>
              </div>
            ) : grupoData ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      {grupoData.asignaturas.map((asignatura) => (
                        <TableHead key={asignatura} className="text-center">{asignatura}</TableHead>
                      ))}
                      <TableHead className="text-center">Promedio</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupoData.alumnos.map((alumno) => (
                      <TableRow key={alumno.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {alumno.nombre} {alumno.apellido}
                            </div>
                            <div className="text-sm text-gray-500">ID: {alumno.id}</div>
                          </div>
                        </TableCell>
                        {grupoData.asignaturas.map((asignatura) => {
                          const calificacion = alumno.calificaciones.find(cal => cal.asignatura === asignatura)
                          return (
                            <TableCell key={asignatura} className="text-center">
                              {calificacion ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-lg">{calificacion.calificacion}</span>
                                  <Badge 
                                    variant={calificacion.estado === "aprobado" ? "default" : "destructive"}
                                    className="text-xs mt-1"
                                  >
                                    {calificacion.estado === "aprobado" ? "Aprobado" : "Reprobado"}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-lg">{alumno.promedio}</span>
                            {alumno.promedio >= 8.0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600 mt-1" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getEstadoColor(alumno.promedio)}>
                            {alumno.promedio >= 8.0 ? "Excelente" : alumno.promedio >= 7.0 ? "Bueno" : "Necesita mejorar"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
                <p className="text-gray-500">
                  Selecciona un grupo para ver las calificaciones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 