"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Users, Calculator, Save, Award } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  getGruposByMaestro,
  getAsignaturasByGrupo,
  getAlumnosByAsignaturaGrupo,
  getPeriodoById,
  getAsignaturaById,
  mockEvaluaciones,
  type Evaluacion,
} from "@/lib/mock-data"
import { calcularPromedios, determinarSituacion, getVariantBySituacion } from "@/lib/calculations"

interface GrupoOption {
  id: number
  nombre: string
  periodo: string
}

interface AsignaturaGrupoOption {
  id: number
  asignatura: string
  grupo: string
  ponderaciones: Array<{ rubro: string; porcentaje: number }>
}

interface AlumnoCalificaciones {
  id: number
  matricula: string
  nombreCompleto: string
  semestre: number
  evaluaciones: { [key: string]: number }
  promedios: { parcial1: number; parcial2: number; parcial3: number; final: number }
  situacion: string
}

const RUBROS = ["asistencia", "actividades", "evidencias", "producto", "examen"]
const PARCIALES = [1, 2, 3]

export default function Calificaciones() {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<GrupoOption[]>([])
  const [asignaturasGrupo, setAsignaturasGrupo] = useState<AsignaturaGrupoOption[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState("")
  const [selectedAsignatura, setSelectedAsignatura] = useState("")
  const [selectedParcial, setSelectedParcial] = useState("1")
  const [alumnos, setAlumnos] = useState<AlumnoCalificaciones[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([...mockEvaluaciones])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadGrupos()
    }
  }, [user])

  useEffect(() => {
    if (selectedGrupo) {
      loadAsignaturasGrupo()
    }
  }, [selectedGrupo])

  useEffect(() => {
    if (selectedAsignatura) {
      loadAlumnos()
    }
  }, [selectedAsignatura, evaluaciones])

  const loadGrupos = () => {
    const maestroId = user?.id || 0
    const gruposMaestro = getGruposByMaestro(maestroId)

    const gruposOptions = gruposMaestro.map((grupo) => {
      const periodo = getPeriodoById(grupo.periodoId)
      return {
        id: grupo.id,
        nombre: grupo.nombre,
        periodo: periodo?.nombre || "Sin periodo",
      }
    })

    setGrupos(gruposOptions)
  }

  const loadAsignaturasGrupo = () => {
    const asignaturasGrupoData = getAsignaturasByGrupo(Number.parseInt(selectedGrupo))

    const asignaturasOptions = asignaturasGrupoData.map((ag) => {
      const asignatura = getAsignaturaById(ag.asignaturaId)
      const grupo = grupos.find((g) => g.id === ag.grupoId)

      return {
        id: ag.id,
        asignatura: asignatura?.nombre || "Sin nombre",
        grupo: grupo?.nombre || "Sin grupo",
        ponderaciones: ag.ponderaciones,
      }
    })

    setAsignaturasGrupo(asignaturasOptions)
  }

  const loadAlumnos = () => {
    const asignaturaGrupoId = Number.parseInt(selectedAsignatura)
    const alumnosData = getAlumnosByAsignaturaGrupo(asignaturaGrupoId)
    const asignaturaGrupoData = asignaturasGrupo.find((ag) => ag.id === asignaturaGrupoId)

    if (!asignaturaGrupoData) return

    const alumnosConCalificaciones = alumnosData.map((alumno) => {
      const evaluacionesAlumno = evaluaciones.filter(
        (e) => e.asignaturaGrupoId === asignaturaGrupoId && e.alumnoId === alumno.id,
      )

      // Crear mapa de evaluaciones
      const evaluacionesMap: { [key: string]: number } = {}
      evaluacionesAlumno.forEach((ev) => {
        evaluacionesMap[`${ev.parcial}_${ev.rubro}`] = ev.calificacion
      })

      // Calcular promedios
      const promedios = calcularPromedios(evaluacionesAlumno, asignaturaGrupoData.ponderaciones)
      const situacion = determinarSituacion(promedios.final)

      return {
        id: alumno.id,
        matricula: alumno.matricula,
        nombreCompleto: alumno.nombreCompleto,
        semestre: alumno.semestre,
        evaluaciones: evaluacionesMap,
        promedios,
        situacion,
      }
    })

    setAlumnos(alumnosConCalificaciones)
  }

  const handleCalificacionChange = (alumnoId: number, rubro: string, calificacion: string) => {
    const nuevaCalificacion = Number.parseFloat(calificacion) || 0
    const asignaturaGrupoId = Number.parseInt(selectedAsignatura)
    const parcial = Number.parseInt(selectedParcial)

    // Actualizar evaluaciones
    const nuevasEvaluaciones = [...evaluaciones]
    const evaluacionIndex = nuevasEvaluaciones.findIndex(
      (e) =>
        e.asignaturaGrupoId === asignaturaGrupoId &&
        e.alumnoId === alumnoId &&
        e.parcial === parcial &&
        e.rubro === rubro,
    )

    if (evaluacionIndex >= 0) {
      nuevasEvaluaciones[evaluacionIndex].calificacion = nuevaCalificacion
    } else {
      nuevasEvaluaciones.push({
        id: Date.now() + Math.random(),
        asignaturaGrupoId,
        alumnoId,
        parcial: parcial as 1 | 2 | 3,
        rubro,
        calificacion: nuevaCalificacion,
      })
    }

    setEvaluaciones(nuevasEvaluaciones)
  }

  const guardarCalificaciones = async () => {
    setSaving(true)

    // Simular guardado
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSaving(false)
    alert("Calificaciones guardadas correctamente")
  }

  const selectedAsignaturaData = asignaturasGrupo.find((ag) => ag.id.toString() === selectedAsignatura)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Calificaciones</h1>
          <p className="text-gray-600 text-lg">Registra y consulta las calificaciones de tus alumnos</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6 border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <BookOpen className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Seleccionar Grupo y Asignatura
            </CardTitle>
            <CardDescription>Elige el grupo y asignatura para gestionar las calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Grupo</Label>
                <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id.toString()}>
                        {grupo.nombre} - {grupo.periodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Asignatura</Label>
                <Select value={selectedAsignatura} onValueChange={setSelectedAsignatura}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturasGrupo.map((ag) => (
                      <SelectItem key={ag.id} value={ag.id.toString()}>
                        {ag.asignatura}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Parcial</Label>
                <Select value={selectedParcial} onValueChange={setSelectedParcial}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Primer Parcial</SelectItem>
                    <SelectItem value="2">Segundo Parcial</SelectItem>
                    <SelectItem value="3">Tercer Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedAsignaturaData && alumnos.length > 0 && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                  <Calculator className="h-5 w-5 mr-2 text-[#bc4b26]" />
                  {selectedAsignaturaData.asignatura} - Parcial {selectedParcial}
                </CardTitle>
                <CardDescription>
                  {alumnos.length} alumnos registrados • Grupo: {selectedAsignaturaData.grupo}
                </CardDescription>
              </div>
              <Button
                onClick={guardarCalificaciones}
                disabled={saving}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26]"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Calificaciones"}
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calificaciones" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="calificaciones">Calificaciones por Parcial</TabsTrigger>
                  <TabsTrigger value="promedios">Promedios Generales</TabsTrigger>
                </TabsList>

                <TabsContent value="calificaciones" className="mt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Matrícula</TableHead>
                          <TableHead className="font-semibold">Alumno</TableHead>
                          <TableHead className="text-center font-semibold">Sem.</TableHead>
                          {RUBROS.map((rubro) => (
                            <TableHead key={rubro} className="text-center font-semibold">
                              {rubro.charAt(0).toUpperCase() + rubro.slice(1)}
                              <div className="text-xs text-gray-500 font-normal">
                                {selectedAsignaturaData.ponderaciones.find((p) => p.rubro === rubro)?.porcentaje}%
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-center font-semibold">Promedio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alumnos.map((alumno) => (
                          <TableRow key={alumno.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-[#bc4b26]">{alumno.matricula}</TableCell>
                            <TableCell className="font-medium">{alumno.nombreCompleto}</TableCell>
                            <TableCell className="text-center">{alumno.semestre}</TableCell>
                            {RUBROS.map((rubro) => (
                              <TableCell key={rubro} className="text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={alumno.evaluaciones[`${selectedParcial}_${rubro}`] || ""}
                                  onChange={(e) => handleCalificacionChange(alumno.id, rubro, e.target.value)}
                                  className="w-20 text-center h-10 border-gray-200 focus:border-[#bc4b26] focus:ring-[#bc4b26]"
                                  placeholder="0.0"
                                />
                              </TableCell>
                            ))}
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-semibold text-sm px-3 py-1">
                                {alumno.promedios[`parcial${selectedParcial}` as keyof typeof alumno.promedios].toFixed(
                                  1,
                                )}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="promedios" className="mt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Matrícula</TableHead>
                          <TableHead className="font-semibold">Alumno</TableHead>
                          <TableHead className="text-center font-semibold">Parcial 1</TableHead>
                          <TableHead className="text-center font-semibold">Parcial 2</TableHead>
                          <TableHead className="text-center font-semibold">Parcial 3</TableHead>
                          <TableHead className="text-center font-semibold">Promedio Final</TableHead>
                          <TableHead className="text-center font-semibold">Situación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alumnos.map((alumno) => (
                          <TableRow key={alumno.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-[#bc4b26]">{alumno.matricula}</TableCell>
                            <TableCell className="font-medium">{alumno.nombreCompleto}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-medium">
                                {alumno.promedios.parcial1 > 0 ? alumno.promedios.parcial1.toFixed(1) : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-medium">
                                {alumno.promedios.parcial2 > 0 ? alumno.promedios.parcial2.toFixed(1) : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-medium">
                                {alumno.promedios.parcial3 > 0 ? alumno.promedios.parcial3.toFixed(1) : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  alumno.promedios.final >= 8
                                    ? "default"
                                    : alumno.promedios.final >= 6
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="font-semibold text-sm px-3 py-1"
                              >
                                {alumno.promedios.final > 0 ? alumno.promedios.final.toFixed(1) : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={getVariantBySituacion(alumno.situacion)}
                                className="font-medium text-sm px-3 py-1"
                              >
                                {alumno.situacion.charAt(0).toUpperCase() + alumno.situacion.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!selectedAsignatura && (
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-[#bc4b26]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecciona un grupo y asignatura</h3>
              <p className="text-gray-500 mb-6">
                Elige el grupo y la asignatura para comenzar a gestionar las calificaciones
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Calculator className="h-4 w-4 mr-1" />
                  Cálculo automático de promedios
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Determinación de situación académica
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
