"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useCourse } from "@/lib/hooks/useCourse"
import { useGroup } from "@/lib/hooks/useGroup"
import { CourseService } from "@/lib/services/course.service"
import { Course, CourseGroup, Student } from "@/lib/mock-data"
import { Users, BookOpen, Calendar, GraduationCap, Plus, BarChart3, Clock, Search, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useStudent } from "@/lib/hooks/useStudent"
import { toast } from 'react-toastify';
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { studentService } from "@/lib/services/student.service"

interface AttendanceData {
  id?: number;
  courseGroupStudentId?: number;
  courseGroupStudent?: {
    id: number;
    isDeleted: boolean;
    courseGroup: any;
    student: any;
  };
  date: string;
  attend: number; // 1=Presente, 2=Ausente, 3=Retardo
  partial: number; // 1=Primer Parcial, 2=Segundo Parcial, 3=Tercer Parcial
}

type EvalType = "actividades" | "evidencias";

export default function MaestroAsignaturas() {
  const { user } = useAuth()
  const { handleGetCourses, handleGetCourseGroupWithStudents, handleGetStudentsByCourseGroup } = useCourse()
  const { handleGetGroups } = useGroup()
  const { handleCreateStudent } = useStudent()
  const [asignaturas, setAsignaturas] = useState<Course[]>([])
  const [filteredAsignaturas, setFilteredAsignaturas] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedCourseGroup, setSelectedCourseGroup] = useState<any | null>(null)
  const [alumnos, setAlumnos] = useState<(Student & { courseGroupStudentId?: number })[]>([])
  const [isLoadingAlumnos, setIsLoadingAlumnos] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    registrationNumber: "",
    semester: 1,
  })
  const itemsPerPage = 5
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [searchStudentTerm, setSearchStudentTerm] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [currentStudentPage, setCurrentStudentPage] = useState(1)
  const [totalStudentPages, setTotalStudentPages] = useState(1)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const studentsPerPage = 5
  const [currentAlumnosPage, setCurrentAlumnosPage] = useState(1)
  const [totalAlumnosPages, setTotalAlumnosPages] = useState(1)
  const alumnosPerPage = 5
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<(Student & { courseGroupStudentId?: number }) | null>(null)
  const [isPonderacionesModalOpen, setIsPonderacionesModalOpen] = useState(false)
  const [ponderacionesCurso, setPonderacionesCurso] = useState<{
    asistencia: number,
    actividades: number,
    evidencias: number,
    producto: number,
    examen: number
  } | null>(null)
  const [ponderacionesIds, setPonderacionesIds] = useState<{
    asistencia?: number,
    actividades?: number,
    evidencias?: number,
    producto?: number,
    examen?: number
  }>({})
  const [selectedCourseGroupForPonderaciones, setSelectedCourseGroupForPonderaciones] = useState<any | null>(null)
  const [isAsistenciaModalOpen, setIsAsistenciaModalOpen] = useState(false)
  const [asistenciaAlumnos, setAsistenciaAlumnos] = useState<(Student & { courseGroupStudentId?: number, attendanceId?: number | null, attend?: number })[]>([])
  const [asistenciaGrupo, setAsistenciaGrupo] = useState<{ asignatura: any, courseGroup: any } | null>(null)
  const [asistenciaFecha, setAsistenciaFecha] = useState<string>("")
  const [asistenciaParcial, setAsistenciaParcial] = useState<number>(1)
  const [isLoadingAsistencia, setIsLoadingAsistencia] = useState(false)
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)
  const [isLoadingDateChange, setIsLoadingDateChange] = useState(false)
  const [isEvaluacionesModalOpen, setIsEvaluacionesModalOpen] = useState(false)
  const [isActividadesModalOpen, setIsActividadesModalOpen] = useState(false)
  const [alumnoEvaluacion, setAlumnoEvaluacion] = useState<any | null>(null)
  const [selectedCourseGroupForActividades, setSelectedCourseGroupForActividades] = useState<any | null>(null)
  const [evaluaciones, setEvaluaciones] = useState({
    actividades: Array(18).fill(0),
    evidencias: Array(18).fill(0),
    producto: 0,
    examen: 0,
  })
  const [evaluacionesParciales, setEvaluacionesParciales] = useState({
    actividades: Array(18).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
    evidencias: Array(18).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
    producto: { name: '', grade: 0, id: null, partialEvaluationId: null },
    examen: { name: '', grade: 0, id: null, partialEvaluationId: null },
  })
  const [actividadesDefinidas, setActividadesDefinidas] = useState({
    actividades: Array(18).fill({ name: '', id: null }),
    evidencias: Array(18).fill({ name: '', id: null }),
    producto: { name: 'Producto del Parcial', id: null },
    examen: { name: 'Examen Parcial', id: null },
  })
  const [isSavingPartial, setIsSavingPartial] = useState(false)
  const [isSavingActividad, setIsSavingActividad] = useState(false)
  const [selectedPartial, setSelectedPartial] = useState(1)
  const [calificacionParcial, setCalificacionParcial] = useState<number | null>(null)
  // 1. Agregar estados para el modal de calificación final
  const [isCalificacionFinalModalOpen, setIsCalificacionFinalModalOpen] = useState(false);
  const [alumnoCalificacionFinal, setAlumnoCalificacionFinal] = useState<any | null>(null);
  const [calificacionesFinales, setCalificacionesFinales] = useState<{
    parcial1: number|null,
    parcial2: number|null,
    parcial3: number|null,
    promedio: number|null,
    asistencia: number|null,
    exentos: number|null
  } | null>(null);
  // 1. Agrega estados para el valor de ordinario y el id de FinalGrade
  const [finalGradeId, setFinalGradeId] = useState<number | null>(null);
  const [inputOrdinario, setInputOrdinario] = useState<string>("");
  const [inputExtraordinario, setInputExtraordinario] = useState<string>("");
  const [isSavingOrdinario, setIsSavingOrdinario] = useState(false);
  const [isSavingExtraordinario, setIsSavingExtraordinario] = useState(false);
  const [ordinarioGuardado, setOrdinarioGuardado] = useState<number | null>(null);
  const [extraordinarioGuardado, setExtraordinarioGuardado] = useState<number | null>(null);



  // Debug: Monitorear cambios en asistenciaAlumnos
  useEffect(() => {
    console.log('Estado actual de asistenciaAlumnos:', asistenciaAlumnos)
  }, [asistenciaAlumnos])

  const loadAsignaturas = async (page = 1) => {
    try {
      const limit = itemsPerPage
      const offset = (page - 1) * limit
      const data = await handleGetCourses(limit, offset)
      setAsignaturas(data.items || data)
      setFilteredAsignaturas(data.items || data)
      setTotalItems(data.total || (data.items ? data.items.length : data.length))
      setCurrentPage(page)
    } catch (error) {
      console.error('Error al cargar las asignaturas:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadAsignaturas(1)
    }
  }, [user])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    loadAsignaturas(page)
  }

  // Helper para headers autenticados
  function getAuthHeaders() {
    const token = (user as any)?.token || "";
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAsignaturas(asignaturas)
    } else {
      const filtered = asignaturas.filter((asignatura) =>
        asignatura.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAsignaturas(filtered)
    }
  }, [searchTerm, asignaturas])

  const currentAsignaturas = filteredAsignaturas

  const handleOpenAlumnosModal = async (groupId: number, course: Course, courseGroup: CourseGroup) => {
    setSelectedGroupId(groupId)
    setSelectedCourse(course)
    setSelectedCourseGroup(courseGroup)
    setIsModalOpen(true)
    setIsLoadingAlumnos(true)
    try {
      console.log('GroupId:', groupId)
      console.log('Course:', course)
      console.log('CourseGroup:', courseGroup)
      const response = await handleGetStudentsByCourseGroup(courseGroup.id!, alumnosPerPage, 0)
      console.log('Respuesta del servidor:', response)
      
      // Extraer estudiantes de la estructura anidada
      let students = []
      if (Array.isArray(response)) {
        // Si es un array directo de courseGroupStudents
        students = response
      } else if (response && response.items) {
        // Si tiene estructura { items: [...] }
        students = response.items
      } else if (response && response.coursesGroupsStudents) {
        // Si tiene estructura anidada con coursesGroupsStudents
        students = response.coursesGroupsStudents
      } else {
        students = []
      }
      
      console.log('Estudiantes extraídos:', students)
      
      const mappedStudents = students.map((item: any) => ({
        id: item.student.id,
        fullName: item.student.fullName,
        semester: item.student.semester,
        registrationNumber: item.student.registrationNumber,
        courseGroupStudentId: item.id
      }))
      setAlumnos(mappedStudents)
      setCurrentAlumnosPage(1)
    } catch (error) {
      console.error('Error al cargar los alumnos:', error)
      toast.error('Error al cargar los alumnos')
    } finally {
      setIsLoadingAlumnos(false)
    }
  }

  const handleAlumnosPageChange = async (page: number) => {
    if (!selectedCourseGroup?.id) return
    setIsLoadingAlumnos(true)
    try {
      const offset = (page - 1) * alumnosPerPage
      const response = await handleGetStudentsByCourseGroup(selectedCourseGroup.id, alumnosPerPage, offset)
      
      // Extraer estudiantes de la estructura anidada
      let students = []
      if (Array.isArray(response)) {
        students = response
      } else if (response && response.items) {
        students = response.items
      } else if (response && response.coursesGroupsStudents) {
        students = response.coursesGroupsStudents
      } else {
        students = []
      }
      
      const mappedStudents = students.map((item: any) => ({
        id: item.student.id,
        fullName: item.student.fullName,
        semester: item.student.semester,
        registrationNumber: item.student.registrationNumber,
        courseGroupStudentId: item.id
      }))
      setAlumnos(mappedStudents)
      setCurrentAlumnosPage(page)
    } catch (error) {
      console.error('Error al cargar los alumnos:', error)
      toast.error('Error al cargar los alumnos')
    } finally {
      setIsLoadingAlumnos(false)
    }
  }

  const handleDeleteStudent = async (courseGroupStudentId: number | undefined) => {
    if (!courseGroupStudentId) return
    try {
      await CourseService.deleteStudentToCourse(courseGroupStudentId)
      toast.success('Alumno eliminado exitosamente')
      
      // Recargar la lista de estudiantes
      if (selectedCourseGroup?.id) {
        const offset = (currentAlumnosPage - 1) * alumnosPerPage
        const response = await handleGetStudentsByCourseGroup(selectedCourseGroup.id, alumnosPerPage, offset)
        
        // Extraer estudiantes de la estructura anidada
        let students = []
        if (Array.isArray(response)) {
          students = response
        } else if (response && response.items) {
          students = response.items
        } else if (response && response.coursesGroupsStudents) {
          students = response.coursesGroupsStudents
        } else {
          students = []
        }
        
        const mappedStudents = students.map((item: any) => ({
          id: item.student.id,
          fullName: item.student.fullName,
          semester: item.student.semester,
          registrationNumber: item.student.registrationNumber,
          courseGroupStudentId: item.id
        }))
        setAlumnos(mappedStudents)
      }
      
      // Limpiar el estado del modal
      setStudentToDelete(null)
    } catch (error) {
      console.error('Error al eliminar el alumno:', error)
      toast.error('Error al eliminar el alumno')
    }
  }

  const handleOpenCreateModal = () => {
    if (!selectedCourse || !selectedCourseGroup) {
      toast.error("No se ha seleccionado un curso")
      return
    }
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setFormData({
      fullName: "",
      registrationNumber: "",
      semester: 1,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "semester" ? parseInt(value) || 1 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const studentData = {
        ...formData
      }

      const student = await handleCreateStudent(studentData)
      await CourseService.assignStudentToCourseGroup(selectedCourseGroup.id!, student.id!)
      
      toast.success('Alumno agregado exitosamente')
      handleCloseCreateModal()

      // Recargar la lista de estudiantes
      if (selectedCourseGroup?.id) {
        const offset = (currentAlumnosPage - 1) * alumnosPerPage
        const response = await handleGetStudentsByCourseGroup(selectedCourseGroup.id, alumnosPerPage, offset)
        
        // Extraer estudiantes de la estructura anidada
        let students = []
        if (Array.isArray(response)) {
          students = response
        } else if (response && response.items) {
          students = response.items
        } else if (response && response.coursesGroupsStudents) {
          students = response.coursesGroupsStudents
        } else {
          students = []
        }
        
        const mappedStudents = students.map((item: any) => ({
          id: item.student.id,
          fullName: item.student.fullName,
          semester: item.student.semester,
          registrationNumber: item.student.registrationNumber,
          courseGroupStudentId: item.id
        }))
        setAlumnos(mappedStudents)
      }

    } catch (error) {
      console.error("Error al crear el alumno:", error)
      toast.error("Error al crear el alumno")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenSelectModal = async () => {
    if (!selectedCourse || !selectedCourseGroup) {
      toast.error("No se ha seleccionado un curso")
      return
    }
    setIsSelectModalOpen(true)
    setSearchStudentTerm("")
    setCurrentStudentPage(1)
    await loadStudents(1)
  }

  const loadStudents = async (page: number) => {
    if (!selectedCourseGroup?.id) {
      return;
    }

    setIsLoadingStudents(true);
    try {
      const offset = (page - 1) * studentsPerPage;
      const students = await studentService.getStudentsNotInCourseGroup(
        selectedCourseGroup.id,
        studentsPerPage,
        offset,
        searchStudentTerm || undefined
      );

      if (Array.isArray(students)) {
        setAllStudents(students);
        setFilteredStudents(students);
      } else {
        setAllStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error('Error al cargar los alumnos:', error);
      toast.error('Error al cargar los alumnos');
      setAllStudents([]);
      setFilteredStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStudentPageChange = async (page: number) => {
    setCurrentStudentPage(page)
    await loadStudents(page)
  }

  const handleAddStudentToGroup = async (student: Student) => {
    if (!selectedCourseGroup?.id) return
    try {
      await CourseService.assignStudentToCourseGroup(selectedCourseGroup.id, student.id!)
      toast.success('Alumno agregado exitosamente')
      setIsSelectModalOpen(false)

      // Recargar la lista de estudiantes
      const offset = (currentAlumnosPage - 1) * alumnosPerPage
      const response = await handleGetStudentsByCourseGroup(selectedCourseGroup.id, alumnosPerPage, offset)
      
      // Extraer estudiantes de la estructura anidada
      let students = []
      if (Array.isArray(response)) {
        students = response
      } else if (response && response.items) {
        students = response.items
      } else if (response && response.coursesGroupsStudents) {
        students = response.coursesGroupsStudents
      } else {
        students = []
      }
      
      const mappedStudents = students.map((item: any) => ({
        id: item.student.id,
        fullName: item.student.fullName,
        semester: item.student.semester,
        registrationNumber: item.student.registrationNumber,
        courseGroupStudentId: item.id
      }))
      setAlumnos(mappedStudents)
    } catch (error) {
      console.error('Error al agregar el alumno:', error)
      toast.error('Error al agregar el alumno')
    }
  }

  const handleOpenPonderacionesModal = async (course: Course, courseGroup: any) => {
    setSelectedCourseGroupForPonderaciones(courseGroup)
    setIsPonderacionesModalOpen(true)
    
    try {
      // Cargar las ponderaciones usando el endpoint individual
      const courseGroupWithPonderaciones = await CourseService.getCourseGroupIndividual(courseGroup.id)
      
      // Usar las ponderaciones que vienen en el courseGroup
      const gradingschemes = courseGroupWithPonderaciones.coursesGroupsGradingschemes || []
      
      // Mapear las ponderaciones existentes
      const ponderaciones = {
        asistencia: 0,
        actividades: 0,
        evidencias: 0,
        producto: 0,
        examen: 0
      }
      
      const ids: {
        asistencia?: number,
        actividades?: number,
        evidencias?: number,
        producto?: number,
        examen?: number
      } = {}
      
      gradingschemes.forEach((scheme: any) => {
        const type = scheme.type.toLowerCase()
        if (type === 'asistencia') {
          ponderaciones.asistencia = scheme.percentage
          ids.asistencia = scheme.id
        } else if (type === 'actividades') {
          ponderaciones.actividades = scheme.percentage
          ids.actividades = scheme.id
        } else if (type === 'evidencias') {
          ponderaciones.evidencias = scheme.percentage
          ids.evidencias = scheme.id
        } else if (type === 'producto') {
          ponderaciones.producto = scheme.percentage
          ids.producto = scheme.id
        } else if (type === 'examen') {
          ponderaciones.examen = scheme.percentage
          ids.examen = scheme.id
        }
      })
      
      setPonderacionesCurso(ponderaciones)
      setPonderacionesIds(ids)
      setSelectedCourseGroupForPonderaciones(courseGroupWithPonderaciones)
      
    } catch (error) {
      console.error('Error al cargar las ponderaciones:', error)
      toast.error('Error al cargar las ponderaciones')
      
      // Si hay error, inicializar con valores por defecto
      setPonderacionesCurso({
        asistencia: 0,
        actividades: 0,
        evidencias: 0,
        producto: 0,
        examen: 0
      })
      setPonderacionesIds({})
    }
  }

  const handlePonderacionChange = async (type: string, value: number) => {
    if (!selectedCourseGroupForPonderaciones?.id) return
    
    // Solo actualizar el estado local, no hacer llamada al backend
    setPonderacionesCurso(prev => prev ? {
      ...prev,
      [type]: value
    } : null)
  }

  const handlePonderacionKeyPress = async (type: string, value: number, event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return
    await handlePonderacionButtonClick(type, value)
  }

  const handlePonderacionButtonClick = async (type: string, value: number) => {
    if (!selectedCourseGroupForPonderaciones?.id) return
    
    try {
      const gradingSchemeData = {
        courseGroupId: selectedCourseGroupForPonderaciones.id,
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalizar primera letra
        percentage: value
      }
      
      // Verificar si ya existe la ponderación
      const existingId = ponderacionesIds[type as keyof typeof ponderacionesIds]
      
      if (existingId) {
        // Actualizar ponderación existente
        await CourseService.updateGradingScheme(existingId, gradingSchemeData)
        toast.success('Ponderación actualizada correctamente')
      } else {
        // Crear nueva ponderación
        await CourseService.createGradingScheme(gradingSchemeData)
        toast.success('Ponderación creada correctamente')
        
        // Recargar las ponderaciones para obtener los IDs actualizados
        await reloadPonderacionesAfterCreate()
      }
      
    } catch (error) {
      console.error('Error al guardar la ponderación:', error)
      toast.error('Error al guardar la ponderación')
    }
  }

  const reloadPonderacionesAfterCreate = async () => {
    if (!selectedCourseGroupForPonderaciones?.id) return
    
    try {
      // Recargar el courseGroup individual para obtener las ponderaciones actualizadas
      const updatedCourseGroup = await CourseService.getCourseGroupIndividual(selectedCourseGroupForPonderaciones.id)
      
      // Usar las ponderaciones que vienen en el courseGroup actualizado
      const gradingschemes = updatedCourseGroup.coursesGroupsGradingschemes || []
      
      // Mapear las ponderaciones actualizadas
      const ponderaciones = {
        asistencia: 0,
        actividades: 0,
        evidencias: 0,
        producto: 0,
        examen: 0
      }
      
      const ids: {
        asistencia?: number,
        actividades?: number,
        evidencias?: number,
        producto?: number,
        examen?: number
      } = {}
      
      gradingschemes.forEach((scheme: any) => {
        const type = scheme.type.toLowerCase()
        if (type === 'asistencia') {
          ponderaciones.asistencia = scheme.percentage
          ids.asistencia = scheme.id
        } else if (type === 'actividades') {
          ponderaciones.actividades = scheme.percentage
          ids.actividades = scheme.id
        } else if (type === 'evidencias') {
          ponderaciones.evidencias = scheme.percentage
          ids.evidencias = scheme.id
        } else if (type === 'producto') {
          ponderaciones.producto = scheme.percentage
          ids.producto = scheme.id
        } else if (type === 'examen') {
          ponderaciones.examen = scheme.percentage
          ids.examen = scheme.id
        }
      })
      
      setPonderacionesCurso(ponderaciones)
      setPonderacionesIds(ids)
      setSelectedCourseGroupForPonderaciones(updatedCourseGroup)
      
    } catch (error) {
      console.error('Error al recargar las ponderaciones:', error)
      toast.error('Error al recargar los datos')
    }
  }

  const handleOpenAsistenciaModal = async (asignatura: any, courseGroup: any) => {
    setAsistenciaGrupo({ asignatura, courseGroup })
    setIsAsistenciaModalOpen(true)
    setIsLoadingAsistencia(true)
    // Fecha actual por defecto
    const currentDate = new Date().toISOString().slice(0, 10)
    setAsistenciaFecha(currentDate)
    // Parcial por defecto
    setAsistenciaParcial(1)
    
    // Cargar los alumnos del grupo
    try {
      const response = await handleGetStudentsByCourseGroup(courseGroup.id, 100, 0) // Cargar todos los alumnos
      const students = Array.isArray(response) ? response : response.items || []
      
      // Obtener las asistencias existentes para la fecha actual y parcial desde el backend
      let existingAttendances: AttendanceData[] = []
      try {
        const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(courseGroup.id, currentDate)
        existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        // Filtrar por parcial
        existingAttendances = existingAttendances.filter((att: AttendanceData) => att.partial === 1)
        console.log('Asistencias existentes para parcial 1:', existingAttendances)
      } catch (attendanceError) {
        console.log('No se encontraron asistencias para esta fecha y parcial, se crearán nuevas')
        existingAttendances = []
      }
      
      // Crear un mapa de asistencias por courseGroupStudentId
      const attendanceMap = new Map()
      const attendanceIdMap = new Map() // Nuevo mapa para guardar los IDs
      existingAttendances.forEach((att: AttendanceData) => {
        console.log('Procesando asistencia:', att)
        // El courseGroupStudentId está anidado dentro de courseGroupStudent
        const courseGroupStudentId = att.courseGroupStudent?.id || att.courseGroupStudentId
        console.log('courseGroupStudentId extraído:', courseGroupStudentId)
        attendanceMap.set(courseGroupStudentId, att.attend)
        attendanceIdMap.set(courseGroupStudentId, att.id) // Guardar el ID de la asistencia
      })
      
      console.log('Mapa de asistencias:', Object.fromEntries(attendanceMap))
      console.log('Mapa de IDs de asistencias:', Object.fromEntries(attendanceIdMap))
      
      const mappedStudents = students.map((item: any) => {
        const courseGroupStudentId = item.id // Este es el ID de la relación courseGroup-student
        const attendValue = attendanceMap.has(courseGroupStudentId) ? attendanceMap.get(courseGroupStudentId) : 1 // 1 = Presente por defecto
        const attendanceId = attendanceIdMap.has(courseGroupStudentId) ? attendanceIdMap.get(courseGroupStudentId) : null
        
        console.log(`Alumno ${item.student.fullName}: courseGroupStudentId=${courseGroupStudentId}, attend=${attendValue}, attendanceId=${attendanceId}`)
        
        return {
          id: item.student.id,
          fullName: item.student.fullName,
          semester: item.student.semester,
          registrationNumber: item.student.registrationNumber,
          courseGroupStudentId: courseGroupStudentId, // Este es el ID que necesitamos para el endpoint
          attend: attendValue, // 1=Presente, 2=Ausente, 3=Retardo
          attendanceId: attendanceId // Guardar el ID de la asistencia si existe
        }
      })
      
      console.log('Alumnos mapeados:', mappedStudents)
      setAsistenciaAlumnos(mappedStudents)
    } catch (error) {
      console.error('Error al cargar los alumnos para asistencia:', error)
      toast.error('Error al cargar los alumnos')
      setAsistenciaAlumnos([])
    } finally {
      setIsLoadingAsistencia(false)
    }
  }

  const handleCloseAsistenciaModal = () => {
    setIsAsistenciaModalOpen(false)
    setAsistenciaGrupo(null)
    setAsistenciaAlumnos([])
    setAsistenciaFecha("")
    setAsistenciaParcial(1)
    setIsLoadingAsistencia(false)
    setIsSavingAttendance(false)
    setIsLoadingDateChange(false)
  }

  const handleSaveAttendance = async () => {
    if (!asistenciaFecha || asistenciaAlumnos.length === 0) {
      toast.error('Por favor selecciona una fecha, un parcial y verifica que hay alumnos')
      return
    }

    setIsSavingAttendance(true)
    
    try {
      console.log('=== INICIANDO GUARDADO DE ASISTENCIAS ===')
      console.log('Fecha:', asistenciaFecha)
      console.log('Alumnos a procesar:', asistenciaAlumnos)
      
      // Procesar cada asistencia individualmente
      for (const alumno of asistenciaAlumnos) {
        if (!alumno.courseGroupStudentId) {
          console.error('❌ courseGroupStudentId es requerido para:', alumno)
          continue
        }
        
        const attendanceData = {
          courseGroupStudentId: alumno.courseGroupStudentId as number,
          date: asistenciaFecha,
          attend: alumno.attend || 1, // Enviar el valor numérico (1=Presente, 2=Ausente, 3=Retardo)
          partial: asistenciaParcial // Agregar el parcial seleccionado
        }
        
        
        try {
          if (alumno.attendanceId) {
            // ACTUALIZAR ASISTENCIA EXISTENTE
            console.log(`🔄 Actualizando asistencia existente con ID: ${alumno.attendanceId}`)
            console.log(`📡 Llamando a: PATCH /api/courses-groups-attendances/${alumno.attendanceId}`)
            
            const updatedAttendance = await CourseService.updateAttendance(alumno.attendanceId, attendanceData)
            console.log('✅ Respuesta del servidor (actualización):', updatedAttendance)
            
            if (updatedAttendance) {
              console.log('✅ Asistencia actualizada exitosamente en el backend')
            } else {
              console.error('❌ No se recibió respuesta del servidor para la actualización')
              toast.error(`Error al actualizar asistencia de ${alumno.fullName}`)
            }
          } else {
            // CREAR NUEVA ASISTENCIA
            console.log('🆕 Creando nueva asistencia')
            console.log('📡 Llamando a: POST /api/courses-groups-attendances')
            
            const newAttendance = await CourseService.createAttendance(attendanceData)
            console.log('✅ Respuesta del servidor (creación):', newAttendance)
            
            if (newAttendance && newAttendance.id) {
              console.log('✅ Nueva asistencia creada exitosamente con ID:', newAttendance.id)
              
              // Actualizar el attendanceId en el estado local
              const updatedAlumnos = asistenciaAlumnos.map(a => 
                a.id === alumno.id 
                  ? { ...a, attendanceId: newAttendance.id }
                  : a
              )
              setAsistenciaAlumnos(updatedAlumnos)
              console.log('✅ Estado local actualizado con nuevo attendanceId')
            } else {
              console.error('❌ No se recibió ID válido del servidor para la nueva asistencia')
              toast.error(`Error al crear asistencia de ${alumno.fullName}`)
            }
          }
        } catch (error) {
          console.error(`❌ Error procesando asistencia para ${alumno.fullName}:`, error)
          console.error('Detalles del error:', {
            message: error instanceof Error ? error.message : 'Error desconocido',
            status: (error as any)?.status,
            response: (error as any)?.response
          })
          toast.error(`Error al procesar asistencia de ${alumno.fullName}`)
        }
      }
      
      console.log('\n=== FINALIZADO GUARDADO DE ASISTENCIAS ===')
      toast.success('Asistencia guardada correctamente')
      
    } catch (error) {
      console.error('❌ Error general al guardar la asistencia:', error)
      toast.error('Error al guardar la asistencia')
    } finally {
      setIsSavingAttendance(false)
    }
  }

  const handleParcialChange = (newParcial: number) => {
    setAsistenciaParcial(newParcial)
    
    if (!asistenciaGrupo?.courseGroup || !asistenciaFecha) return
    
    setIsLoadingDateChange(true)
    
    // Obtener las asistencias existentes para la nueva fecha y parcial desde el backend
    const loadAttendancesForParcial = async () => {
      try {
        const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(asistenciaGrupo.courseGroup.id, asistenciaFecha)
        const existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        // Filtrar por parcial
        const filteredAttendances = existingAttendances.filter((att: AttendanceData) => att.partial === newParcial)
        console.log('Asistencias para nueva fecha y parcial:', filteredAttendances)
        
        // Crear un mapa de asistencias por courseGroupStudentId
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        filteredAttendances.forEach((att: AttendanceData) => {
          const courseGroupStudentId = att.courseGroupStudent?.id || att.courseGroupStudentId
          if (courseGroupStudentId) {
            dateAttendanceMap.set(courseGroupStudentId, att.attend)
            dateAttendanceIdMap.set(courseGroupStudentId, att.id)
          }
        })
        
        // Actualizar las asistencias de los alumnos
        const updatedAlumnos = asistenciaAlumnos.map(alumno => {
          const attendValue = dateAttendanceMap.has(alumno.courseGroupStudentId) ? dateAttendanceMap.get(alumno.courseGroupStudentId) : 1 // 1 = Presente por defecto
          const attendanceId = dateAttendanceIdMap.has(alumno.courseGroupStudentId) ? dateAttendanceIdMap.get(alumno.courseGroupStudentId) : null
          
          return {
            ...alumno,
            attend: attendValue, // 1=Presente, 2=Ausente, 3=Retardo
            attendanceId: attendanceId
          }
        })
        
        console.log('Alumnos actualizados para nuevo parcial:', updatedAlumnos)
        setAsistenciaAlumnos(updatedAlumnos)
      } catch (error) {
        console.log('No se encontraron asistencias para esta fecha y parcial, se crearán nuevas')
        // Si no hay asistencias, resetear todos los attendanceId a null y attend a 1 (Presente)
        const updatedAlumnos = asistenciaAlumnos.map(alumno => ({
          ...alumno,
          attend: 1, // 1 = Presente por defecto
          attendanceId: null
        }))
        setAsistenciaAlumnos(updatedAlumnos)
      } finally {
        setIsLoadingDateChange(false)
      }
    }
    
    loadAttendancesForParcial()
  }

  const handleDateChange = (newDate: string) => {
    setAsistenciaFecha(newDate)
    
    if (!asistenciaGrupo?.courseGroup) return
    
    setIsLoadingDateChange(true)
    
    // Obtener las asistencias existentes para la nueva fecha desde el backend
    const loadAttendancesForDate = async () => {
      try {
        const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(asistenciaGrupo.courseGroup.id, newDate)
        const existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        // Filtrar por parcial
        const filteredAttendances = existingAttendances.filter((att: AttendanceData) => att.partial === asistenciaParcial)
        console.log('Asistencias para nueva fecha y parcial:', filteredAttendances)
        
        // Crear un mapa de asistencias por courseGroupStudentId
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        filteredAttendances.forEach((att: AttendanceData) => {
          const courseGroupStudentId = att.courseGroupStudent?.id || att.courseGroupStudentId
          if (courseGroupStudentId) {
            dateAttendanceMap.set(courseGroupStudentId, att.attend)
            dateAttendanceIdMap.set(courseGroupStudentId, att.id)
          }
        })
        
        // Actualizar las asistencias de los alumnos
        const updatedAlumnos = asistenciaAlumnos.map(alumno => {
          const attendValue = dateAttendanceMap.has(alumno.courseGroupStudentId) ? dateAttendanceMap.get(alumno.courseGroupStudentId) : 1 // 1 = Presente por defecto
          const attendanceId = dateAttendanceIdMap.has(alumno.courseGroupStudentId) ? dateAttendanceIdMap.get(alumno.courseGroupStudentId) : null
          
          return {
            ...alumno,
            attend: attendValue, // 1=Presente, 2=Ausente, 3=Retardo
            attendanceId: attendanceId
          }
        })
        
        console.log('Alumnos actualizados para nueva fecha:', updatedAlumnos)
        setAsistenciaAlumnos(updatedAlumnos)
      } catch (error) {
        console.log('No se encontraron asistencias para esta fecha, se crearán nuevas')
        // Si no hay asistencias, resetear todos los attendanceId a null y attend a 1 (Presente)
        const updatedAlumnos = asistenciaAlumnos.map(alumno => ({
          ...alumno,
          attend: 1, // 1 = Presente por defecto
          attendanceId: null
        }))
        setAsistenciaAlumnos(updatedAlumnos)
      } finally {
        setIsLoadingDateChange(false)
      }
    }
    
    loadAttendancesForDate()
  }

  const handlePartialEvaluationNameChange = (type: EvalType, idx: number, value: string) => {
    setEvaluacionesParciales(prev => ({
      ...prev,
      [type]: prev[type].map((item: any, i: number) => i === idx ? { ...item, name: value } : item)
    }))
  }

  const handlePartialEvaluationChange = (type: EvalType, idx: number, value: number) => {
    setEvaluacionesParciales(prev => ({
      ...prev,
      [type]: prev[type].map((item: any, i: number) => i === idx ? { ...item, grade: value } : item)
    }))
  }

  const handlePartialEvaluationKeyPress = async (
    type: "actividades" | "evidencias" | "producto" | "examen",
    idx: number,
    event: React.KeyboardEvent
  ) => {
    if (event.key !== 'Enter') return
    await handlePartialEvaluationButtonClick(type, idx)
  }

  const calcularCalificacionParcial = async () => {
    console.log('=== INICIANDO CÁLCULO DE CALIFICACIÓN PARCIAL ===')
    console.log('Ponderaciones actuales:', ponderacionesCurso)
    console.log('Evaluaciones parciales:', evaluacionesParciales)
    
    if (!ponderacionesCurso) {
      console.log('❌ No hay ponderaciones disponibles')
      return
    }
    
    let calificacionFinal = 0
    let totalPonderacion = 0
    
    // 1. Cálculo de Asistencia
    console.log('\n--- CÁLCULO DE ASISTENCIA ---')
    console.log('Ponderación de Asistencia:', ponderacionesCurso.asistencia, '%')
    
    if (ponderacionesCurso.asistencia > 0 && alumnoEvaluacion?.courseGroupStudentId) {
      try {
        console.log('PARCIAL ENVIADO AL ENDPOINT DE ASISTENCIAS:', selectedPartial);
        // Usar el método correcto para obtener todas las asistencias del alumno en el parcial
        const asistenciasAlumno = await CourseService.getAttendancesByCourseGroupStudentAndPartial(
          alumnoEvaluacion.courseGroupStudentId,
          selectedPartial
        );

        console.log('Asistencias del alumno en el parcial:', asistenciasAlumno);

        if (Array.isArray(asistenciasAlumno) && asistenciasAlumno.length > 0) {
          const asistenciasPresentes = asistenciasAlumno.filter((att) => att.attend === 1).length;
          const totalAsistencias = asistenciasAlumno.length;
          const porcentajeAsistencia = (asistenciasPresentes / totalAsistencias) * 100;
          const asistenciaPromedio = (porcentajeAsistencia / 100) * 10;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;

          console.log('Total de asistencias registradas:', totalAsistencias);
          console.log('Asistencias presentes:', asistenciasPresentes);
          console.log('Porcentaje de asistencia:', porcentajeAsistencia.toFixed(2) + '%');
          console.log('Promedio de Asistencia (0-10):', asistenciaPromedio.toFixed(2));
          console.log('Calificación de Asistencia:', calificacionAsistencia.toFixed(2));

          calificacionFinal += calificacionAsistencia;
          totalPonderacion += ponderacionesCurso.asistencia;
        } else {
          // No hay asistencias registradas para este alumno en el parcial
          const asistenciaPromedio = 0;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
          console.log('Promedio de Asistencia:', asistenciaPromedio);
          console.log('Calificación de Asistencia:', calificacionAsistencia);
        }
      } catch (error) {
        console.error('Error al obtener asistencias:', error);
        const asistenciaPromedio = 0;
        const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
        console.log('Promedio de Asistencia:', asistenciaPromedio);
        console.log('Calificación de Asistencia:', calificacionAsistencia);
      }
    } else {
      console.log('No hay ponderación de asistencia o no hay alumno seleccionado');
      const asistenciaPromedio = 0;
      const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
      console.log('Promedio de Asistencia:', asistenciaPromedio);
      console.log('Calificación de Asistencia:', calificacionAsistencia);
    }
    
    // 2. Cálculo de Actividades
    console.log('\n--- CÁLCULO DE ACTIVIDADES ---')
    console.log('Ponderación de Actividades:', ponderacionesCurso.actividades, '%')
    
    const actividadesValores = evaluacionesParciales.actividades
      .filter(item => item.grade > 0)
      .map(item => item.grade)
    
    console.log('Valores de actividades (solo > 0):', actividadesValores)
    
    if (actividadesValores.length > 0) {
      const promedioActividades = actividadesValores.reduce((sum, grade) => sum + grade, 0) / actividadesValores.length
      const calificacionActividades = (promedioActividades * ponderacionesCurso.actividades) / 100
      
      console.log('Cantidad de actividades con calificación:', actividadesValores.length)
      console.log('Promedio de Actividades:', promedioActividades)
      console.log('Calificación de Actividades:', calificacionActividades)
      
      if (ponderacionesCurso.actividades > 0) {
        calificacionFinal += calificacionActividades
        totalPonderacion += ponderacionesCurso.actividades
      }
    } else {
      console.log('No hay actividades con calificación > 0')
    }
    
    // 3. Cálculo de Evidencias
    console.log('\n--- CÁLCULO DE EVIDENCIAS ---')
    console.log('Ponderación de Evidencias:', ponderacionesCurso.evidencias, '%')
    
    const evidenciasValores = evaluacionesParciales.evidencias
      .filter(item => item.grade > 0)
      .map(item => item.grade)
    
    console.log('Valores de evidencias (solo > 0):', evidenciasValores)
    
    if (evidenciasValores.length > 0) {
      const promedioEvidencias = evidenciasValores.reduce((sum, grade) => sum + grade, 0) / evidenciasValores.length
      const calificacionEvidencias = (promedioEvidencias * ponderacionesCurso.evidencias) / 100
      
      console.log('Cantidad de evidencias con calificación:', evidenciasValores.length)
      console.log('Promedio de Evidencias:', promedioEvidencias)
      console.log('Calificación de Evidencias:', calificacionEvidencias)
      
      if (ponderacionesCurso.evidencias > 0) {
        calificacionFinal += calificacionEvidencias
        totalPonderacion += ponderacionesCurso.evidencias
      }
    } else {
      console.log('No hay evidencias con calificación > 0')
    }
    
    // 4. Cálculo de Producto
    console.log('\n--- CÁLCULO DE PRODUCTO ---')
    console.log('Ponderación de Producto:', ponderacionesCurso.producto, '%')
    console.log('Calificación de Producto:', evaluacionesParciales.producto.grade)
    
    if (evaluacionesParciales.producto.grade > 0) {
      const calificacionProducto = (evaluacionesParciales.producto.grade * ponderacionesCurso.producto) / 100
      console.log('Calificación calculada de Producto:', calificacionProducto)
      
      if (ponderacionesCurso.producto > 0) {
        calificacionFinal += calificacionProducto
        totalPonderacion += ponderacionesCurso.producto
      }
    } else {
      console.log('No hay calificación de Producto > 0')
    }
    
    // 5. Cálculo de Examen
    console.log('\n--- CÁLCULO DE EXAMEN ---')
    console.log('Ponderación de Examen:', ponderacionesCurso.examen, '%')
    console.log('Calificación de Examen:', evaluacionesParciales.examen.grade)
    
    if (evaluacionesParciales.examen.grade > 0) {
      const calificacionExamen = (evaluacionesParciales.examen.grade * ponderacionesCurso.examen) / 100
      console.log('Calificación calculada de Examen:', calificacionExamen)
      
      if (ponderacionesCurso.examen > 0) {
        calificacionFinal += calificacionExamen
        totalPonderacion += ponderacionesCurso.examen
      }
    } else {
      console.log('No hay calificación de Examen > 0')
    }
    
    // Resultado final
    console.log('\n--- RESULTADO FINAL ---')
    console.log('Calificación acumulada:', calificacionFinal)
    console.log('Total de ponderación utilizada:', totalPonderacion, '%')
    
    if (totalPonderacion > 0) {
      const calificacionFinalCalculada = calificacionFinal
      console.log('Calificación Final del Parcial:', calificacionFinalCalculada)
      setCalificacionParcial(calificacionFinalCalculada)
    } else {
      console.log('❌ No hay ponderaciones configuradas o calificaciones válidas')
      setCalificacionParcial(null)
    }
    
    console.log('=== FINALIZADO CÁLCULO DE CALIFICACIÓN PARCIAL ===\n')
  }

  // Función para abrir el modal de actividades
  const handleOpenActividadesModal = async (course: Course, courseGroup: any) => {
    setSelectedCourseGroupForActividades(courseGroup);
    setIsActividadesModalOpen(true);
    
    try {
      // Cargar las actividades definidas para este curso
      const actividadesDefinidasData = await CourseService.getPartialEvaluationsByCourseGroupId(courseGroup.id);
      
      // Inicializar arrays vacíos
      const actividades = Array(18).fill({ name: '', id: null });
      const evidencias = Array(18).fill({ name: '', id: null });
      let producto = { name: 'Producto del Parcial', id: null };
      let examen = { name: 'Examen Parcial', id: null };
      
      // Mapear las actividades definidas por slot
      actividadesDefinidasData.forEach((item: any) => {
        if (item.type === 'Actividades' && typeof item.slot === 'number' && item.slot < 18) {
          actividades[item.slot] = { name: item.name, id: item.id };
        } else if (item.type === 'Evidencias' && typeof item.slot === 'number' && item.slot < 18) {
          evidencias[item.slot] = { name: item.name, id: item.id };
        } else if (item.type === 'Producto') {
          producto = { name: item.name || 'Producto del Parcial', id: item.id };
        } else if (item.type === 'Examen') {
          examen = { name: item.name || 'Examen Parcial', id: item.id };
        }
      });
      
      setActividadesDefinidas({ actividades, evidencias, producto, examen });
    } catch (error) {
      console.error('Error al cargar las actividades definidas:', error);
      toast.error('Error al cargar las actividades');
    }
  };

  // Función para crear/actualizar actividades definidas
  const handleActividadButtonClick = async (
    type: "actividades" | "evidencias" | "producto" | "examen",
    idx: number
  ) => {
    if (!selectedCourseGroupForActividades?.id) return;
    
    setIsSavingActividad(true);
    
    let data;
    if (type === "actividades" || type === "evidencias") {
      data = actividadesDefinidas[type][idx];
    } else {
      data = actividadesDefinidas[type];
    }

    const dto: any = {
      name: data.name || "",
      type:
        type === "actividades"
          ? "Actividades"
          : type === "evidencias"
          ? "Evidencias"
          : type === "producto"
          ? "Producto"
          : "Examen",
      courseGroupId: selectedCourseGroupForActividades.id,
      slot: type === "actividades" || type === "evidencias" ? idx : 0,
    };

    try {
      if (data.id) {
        // PATCH
        await CourseService.updatePartialEvaluation(data.id, dto);
        toast.success("Actividad editada correctamente");
      } else {
        // POST
        const result = await CourseService.createPartialEvaluation(dto);
        if (type === "actividades" || type === "evidencias") {
          setActividadesDefinidas(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) =>
              i === idx ? { ...item, id: result.id } : item
            ),
          }));
        } else {
          setActividadesDefinidas(prev => ({
            ...prev,
            [type]: { ...prev[type], id: result.id },
          }));
        }
        toast.success("Actividad creada correctamente");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar la actividad");
    } finally {
      setIsSavingActividad(false);
    }
  };

  const handlePartialEvaluationButtonClick = async (
    type: "actividades" | "evidencias" | "producto" | "examen",
    idx: number
  ) => {
    setIsSavingPartial(true);

    let data;
    if (type === "actividades" || type === "evidencias") {
      data = evaluacionesParciales[type][idx];
    } else {
      data = evaluacionesParciales[type];
    }

    // Verificar que existe la actividad definida
    let actividadDefinida;
    if (type === "actividades" || type === "evidencias") {
      actividadDefinida = actividadesDefinidas[type][idx];
    } else {
      actividadDefinida = actividadesDefinidas[type];
    }

    if (!actividadDefinida?.id) {
      toast.error("Primero debes crear la actividad en el botón 'Actividades'");
      setIsSavingPartial(false);
      return;
    }

    const dto: any = {
      grade: data.grade,
      partial: selectedPartial,
      partialEvaluationId: actividadDefinida.id,
      courseGroupStudentId: alumnoEvaluacion?.courseGroupStudentId,
    };

    try {
      if (data.id) {
        // PATCH
        console.log("PATCH via CourseService.updatePartialEvaluationGrade", data.id, dto);
        await CourseService.updatePartialEvaluationGrade(data.id, dto);
        toast.success("Calificación editada correctamente");
      } else {
        // POST
        console.log("POST via CourseService.createPartialEvaluationGrade", dto);
        const result = await CourseService.createPartialEvaluationGrade(dto);
        if (type === "actividades" || type === "evidencias") {
          setEvaluacionesParciales(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) =>
              i === idx ? { ...item, id: result.id, partialEvaluationId: actividadDefinida.id } : item
            ),
          }));
        } else {
          setEvaluacionesParciales(prev => ({
            ...prev,
            [type]: { ...prev[type], id: result.id, partialEvaluationId: actividadDefinida.id },
          }));
        }
        toast.success("Calificación guardada correctamente");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar la calificación");
    } finally {
      setIsSavingPartial(false);
    }
  };

  useEffect(() => {
    const loadPartialEvaluations = async () => {
      if (!isEvaluacionesModalOpen || !alumnoEvaluacion?.courseGroupStudentId) return;
      try {
        // Cargar las actividades definidas para el curso (que incluyen las calificaciones)
        const actividadesDefinidasData = await CourseService.getPartialEvaluationsByCourseGroupId(selectedCourseGroup?.id!);
        
        // Inicializar arrays vacíos
        const actividades = Array(18).fill({ name: '', grade: 0, id: null, partialEvaluationId: null });
        const evidencias = Array(18).fill({ name: '', grade: 0, id: null, partialEvaluationId: null });
        let producto = { name: '', grade: 0, id: null, partialEvaluationId: null };
        let examen = { name: '', grade: 0, id: null, partialEvaluationId: null };
        
        // Mapear las actividades definidas y sus calificaciones
        actividadesDefinidasData.forEach((actividadDefinida: any) => {
          // Buscar la calificación del alumno específico en el parcial seleccionado
          const courseGroupStudent = actividadDefinida.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumnoEvaluacion.courseGroupStudentId
          );
          
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => peg.partial === selectedPartial
          );
          
          if (actividadDefinida.type === 'Actividades' && typeof actividadDefinida.slot === 'number' && actividadDefinida.slot < 18) {
            actividades[actividadDefinida.slot] = { 
              name: actividadDefinida.name, 
              grade: grade?.grade || 0, 
              id: grade?.id || null, 
              partialEvaluationId: actividadDefinida.id 
            };
          } else if (actividadDefinida.type === 'Evidencias' && typeof actividadDefinida.slot === 'number' && actividadDefinida.slot < 18) {
            evidencias[actividadDefinida.slot] = { 
              name: actividadDefinida.name, 
              grade: grade?.grade || 0, 
              id: grade?.id || null, 
              partialEvaluationId: actividadDefinida.id 
            };
          } else if (actividadDefinida.type === 'Producto') {
            producto = { 
              name: actividadDefinida.name, 
              grade: grade?.grade || 0, 
              id: grade?.id || null, 
              partialEvaluationId: actividadDefinida.id 
            };
          } else if (actividadDefinida.type === 'Examen') {
            examen = { 
              name: actividadDefinida.name, 
              grade: grade?.grade || 0, 
              id: grade?.id || null, 
              partialEvaluationId: actividadDefinida.id 
            };
          }
        });
        
        setEvaluacionesParciales({ actividades, evidencias, producto, examen });
        
        // También actualizar las actividades definidas para mostrar en la interfaz
        const actividadesDefinidas = {
          actividades: Array(18).fill({ name: '', id: null }),
          evidencias: Array(18).fill({ name: '', id: null }),
          producto: { name: 'Producto del Parcial', id: null },
          examen: { name: 'Examen Parcial', id: null },
        };
        
        actividadesDefinidasData.forEach((item: any) => {
          if (item.type === 'Actividades' && typeof item.slot === 'number' && item.slot < 18) {
            actividadesDefinidas.actividades[item.slot] = { name: item.name, id: item.id };
          } else if (item.type === 'Evidencias' && typeof item.slot === 'number' && item.slot < 18) {
            actividadesDefinidas.evidencias[item.slot] = { name: item.name, id: item.id };
          } else if (item.type === 'Producto') {
            actividadesDefinidas.producto = { name: item.name || 'Producto del Parcial', id: item.id };
          } else if (item.type === 'Examen') {
            actividadesDefinidas.examen = { name: item.name || 'Examen Parcial', id: item.id };
          }
        });
        
        setActividadesDefinidas(actividadesDefinidas);
      } catch (error) {
        console.log(error);
        setEvaluacionesParciales({
          actividades: Array(18).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
          evidencias: Array(18).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
          producto: { name: '', grade: 0, id: null, partialEvaluationId: null },
          examen: { name: '', grade: 0, id: null, partialEvaluationId: null },
        });
      }
    };
    loadPartialEvaluations();
  }, [isEvaluacionesModalOpen, alumnoEvaluacion?.courseGroupStudentId, selectedPartial, selectedCourseGroup?.id]);

  // Calcular calificación del parcial cuando cambien las evaluaciones o ponderaciones
  useEffect(() => {
    if (isEvaluacionesModalOpen && ponderacionesCurso) {
      calcularCalificacionParcial();
    }
  }, [evaluacionesParciales, ponderacionesCurso, selectedPartial]);

  // 2. Función para calcular la calificación final y asistencia
  const handleVerCalificacionFinal = async (alumno: any) => {
    if (!selectedCourseGroup) return;
    setAlumnoCalificacionFinal(alumno);
    setIsCalificacionFinalModalOpen(true);
    try {
      // Calcular calificaciones de los 3 parciales
      let parciales: number[] = [];
      for (let parcial = 1; parcial <= 3; parcial++) {
        // Obtener actividades definidas para el curso (que incluyen las calificaciones)
        const actividadesDefinidasData = await CourseService.getPartialEvaluationsByCourseGroupId(selectedCourseGroup.id);
        // Obtener ponderaciones
        const cg = await CourseService.getCourseGroupIndividual(selectedCourseGroup.id);
        const gradingschemes = cg.coursesGroupsGradingschemes || [];
        const ponderaciones = { asistencia: 0, actividades: 0, evidencias: 0, producto: 0, examen: 0 };
        gradingschemes.forEach((scheme: any) => {
          const type = scheme.type.toLowerCase();
          if (type === 'asistencia') ponderaciones.asistencia = scheme.percentage;
          if (type === 'actividades') ponderaciones.actividades = scheme.percentage;
          if (type === 'evidencias') ponderaciones.evidencias = scheme.percentage;
          if (type === 'producto') ponderaciones.producto = scheme.percentage;
          if (type === 'examen') ponderaciones.examen = scheme.percentage;
        });
        // Calcular asistencia
        let asistenciaPromedio = 0;
        if (ponderaciones.asistencia > 0) {
          const asistencias = await CourseService.getAttendancesByCourseGroupStudentAndPartial(alumno.courseGroupStudentId, parcial);
          if (Array.isArray(asistencias) && asistencias.length > 0) {
            const presentes = asistencias.filter((att: any) => att.attend === 1).length;
            asistenciaPromedio = (presentes / asistencias.length) * 10;
          }
        }
        // Calcular actividades
        const actividadesActividades = actividadesDefinidasData.filter((item: any) => item.type === 'Actividades');
        const actividadesGrades = actividadesActividades.map((actividad: any) => {
          const courseGroupStudent = actividad.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumno.courseGroupStudentId
          );
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => peg.partial === parcial
          );
          return grade?.grade || 0;
        }).filter((grade: number) => grade > 0);
        const promedioActividades = actividadesGrades.length > 0 ? actividadesGrades.reduce((a: number, b: number) => a + b, 0) / actividadesGrades.length : 0;
        
        // Calcular evidencias
        const actividadesEvidencias = actividadesDefinidasData.filter((item: any) => item.type === 'Evidencias');
        const evidenciasGrades = actividadesEvidencias.map((actividad: any) => {
          const courseGroupStudent = actividad.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumno.courseGroupStudentId
          );
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => peg.partial === parcial
          );
          return grade?.grade || 0;
        }).filter((grade: number) => grade > 0);
        const promedioEvidencias = evidenciasGrades.length > 0 ? evidenciasGrades.reduce((a: number, b: number) => a + b, 0) / evidenciasGrades.length : 0;
        
        // Producto
        const actividadProducto = actividadesDefinidasData.find((item: any) => item.type === 'Producto');
        let producto = 0;
        if (actividadProducto) {
          const courseGroupStudent = actividadProducto.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumno.courseGroupStudentId
          );
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => peg.partial === parcial
          );
          producto = grade?.grade || 0;
        }
        
        // Examen
        const actividadExamen = actividadesDefinidasData.find((item: any) => item.type === 'Examen');
        let examen = 0;
        if (actividadExamen) {
          const courseGroupStudent = actividadExamen.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumno.courseGroupStudentId
          );
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => peg.partial === parcial
          );
          examen = grade?.grade || 0;
        }
        // Calcular calificación parcial
        let calif = 0;
        calif += (asistenciaPromedio * ponderaciones.asistencia) / 100;
        calif += (promedioActividades * ponderaciones.actividades) / 100;
        calif += (promedioEvidencias * ponderaciones.evidencias) / 100;
        calif += (producto * ponderaciones.producto) / 100;
        calif += (examen * ponderaciones.examen) / 100;
        parciales.push(calif);
      }
      // Calcular promedio
      const parcialesValidos = parciales.filter(p => typeof p === 'number' && !isNaN(p));
      const promedio = parcialesValidos.length > 0 ? (parcialesValidos.reduce((a, b) => a + b, 0) / parcialesValidos.length) : null;
      // Calcular asistencia total
      let asistenciasTotales = await CourseService.getAttendancesByCourseGroupStudentAndPartial(alumno.courseGroupStudentId, 0); // 0 = todas
      if (!Array.isArray(asistenciasTotales)) asistenciasTotales = [];
      const presentesTotales = asistenciasTotales.filter((att: any) => att.attend === 1).length;
      const asistenciaPorcentaje = asistenciasTotales.length > 0 ? Math.round((presentesTotales / asistenciasTotales.length) * 100) : 0;
      // Exentos = promedio redondeado a 2 decimales
      const exentos = promedio !== null ? Math.round(promedio * 100) / 100 : null;

      // --- INTEGRACIÓN FINAL GRADE ---
      try {
        // 1. Consultar si ya existe un FinalGrade
        const finalGrades = await CourseService.getFinalGradesByCourseGroupStudentId(alumno.courseGroupStudentId);
        
        if (!finalGrades || finalGrades.length === 0) {
          // Crear nuevo FinalGrade
          const dto = {
            grade: promedio !== null ? Math.round(promedio) : 0, // Redondeo a entero
            gradeOrdinary: 0,
            gradeExtraordinary: 0,
            date: new Date().toISOString(),
            type: 'final',
            courseGroupStudentId: alumno.courseGroupStudentId
          };
          const created = await CourseService.createFinalGrade(dto);
          setFinalGradeId(created.id);
          setInputOrdinario(created.gradeOrdinary?.toString() || "");
          setInputExtraordinario(created.gradeExtraordinary?.toString() || "");
          setOrdinarioGuardado(created.gradeOrdinary || null);
          setExtraordinarioGuardado(created.gradeExtraordinary || null);
        } else {
          // Actualizar solo el promedio, preservando las calificaciones existentes
          const existingFinalGrade = finalGrades[0];
          // Solo actualizar el campo grade, no tocar los otros campos
          const dto = {
            grade: promedio !== null ? Math.round(promedio) : 0
          };
          await CourseService.updateFinalGrade(existingFinalGrade.id, dto);
          setFinalGradeId(existingFinalGrade.id);
          // IMPORTANTE: Usar los valores existentes del FinalGrade, no recalcular
          setInputOrdinario(existingFinalGrade.gradeOrdinary?.toString() || "");
          setInputExtraordinario(existingFinalGrade.gradeExtraordinary?.toString() || "");
          setOrdinarioGuardado(existingFinalGrade.gradeOrdinary || null);
          setExtraordinarioGuardado(existingFinalGrade.gradeExtraordinary || null);
        }
      } catch (err) {
        console.error('Error registrando FinalGrade:', err);
        setFinalGradeId(null);
        setInputOrdinario("");
        setInputExtraordinario("");
      }
      // --- FIN INTEGRACIÓN FINAL GRADE ---

      setCalificacionesFinales({
        parcial1: parciales[0] ?? null,
        parcial2: parciales[1] ?? null,
        parcial3: parciales[2] ?? null,
        promedio: promedio !== null ? Math.round(promedio * 100) / 100 : null,
        asistencia: asistenciaPorcentaje,
        exentos: exentos
      });
      
    } catch (error) {
      setCalificacionesFinales(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Asignaturas</h1>
              <p className="text-gray-600 text-lg">
                Gestiona tus asignaturas y grupos
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#bc4b26] to-[#d05f27] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Asignaturas</CardTitle>
              <BookOpen className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{asignaturas.length}</div>
              <p className="text-xs opacity-90 mt-1">Asignaturas activas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#d05f27] to-[#bc4b26] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Grupos</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Set(asignaturas.flatMap(a => a.coursesGroups!.map(cg => cg.group!.id))).size}
              </div>
              <p className="text-xs opacity-90 mt-1">Grupos asignados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#003d5c] to-[#004a73] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Alumnos</CardTitle>
              <GraduationCap className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {asignaturas.reduce((sum, a) => sum + a.coursesGroups!.length, 0)}
              </div>
              <p className="text-xs opacity-90 mt-1">Alumnos en total</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Lista de Asignaturas</CardTitle>
                <CardDescription>Gestiona tus asignaturas y grupos</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar asignatura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAsignaturas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <BookOpen className="h-12 w-12 mb-4" />
                          <p className="text-lg font-medium">No hay asignaturas asignadas</p>
                          <p className="text-sm">Comienza agregando asignaturas a tus grupos</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentAsignaturas.flatMap((asignatura) => 
                      asignatura.coursesGroups!.map((courseGroup) => (
                        <TableRow key={`${asignatura.id}-${courseGroup.id}`}>
                          <TableCell className="font-medium">
                            {asignatura.name}
                          </TableCell>
                          <TableCell>{courseGroup.group!.name}</TableCell>
                          <TableCell>{courseGroup.group!.period.name}</TableCell>
                          <TableCell>{courseGroup.schedule}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (courseGroup.id && asignatura.id && courseGroup.user?.id) {
                                    const courseGroupData: CourseGroup = {
                                      id: courseGroup.id,
                                      course: {
                                        id: asignatura.id,
                                        name: asignatura.name
                                      },
                                      group: {
                                        id: courseGroup.group!.id,
                                        name: courseGroup.group!.name,
                                        semester: courseGroup.group!.semester,
                                      },
                                      user: {
                                        id: courseGroup.user.id,
                                        fullName: courseGroup.user.fullName,
                                        email: courseGroup.user.email || '',
                                        role: courseGroup.user.role || 'maestro'
                                      }
                                    }
                                    handleOpenAlumnosModal(courseGroup.group!.id!, asignatura, courseGroupData)
                                  }
                                }}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Alumnos
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPonderacionesModal(asignatura, courseGroup)}
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Ponderaciones
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenActividadesModal(asignatura, courseGroup)}
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Actividades
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleOpenAsistenciaModal(asignatura, courseGroup)}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Asistencia
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Modal de Alumnos */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-5xl [&>button]:hidden">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle>Lista de Alumnos</DialogTitle>
                      <DialogDescription>
                        Alumnos inscritos en el grupo seleccionado
                      </DialogDescription>
                    </div>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                </DialogHeader>
                <div className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Semestre</TableHead>
                          <TableHead>Matricula</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingAlumnos ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                                <p>Cargando alumnos...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : alumnos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Users className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No hay alumnos inscritos</p>
                                <p className="text-sm">Este grupo aún no tiene alumnos asignados</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          alumnos.map((alumno) => (
                            <TableRow key={alumno.id}>
                              <TableCell className="font-medium">{alumno.fullName}</TableCell>
                              <TableCell>{selectedCourseGroup?.group?.semester || 'N/A'}</TableCell>
                              <TableCell>{alumno.registrationNumber}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-36 flex items-center justify-center"
                                    onClick={async () => {
                                      setAlumnoEvaluacion(alumno)
                                      setIsEvaluacionesModalOpen(true)
                                      
                                      // Cargar las ponderaciones del curso si no están cargadas
                                      if (!ponderacionesCurso && selectedCourseGroup) {
                                        try {
                                          const courseGroupWithPonderaciones = await CourseService.getCourseGroupIndividual(selectedCourseGroup.id)
                                          const gradingschemes = courseGroupWithPonderaciones.coursesGroupsGradingschemes || []
                                          
                                          const ponderaciones = {
                                            asistencia: 0,
                                            actividades: 0,
                                            evidencias: 0,
                                            producto: 0,
                                            examen: 0
                                          }
                                          
                                          const ids: {
                                            asistencia?: number,
                                            actividades?: number,
                                            evidencias?: number,
                                            producto?: number,
                                            examen?: number
                                          } = {}
                                          
                                          gradingschemes.forEach((scheme: any) => {
                                            const type = scheme.type.toLowerCase()
                                            if (type === 'asistencia') {
                                              ponderaciones.asistencia = scheme.percentage
                                              ids.asistencia = scheme.id
                                            } else if (type === 'actividades') {
                                              ponderaciones.actividades = scheme.percentage
                                              ids.actividades = scheme.id
                                            } else if (type === 'evidencias') {
                                              ponderaciones.evidencias = scheme.percentage
                                              ids.evidencias = scheme.id
                                            } else if (type === 'producto') {
                                              ponderaciones.producto = scheme.percentage
                                              ids.producto = scheme.id
                                            } else if (type === 'examen') {
                                              ponderaciones.examen = scheme.percentage
                                              ids.examen = scheme.id
                                            }
                                          })
                                          
                                          setPonderacionesCurso(ponderaciones)
                                          setPonderacionesIds(ids)
                                        } catch (error) {
                                          console.error('Error al cargar las ponderaciones:', error)
                                        }
                                      }
                                    }}
                                  >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Evaluaciones
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-36 flex items-center justify-center"
                                    onClick={() => handleVerCalificacionFinal(alumno)}
                                  >
                                    Promedio
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Página {currentAlumnosPage}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAlumnosPageChange(currentAlumnosPage - 1)}
                        disabled={currentAlumnosPage === 1 || isLoadingAlumnos}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAlumnosPageChange(currentAlumnosPage + 1)}
                        disabled={alumnos.length < alumnosPerPage || isLoadingAlumnos}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Crear Alumno */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar nuevo alumno</DialogTitle>
                  <DialogDescription>
                    Llena los campos para registrar un nuevo alumno.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="fullName">Nombre</Label>
                    <Input 
                      id="fullName" 
                      name="fullName"
                      value={formData.fullName} 
                      onChange={handleInputChange} 
                      placeholder="Ej. Juan Pérez" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationNumber">Matrícula</Label>
                    <Input 
                      id="registrationNumber" 
                      name="registrationNumber"
                      value={formData.registrationNumber} 
                      onChange={handleInputChange} 
                      placeholder="Ej. 2024001" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="semester">Semestre</Label>
                    <Input 
                      id="semester" 
                      name="semester"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.semester} 
                      onChange={handleInputChange} 
                      placeholder="Ej. 1" 
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseCreateModal}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modal de Seleccionar Alumno */}
            <Dialog open={isSelectModalOpen} onOpenChange={setIsSelectModalOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar Alumno</DialogTitle>
                  <DialogDescription>
                    Selecciona un alumno para agregarlo al grupo
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar por nombre, matrícula o semestre..."
                        value={searchStudentTerm}
                        onChange={(e) => setSearchStudentTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Semestre</TableHead>
                          <TableHead>Matricula</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingStudents ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                                <p>Cargando alumnos...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Users className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No hay alumnos disponibles</p>
                                <p className="text-sm">
                                  {searchStudentTerm 
                                    ? "No se encontraron alumnos que coincidan con la búsqueda" 
                                    : "No se encontraron alumnos para agregar"}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStudents.map((alumno) => {
                            console.log('=== DEBUG ALUMNO ===');
                            console.log('Alumno completo:', alumno);
                            console.log('courseGroupStudent:', alumno.courseGroupStudent);
                            console.log('courseGroup:', alumno.courseGroupStudent?.courseGroup);
                            console.log('group:', alumno.courseGroupStudent?.courseGroup?.group);
                            console.log('semester:', alumno.courseGroupStudent?.courseGroup?.group?.semester);
                            console.log('========================');
                            return (
                              <TableRow key={alumno.id}>
                                <TableCell className="font-medium">{alumno.fullName}</TableCell>
                                <TableCell>{alumno.courseGroupStudent?.courseGroup?.group?.semester || 'N/A'}</TableCell>
                                <TableCell>{alumno.registrationNumber}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAddStudentToGroup(alumno)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Agregar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Página {currentStudentPage}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStudentPageChange(currentStudentPage - 1)}
                        disabled={currentStudentPage === 1 || isLoadingStudents}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStudentPageChange(currentStudentPage + 1)}
                        disabled={filteredStudents.length < studentsPerPage || isLoadingStudents}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsSelectModalOpen(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Confirmación de Eliminación */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Eliminación</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que quieres eliminar a <strong>{studentToDelete?.fullName}</strong> del grupo?
                    <br />
                    <span className="text-sm text-gray-500">
                      Matrícula: {studentToDelete?.registrationNumber} | Semestre: {studentToDelete?.courseGroupStudent?.courseGroup.group?.semester}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false)
                      setStudentToDelete(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (studentToDelete) {
                        handleDeleteStudent(studentToDelete.courseGroupStudentId)
                      }
                      setIsDeleteModalOpen(false)
                    }}
                  >
                    Eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Ponderaciones */}
            <Dialog open={isPonderacionesModalOpen} onOpenChange={setIsPonderacionesModalOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Ponderaciones</DialogTitle>
                  <DialogDescription>
                    Estas son las ponderaciones del curso seleccionado.
                  </DialogDescription>
                </DialogHeader>
                <div className="w-full flex justify-center">
                  <table className="min-w-full w-full border border-gray-300 text-center">
                    <thead>
                      <tr className="bg-gradient-to-br from-[#bc4b26] to-[#d05f27] text-white">
                        <th className="px-6 py-3">Asistencia</th>
                        <th className="px-6 py-3">Actividades</th>
                        <th className="px-6 py-3">Evidencias</th>
                        <th className="px-6 py-3">Producto</th>
                        <th className="px-6 py-3">Examen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold text-lg">
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ponderacionesCurso?.asistencia ?? 0}
                                onChange={(e) => handlePonderacionChange('asistencia', Number(e.target.value))}
                                onKeyPress={(e) => handlePonderacionKeyPress('asistencia', Number(e.currentTarget.value), e)}
                                className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                              />
                              <span className="ml-1">%</span>
                            </div>
                            <Button
                              size="sm"
                              variant={ponderacionesIds.asistencia ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${ponderacionesIds.asistencia ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePonderacionButtonClick('asistencia', ponderacionesCurso?.asistencia ?? 0)}
                            >
                              {ponderacionesIds.asistencia ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ponderacionesCurso?.actividades ?? 0}
                                onChange={(e) => handlePonderacionChange('actividades', Number(e.target.value))}
                                onKeyPress={(e) => handlePonderacionKeyPress('actividades', Number(e.currentTarget.value), e)}
                                className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                              />
                              <span className="ml-1">%</span>
                            </div>
                            <Button
                              size="sm"
                              variant={ponderacionesIds.actividades ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${ponderacionesIds.actividades ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePonderacionButtonClick('actividades', ponderacionesCurso?.actividades ?? 0)}
                            >
                              {ponderacionesIds.actividades ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ponderacionesCurso?.evidencias ?? 0}
                                onChange={(e) => handlePonderacionChange('evidencias', Number(e.target.value))}
                                onKeyPress={(e) => handlePonderacionKeyPress('evidencias', Number(e.currentTarget.value), e)}
                                className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                              />
                              <span className="ml-1">%</span>
                            </div>
                            <Button
                              size="sm"
                              variant={ponderacionesIds.evidencias ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${ponderacionesIds.evidencias ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePonderacionButtonClick('evidencias', ponderacionesCurso?.evidencias ?? 0)}
                            >
                              {ponderacionesIds.evidencias ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ponderacionesCurso?.producto ?? 0}
                                onChange={(e) => handlePonderacionChange('producto', Number(e.target.value))}
                                onKeyPress={(e) => handlePonderacionKeyPress('producto', Number(e.currentTarget.value), e)}
                                className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                              />
                              <span className="ml-1">%</span>
                            </div>
                            <Button
                              size="sm"
                              variant={ponderacionesIds.producto ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${ponderacionesIds.producto ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePonderacionButtonClick('producto', ponderacionesCurso?.producto ?? 0)}
                            >
                              {ponderacionesIds.producto ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ponderacionesCurso?.examen ?? 0}
                                onChange={(e) => handlePonderacionChange('examen', Number(e.target.value))}
                                onKeyPress={(e) => handlePonderacionKeyPress('examen', Number(e.currentTarget.value), e)}
                                className="w-16 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#bc4b26]"
                              />
                              <span className="ml-1">%</span>
                            </div>
                            <Button
                              size="sm"
                              variant={ponderacionesIds.examen ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${ponderacionesIds.examen ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePonderacionButtonClick('examen', ponderacionesCurso?.examen ?? 0)}
                            >
                              {ponderacionesIds.examen ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPonderacionesModalOpen(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Actividades */}
            <Dialog open={isActividadesModalOpen} onOpenChange={setIsActividadesModalOpen}>
              <DialogContent className="max-w-[90vw]">
                <DialogHeader>
                  <DialogTitle>Actividades del Curso</DialogTitle>
                  <DialogDescription>
                    Define las actividades, evidencias, producto y examen para este curso. Estas actividades aparecerán para todos los alumnos.
                  </DialogDescription>
                </DialogHeader>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[2400px] border border-gray-300 text-center">
                    <thead>
                      <tr>
                        <th colSpan={18} className="bg-blue-100 font-semibold border-r border-gray-300">Actividades de Aprendizaje</th>
                        <th colSpan={18} className="bg-green-100 font-semibold border-r border-gray-300">Evidencias de Aprendizaje</th>
                        <th className="bg-pink-200 font-semibold border-r border-gray-300">Producto del Parcial</th>
                        <th className="bg-gray-400 font-semibold text-white">Examen Parcial</th>
                      </tr>
                      <tr>
                        {[...Array(18)].map((_, i) => (
                          <th key={"act"+i} className="bg-blue-50 border-r border-gray-200">A{i+1}</th>
                        ))}
                        {[...Array(18)].map((_, i) => (
                          <th key={"ev"+i} className="bg-green-50 border-r border-gray-200">E{i+1}</th>
                        ))}
                        <th className="bg-pink-50 border-r border-gray-200">Producto</th>
                        <th className="bg-gray-100">Examen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {/* Inputs de nombre para Actividades */}
                        {[...Array(18)].map((_, i) => (
                          <td key={"actname"+i} className="px-2 py-1 border-r border-gray-100">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="text"
                                placeholder="Nombre"
                                value={actividadesDefinidas.actividades[i]?.name || ''}
                                onChange={e => {
                                  setActividadesDefinidas(prev => ({
                                    ...prev,
                                    actividades: prev.actividades.map((item, idx) => 
                                      idx === i ? { ...item, name: e.target.value } : item
                                    )
                                  }))
                                }}
                                className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                              />
                              <Button
                                size="sm"
                                variant={actividadesDefinidas.actividades[i]?.id ? "outline" : "default"}
                                className={`h-6 px-2 text-xs ${actividadesDefinidas.actividades[i]?.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                onClick={() => handleActividadButtonClick('actividades', i)}
                                disabled={isSavingActividad}
                              >
                                {actividadesDefinidas.actividades[i]?.id ? '✏️ Editar' : '➕ Agregar'}
                              </Button>
                            </div>
                          </td>
                        ))}
                        {/* Inputs de nombre para Evidencias */}
                        {[...Array(18)].map((_, i) => (
                          <td key={"evname"+i} className="px-2 py-1 border-r border-gray-100">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="text"
                                placeholder="Nombre"
                                value={actividadesDefinidas.evidencias[i]?.name || ''}
                                onChange={e => {
                                  setActividadesDefinidas(prev => ({
                                    ...prev,
                                    evidencias: prev.evidencias.map((item, idx) => 
                                      idx === i ? { ...item, name: e.target.value } : item
                                    )
                                  }))
                                }}
                                className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                              />
                              <Button
                                size="sm"
                                variant={actividadesDefinidas.evidencias[i]?.id ? "outline" : "default"}
                                className={`h-6 px-2 text-xs ${actividadesDefinidas.evidencias[i]?.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                onClick={() => handleActividadButtonClick('evidencias', i)}
                                disabled={isSavingActividad}
                              >
                                {actividadesDefinidas.evidencias[i]?.id ? '✏️ Editar' : '➕ Agregar'}
                              </Button>
                            </div>
                          </td>
                        ))}
                        {/* Producto */}
                        <td className="px-2 py-1 border-r border-gray-100">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="text"
                              placeholder="Nombre"
                              value={actividadesDefinidas.producto?.name || ''}
                              onChange={e => {
                                setActividadesDefinidas(prev => ({
                                  ...prev,
                                  producto: { ...prev.producto, name: e.target.value }
                                }))
                              }}
                              className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                            />
                            <Button
                              size="sm"
                              variant={actividadesDefinidas.producto?.id ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${actividadesDefinidas.producto?.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handleActividadButtonClick('producto', 0)}
                              disabled={isSavingActividad}
                            >
                              {actividadesDefinidas.producto?.id ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        {/* Examen */}
                        <td className="px-2 py-1">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="text"
                              placeholder="Nombre"
                              value={actividadesDefinidas.examen?.name || ''}
                              onChange={e => {
                                setActividadesDefinidas(prev => ({
                                  ...prev,
                                  examen: { ...prev.examen, name: e.target.value }
                                }))
                              }}
                              className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                            />
                            <Button
                              size="sm"
                              variant={actividadesDefinidas.examen?.id ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${actividadesDefinidas.examen?.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handleActividadButtonClick('examen', 0)}
                              disabled={isSavingActividad}
                            >
                              {actividadesDefinidas.examen?.id ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsActividadesModalOpen(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Asistencia */}
            <Dialog open={isAsistenciaModalOpen} onOpenChange={setIsAsistenciaModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Asistencia - {asistenciaParcial === 1 ? 'Primer' : asistenciaParcial === 2 ? 'Segundo' : 'Tercer'} Parcial</DialogTitle>
                  <DialogDescription>
                    Selecciona los alumnos presentes y ausentes para el parcial seleccionado
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <label htmlFor="asistenciaFecha" className="font-medium">Fecha:</label>
                    <input
                      id="asistenciaFecha"
                      type="date"
                      value={asistenciaFecha}
                      onChange={e => handleDateChange(e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={isLoadingDateChange}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="asistenciaParcial" className="font-medium">Parcial:</label>
                    <select
                      id="asistenciaParcial"
                      value={asistenciaParcial}
                      onChange={e => handleParcialChange(Number(e.target.value))}
                      className="border rounded px-2 py-1"
                      disabled={isLoadingDateChange}
                    >
                      <option value={1}>Primer Parcial</option>
                      <option value={2}>Segundo Parcial</option>
                      <option value={3}>Tercer Parcial</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="rounded-md border h-full flex flex-col">
                    <table className="min-w-full w-full border-separate" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
                      <thead className="bg-white sticky top-0 z-10" style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                        <tr>
                          <th className="px-4 py-2 text-left" style={{ width: '30%' }}>Nombre Completo</th>
                          <th className="px-4 py-2 text-left" style={{ width: '18%' }}>Matrícula</th>
                          <th className="px-4 py-2 text-left" style={{ width: '18%' }}>Estado</th>
                          <th className="px-4 py-2 text-center" style={{ width: '11%' }}>Presente</th>
                          <th className="px-4 py-2 text-center" style={{ width: '11%' }}>Ausente</th>
                          <th className="px-4 py-2 text-center" style={{ width: '12%' }}>Retardo</th>
                        </tr>
                      </thead>
                      <tbody className="block max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ display: 'block', width: '100%' }}>
                        {isLoadingAsistencia || isLoadingDateChange ? (
                          <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                            <td colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                                <p>{isLoadingDateChange ? 'Cargando asistencias...' : 'Cargando alumnos...'}</p>
                              </div>
                            </td>
                          </tr>
                        ) : asistenciaAlumnos.length === 0 ? (
                          <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                            <td colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Users className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No hay alumnos en este grupo</p>
                                <p className="text-sm">Agrega alumnos al grupo para tomar asistencia</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          asistenciaAlumnos.map((alumno) => (
                            <tr key={alumno.id} style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                              <td className="font-medium px-4 py-2" style={{ width: '30%' }}>{alumno.fullName}</td>
                              <td className="px-4 py-2" style={{ width: '18%' }}>{alumno.registrationNumber}</td>
                              <td className="px-4 py-2" style={{ width: '18%' }}>
                                {alumno.attendanceId ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    ✓ Creada
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    ⚠ Nueva
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center" style={{ width: '11%' }}>
                                <input
                                  type="checkbox"
                                  checked={alumno.attend === 1}
                                  onChange={(e) => {
                                    const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                      a.id === alumno.id ? { ...a, attend: e.target.checked ? 1 : 2 } : a
                                    );
                                    setAsistenciaAlumnos(updatedAlumnos);
                                  }}
                                />
                              </td>
                              <td className="px-4 py-2 text-center" style={{ width: '11%' }}>
                                <input
                                  type="checkbox"
                                  checked={alumno.attend === 2}
                                  onChange={(e) => {
                                    const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                      a.id === alumno.id ? { ...a, attend: e.target.checked ? 2 : 1 } : a
                                    );
                                    setAsistenciaAlumnos(updatedAlumnos);
                                  }}
                                />
                              </td>
                              <td className="px-4 py-2 text-center" style={{ width: '12%' }}>
                                <input
                                  type="checkbox"
                                  checked={alumno.attend === 3}
                                  onChange={(e) => {
                                    const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                      a.id === alumno.id ? { ...a, attend: e.target.checked ? 3 : 1 } : a
                                    );
                                    setAsistenciaAlumnos(updatedAlumnos);
                                  }}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleCloseAsistenciaModal}
                    disabled={isSavingAttendance}
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSaveAttendance}
                    disabled={isSavingAttendance || asistenciaAlumnos.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSavingAttendance ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Evaluaciones */}
            <Dialog open={isEvaluacionesModalOpen} onOpenChange={setIsEvaluacionesModalOpen}>
              <DialogContent className="max-w-[90vw]">
                <DialogHeader>
                  <DialogTitle>Evaluaciones de {alumnoEvaluacion?.fullName}</DialogTitle>
                  <DialogDescription>
                    Asigna las calificaciones de las evaluaciones para el alumno seleccionado.
                  </DialogDescription>
                </DialogHeader>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[2400px] border border-gray-300 text-center">
                    <thead>
                      <tr>
                        <th colSpan={18} className="bg-blue-100 font-semibold border-r border-gray-300">Actividades de Aprendizaje</th>
                        <th colSpan={18} className="bg-green-100 font-semibold border-r border-gray-300">Evidencias de Aprendizaje</th>
                        <th className="bg-pink-200 font-semibold border-r border-gray-300">Producto del Parcial</th>
                        <th className="bg-gray-400 font-semibold text-white border-r border-gray-300">Examen Parcial</th>
                        <th className="bg-purple-500 font-semibold text-white">Calificación Parcial</th>
                      </tr>
                      <tr>
                        {[...Array(18)].map((_, i) => (
                          <th key={"act"+i} className="bg-blue-50 border-r border-gray-200">A{i+1}</th>
                        ))}
                        {[...Array(18)].map((_, i) => (
                          <th key={"ev"+i} className="bg-green-50 border-r border-gray-200">E{i+1}</th>
                        ))}
                        <th className="bg-pink-50 border-r border-gray-200">Producto</th>
                        <th className="bg-gray-100 border-r border-gray-200">Examen</th>
                        <th className="bg-purple-100">Calificación</th>
                      </tr>
                      <tr>
                        {/* Nombres de Actividades (solo lectura) */}
                        {[...Array(18)].map((_, i) => (
                          <th key={"actname"+i} className="bg-blue-50 border-r border-gray-200">
                            <div className="text-xs font-medium text-blue-800 px-1">
                              {actividadesDefinidas.actividades[i]?.name || `A${i+1}`}
                            </div>
                          </th>
                        ))}
                        {/* Nombres de Evidencias (solo lectura) */}
                        {[...Array(18)].map((_, i) => (
                          <th key={"evname"+i} className="bg-green-50 border-r border-gray-200">
                            <div className="text-xs font-medium text-green-800 px-1">
                              {actividadesDefinidas.evidencias[i]?.name || `E${i+1}`}
                            </div>
                          </th>
                        ))}
                        <th className="bg-pink-50 border-r border-gray-200">
                          <div className="text-xs font-medium text-pink-800 px-1">
                            {actividadesDefinidas.producto?.name || 'Producto'}
                          </div>
                        </th>
                        <th className="bg-gray-100 border-r border-gray-200">
                          <div className="text-xs font-medium text-gray-800 px-1">
                            {actividadesDefinidas.examen?.name || 'Examen'}
                          </div>
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {/* Inputs de calificación y botón para Actividades */}
                        {evaluacionesParciales.actividades.map((item, i) => (
                          <td key={"actv"+i} className="px-2 py-1 border-r border-gray-100">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={item.grade}
                                onChange={e => handlePartialEvaluationChange('actividades', i, Number(e.target.value))}
                                onKeyDown={e => handlePartialEvaluationKeyPress('actividades', i, e)}
                                className="w-14 text-center border rounded px-2 py-1 mx-1"
                              />
                              <Button
                                size="sm"
                                variant={item.id ? "outline" : "default"}
                                className={`h-6 px-2 text-xs ${item.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                onClick={() => handlePartialEvaluationButtonClick('actividades', i)}
                                disabled={isSavingPartial}
                              >
                                {item.id ? '✏️ Editar' : '➕ Agregar'}
                              </Button>
                            </div>
                          </td>
                        ))}
                        {/* Inputs de calificación y botón para Evidencias */}
                        {evaluacionesParciales.evidencias.map((item, i) => (
                          <td key={"evv"+i} className="px-2 py-1 border-r border-gray-100">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={item.grade}
                                onChange={e => handlePartialEvaluationChange('evidencias', i, Number(e.target.value))}
                                onKeyDown={e => handlePartialEvaluationKeyPress('evidencias', i, e)}
                                className="w-14 text-center border rounded px-2 py-1 mx-1"
                              />
                              <Button
                                size="sm"
                                variant={item.id ? "outline" : "default"}
                                className={`h-6 px-2 text-xs ${item.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                onClick={() => handlePartialEvaluationButtonClick('evidencias', i)}
                                disabled={isSavingPartial}
                              >
                                {item.id ? '✏️ Editar' : '➕ Agregar'}
                              </Button>
                            </div>
                          </td>
                        ))}
                        {/* Producto */}
                        <td className="px-2 py-1 border-r border-gray-100">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={evaluacionesParciales.producto.grade}
                              onChange={e => setEvaluacionesParciales(prev => ({ ...prev, producto: { ...prev.producto, grade: Number(e.target.value) } }))}
                              onKeyDown={e => handlePartialEvaluationKeyPress('producto', 0, e)}
                              className="w-14 text-center border rounded px-2 py-1 mx-1"
                            />
                            <Button
                              size="sm"
                              variant={evaluacionesParciales.producto.id ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${evaluacionesParciales.producto.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePartialEvaluationButtonClick('producto', 0)}
                              disabled={isSavingPartial}
                            >
                              {evaluacionesParciales.producto.id ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        {/* Examen */}
                        <td className="px-2 py-1 border-r border-gray-100">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={evaluacionesParciales.examen.grade}
                              onChange={e => setEvaluacionesParciales(prev => ({ ...prev, examen: { ...prev.examen, grade: Number(e.target.value) } }))}
                              onKeyDown={e => handlePartialEvaluationKeyPress('examen', 0, e)}
                              className="w-14 text-center border rounded px-2 py-1 mx-1"
                            />
                            <Button
                              size="sm"
                              variant={evaluacionesParciales.examen.id ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${evaluacionesParciales.examen.id ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handlePartialEvaluationButtonClick('examen', 0)}
                              disabled={isSavingPartial}
                            >
                              {evaluacionesParciales.examen.id ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        {/* Calificación del Parcial */}
                        <td className="px-2 py-1">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-14 h-8 flex items-center justify-center bg-purple-50 border border-purple-200 rounded font-semibold text-purple-700">
                              {calificacionParcial !== null ? (Math.floor(calificacionParcial * 100) / 100).toFixed(2) : '--.--'}
                            </div>
                            <div className="text-xs text-purple-600 font-medium">
                              Calificación
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsEvaluacionesModalOpen(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
                <div className="flex items-center gap-2 mt-4 justify-start">
                  <label htmlFor="parcial-select" className="font-medium">Parcial:</label>
                  <select
                    id="parcial-select"
                    value={selectedPartial}
                    onChange={e => setSelectedPartial(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    <option value={1}>Primer Parcial</option>
                    <option value={2}>Segundo Parcial</option>
                    <option value={3}>Tercer Parcial</option>
                  </select>
                </div>
              </DialogContent>
            </Dialog>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Modal de Calificación Final */}
      <Dialog open={isCalificacionFinalModalOpen} onOpenChange={setIsCalificacionFinalModalOpen}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Calificación Final</DialogTitle>
            <DialogDescription>
              Resumen de calificaciones del alumno
            </DialogDescription>
          </DialogHeader>
          {alumnoCalificacionFinal && calificacionesFinales ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-center">
                <thead>
                  <tr className="bg-yellow-400 text-black">
                    <th className="px-2 py-1">Matrícula</th>
                    <th className="px-2 py-1">Nombre</th>
                    <th className="px-2 py-1">Parcial 1</th>
                    <th className="px-2 py-1">Parcial 2</th>
                    <th className="px-2 py-1">Parcial 3</th>
                    <th className="px-2 py-1">Promedio</th>
                    <th className="px-2 py-1">Asistencia</th>
                    <th className="px-2 py-1">Exentos</th>
                    <th className="px-2 py-1">Ordinario</th>
                    <th className="px-2 py-1">Extraordinario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-2 py-1">{alumnoCalificacionFinal.registrationNumber}</td>
                    <td className="px-2 py-1">{alumnoCalificacionFinal.fullName}</td>
                    <td className="px-2 py-1">{calificacionesFinales.parcial1 !== null ? calificacionesFinales.parcial1.toFixed(2) : '--'}</td>
                    <td className="px-2 py-1">{calificacionesFinales.parcial2 !== null ? calificacionesFinales.parcial2.toFixed(2) : '--'}</td>
                    <td className="px-2 py-1">{calificacionesFinales.parcial3 !== null ? calificacionesFinales.parcial3.toFixed(2) : '--'}</td>
                    <td className="px-2 py-1 font-bold">{calificacionesFinales.promedio !== null ? calificacionesFinales.promedio.toFixed(2) : '--'}</td>
                    <td className="px-2 py-1">{calificacionesFinales.asistencia !== null ? calificacionesFinales.asistencia + '%' : '--'}</td>
                    <td className={
                      "px-2 py-1 font-bold " +
                      (calificacionesFinales.promedio !== null && calificacionesFinales.promedio < 8
                        ? "bg-pink-200 text-pink-800"
                        : calificacionesFinales.promedio !== null && calificacionesFinales.promedio >= 8
                          ? "bg-green-100 text-green-800"
                          : "")
                    }>
                      {calificacionesFinales.promedio !== null && calificacionesFinales.promedio < 8
                        ? 'Ord A'
                        : calificacionesFinales.exentos !== null
                          ? Math.round(calificacionesFinales.exentos)
                          : '--'}
                    </td>
                    <td className={
                      ordinarioGuardado !== null && ordinarioGuardado < 6
                        ? "px-2 py-1 bg-red-200 text-red-800 font-bold text-center"
                        : "px-2 py-1"
                    }>
                      {calificacionesFinales.promedio !== null && calificacionesFinales.promedio < 8 ? (
                        ordinarioGuardado !== null && ordinarioGuardado < 6 ? (
                          'EXT'
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              className="w-20 text-center border rounded px-2 py-1 mx-1"
                              placeholder="Ordinario"
                              value={inputOrdinario}
                              onChange={e => setInputOrdinario(e.target.value)}
                              disabled={isSavingOrdinario}
                            />
                            <button
                              className={`h-6 px-2 text-xs rounded ${finalGradeId ? 'border-green-500 text-green-600 border bg-green-50 hover:bg-green-100' : 'bg-green-600 text-white'} font-semibold`}
                              style={{ minWidth: 60 }}
                              disabled={isSavingOrdinario || !finalGradeId}
                              onClick={async () => {
                                if (!finalGradeId || !alumnoCalificacionFinal?.courseGroupStudentId) return;
                                setIsSavingOrdinario(true);
                                try {
                                  await CourseService.updateFinalGrade(finalGradeId, { gradeOrdinary: Number(inputOrdinario) });
                                  setOrdinarioGuardado(Number(inputOrdinario));
                                  toast.success('Calificación ordinaria guardada correctamente');
                                  // No necesitamos recargar, ya tenemos el valor actualizado en el estado
                                } catch (err) {
                                  console.error('Error al guardar calificación ordinaria:', err);
                                  toast.error('Error al guardar calificación ordinaria');
                                } finally {
                                  setIsSavingOrdinario(false);
                                }
                              }}
                            >
                              {isSavingOrdinario ? 'Guardando...' : (finalGradeId ? '✏️ Editar' : '➕ Agregar')}
                            </button>
                          </div>
                        )
                      ) : '--'}
                    </td>
                    <td className={
                      ordinarioGuardado !== null && ordinarioGuardado < 6 && calificacionesFinales.promedio !== null && calificacionesFinales.promedio < 8
                        ? "px-2 py-1 bg-red-200 text-red-800 font-bold text-center"
                        : "px-2 py-1"
                    }>
                      {ordinarioGuardado !== null && ordinarioGuardado < 6 && calificacionesFinales.promedio !== null && calificacionesFinales.promedio < 8 ? (
                        extraordinarioGuardado !== null && extraordinarioGuardado < 6 ? (
                          'NA'
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              className="w-20 text-center border rounded px-2 py-1 mx-1"
                              placeholder="Extraordinario"
                              value={inputExtraordinario}
                              onChange={e => setInputExtraordinario(e.target.value)}
                              disabled={isSavingExtraordinario}
                            />
                            <button
                              className={`h-6 px-2 text-xs rounded ${finalGradeId ? 'border-green-500 text-green-600 border bg-green-50 hover:bg-green-100' : 'bg-green-600 text-white'} font-semibold`}
                              style={{ minWidth: 60 }}
                              disabled={isSavingExtraordinario || !finalGradeId}
                              onClick={async () => {
                                if (!finalGradeId || !alumnoCalificacionFinal?.courseGroupStudentId) return;
                                setIsSavingExtraordinario(true);
                                try {
                                  await CourseService.updateFinalGrade(finalGradeId, { gradeExtraordinary: Number(inputExtraordinario) });
                                  setExtraordinarioGuardado(Number(inputExtraordinario));
                                  toast.success('Calificación extraordinaria guardada correctamente');
                                  // No necesitamos recargar, ya tenemos el valor actualizado en el estado
                                } catch (err) {
                                  console.error('Error al guardar calificación extraordinaria:', err);
                                  toast.error('Error al guardar calificación extraordinaria');
                                } finally {
                                  setIsSavingExtraordinario(false);
                                }
                              }}
                            >
                              {isSavingExtraordinario ? 'Guardando...' : (finalGradeId ? '✏️ Editar' : '➕ Agregar')}
                            </button>
                          </div>
                        )
                      ) : '--'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">Cargando calificaciones...</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCalificacionFinalModalOpen(false);
              setOrdinarioGuardado(null);
              setExtraordinarioGuardado(null);
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
