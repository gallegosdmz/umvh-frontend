"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Search, Filter, ArrowLeft, Eye, Award, TrendingUp, TrendingDown, Plus, BookOpen, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useGroup } from "@/lib/hooks/useGroup"
import { GroupForDirector, CourseGroupForDirector, CourseGroupStudent } from "@/lib/mock-data"
import { toast } from "@/hooks/use-toast"

interface Estadisticas {
  totalGrupos: number
  totalAsignaturas: number
  totalAlumnos: number
  promedioGeneral: number
}

export default function AlumnosPage() {
  const { user } = useAuth()
  const { handleGetGroupsForDirector, loading, error, totalItems } = useGroup()
  
  const [grupos, setGrupos] = useState<GroupForDirector[]>([])
  const [filteredGrupos, setFilteredGrupos] = useState<GroupForDirector[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("todos")
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalGrupos: 0,
    totalAsignaturas: 0,
    totalAlumnos: 0,
    promedioGeneral: 0
  })

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Estados para modales
  const [selectedGroup, setSelectedGroup] = useState<GroupForDirector | null>(null)
  const [selectedCourseGroup, setSelectedCourseGroup] = useState<CourseGroupForDirector | null>(null)
  const [showAsignaturasModal, setShowAsignaturasModal] = useState(false)
  const [showAlumnosModal, setShowAlumnosModal] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const offset = (currentPage - 1) * itemsPerPage
        const data = await handleGetGroupsForDirector(itemsPerPage, offset)
        setGrupos(data.groups)
        
        // Calcular estadísticas
        const stats = calcularEstadisticas(data.groups)
        setEstadisticas(stats)

      } catch (error) {
        console.error('Error al cargar datos:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de grupos",
          variant: "destructive"
        })
      }
    }

    cargarDatos()
  }, [currentPage, itemsPerPage])

  // Calcular estadísticas
  const calcularEstadisticas = (gruposData: GroupForDirector[]): Estadisticas => {
    let totalAsignaturas = 0
    let totalAlumnos = 0
    let sumaPromedios = 0
    let contadorAlumnos = 0

    gruposData.forEach(grupo => {
      grupo.coursesGroups?.forEach(courseGroup => {
        totalAsignaturas++
        courseGroup.coursesGroupsStudents?.forEach(student => {
          totalAlumnos++
          
          // Calcular promedio del alumno
          const calificaciones = [
            ...(student.finalGrades || []),
            ...(student.partialGrades || [])
          ]
          
          if (calificaciones.length > 0) {
            const promedio = calificaciones.reduce((sum, cal) => sum + (cal.grade || 0), 0) / calificaciones.length
            sumaPromedios += promedio
            contadorAlumnos++
          }
        })
      })
    })

    return {
      totalGrupos: gruposData.length,
      totalAsignaturas,
      totalAlumnos,
      promedioGeneral: contadorAlumnos > 0 ? sumaPromedios / contadorAlumnos : 0
    }
  }

  // Filtrar grupos
  useEffect(() => {
    let filtered = grupos

    if (searchTerm) {
      filtered = filtered.filter(grupo =>
        grupo.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedPeriod !== "todos") {
      filtered = filtered.filter(grupo => 
        grupo.period?.name === selectedPeriod
      )
    }

    setFilteredGrupos(filtered)
  }, [grupos, searchTerm, selectedPeriod])

  // Calcular promedio de un alumno
  const calcularPromedioAlumno = (student: CourseGroupStudent): number => {
    const calificaciones = [
      ...(student.finalGrades || []),
      ...(student.partialGrades || [])
    ]
    
    if (calificaciones.length === 0) return 0
    
    const suma = calificaciones.reduce((sum, cal) => sum + (cal.grade || 0), 0)
    return suma / calificaciones.length
  }

  // Obtener estado del alumno basado en su promedio
  const getEstadoAlumno = (promedio: number) => {
    if (promedio >= 8.0) return { text: "Excelente", color: "bg-green-100 text-green-800" }
    if (promedio >= 7.0) return { text: "Bueno", color: "bg-yellow-100 text-yellow-800" }
    return { text: "Necesita mejorar", color: "bg-red-100 text-red-800" }
  }

  // Obtener períodos únicos
  const periodosUnicos = Array.from(new Set(grupos.map(grupo => grupo.period?.name).filter((name): name is string => Boolean(name))))

  // Calcular total de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage)

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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Alumnos</h1>
                <p className="text-gray-600 text-lg">
                  Visualización de grupos, asignaturas y alumnos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Users className="h-3 w-3 mr-1" />
                {filteredGrupos.length} grupos
              </Badge>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 mb-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Grupos</p>
                  <p className="text-3xl font-bold">
                    {estadisticas.totalGrupos}
                  </p>
                </div>
                <Users className="h-8 w-8 opacity-90" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Asignaturas</p>
                  <p className="text-3xl font-bold">
                    {estadisticas.totalAsignaturas}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 opacity-90" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Alumnos</p>
                  <p className="text-3xl font-bold">
                    {estadisticas.totalAlumnos}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 opacity-90" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Promedio General</p>
                  <p className="text-3xl font-bold">
                    {estadisticas.promedioGeneral.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-90" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="mb-6 border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <Filter className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre del grupo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los períodos</SelectItem>
                  {periodosUnicos.map((periodo) => (
                    <SelectItem key={periodo} value={periodo}>
                      {periodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Grupos */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <Users className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Lista de Grupos
            </CardTitle>
            <CardDescription>
              Información detallada de grupos y sus asignaturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bc4b26]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Semestre</TableHead>
                      <TableHead>Asignaturas</TableHead>
                      <TableHead>Alumnos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrupos.map((grupo) => (
                      <TableRow key={grupo.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              Grupo {grupo.name}
                            </div>
                            <div className="text-sm text-gray-500">ID: {grupo.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {grupo.period?.name || 'Sin período'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {grupo.semester || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {grupo.coursesGroups?.length || 0} asignaturas
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {grupo.coursesGroups?.reduce((total, courseGroup) => 
                              total + (courseGroup.coursesGroupsStudents?.length || 0), 0
                            ) || 0} alumnos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedGroup(grupo)
                              setShowAsignaturasModal(true)
                            }}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Ver Asignaturas
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!loading && filteredGrupos.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron grupos</h3>
                <p className="text-gray-500">
                  No hay grupos que coincidan con los filtros aplicados.
                </p>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} grupos
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {/* Mostrar errores */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">
                  Error: {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Asignaturas */}
        <Dialog open={showAsignaturasModal} onOpenChange={setShowAsignaturasModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl font-bold text-gray-900">
                <BookOpen className="h-5 w-5 mr-2 text-[#bc4b26]" />
                Asignaturas del Grupo {selectedGroup?.name}
              </DialogTitle>
              <DialogDescription>
                Lista de asignaturas y sus maestros asignados
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Maestro</TableHead>
                    <TableHead>Alumnos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup?.coursesGroups?.map((courseGroup) => (
                    <TableRow key={courseGroup.id}>
                      <TableCell>
                        <div className="font-medium">
                          {courseGroup.course?.name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {courseGroup.id}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {courseGroup.user?.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{courseGroup.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {courseGroup.coursesGroupsStudents?.length || 0} alumnos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedCourseGroup(courseGroup)
                            setShowAlumnosModal(true)
                            setShowAsignaturasModal(false)
                          }}
                        >
                          <GraduationCap className="h-4 w-4 mr-1" />
                          Ver Alumnos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Alumnos */}
        <Dialog open={showAlumnosModal} onOpenChange={setShowAlumnosModal}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl font-bold text-gray-900">
                <GraduationCap className="h-5 w-5 mr-2 text-[#bc4b26]" />
                Alumnos de {selectedCourseGroup?.course?.name}
              </DialogTitle>
              <DialogDescription>
                Lista de alumnos con sus calificaciones y asistencia
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Asistencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCourseGroup?.coursesGroupsStudents?.map((student) => {
                    const promedio = calcularPromedioAlumno(student)
                    const estado = getEstadoAlumno(promedio)
                    const asistencias = student.coursesGroupsAttendances || []
                    const asistenciasPresentes = asistencias.filter(a => a.isPresent).length
                    const porcentajeAsistencia = asistencias.length > 0 
                      ? (asistenciasPresentes / asistencias.length) * 100 
                      : 0

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student.student?.fullName}
                            </div>
                            <div className="text-sm text-gray-500">ID: {student.student?.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.student?.registrationNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg">{promedio.toFixed(1)}</span>
                            {promedio >= 8.0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={estado.color}>
                            {estado.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{porcentajeAsistencia.toFixed(1)}%</span>
                            <Badge variant="outline">
                              {asistenciasPresentes}/{asistencias.length}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
} 