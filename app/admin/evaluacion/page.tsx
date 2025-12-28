"use client"

import { useState, useEffect } from "react"
import { EvaluationCriteriaPanel, type EvaluationCriteria } from "@/components/evaluation-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "react-toastify"
import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"

interface CourseGroupOption {
  id: number
  course: { id: number; name: string }
  group: { id: number; name: string; semester: number; period?: { name: string } }
  user: { id: number; fullName: string; email: string }
  schedule?: string
}

export default function EvaluacionPage() {
  const [courseGroups, setCourseGroups] = useState<CourseGroupOption[]>([])
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<number | null>(1) // Pre-seleccionar el primero
  const [selectedCourseGroup, setSelectedCourseGroup] = useState<CourseGroupOption | null>(null)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<EvaluationCriteria>>({})

  useEffect(() => {
    loadCourseGroups()
  }, [])

  useEffect(() => {
    if (selectedCourseGroupId) {
      loadCourseGroupData(selectedCourseGroupId)
    }
  }, [selectedCourseGroupId])

  const loadCourseGroups = async () => {
    setIsLoadingGroups(true)
    try {
      // Datos mock completos y variados
      const mockCourseGroups: CourseGroupOption[] = [
        {
          id: 1,
          course: { id: 1, name: "Ecología" },
          group: { id: 1, name: "Grupo A", semester: 3, period: { name: "2023-3" } },
          user: { id: 1, fullName: "EVANGELINA REYES AYALA", email: "evangelina@example.com" },
          schedule: "Lunes y Miércoles 10:00-12:00"
        },
        {
          id: 2,
          course: { id: 2, name: "Matemáticas Avanzadas" },
          group: { id: 2, name: "Grupo B", semester: 2, period: { name: "2023-3" } },
          user: { id: 2, fullName: "JUAN PÉREZ GARCÍA", email: "juan@example.com" },
          schedule: "Martes y Jueves 14:00-16:00"
        },
        {
          id: 3,
          course: { id: 3, name: "Historia de México" },
          group: { id: 3, name: "Grupo C", semester: 1, period: { name: "2023-3" } },
          user: { id: 3, fullName: "MARÍA GONZÁLEZ LÓPEZ", email: "maria@example.com" },
          schedule: "Viernes 09:00-11:00"
        },
        {
          id: 4,
          course: { id: 4, name: "Química Orgánica" },
          group: { id: 4, name: "Grupo D", semester: 4, period: { name: "2024-1" } },
          user: { id: 4, fullName: "CARLOS RODRÍGUEZ MARTÍNEZ", email: "carlos@example.com" },
          schedule: "Lunes, Miércoles y Viernes 08:00-10:00"
        },
        {
          id: 5,
          course: { id: 5, name: "Física Aplicada" },
          group: { id: 5, name: "Grupo E", semester: 5, period: { name: "2024-1" } },
          user: { id: 5, fullName: "ANA LÓPEZ SÁNCHEZ", email: "ana@example.com" },
          schedule: "Martes y Jueves 11:00-13:00"
        },
        {
          id: 6,
          course: { id: 6, name: "Literatura Universal" },
          group: { id: 6, name: "Grupo F", semester: 2, period: { name: "2023-3" } },
          user: { id: 6, fullName: "ROBERTO HERNÁNDEZ TORRES", email: "roberto@example.com" },
          schedule: "Lunes 15:00-17:00"
        },
        {
          id: 7,
          course: { id: 7, name: "Biología Celular" },
          group: { id: 7, name: "Grupo G", semester: 3, period: { name: "2023-3" } },
          user: { id: 7, fullName: "LAURA MORALES DÍAZ", email: "laura@example.com" },
          schedule: "Miércoles 13:00-15:00"
        },
        {
          id: 8,
          course: { id: 8, name: "Estadística" },
          group: { id: 8, name: "Grupo H", semester: 4, period: { name: "2024-1" } },
          user: { id: 8, fullName: "FERNANDO CASTRO RUIZ", email: "fernando@example.com" },
          schedule: "Jueves 16:00-18:00"
        }
      ]
      
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 500))
      setCourseGroups(mockCourseGroups)
    } catch (error) {
      console.error('Error al cargar course groups:', error)
      toast.error('Error al cargar los grupos de cursos')
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const loadCourseGroupData = async (courseGroupId: number) => {
    setIsLoadingData(true)
    try {
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Encontrar el course group seleccionado
      const found = courseGroups.find(cg => cg.id === courseGroupId)
      if (found) {
        setSelectedCourseGroup(found)
      }

      // Intentar cargar desde localStorage primero (simula datos guardados)
      const savedData = localStorage.getItem(`ponderaciones_${courseGroupId}`)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          if (parsed.values) {
            setInitialValues(parsed.values)
            return
          }
        } catch (e) {
          console.error('Error al parsear datos guardados:', e)
        }
      }

      // Ponderaciones mock variadas según el curso (para mostrar diferentes escenarios)
      const mockPonderaciones: Record<number, Partial<EvaluationCriteria>> = {
        1: {
          // Ecología - valores estándar
          attendance: 10,
          activities: 20,
          evidence: 20,
          integrativeProduct: 20,
          exam: 30
        },
        2: {
          // Matemáticas - más peso en examen
          attendance: 5,
          activities: 15,
          evidence: 15,
          integrativeProduct: 15,
          exam: 50
        },
        3: {
          // Historia - más peso en actividades y evidencias
          attendance: 15,
          activities: 25,
          evidence: 25,
          integrativeProduct: 15,
          exam: 20
        },
        4: {
          // Química - balanceado
          attendance: 10,
          activities: 20,
          evidence: 20,
          integrativeProduct: 20,
          exam: 30
        },
        5: {
          // Física - más examen
          attendance: 10,
          activities: 15,
          evidence: 15,
          integrativeProduct: 20,
          exam: 40
        },
        6: {
          // Literatura - más actividades
          attendance: 10,
          activities: 30,
          evidence: 25,
          integrativeProduct: 20,
          exam: 15
        },
        7: {
          // Biología - más evidencias
          attendance: 10,
          activities: 20,
          evidence: 30,
          integrativeProduct: 20,
          exam: 20
        },
        8: {
          // Estadística - más producto integrador
          attendance: 10,
          activities: 15,
          evidence: 15,
          integrativeProduct: 30,
          exam: 30
        }
      }

      // Usar ponderaciones específicas o valores por defecto
      const ponderaciones = mockPonderaciones[courseGroupId] || {
        attendance: 10,
        activities: 20,
        evidence: 20,
        integrativeProduct: 20,
        exam: 30
      }

      setInitialValues(ponderaciones)
    } catch (error) {
      console.error('Error al cargar datos del curso:', error)
      toast.error('Error al cargar los datos del curso')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSave = async (values: EvaluationCriteria) => {
    if (!selectedCourseGroupId) return

    try {
      // Simular guardado (mock)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Guardar en localStorage como mock
      const savedData = {
        courseGroupId: selectedCourseGroupId,
        values,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(`ponderaciones_${selectedCourseGroupId}`, JSON.stringify(savedData))
      
      toast.success('Ponderaciones guardadas correctamente')
      
      // Actualizar valores iniciales para reflejar los cambios
      setInitialValues(values)
    } catch (error) {
      console.error('Error al guardar ponderaciones:', error)
      toast.error('Error al guardar las ponderaciones')
      throw error
    }
  }

  const getCourseGroupLabel = (cg: CourseGroupOption) => {
    const courseName = cg.course?.name || 'Sin asignatura'
    const groupName = cg.group?.name || 'Sin grupo'
    const semester = cg.group?.semester || ''
    const teacherName = cg.user?.fullName || 'Sin docente'
    return `${courseName} - ${groupName} (${semester}) - ${teacherName}`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Configuración de Ponderaciones</h1>
            <p className="text-muted-foreground">
              Establece las ponderaciones de evaluación para cada curso
            </p>
          </div>
        </div>
      </div>

      {/* Selector de curso/grupo */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Curso y Grupo</CardTitle>
          <CardDescription>
            Elige el curso y grupo para configurar las ponderaciones de evaluación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-group-select">Curso - Grupo</Label>
              <Select
                value={selectedCourseGroupId?.toString() || ""}
                onValueChange={(value) => setSelectedCourseGroupId(Number(value))}
                disabled={isLoadingGroups}
              >
                <SelectTrigger id="course-group-select" className="w-full">
                  <SelectValue placeholder="Selecciona un curso y grupo" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingGroups ? (
                    <div className="flex items-center justify-center p-4">
                      <LoadingSpinner />
                    </div>
                  ) : courseGroups.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay cursos disponibles
                    </div>
                  ) : (
                    courseGroups.map((cg) => (
                      <SelectItem key={cg.id} value={cg.id.toString()}>
                        {getCourseGroupLabel(cg)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de evaluación */}
      {selectedCourseGroupId && (
        <div className="space-y-4">
          {isLoadingData ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </CardContent>
            </Card>
          ) : (
            <EvaluationCriteriaPanel
              teacherName={selectedCourseGroup?.user?.fullName || ""}
              semester={selectedCourseGroup?.group?.semester}
              subject={selectedCourseGroup?.course?.name || ""}
              safis={selectedCourseGroup?.group?.period?.name || ""}
              initialValues={initialValues}
              onSave={handleSave}
              isLoading={isLoadingData}
            />
          )}
        </div>
      )}

      {/* Mensaje cuando no hay selección */}
      {!selectedCourseGroupId && !isLoadingGroups && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Selecciona un curso y grupo para comenzar a configurar las ponderaciones
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

