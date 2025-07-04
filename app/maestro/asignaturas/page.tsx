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
}

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
  const [isLoadingAsistencia, setIsLoadingAsistencia] = useState(false)
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)
  const [isLoadingDateChange, setIsLoadingDateChange] = useState(false)

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
    
    // Cargar los alumnos del grupo
    try {
      const response = await handleGetStudentsByCourseGroup(courseGroup.id, 100, 0) // Cargar todos los alumnos
      const students = Array.isArray(response) ? response : response.items || []
      
      // Obtener las asistencias existentes para la fecha actual desde el backend
      let existingAttendances: AttendanceData[] = []
      try {
        const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(courseGroup.id, currentDate)
        existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        console.log('Asistencias existentes:', existingAttendances)
      } catch (attendanceError) {
        console.log('No se encontraron asistencias para esta fecha, se crearán nuevas')
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
    setIsLoadingAsistencia(false)
    setIsSavingAttendance(false)
    setIsLoadingDateChange(false)
  }

  const handleSaveAttendance = async () => {
    if (!asistenciaFecha || asistenciaAlumnos.length === 0) {
      toast.error('Por favor selecciona una fecha y verifica que hay alumnos')
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
          attend: alumno.attend || 1 // Enviar el valor numérico (1=Presente, 2=Ausente, 3=Retardo)
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

  const handleDateChange = (newDate: string) => {
    setAsistenciaFecha(newDate)
    
    if (!asistenciaGrupo?.courseGroup) return
    
    setIsLoadingDateChange(true)
    
    // Obtener las asistencias existentes para la nueva fecha desde el backend
    const loadAttendancesForDate = async () => {
      try {
        const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(asistenciaGrupo.courseGroup.id, newDate)
        const existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        console.log('Asistencias para nueva fecha:', existingAttendances)
        
        // Crear un mapa de asistencias por courseGroupStudentId
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        existingAttendances.forEach((att: AttendanceData) => {
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
              <DialogContent className="max-w-4xl [&>button]:hidden">
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingAlumnos ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                                <p>Cargando alumnos...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : alumnos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
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

            {/* Modal de Asistencia */}
            <Dialog open={isAsistenciaModalOpen} onOpenChange={setIsAsistenciaModalOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Asistencia</DialogTitle>
                  <DialogDescription>
                    Selecciona los alumnos presentes y ausentes
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 flex items-center gap-2">
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
                <div className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Presente</TableHead>
                          <TableHead>Ausente</TableHead>
                          <TableHead>Retardo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingAsistencia || isLoadingDateChange ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                                <p>{isLoadingDateChange ? 'Cargando asistencias...' : 'Cargando alumnos...'}</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : asistenciaAlumnos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Users className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No hay alumnos en este grupo</p>
                                <p className="text-sm">Agrega alumnos al grupo para tomar asistencia</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          asistenciaAlumnos.map((alumno) => (
                            <TableRow key={alumno.id}>
                              <TableCell className="font-medium">{alumno.fullName}</TableCell>
                              <TableCell>{alumno.registrationNumber}</TableCell>
                              <TableCell>
                                {alumno.attendanceId ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    ✓ Creada
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    ⚠ Nueva
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
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
    </div>
  )
}
