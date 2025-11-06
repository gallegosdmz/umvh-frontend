"use client"

// 🚀 OPTIMIZACIÓN: Este componente ahora usa un endpoint optimizado que trae todos los datos
// en una sola petición en lugar de hacer 99+ peticiones individuales.
// Endpoint: /api/course-groups/{courseGroupId}/evaluations-data

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
import { EvaluationsDataResponse, FinalDataResponse } from "@/types/api-responses"
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
import { AttendanceModal } from "@/components/attendance"
import { PonderacionesModal } from "@/components/ponderaciones"
import { usePonderaciones } from "@/hooks/use-ponderaciones"
import { useRealInternet, useOfflineGrades } from "@/hooks"



type EvalType = "actividades" | "evidencias";

export default function MaestroAsignaturas() {
  // Hook para detectar conexión REAL a internet
  useRealInternet()
  
  // Hook para manejar calificaciones offline
  const { 
    isOnline: gradesOnline, 
    saveGrade, 
    updateGrade,
    savePartialGrade, 
    saveFinalGrade,
    getOfflineGrades,
    getOfflinePartialGrade,
    getOfflineFinalGrade
  } = useOfflineGrades()
  
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
  
  // Hook para manejar ponderaciones
  const { ponderacionesCurso, ponderacionesIds, isLoading: isLoadingPonderaciones, loadPonderaciones } = usePonderaciones(selectedCourseGroup?.id)
  
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
  const [selectedCourseGroupForPonderaciones, setSelectedCourseGroupForPonderaciones] = useState<any | null>(null)

  const [isEvaluacionesModalOpen, setIsEvaluacionesModalOpen] = useState(false)
  const [isActividadesModalOpen, setIsActividadesModalOpen] = useState(false)
  const [alumnoEvaluacion, setAlumnoEvaluacion] = useState<any | null>(null)
  const [selectedCourseGroupForActividades, setSelectedCourseGroupForActividades] = useState<any | null>(null)
  const [evaluaciones, setEvaluaciones] = useState({
    actividades: Array(10).fill(0),
    evidencias: Array(5).fill(0),
    producto: 0,
    examen: 0,
  })
  const [evaluacionesParciales, setEvaluacionesParciales] = useState({
    actividades: Array(10).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
    evidencias: Array(5).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
    producto: { name: '', grade: 0, id: null, partialEvaluationId: null },
    examen: { name: '', grade: 0, id: null, partialEvaluationId: null },
  })
  const [actividadesDefinidas, setActividadesDefinidas] = useState({
    actividades: Array(10).fill({ name: '', id: null, partial: 1 }),
    evidencias: Array(5).fill({ name: '', id: null, partial: 1 }),
    producto: { name: 'Producto del Parcial', id: null, partial: 1 },
    examen: { name: 'Examen Parcial', id: null, partial: 1 },
  })
  const [todasLasActividades, setTodasLasActividades] = useState<any[]>([])
  const [isSavingPartial, setIsSavingPartial] = useState(false)
  const [isSavingActividad, setIsSavingActividad] = useState(false)
  const [selectedPartial, setSelectedPartial] = useState(1)
  const [selectedPartialForActividades, setSelectedPartialForActividades] = useState(1)
  const [calificacionParcial, setCalificacionParcial] = useState<number | null>(null)
  
  // Estado para almacenar las calificaciones de todos los alumnos
  const [calificacionesAlumnos, setCalificacionesAlumnos] = useState<{[key: number]: {
    actividades: Array<{grade: number, id: number | null}>,
    evidencias: Array<{grade: number, id: number | null}>,
    producto: {grade: number, id: number | null},
    examen: {grade: number, id: number | null}
  }}>({})

  const [calificacionesParcialesAlumnos, setCalificacionesParcialesAlumnos] = useState<{[key: number]: {
    calificacion: number,
    porcentajeAsistencia: number,
    parcial1?: number,
    parcial2?: number,
    parcial3?: number
  }}>({})
  
  // Estado para controlar si ya se han cargado las calificaciones y evitar bucles infinitos
  const [calificacionesLoaded, setCalificacionesLoaded] = useState(false)
  
  // Estado para el modal general
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false)
  const [selectedCourseForGeneral, setSelectedCourseForGeneral] = useState<Course | null>(null)
  const [selectedCourseGroupForGeneral, setSelectedCourseGroupForGeneral] = useState<any | null>(null)
  const [calificacionesGenerales, setCalificacionesGenerales] = useState<{[key: number]: {
    parcial1: number,
    parcial2: number,
    parcial3: number,
    promedio: number
  }}>({})
  
  // Estados separados para el modal de General (NO afectan otros modales)
  const [alumnosGenerales, setAlumnosGenerales] = useState<FinalDataResponse['students']>([])
  const [calificacionesFinalesGenerales, setCalificacionesFinalesGenerales] = useState<{[key: number]: {
    ordinario: number | null;
    extraordinario: number | null;
  }}>({})
  const [isLoadingGenerales, setIsLoadingGenerales] = useState(false)
  
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
  
  // Estado para almacenar las calificaciones finales de todos los alumnos
  const [calificacionesFinalesAlumnos, setCalificacionesFinalesAlumnos] = useState<{[key: number]: {
    ordinario: number | null;
    extraordinario: number | null;
  }}>({});

  // Estado para almacenar los mapas optimizados de asistencias y calificaciones
  const [asistenciasMap, setAsistenciasMap] = useState<{[key: number]: {[key: number]: any[]}}>({})
  const [calificacionesMap, setCalificacionesMap] = useState<{[key: number]: {[key: number]: number}}>({})

  // Función helper para crear estructura vacía de calificaciones
  const crearEstructuraVaciaCalificaciones = () => {
    const estructuraVacia: {[key: number]: any} = {};
    alumnos.forEach(alumno => {
        estructuraVacia[alumno.courseGroupStudentId!] = {
          actividades: Array(10).fill({ grade: 0, id: null }),
          evidencias: Array(5).fill({ grade: 0, id: null }),
          producto: { grade: 0, id: null },
          examen: { grade: 0, id: null }
        };
    });
    return estructuraVacia;
  };

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
    console.log('🧹 LIMPIANDO CACHE DE DATOS ANTERIORES');
    
    // Limpiar cache de datos anteriores para evitar datos incorrectos
    setCalificacionesAlumnos({})
    setCalificacionesParcialesAlumnos({})
    setCalificacionesMap({})
    setAsistenciasMap({})
    setCalificacionesLoaded(false)
    
    // Forzar recarga de ponderaciones para asegurar datos frescos
    if (courseGroup?.id) {
      console.log('🔄 FORZANDO RECARGA DE PONDERACIONES');
      // El hook use-ponderaciones se ejecutará automáticamente cuando cambie selectedCourseGroup
    }

    // Determinar el parcial activo según el periodo
    const period = courseGroup.group?.period
    let parcialActivo = 1 // Por defecto primer parcial
    
    console.log('🔍 PERIODO DEL GRUPO:', period);
    console.log('🔍 PROPIEDADES DEL PERIODO:', {
      firstPartialActive: period?.firstPartialActive,
      secondPartialActive: period?.secondPartialActive,
      thirdPartialActive: period?.thirdPartialActive
    });
    
    if (period?.firstPartialActive) {
      parcialActivo = 1
      console.log('✅ PARCIAL ACTIVO: 1 (firstPartialActive)');
    } else if (period?.secondPartialActive) {
      parcialActivo = 2
      console.log('✅ PARCIAL ACTIVO: 2 (secondPartialActive)');
    } else if (period?.thirdPartialActive) {
      parcialActivo = 3
      console.log('✅ PARCIAL ACTIVO: 3 (thirdPartialActive)');
    } else {
      console.log('⚠️ NINGÚN PARCIAL ACTIVO DETECTADO - USANDO PARCIAL 1 POR DEFECTO');
    }
    
    console.log('🎯 PARCIAL ACTIVO FINAL:', parcialActivo);
    setSelectedPartial(parcialActivo)
    
    setSelectedGroupId(groupId)
    setSelectedCourse(course)
    setSelectedCourseGroup(courseGroup)
    setIsModalOpen(true)
    setIsLoadingAlumnos(true)
    
    try {
      const evaluationsData = await CourseService.getCourseGroupEvaluationsData(courseGroup.id!)

      // Extraer estudiantes
      const students = evaluationsData.students || []
      const mappedStudents = students.map((item: any) => ({
        id: item.id,
        fullName: item.fullName,
        semester: item.semester,
        registrationNumber: item.registrationNumber,
        courseGroupStudentId: item.courseGroupStudentId
      }))
      setAlumnos(mappedStudents)
      setCurrentAlumnosPage(1)
      

      
      // Procesar actividades definidas
      const actividadesDefinidasData = evaluationsData.partialEvaluations || []
      const actividadesFiltradas = filtrarActividadesPorParcial(actividadesDefinidasData, parcialActivo)
      setActividadesDefinidas(actividadesFiltradas)
      
      // Procesar calificaciones y asistencias para evitar peticiones individuales
      await procesarDatosOptimizados(evaluationsData, mappedStudents, parcialActivo)
      
      
    } catch (error) {
      console.error('Error al cargar los datos optimizados:', error)
      toast.error('Error al cargar los datos del grupo')
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

  const handleOpenPonderacionesModal = (course: Course, courseGroup: any) => {
    setSelectedCourseGroupForPonderaciones(courseGroup)
    setIsPonderacionesModalOpen(true)
    // Recargar ponderaciones cuando se abra el modal
    if (courseGroup?.id) {
      loadPonderaciones()
    }
  }



  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<Course | null>(null)
  const [selectedCourseGroupForAttendance, setSelectedCourseGroupForAttendance] = useState<any | null>(null)

  const handleOpenAttendanceModal = (asignatura: Course, courseGroup: any) => {
    setSelectedCourseForAttendance(asignatura)
    setSelectedCourseGroupForAttendance(courseGroup)
    setIsAttendanceModalOpen(true)
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
    
    
    if (!ponderacionesCurso) {
      
      return
    }
    
    let calificacionFinal = 0
    let totalPonderacion = 0
    
    // 1. Cálculo de Asistencia
    
    
    if (ponderacionesCurso.asistencia > 0 && alumnoEvaluacion?.courseGroupStudentId) {
      try {
        
        // Usar el método correcto para obtener todas las asistencias del alumno en el parcial
        const asistenciasAlumno = await CourseService.getAttendancesByCourseGroupStudentAndPartial(
          alumnoEvaluacion.courseGroupStudentId,
          selectedPartial
        );

        

        if (Array.isArray(asistenciasAlumno) && asistenciasAlumno.length > 0) {
          const asistenciasPresentes = asistenciasAlumno.filter((att) => att.attend === 1).length;
          const totalAsistencias = asistenciasAlumno.length;
          const porcentajeAsistencia = (asistenciasPresentes / totalAsistencias) * 100;
          const asistenciaPromedio = (porcentajeAsistencia / 100) * 10;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;

          

          calificacionFinal += calificacionAsistencia;
          totalPonderacion += ponderacionesCurso.asistencia;
        } else {
          // No hay asistencias registradas para este alumno en el parcial
          const asistenciaPromedio = 0;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
          
        }
      } catch (error) {
        
        const asistenciaPromedio = 0;
        const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
        
      }
    } else {
      
      const asistenciaPromedio = 0;
      const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
      
    }
    
    // 2. Cálculo de Actividades
    
    
    const actividadesValores = evaluacionesParciales.actividades
      .filter(item => item.grade > 0)
      .map(item => item.grade)
    
    
    
    if (actividadesValores.length > 0) {
      const promedioActividades = actividadesValores.reduce((sum, grade) => sum + grade, 0) / actividadesValores.length
      const calificacionActividades = (promedioActividades * ponderacionesCurso.actividades) / 100
      
      
      
      if (ponderacionesCurso.actividades > 0) {
        calificacionFinal += calificacionActividades
        totalPonderacion += ponderacionesCurso.actividades
      }
    } else {
      
    }
    
    // 3. Cálculo de Evidencias
    
    
    const evidenciasValores = evaluacionesParciales.evidencias
      .filter(item => item.grade > 0)
      .map(item => item.grade)
    
    
    
    if (evidenciasValores.length > 0) {
      const promedioEvidencias = evidenciasValores.reduce((sum, grade) => sum + grade, 0) / evidenciasValores.length
      const calificacionEvidencias = (promedioEvidencias * ponderacionesCurso.evidencias) / 100
      
      
      
      if (ponderacionesCurso.evidencias > 0) {
        calificacionFinal += calificacionEvidencias
        totalPonderacion += ponderacionesCurso.evidencias
      }
    } else {
      
    }
    
    // 4. Cálculo de Producto
    
    
    if (evaluacionesParciales.producto.grade > 0) {
      const calificacionProducto = (evaluacionesParciales.producto.grade * ponderacionesCurso.producto) / 100
      
      
      if (ponderacionesCurso.producto > 0) {
        calificacionFinal += calificacionProducto
        totalPonderacion += ponderacionesCurso.producto
      }
    } else {
      
    }
    
    // 5. Cálculo de Examen
    
    
    if (evaluacionesParciales.examen.grade > 0) {
      const calificacionExamen = (evaluacionesParciales.examen.grade * ponderacionesCurso.examen) / 100
      
      
      if (ponderacionesCurso.examen > 0) {
        calificacionFinal += calificacionExamen
        totalPonderacion += ponderacionesCurso.examen
      }
    } else {
      
    }
    
    
    
    if (totalPonderacion > 0) {
      const calificacionFinalCalculada = calificacionFinal
      
      setCalificacionParcial(calificacionFinalCalculada)
    } else {
      
      setCalificacionParcial(null)
    }
    
    
  }

  // Función para filtrar actividades por parcial
  const filtrarActividadesPorParcial = (actividadesDefinidasData: any[], parcial: number) => {
    // Inicializar arrays vacíos
    const actividades = Array(10).fill({ name: '', id: null, partial: parcial });
    const evidencias = Array(5).fill({ name: '', id: null, partial: parcial });
    let producto = { name: 'Producto del Parcial', id: null, partial: parcial };
    let examen = { name: 'Examen Parcial', id: null, partial: parcial };
    
    // Filtrar solo las actividades del parcial seleccionado
    const actividadesDelParcial = actividadesDefinidasData.filter((item: any) => item.partial === parcial);
    
    
    // Mapear las actividades definidas por slot
    actividadesDelParcial.forEach((item: any) => {
      
      
      if (item.type === 'Actividades' && typeof item.slot === 'number' && item.slot < 10) {
        
        actividades[item.slot] = { name: item.name, id: item.id, partial: item.partial };
      } else if (item.type === 'Evidencias' && typeof item.slot === 'number' && item.slot < 5) {
        
        evidencias[item.slot] = { name: item.name, id: item.id, partial: item.partial };
      } else if (item.type === 'Producto') {
        
        producto = { name: item.name || 'Producto del Parcial', id: item.id, partial: item.partial };
      } else if (item.type === 'Examen') {
        
        examen = { name: item.name || 'Examen Parcial', id: item.id, partial: item.partial };
      }
    });
    
    return { actividades, evidencias, producto, examen };
  };

  // Función para abrir el modal de actividades
  const handleOpenActividadesModal = async (course: Course, courseGroup: any) => {
    
    
    setSelectedCourseGroupForActividades(courseGroup);
    setIsActividadesModalOpen(true);
    
    try {
      // Cargar las actividades definidas para este curso
      const actividadesDefinidasData = await CourseService.getPartialEvaluationsByCourseGroupId(courseGroup.id);
      
      
      // Guardar todas las actividades
      setTodasLasActividades(actividadesDefinidasData);
      
      // Inicializar con el parcial seleccionado por defecto
      setSelectedPartialForActividades(1);
      
      // Filtrar y mostrar solo las actividades del primer parcial
      const actividadesFiltradas = filtrarActividadesPorParcial(actividadesDefinidasData, 1);
      setActividadesDefinidas(actividadesFiltradas);
      
    } catch (error) {
      
      toast.error('Error al cargar las actividades');
    }
  };

  // Función para obtener calificación de un parcial específico (método individual)
  const obtenerCalificacionParcial = async (courseGroupStudentId: number, parcial: number) => {
    try {
      const response = await CourseService.getPartialGradesByStudentAndPartial(courseGroupStudentId, parcial);
      
      
      if (response && response.length > 0) {
        // Buscar la calificación parcial calculada
        const partialGrade = response.find((grade: any) => grade.partial === parcial);
        if (partialGrade && partialGrade.grade > 0) {
          return partialGrade.grade;
        }
      }
      
      return 0;
    } catch (error) {
      
      return 0;
    }
  };

  // Función optimizada para obtener todas las calificaciones parciales de un grupo
  const obtenerCalificacionesParcialesOptimizado = async (courseGroupId: number) => {
    try {
      const response = await CourseService.getPartialGradesByCourseGroup(courseGroupId);
      
      // Crear un mapa de calificaciones por estudiante y parcial
      const calificacionesMap: {[key: number]: {[key: number]: number}} = {};
      
      if (response && Array.isArray(response)) {
        response.forEach((grade: any) => {
          const courseGroupStudentId = grade.courseGroupStudentId;
          const partial = grade.partial;
          const gradeValue = grade.grade || 0;
          
          if (!calificacionesMap[courseGroupStudentId]) {
            calificacionesMap[courseGroupStudentId] = {};
          }
          
          calificacionesMap[courseGroupStudentId][partial] = gradeValue;
        });
      }
      
      return calificacionesMap;
    } catch (error) {
      console.error('Error al obtener calificaciones parciales optimizado:', error);
      return {};
    }
  };

  // Función optimizada para obtener todas las asistencias de un grupo
  const obtenerAsistenciasOptimizado = async (courseGroupId: number) => {
    try {
      const response = await CourseService.getAttendancesByCourseGroup(courseGroupId);
      
      // Crear un mapa de asistencias por estudiante y parcial
      const asistenciasMap: {[key: number]: {[key: number]: any[]}} = {};
      
      if (response && Array.isArray(response)) {
        response.forEach((attendance: any) => {
          const courseGroupStudentId = attendance.courseGroupStudentId;
          const partial = attendance.partial;
          
          if (!asistenciasMap[courseGroupStudentId]) {
            asistenciasMap[courseGroupStudentId] = {};
          }
          
          if (!asistenciasMap[courseGroupStudentId][partial]) {
            asistenciasMap[courseGroupStudentId][partial] = [];
          }
          
          asistenciasMap[courseGroupStudentId][partial].push(attendance);
        });
      }
      
      return asistenciasMap;
    } catch (error) {
      console.error('Error al obtener asistencias optimizado:', error);
      return {};
    }
  };

  // Función para procesar los datos optimizados del endpoint
  const procesarDatosOptimizados = async (evaluationsData: EvaluationsDataResponse, students: any[], parcialSeleccionado?: number) => {
    try {
      
      // Usar el parcial pasado como parámetro o el estado actual
      const parcialActual = parcialSeleccionado || selectedPartial;
      
      console.log('🎯 PARCIAL ACTUAL:', parcialActual, 'SELECTED PARTIAL:', selectedPartial, 'PARCIAL SELECCIONADO:', parcialSeleccionado);
      
      const { partialGrades, attendances, partialEvaluations, partialEvaluationGrades } = evaluationsData;
      
      // Crear mapas optimizados para calificaciones parciales
      const calificacionesMapTemp: {[key: number]: {[key: number]: number}} = {};
      if (partialGrades && Array.isArray(partialGrades)) {
        partialGrades.forEach((grade: any) => {
          const courseGroupStudentId = grade.courseGroupStudentId;
          const partial = grade.partial;
          const gradeValue = grade.grade || 0;
          
          if (!calificacionesMapTemp[courseGroupStudentId]) {
            calificacionesMapTemp[courseGroupStudentId] = {};
          }
          calificacionesMapTemp[courseGroupStudentId][partial] = gradeValue;
        });
      }
      
      // Guardar en el estado
      setCalificacionesMap(calificacionesMapTemp);

      
      // Crear mapas optimizados para asistencias
      const asistenciasMapTemp: {[key: number]: {[key: number]: any[]}} = {};
      
      if (attendances && Array.isArray(attendances)) {
        // Agrupar asistencias por courseGroupStudentId y partial
        const asistenciasPorEstudiante: {[key: number]: {[key: number]: any[]}} = {};
        
        attendances.forEach((attendance: any) => {
          const courseGroupStudentId = attendance.courseGroupStudentId;
          const partial = attendance.partial;
          
          if (!asistenciasPorEstudiante[courseGroupStudentId]) {
            asistenciasPorEstudiante[courseGroupStudentId] = {};
          }
          
          if (!asistenciasPorEstudiante[courseGroupStudentId][partial]) {
            asistenciasPorEstudiante[courseGroupStudentId][partial] = [];
          }
          
          asistenciasPorEstudiante[courseGroupStudentId][partial].push(attendance);
        });
        
        // Crear el mapa final
        Object.keys(asistenciasPorEstudiante).forEach(courseGroupStudentId => {
          const studentId = parseInt(courseGroupStudentId);
          asistenciasMapTemp[studentId] = asistenciasPorEstudiante[studentId];
        });
        
      } else {
        console.log('⚠️ No se encontraron attendances o no es un array');
      }
      
      // Guardar en el estado
      setAsistenciasMap(asistenciasMapTemp);

      
      // Crear mapa de calificaciones de actividades por estudiante y evaluación
      const calificacionesActividadesMap: {[key: number]: {[key: number]: any}} = {};

      
      if (partialEvaluationGrades && Array.isArray(partialEvaluationGrades)) {
        partialEvaluationGrades.forEach((grade: any) => {
          const courseGroupStudentId = grade.courseGroupStudentId;
          const partialEvaluationId = grade.partialEvaluationId;
          
          if (!calificacionesActividadesMap[courseGroupStudentId]) {
            calificacionesActividadesMap[courseGroupStudentId] = {};
          }
          
          calificacionesActividadesMap[courseGroupStudentId][partialEvaluationId] = {
            grade: grade.grade || 0,
            id: grade.id,
            partialEvaluation: grade.partialEvaluation // Guardar la relación completa
          };
        });
        
      } else {
        console.log('⚠️ No se encontraron partialEvaluationGrades o no es un array');
      }
      
      // Procesar calificaciones de actividades para el parcial seleccionado
      const nuevasCalificaciones: {[key: number]: any} = {};
      
      for (const student of students) {
        const courseGroupStudentId = student.courseGroupStudentId;
        
        // Inicializar estructura para el alumno
        nuevasCalificaciones[courseGroupStudentId] = {
          actividades: Array(10).fill(null).map(() => ({grade: 0, id: null})),
          evidencias: Array(5).fill(null).map(() => ({grade: 0, id: null})),
          producto: {grade: 0, id: null},
          examen: {grade: 0, id: null}
        };
        
        // Procesar calificaciones de actividades del parcial seleccionado
        if (partialEvaluations && Array.isArray(partialEvaluations)) {
          console.log(`🔍 PROCESANDO EVALUACIONES PARA ESTUDIANTE ${student.fullName} (ID: ${courseGroupStudentId})`);
          
          partialEvaluations.forEach((evaluation: any) => {
            if (evaluation.partial === parcialActual) {
              // Buscar la calificación específica para esta actividad y estudiante
              const studentGrades = calificacionesActividadesMap[courseGroupStudentId] || {};
              const grade = studentGrades[evaluation.id];
              
              console.log(`📋 EVALUACIÓN ENCONTRADA:`, {
                type: evaluation.type,
                slot: evaluation.slot,
                partial: evaluation.partial,
                evaluationId: evaluation.id,
                grade: grade?.grade || 0,
                studentName: student.fullName
              });
              
              if (evaluation.type === 'Actividades' && typeof evaluation.slot === 'number' && evaluation.slot < 10) {
                console.log(`✅ ASIGNANDO A ACTIVIDADES - Slot: ${evaluation.slot}, Grade: ${grade?.grade || 0}`);
                nuevasCalificaciones[courseGroupStudentId].actividades[evaluation.slot] = {
                  grade: grade?.grade || 0,
                  id: grade?.id || null
                };
              } else if (evaluation.type === 'Evidencias' && typeof evaluation.slot === 'number' && evaluation.slot < 5) {
                console.log(`✅ ASIGNANDO A EVIDENCIAS - Slot: ${evaluation.slot}, Grade: ${grade?.grade || 0}`);
                nuevasCalificaciones[courseGroupStudentId].evidencias[evaluation.slot] = {
                  grade: grade?.grade || 0,
                  id: grade?.id || null
                };
              } else if (evaluation.type === 'Producto') {
                console.log(`✅ ASIGNANDO A PRODUCTO - Grade: ${grade?.grade || 0}`);
                nuevasCalificaciones[courseGroupStudentId].producto = {
                  grade: grade?.grade || 0,
                  id: grade?.id || null
                };
              } else if (evaluation.type === 'Examen') {
                console.log(`✅ ASIGNANDO A EXAMEN - Grade: ${grade?.grade || 0}`);
                nuevasCalificaciones[courseGroupStudentId].examen = {
                  grade: grade?.grade || 0,
                  id: grade?.id || null
                };
              } else {
                console.log(`⚠️ EVALUACIÓN NO RECONOCIDA:`, {
                  type: evaluation.type,
                  slot: evaluation.slot,
                  message: 'No se pudo asignar a ninguna categoría'
                });
              }
            }
          });
        }
        
        // Mostrar resultado final para cada estudiante
        console.log(`📊 RESULTADO FINAL PARA ${student.fullName}:`, {
          actividades: nuevasCalificaciones[courseGroupStudentId].actividades.filter((a: any) => a.grade > 0).length,
          evidencias: nuevasCalificaciones[courseGroupStudentId].evidencias.filter((e: any) => e.grade > 0).length,
          producto: nuevasCalificaciones[courseGroupStudentId].producto.grade,
          examen: nuevasCalificaciones[courseGroupStudentId].examen.grade
        });
      }
      
      // Establecer los datos procesados
      setCalificacionesAlumnos(nuevasCalificaciones);
      
      // NO calcular calificaciones parciales aquí - se hará en el useEffect cuando las ponderaciones estén listas
      
      // Marcar como cargadas para evitar bucles
      setCalificacionesLoaded(true);
      
    } catch (error) {
      console.error('Error al procesar datos optimizados:', error);
    }
  };

  // Función optimizada para obtener todos los datos del grupo usando el nuevo endpoint
  const obtenerDatosCompletosGrupo = async (courseGroupId: number) => {
    try {

      
      // Usar el nuevo endpoint específico para el modal de General
      const response = await CourseService.getCourseGroupFinalData(courseGroupId);
      
      // ========== CONSOLE.LOG: DATOS DEL ENDPOINT ==========
      console.log('📊 ========== DATOS DEL ENDPOINT - Reporte General ==========');
      console.log('🔵 Response completo del endpoint:', response);
      console.log('🔵 Estructura de response:', {
        students: response.students ? `Array de ${response.students.length} estudiantes` : 'No existe'
      });
      
      if (response.students && response.students.length > 0) {
        console.log('🔵 Ejemplo de estudiante (primer elemento):', response.students[0]);
        console.log('🔵 Propiedades disponibles en estudiantes:', Object.keys(response.students[0] || {}));
        if (response.students[0].partialGrades) {
          console.log('🔵 Ejemplo de partialGrades:', response.students[0].partialGrades);
        }
        if (response.students[0].attendances) {
          console.log('🔵 Ejemplo de attendances:', response.students[0].attendances);
        }
        if (response.students[0].finalGrade) {
          console.log('🔵 Ejemplo de finalGrade:', response.students[0].finalGrade);
        }
      }
      console.log('📊 ============================================================');
      
      // Los datos ya vienen agrupados por estudiante, simplemente retornarlos
      return {
        students: response.students || []
      };
    } catch (error) {
      console.error('Error al obtener datos completos del grupo:', error);
      return {
        students: []
      };
    }
  };

  // Función para abrir el modal general
  const handleOpenGeneralModal = async (course: Course, courseGroup: any) => {
    
    setSelectedCourseForGeneral(course);
    setSelectedCourseGroupForGeneral(courseGroup);
    setIsGeneralModalOpen(true);
    setIsLoadingGenerales(true);
    
    try {
      // Cargar todos los datos del grupo en una sola llamada (SUPER OPTIMIZADO)
      const datosCompletos = await obtenerDatosCompletosGrupo(courseGroup.id);
      
      
      // Validar que students existe y es un array
      if (!datosCompletos.students || !Array.isArray(datosCompletos.students)) {
        console.error('❌ Error: datosCompletos.students no es un array válido:', datosCompletos.students);
        toast.error('Error: No se pudieron cargar los estudiantes');
        return;
      }
      
      
      // Los estudiantes ya vienen en el formato correcto del endpoint
      const mappedStudents = datosCompletos.students || [];
      setAlumnosGenerales(mappedStudents);
      
      // Crear mapas de calificaciones finales desde los datos de los estudiantes
      const calificacionesFinalesMap: {[key: number]: {
        ordinario: number | null;
        extraordinario: number | null;
      }} = {};
      
      for (const alumno of mappedStudents) {
        const courseGroupStudentId: number = (alumno.courseGroupStudentId || alumno.id || 0) as number;
        if (alumno.finalGrade) {
          calificacionesFinalesMap[courseGroupStudentId] = {
            ordinario: alumno.finalGrade.gradeOrdinary || null,
            extraordinario: alumno.finalGrade.gradeExtraordinary || null
          };
        }
      }
      
      setCalificacionesFinalesGenerales(calificacionesFinalesMap);
      
      // Los datos ya están cargados desde el endpoint, no es necesario guardar automáticamente
      // El usuario puede usar el botón "Recalcular Finales" si desea actualizar las calificaciones
      
      
      toast.success(`Datos cargados correctamente: ${mappedStudents.length} estudiantes`);
      
    } catch (error) {
      console.error('Error al cargar datos para el modal general:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoadingGenerales(false);
    }
  };

  // Función para calcular y guardar automáticamente las calificaciones finales
  const calcularYGuardarCalificacionesFinales = async (courseGroupStudentId: number, promedio: number) => {
    if (promedio <= 0) return;
    
    try {
      // Convertir a entero con redondeo matemático estándar (el backend espera números enteros)
      // 8.50 sube a 9, 8.49 baja a 8
      const promedioEntero = Math.round(promedio);
      
      // Buscar si ya existe una calificación final
      const finalGrades = await CourseService.getFinalGradesByCourseGroupStudentId(courseGroupStudentId);
      
      if (finalGrades && finalGrades.length > 0) {
        // Actualizar solo el campo grade, preservar gradeOrdinary y gradeExtraordinary
        await CourseService.updateFinalGrade(finalGrades[0].id, { 
          grade: promedioEntero
        });

      } else {
        // Crear nueva calificación final con gradeOrdinary y gradeExtraordinary en 0
        await CourseService.createFinalGrade({
          grade: promedioEntero,
          gradeOrdinary: 0,
          gradeExtraordinary: 0,
          date: new Date().toISOString(),
          type: 'final',
          courseGroupStudentId: courseGroupStudentId
        });

      }
      
      // Actualizar el estado local
      setCalificacionesFinalesGenerales(prev => ({
        ...prev,
        [courseGroupStudentId]: {
          ...prev[courseGroupStudentId],
          ordinario: promedioEntero
        }
      }));
      
    } catch (error) {
      console.error('Error al calcular/guardar calificación final:', error);
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
      partial: data.partial || 1,
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
      partialEvaluationId: actividadDefinida.id,
      courseGroupStudentId: alumnoEvaluacion?.courseGroupStudentId,
    };

    try {
      if (data.id) {
        // PATCH
        
        await CourseService.updatePartialEvaluationGrade(data.id, dto);
        toast.success("Calificación editada correctamente");
      } else {
        // POST
        
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

      // DESPUÉS DE GUARDAR LA EVALUACIÓN INDIVIDUAL, GUARDAR LA CALIFICACIÓN PARCIAL FINAL
      if (calificacionParcial && calificacionParcial > 0 && alumnoEvaluacion?.courseGroupStudentId) {
        try {
          const partialGradeDto = {
            partial: selectedPartial,
            grade: Math.round(calificacionParcial * 100) / 100, // Redondear a 2 decimales
            date: new Date().toISOString(),
            courseGroupStudentId: alumnoEvaluacion.courseGroupStudentId
          };
          
          
          
          // Verificar si ya existe una calificación parcial para este alumno y parcial
          const existingPartialGrades = await CourseService.getPartialGradesByStudentAndPartial(
            alumnoEvaluacion.courseGroupStudentId, 
            selectedPartial
          );
          
          
          
          if (existingPartialGrades && existingPartialGrades.length > 0) {
            // Actualizar la calificación parcial existente
            const existingPartialGrade = existingPartialGrades[0]; // Tomar la primera
            
            
            const result = await CourseService.updatePartialGrade(existingPartialGrade.id, partialGradeDto);
            
          } else {
            // Crear nueva calificación parcial
            
            
            const result = await CourseService.createPartialGrade(partialGradeDto);
            
          }
          
        } catch (error) {
          
          // No mostrar toast de error para no confundir al usuario
        }
      }
    } catch (error) {
      
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
        const actividades = Array(10).fill({ name: '', grade: 0, id: null, partialEvaluationId: null });
        const evidencias = Array(5).fill({ name: '', grade: 0, id: null, partialEvaluationId: null });
        let producto = { name: '', grade: 0, id: null, partialEvaluationId: null };
        let examen = { name: '', grade: 0, id: null, partialEvaluationId: null };
        
        // Mapear las actividades definidas y buscar sus calificaciones en coursesGroupsStudents
        actividadesDefinidasData.forEach((actividadDefinida: any) => {
          
          
          // Solo procesar actividades del parcial seleccionado
          if (actividadDefinida.partial !== selectedPartial) {
            
            return;
          }
          
          // Buscar el courseGroupStudent específico del alumno
          const courseGroupStudent = actividadDefinida.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumnoEvaluacion.courseGroupStudentId
          );
          
          
          
          // Buscar la calificación específica para esta actividad
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => {
              
              
              const matchesActivity = peg.partialEvaluation?.id === actividadDefinida.id;
              
              
              return matchesActivity;
            }
          );
          
          
          
          if (actividadDefinida.type === 'Actividades' && typeof actividadDefinida.slot === 'number' && actividadDefinida.slot < 10) {
            const actividadData = { 
              name: actividadDefinida.name, 
              grade: grade?.grade || 0, 
              id: grade?.id || null, 
              partialEvaluationId: actividadDefinida.id 
            };
            
            actividades[actividadDefinida.slot] = actividadData;
          } else if (actividadDefinida.type === 'Evidencias' && typeof actividadDefinida.slot === 'number' && actividadDefinida.slot < 5) {
            const evidenciaData = { 
              name: actividadDefinida.name, 
              grade: grade?.grade || 0, 
              id: grade?.id || null, 
              partialEvaluationId: actividadDefinida.id 
            };
            
            evidencias[actividadDefinida.slot] = evidenciaData;
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
        // Solo mostrar las actividades del parcial seleccionado
        const actividadesDefinidas = {
          actividades: Array(10).fill({ name: '', id: null, partial: selectedPartial }),
          evidencias: Array(5).fill({ name: '', id: null, partial: selectedPartial }),
          producto: { name: 'Producto del Parcial', id: null, partial: selectedPartial },
          examen: { name: 'Examen Parcial', id: null, partial: selectedPartial },
        };
        
        // Filtrar solo las actividades del parcial seleccionado
        const actividadesDelParcial = actividadesDefinidasData.filter((item: any) => item.partial === selectedPartial);
        
        actividadesDelParcial.forEach((item: any) => {
          if (item.type === 'Actividades' && typeof item.slot === 'number' && item.slot < 10) {
            actividadesDefinidas.actividades[item.slot] = { name: item.name, id: item.id, partial: item.partial };
          } else if (item.type === 'Evidencias' && typeof item.slot === 'number' && item.slot < 5) {
            actividadesDefinidas.evidencias[item.slot] = { name: item.name, id: item.id, partial: item.partial };
          } else if (item.type === 'Producto') {
            actividadesDefinidas.producto = { name: item.name || 'Producto del Parcial', id: item.id, partial: item.partial };
          } else if (item.type === 'Examen') {
            actividadesDefinidas.examen = { name: item.name || 'Examen Parcial', id: item.id, partial: item.partial };
          }
        });
        
        setActividadesDefinidas(actividadesDefinidas);
      } catch (error) {
        
        setEvaluacionesParciales({
          actividades: Array(10).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
          evidencias: Array(5).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
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

  // Cargar calificaciones cuando se abra el modal de alumnos (OPTIMIZADO)
  useEffect(() => {
    if (isModalOpen && selectedCourseGroup && alumnos.length > 0 && !calificacionesLoaded) {
      // Ya no necesitamos cargar calificaciones aquí porque se hace en procesarDatosOptimizados
      setCalificacionesLoaded(true);
    }
  }, [isModalOpen, selectedCourseGroup, alumnos, calificacionesLoaded]);

  // Recalcular calificaciones parciales cuando cambien las ponderaciones (OPTIMIZADO)
  useEffect(() => {
    if (isModalOpen && ponderacionesCurso && !isLoadingPonderaciones && Object.keys(calificacionesAlumnos).length > 0 && calificacionesLoaded) {
      // VALIDACIÓN: Verificar que los datos son consistentes antes de calcular
      console.log('🔍 VALIDANDO CONSISTENCIA DE DATOS ANTES DEL CÁLCULO');
      
      // Verificar que hay datos válidos en calificacionesAlumnos
      const hasValidStudentData = Object.values(calificacionesAlumnos).some((studentData: any) => 
        studentData && (studentData.actividades?.length > 0 || studentData.evidencias?.length > 0 || studentData.producto?.grade > 0 || studentData.examen?.grade > 0)
      );
      
      if (!hasValidStudentData) {
        console.log('⚠️ NO HAY DATOS VÁLIDOS DE ESTUDIANTES - Esperando carga completa');
        return;
      }
      
      // Solo recalcular si no se han calculado las calificaciones parciales aún
      const shouldRecalculate = Object.keys(calificacionesParcialesAlumnos).length === 0;
      if (shouldRecalculate) {
        console.log('✅ DATOS VÁLIDOS - Iniciando cálculo de calificaciones parciales');
        // Usar la función optimizada con los mapas del estado
        calcularCalificacionesParcialesOptimizado(alumnos, calificacionesMap, asistenciasMap, selectedPartial);
      }
    }
  }, [isModalOpen, ponderacionesCurso, isLoadingPonderaciones, calificacionesLoaded]);

  // Recargar actividades cuando se cierre el modal de actividades (para reflejar cambios)
  useEffect(() => {
    if (!isActividadesModalOpen && selectedCourseGroup && isModalOpen) {
      // Recargar las actividades cuando se cierre el modal de actividades
      const recargarActividades = async () => {
        try {
          const actividadesDefinidasData = await CourseService.getPartialEvaluationsByCourseGroupId(selectedCourseGroup.id!)
          const actividadesFiltradas = filtrarActividadesPorParcial(actividadesDefinidasData, selectedPartial)
          setActividadesDefinidas(actividadesFiltradas)
        } catch (error) {
          console.error('Error al recargar actividades:', error)
        }
      }
      recargarActividades()
    }
  }, [isActividadesModalOpen, selectedCourseGroup, selectedPartial, isModalOpen])

  // MONITOREO AGRESIVO - Forzar limpieza si detecta calificaciones incorrectas
  useEffect(() => {
    // Si hay calificaciones pero no están cargadas, limpiarlas inmediatamente
    if (Object.keys(calificacionesAlumnos).length > 0 && !calificacionesLoaded) {

      setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
      setCalificacionesParcialesAlumnos({});
      setCalificacionesMap({});
      setAsistenciasMap({});
    }
  }, [calificacionesLoaded]); // Solo depende de calificacionesLoaded

  // LIMPIEZA ESPECÍFICA PARA EL PROBLEMA DEL CAMBIO ENTRE PARCIALES
  useEffect(() => {
    // Si estamos en el segundo parcial y hay calificaciones del primer parcial, limpiarlas
    if (selectedPartial === 2 && Object.keys(calificacionesAlumnos).length > 0) {

      
      // Verificar si las calificaciones son del parcial anterior
      const hasFirstPartialGrades = Object.values(calificacionesAlumnos).some((studentGrades: any) => {
        return studentGrades.actividades.some((act: any) => act.grade > 0) ||
               studentGrades.evidencias.some((ev: any) => ev.grade > 0) ||
               studentGrades.producto.grade > 0 ||
               studentGrades.examen.grade > 0;
      });
      
      if (hasFirstPartialGrades) {

        setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
        setCalificacionesParcialesAlumnos({});
        setCalificacionesMap({});
        setAsistenciasMap({});
      }
    }
    
    // Si estamos en el tercer parcial y hay calificaciones de parciales anteriores, limpiarlas
    if (selectedPartial === 3 && Object.keys(calificacionesAlumnos).length > 0) {

      
      // Verificar si las calificaciones son de parciales anteriores
      const hasPreviousPartialGrades = Object.values(calificacionesAlumnos).some((studentGrades: any) => {
        return studentGrades.actividades.some((act: any) => act.grade > 0) ||
               studentGrades.evidencias.some((ev: any) => ev.grade > 0) ||
               studentGrades.producto.grade > 0 ||
               studentGrades.examen.grade > 0;
      });
      
      if (hasPreviousPartialGrades) {

        setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
        setCalificacionesParcialesAlumnos({});
        setCalificacionesMap({});
        setAsistenciasMap({});
      }
    }
  }, [selectedPartial]); // Solo depende de selectedPartial

  // ELIMINADO: Este useEffect estaba causando errores 401 al intentar guardar automáticamente
  // Las calificaciones finales ya vienen del endpoint, no necesitan guardarse automáticamente
  // El usuario puede usar el botón "Recalcular Finales" si desea actualizar
  /*
  useEffect(() => {
    if (isGeneralModalOpen && alumnosGenerales.length > 0 && Object.keys(calificacionesGenerales).length > 0) {

      
      const recalcularFinales = async () => {
        for (const alumno of alumnosGenerales) {
          const courseGroupStudentId = alumno.courseGroupStudentId!;
          const calificacion = calificacionesGenerales[courseGroupStudentId];
          
          if (calificacion && calificacion.promedio > 0) {
            await calcularYGuardarCalificacionesFinales(courseGroupStudentId, calificacion.promedio);
          }
        }
      };
      
      recalcularFinales();
    }
  }, [isGeneralModalOpen, alumnosGenerales, calificacionesGenerales]);
  */

  // FUNCIÓN DE LIMPIEZA FORZADA - SE EJECUTA CADA 500ms PARA VERIFICAR
  // ELIMINADO: Este useEffect estaba causando el bucle infinito

  // Función para manejar el cambio de parcial en la tabla de evaluaciones (OPTIMIZADO)
  const handleParcialChangeEvaluaciones = async (newParcial: number) => {
    setSelectedPartial(newParcial);
    
    if (selectedCourseGroup) {
      try {
        // LIMPIEZA AGRESIVA - SOLUCIÓN DIRECTA AL PROBLEMA
        
        // 1. Limpiar TODOS los estados relacionados con calificaciones
        setCalificacionesLoaded(false);
        setCalificacionesParcialesAlumnos({});
        
        // Inicializar calificacionesAlumnos con estructura vacía pero válida
        setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
        
        setCalificacionesMap({});
        setAsistenciasMap({});
        
        // 2. Limpiar evaluaciones parciales si el modal está abierto
        if (isEvaluacionesModalOpen) {
          setEvaluacionesParciales({
            actividades: Array(10).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
            evidencias: Array(5).fill({ name: '', grade: 0, id: null, partialEvaluationId: null }),
            producto: { name: '', grade: 0, id: null, partialEvaluationId: null },
            examen: { name: '', grade: 0, id: null, partialEvaluationId: null },
          });
        }
        
        // 3. Forzar múltiples limpiezas con diferentes timing
        setTimeout(() => {

          setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
        }, 0);
        
        setTimeout(() => {
          setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
        }, 50);
        
        setTimeout(() => {
          setCalificacionesAlumnos(crearEstructuraVaciaCalificaciones());
        }, 100);
        
        // 4. Esperar a que se complete la limpieza
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // 5. Actualizar el parcial seleccionado
        setSelectedPartial(newParcial);
        
        // 6. Cargar los datos del nuevo parcial

        const evaluationsData = await CourseService.getCourseGroupEvaluationsData(selectedCourseGroup.id!)
        const actividadesDefinidasData = evaluationsData.partialEvaluations || []
        const actividadesFiltradas = filtrarActividadesPorParcial(actividadesDefinidasData, newParcial)
        setActividadesDefinidas(actividadesFiltradas)
        
        // 7. Procesar los datos optimizados para el nuevo parcial
        await procesarDatosOptimizados(evaluationsData, alumnos, newParcial);
        
      } catch (error) {
        console.error('Error al cambiar parcial:', error)
        toast.error('Error al cambiar de parcial')
      }
    }
  };

  const handleSaveStudentGrade = async (courseGroupStudentId: number, type: string, index: number, grade: number) => {
    try {
      // Verificar que existe la actividad definida
      let actividadDefinida: any;
      if (type === "actividades" || type === "evidencias") {
        const actividadesArray = actividadesDefinidas[type as keyof typeof actividadesDefinidas] as any[];
        actividadDefinida = actividadesArray[index];
      } else {
        actividadDefinida = actividadesDefinidas[type as keyof typeof actividadesDefinidas];
      }

      if (!actividadDefinida?.id) {
        toast.error("Primero debes crear la actividad en el botón 'Actividades'");
        return;
      }

      // Obtener la calificación actual del estado
      let currentGrade = { grade: 0, id: null as number | null };
      if (type === "actividades") {
        currentGrade = calificacionesAlumnos[courseGroupStudentId]?.actividades[index] || { grade: 0, id: null };
      } else if (type === "evidencias") {
        currentGrade = calificacionesAlumnos[courseGroupStudentId]?.evidencias[index] || { grade: 0, id: null };
      } else if (type === "producto") {
        currentGrade = calificacionesAlumnos[courseGroupStudentId]?.producto || { grade: 0, id: null };
      } else if (type === "examen") {
        currentGrade = calificacionesAlumnos[courseGroupStudentId]?.examen || { grade: 0, id: null };
      }

      const dto = {
        grade: grade,
        partialEvaluationId: actividadDefinida.id,
        courseGroupStudentId: courseGroupStudentId,
      };

      // Usar el hook offline para guardar la calificación
      if (currentGrade.id) {
        // Actualizar calificación existente
        await updateGrade(currentGrade.id, dto);
      } else {
        // Crear nueva calificación
        const result = await saveGrade(dto);
        
        if (result) {
          // Actualizar el estado local con el ID de la nueva calificación
          setCalificacionesAlumnos(prev => {
            const updated = { ...prev };
            if (!updated[courseGroupStudentId]) return prev;
            
            if (type === "actividades") {
              updated[courseGroupStudentId].actividades[index] = { grade: grade, id: result.id };
            } else if (type === "evidencias") {
              updated[courseGroupStudentId].evidencias[index] = { grade: grade, id: result.id };
            } else if (type === "producto") {
              updated[courseGroupStudentId].producto = { grade: grade, id: result.id };
            } else if (type === "examen") {
              updated[courseGroupStudentId].examen = { grade: grade, id: result.id };
            }
            
            return updated;
          });
        }
      }

      // Recalcular calificaciones parciales de todos los alumnos
      await calcularCalificacionesParcialesTodosAlumnos(selectedPartial, calificacionesMap);

    } catch (error) {
      console.error('Error al guardar calificación:', error);
      toast.error("Error al guardar la calificación");
    }
  };

  const calcularCalificacionParcialParaAlumno = async (courseGroupStudentId: number) => {
    
    
    if (!ponderacionesCurso) {
      
      return;
    }
    
    const calificacionesAlumno = calificacionesAlumnos[courseGroupStudentId];
    if (!calificacionesAlumno) {
      
      return;
    }
    
    let calificacionFinal = 0;
    let totalPonderacion = 0;
    
    // 1. Cálculo de Asistencia (siempre se calcula el porcentaje)
    let porcentajeAsistencia = 0;
    
    try {
      const asistenciasAlumno = await CourseService.getAttendancesByCourseGroupStudentAndPartial(
        courseGroupStudentId,
        selectedPartial
      );

      if (Array.isArray(asistenciasAlumno) && asistenciasAlumno.length > 0) {
        const asistenciasPresentes = asistenciasAlumno.filter((att) => att.attend === 1).length;
        const totalAsistencias = asistenciasAlumno.length;
        porcentajeAsistencia = (asistenciasPresentes / totalAsistencias) * 100;
        
        // Solo se suma a la calificación final si la ponderación es mayor a 0
        if (ponderacionesCurso.asistencia > 0) {
          const asistenciaPromedio = (porcentajeAsistencia / 100) * 10;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
          
          calificacionFinal += calificacionAsistencia;
          totalPonderacion += ponderacionesCurso.asistencia;
        }
      }
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
    }
    
    // 2. Cálculo de Actividades
    
    
    const actividadesValores = calificacionesAlumno.actividades
      .filter(item => item.grade > 0)
      .map(item => item.grade);
    
    
    
    if (actividadesValores.length > 0) {
      const promedioActividades = actividadesValores.reduce((sum, grade) => sum + grade, 0) / actividadesValores.length;
      const calificacionActividades = (promedioActividades * ponderacionesCurso.actividades) / 100;
      
      
      
      if (ponderacionesCurso.actividades > 0) {
        calificacionFinal += calificacionActividades;
        totalPonderacion += ponderacionesCurso.actividades;
      }
    } else {
      
    }
    
    // 3. Cálculo de Evidencias
    
    
    const evidenciasValores = calificacionesAlumno.evidencias
      .filter(item => item.grade > 0)
      .map(item => item.grade);
    
    
    
    if (evidenciasValores.length > 0) {
      const promedioEvidencias = evidenciasValores.reduce((sum, grade) => sum + grade, 0) / evidenciasValores.length;
      const calificacionEvidencias = (promedioEvidencias * ponderacionesCurso.evidencias) / 100;
      
      
      
      if (ponderacionesCurso.evidencias > 0) {
        calificacionFinal += calificacionEvidencias;
        totalPonderacion += ponderacionesCurso.evidencias;
      }
    } else {
      
    }
    
    // 4. Cálculo de Producto
    
    
    if (calificacionesAlumno.producto.grade > 0) {
      const calificacionProducto = (calificacionesAlumno.producto.grade * ponderacionesCurso.producto) / 100;
      
      
      
      if (ponderacionesCurso.producto > 0) {
        calificacionFinal += calificacionProducto;
        totalPonderacion += ponderacionesCurso.producto;
      }
    } else {
      
    }
    
    // 5. Cálculo de Examen
    
    
    if (calificacionesAlumno.examen.grade > 0) {
      const calificacionExamen = (calificacionesAlumno.examen.grade * ponderacionesCurso.examen) / 100;
      
      
      
      if (ponderacionesCurso.examen > 0) {
        calificacionFinal += calificacionExamen;
        totalPonderacion += ponderacionesCurso.examen;
      }
    } else {
      
    }
    
    // 6. Cálculo Final
    
    
    let calificacionParcialFinal = 0;
    if (totalPonderacion > 0) {
      calificacionParcialFinal = (calificacionFinal / totalPonderacion) * 100;
    }
    
    
    
    // Guardar la calificación parcial final
    if (calificacionParcialFinal > 0) {
      try {
        const partialGradeDto = {
          partial: selectedPartial,
          grade: Math.round(calificacionParcialFinal * 100) / 100, // Redondear a 2 decimales
          date: new Date().toISOString(),
          courseGroupStudentId: courseGroupStudentId
        };
        
        
        
        // Verificar si ya existe una calificación parcial para este alumno y parcial (OPTIMIZADO)
        // Usar el mapa de calificaciones ya cargado en lugar de hacer una nueva llamada
        const calificacionesMap = await obtenerCalificacionesParcialesOptimizado(selectedCourseGroup?.id || 0);
        const studentGrades = calificacionesMap[courseGroupStudentId] || {};
        const existingGrade = studentGrades[selectedPartial];
        
        // Buscar el ID de la calificación existente si existe
        let existingPartialGradeId: number | null = null;
        if (existingGrade !== undefined) {
          // Si existe la calificación, necesitamos obtener el ID para actualizar
          const existingPartialGrades = await CourseService.getPartialGradesByStudentAndPartial(
            courseGroupStudentId, 
            selectedPartial
          );
          if (existingPartialGrades && existingPartialGrades.length > 0) {
            existingPartialGradeId = existingPartialGrades[0].id;
          }
        }
        
        
        
        if (existingPartialGradeId !== null) {
          // Actualizar la calificación parcial existente
          const result = await CourseService.updatePartialGrade(existingPartialGradeId, partialGradeDto);
          
        } else {
          // Crear nueva calificación parcial
          const result = await CourseService.createPartialGrade(partialGradeDto);
          
        }
        
      } catch (error) {
        
      }
    }
  };

  // Función optimizada para calcular calificaciones parciales usando datos ya cargados
  const calcularCalificacionesParcialesOptimizado = async (
    students: any[], 
    calificacionesMap: {[key: number]: {[key: number]: number}}, 
    asistenciasMap: {[key: number]: {[key: number]: any[]}},
    parcialSeleccionado?: number
  ) => {
    // Usar el parcial pasado como parámetro o el estado actual
    const parcialActual = parcialSeleccionado || selectedPartial;
  
    console.log('🚀 INICIANDO CÁLCULO DE CALIFICACIONES PARCIALES OPTIMIZADO');
    console.log('📊 PARÁMETROS:', {
      studentsCount: students.length,
      parcialActual,
      ponderacionesCurso,
      calificacionesMapKeys: Object.keys(calificacionesMap).length,
      asistenciasMapKeys: Object.keys(asistenciasMap).length
    });
    
    // VALIDACIÓN: Verificar que los datos corresponden al parcial actual
    console.log('🔍 VALIDANDO DATOS PARA EL PARCIAL:', parcialActual);
    
    // Verificar que hay datos válidos para el parcial actual
    const hasValidData = Object.keys(calificacionesMap).length > 0 && Object.keys(asistenciasMap).length > 0;
    if (!hasValidData) {
      console.log('⚠️ DATOS INSUFICIENTES - Esperando carga completa de datos');
      return;
    }
    
    if (!ponderacionesCurso || !students.length) {
      console.log('⚠️ No se pueden calcular calificaciones: ponderacionesCurso o students vacíos');
      console.log('LOG DE PONDERACIONES: ', ponderacionesCurso);
      return;
    }
    
    const nuevasCalificacionesParciales: {[key: number]: {
      calificacion: number,
      porcentajeAsistencia: number,
      parcial1?: number,
      parcial2?: number,
      parcial3?: number
    }} = {};
    
    console.log('🔄 INICIANDO BUCLE DE ESTUDIANTES');
    for (const student of students) {
      const courseGroupStudentId = student.courseGroupStudentId;
      const calificacionesAlumno = calificacionesAlumnos[courseGroupStudentId];
      
      console.log(`👤 PROCESANDO ESTUDIANTE: ${student.fullName} (ID: ${courseGroupStudentId})`);
      
      if (!calificacionesAlumno) {
        console.log(`⚠️ No hay calificaciones para el estudiante ${student.fullName}`);
        nuevasCalificacionesParciales[courseGroupStudentId] = { calificacion: 0, porcentajeAsistencia: 0 };
        continue;
      }
      
      // VALIDACIÓN: Verificar que los datos del estudiante son válidos para el parcial actual
      console.log(`🔍 VALIDANDO DATOS DEL ESTUDIANTE ${student.fullName}:`, {
        actividades: calificacionesAlumno.actividades?.length || 0,
        evidencias: calificacionesAlumno.evidencias?.length || 0,
        producto: calificacionesAlumno.producto?.grade || 0,
        examen: calificacionesAlumno.examen?.grade || 0
      });
      
      // VALIDACIÓN ADICIONAL: Detectar datos sospechosos (posible cache incorrecto)
      const actividadesCount = calificacionesAlumno.actividades?.length || 0;
      const evidenciasCount = calificacionesAlumno.evidencias?.length || 0;
      
      // Si hay demasiadas actividades o evidencias, podría ser un problema de cache
      if (actividadesCount > 10 || evidenciasCount > 10) {
        console.log(`🚨 DATOS SOSPECHOSOS DETECTADOS para ${student.fullName}:`, {
          actividadesCount,
          evidenciasCount,
          message: 'Posible problema de cache - saltando cálculo'
        });
        nuevasCalificacionesParciales[courseGroupStudentId] = { calificacion: 0, porcentajeAsistencia: 0 };
        continue;
      }
      
      // VALIDACIÓN ESPECÍFICA: Detectar el problema de intercambio de datos
      // Si actividades tiene 3 elementos y evidencias tiene 0, podría ser un intercambio
      if (actividadesCount === 3 && evidenciasCount === 0) {
        console.log(`🚨 POSIBLE INTERCAMBIO DE DATOS DETECTADO para ${student.fullName}:`, {
          actividadesCount,
          evidenciasCount,
          message: 'Actividades tiene 3 elementos y evidencias 0 - posible intercambio de datos'
        });
        // No saltar el cálculo, pero marcar como sospechoso
        console.log(`⚠️ Continuando con datos sospechosos para ${student.fullName}`);
      }
      
      let calificacionFinal = 0;
      let totalPonderacion = 0;
      let porcentajeAsistencia = 0;
      
      // 1. Cálculo de Asistencia usando datos ya cargados (siempre se calcula el porcentaje)
      const asistenciasAlumno = asistenciasMap[courseGroupStudentId]?.[parcialActual] || [];
      
      console.log(`📅 ASISTENCIA - Estudiante: ${student.fullName}`, {
        asistenciasCount: asistenciasAlumno.length,
        ponderacionAsistencia: ponderacionesCurso.asistencia
      });
      
      if (asistenciasAlumno.length > 0) {
        const asistenciasPresentes = asistenciasAlumno.filter((att) => att.attend === 1).length;
        const totalAsistencias = asistenciasAlumno.length;
        porcentajeAsistencia = (asistenciasPresentes / totalAsistencias) * 100;
        
        console.log(`✅ ASISTENCIA CALCULADA:`, {
          asistenciasPresentes,
          totalAsistencias,
          porcentajeAsistencia: porcentajeAsistencia.toFixed(2)
        });
        
        // Solo se suma a la calificación final si la ponderación es mayor a 0
        if (ponderacionesCurso.asistencia > 0) {
          const asistenciaPromedio = (porcentajeAsistencia / 100) * 10;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
          
          console.log(`📊 CALIFICACIÓN ASISTENCIA:`, {
            asistenciaPromedio: asistenciaPromedio.toFixed(2),
            calificacionAsistencia: calificacionAsistencia.toFixed(2),
            ponderacion: ponderacionesCurso.asistencia
          });
          
          calificacionFinal += calificacionAsistencia;
          totalPonderacion += ponderacionesCurso.asistencia;
        } else {
          // Log reducido para evitar spam en consola
          if (courseGroupStudentId === students[0]?.courseGroupStudentId) {
            console.log('ℹ️ La ponderación de asistencia es 0, se muestra el porcentaje pero no se suma a la calificación');
          }
        }
      } else {
        // Log reducido para evitar spam en consola
        if (courseGroupStudentId === students[0]?.courseGroupStudentId) {
          console.log('⚠️ No hay asistencias registradas para este alumno en el parcial seleccionado');
        }
      }
      
      // 2. Cálculo de Actividades
      const actividadesValores = calificacionesAlumno.actividades
        .filter(item => item.grade > 0)
        .map(item => item.grade);
      
      console.log(`📚 ACTIVIDADES - Estudiante: ${student.fullName}`, {
        actividadesValores,
        ponderacionActividades: ponderacionesCurso.actividades,
        cantidadActividades: actividadesValores.length
      });
      
      if (actividadesValores.length > 0) {
        const promedioActividades = actividadesValores.reduce((sum, grade) => sum + grade, 0) / actividadesValores.length;
        const calificacionActividades = (promedioActividades * ponderacionesCurso.actividades) / 100;
        
        console.log(`✅ ACTIVIDADES CALCULADAS:`, {
          promedioActividades: promedioActividades.toFixed(2),
          calificacionActividades: calificacionActividades.toFixed(2),
          ponderacion: ponderacionesCurso.actividades
        });
        
        if (ponderacionesCurso.actividades > 0) {
          calificacionFinal += calificacionActividades;
          totalPonderacion += ponderacionesCurso.actividades;
        }
      } else {
        console.log(`⚠️ No hay actividades con calificación > 0 para ${student.fullName}`);
      }
      
      // 3. Cálculo de Evidencias
      const evidenciasValores = calificacionesAlumno.evidencias
        .filter(item => item.grade > 0)
        .map(item => item.grade);
      
      console.log(`🔍 EVIDENCIAS - Estudiante: ${student.fullName}`, {
        evidenciasValores,
        ponderacionEvidencias: ponderacionesCurso.evidencias,
        cantidadEvidencias: evidenciasValores.length
      });
      
      if (evidenciasValores.length > 0) {
        const promedioEvidencias = evidenciasValores.reduce((sum, grade) => sum + grade, 0) / evidenciasValores.length;
        const calificacionEvidencias = (promedioEvidencias * ponderacionesCurso.evidencias) / 100;
        
        console.log(`✅ EVIDENCIAS CALCULADAS:`, {
          promedioEvidencias: promedioEvidencias.toFixed(2),
          calificacionEvidencias: calificacionEvidencias.toFixed(2),
          ponderacion: ponderacionesCurso.evidencias
        });
        
        if (ponderacionesCurso.evidencias > 0) {
          calificacionFinal += calificacionEvidencias;
          totalPonderacion += ponderacionesCurso.evidencias;
        }
      } else {
        console.log(`⚠️ No hay evidencias con calificación > 0 para ${student.fullName}`);
      }
      
      // 4. Cálculo de Producto
      console.log(`📦 PRODUCTO - Estudiante: ${student.fullName}`, {
        grade: calificacionesAlumno.producto.grade,
        ponderacionProducto: ponderacionesCurso.producto
      });
      
      if (calificacionesAlumno.producto.grade > 0) {
        const calificacionProducto = (calificacionesAlumno.producto.grade * ponderacionesCurso.producto) / 100;
        
        console.log(`✅ PRODUCTO CALCULADO:`, {
          grade: calificacionesAlumno.producto.grade,
          calificacionProducto: calificacionProducto.toFixed(2),
          ponderacion: ponderacionesCurso.producto
        });
        
        if (ponderacionesCurso.producto > 0) {
          calificacionFinal += calificacionProducto;
          totalPonderacion += ponderacionesCurso.producto;
        }
      } else {
        console.log(`⚠️ No hay calificación de producto > 0 para ${student.fullName}`);
      }
      
      // 5. Cálculo de Examen
      console.log(`📝 EXAMEN - Estudiante: ${student.fullName}`, {
        grade: calificacionesAlumno.examen.grade,
        ponderacionExamen: ponderacionesCurso.examen
      });
      
      if (calificacionesAlumno.examen.grade > 0) {
        const calificacionExamen = (calificacionesAlumno.examen.grade * ponderacionesCurso.examen) / 100;
        
        console.log(`✅ EXAMEN CALCULADO:`, {
          grade: calificacionesAlumno.examen.grade,
          calificacionExamen: calificacionExamen.toFixed(2),
          ponderacion: ponderacionesCurso.examen
        });
        
        if (ponderacionesCurso.examen > 0) {
          calificacionFinal += calificacionExamen;
          totalPonderacion += ponderacionesCurso.examen;
        }
      } else {
        console.log(`⚠️ No hay calificación de examen > 0 para ${student.fullName}`);
      }
      
      // 6. Cálculo Final
      console.log(`🧮 RESUMEN FINAL - Estudiante: ${student.fullName}`, {
        calificacionFinal: calificacionFinal.toFixed(2),
        totalPonderacion: totalPonderacion.toFixed(2),
        porcentajeAsistencia: porcentajeAsistencia.toFixed(2)
      });
      
      let calificacionParcialFinal = 0;
      if (totalPonderacion > 0) {
        calificacionParcialFinal = (calificacionFinal / totalPonderacion) * 100;
        console.log(`🎯 CALIFICACIÓN PARCIAL FINAL: ${calificacionParcialFinal.toFixed(2)}`);
      } else {
        console.log(`⚠️ No hay ponderación total para calcular la calificación final`);
      }
      
      // Obtener los parciales individuales usando datos ya cargados
      const studentGrades = calificacionesMap[courseGroupStudentId] || {};
      const parcial1 = studentGrades[1] || 0;
      const parcial2 = studentGrades[2] || 0;
      const parcial3 = studentGrades[3] || 0;
      
      nuevasCalificacionesParciales[courseGroupStudentId] = {
        calificacion: Math.round(calificacionParcialFinal * 100) / 100,
        porcentajeAsistencia: Math.round(porcentajeAsistencia * 100) / 100,
        parcial1: parcial1,
        parcial2: parcial2,
        parcial3: parcial3
      };
      
      console.log(`✅ ESTUDIANTE PROCESADO: ${student.fullName} - Calificación: ${calificacionParcialFinal.toFixed(2)}`);
      
    }
    
    console.log('🎉 CÁLCULO COMPLETADO - Total de estudiantes procesados:', Object.keys(nuevasCalificacionesParciales).length);
    
    setCalificacionesParcialesAlumnos(nuevasCalificacionesParciales);
    
    // Actualizar calificaciones parciales en la base de datos
    await actualizarCalificacionesParcialesEnBD(nuevasCalificacionesParciales);
  };

  const calcularCalificacionesParcialesTodosAlumnos = async (parcialSeleccionado?: number, calificacionesMapParam?: {[key: number]: {[key: number]: number}}) => {
    // Usar el parcial pasado como parámetro o el estado actual
    const parcialActual = parcialSeleccionado || selectedPartial;
    
    // Usar el mapa de calificaciones pasado como parámetro o el estado actual
    const calificacionesMapToUse = calificacionesMapParam || calificacionesMap;
    
    if (!ponderacionesCurso || !alumnos.length) {
      
      return;
    }
    
    const nuevasCalificacionesParciales: {[key: number]: {
      calificacion: number,
      porcentajeAsistencia: number,
      parcial1?: number,
      parcial2?: number,
      parcial3?: number
    }} = {};
    
    for (const alumno of alumnos) {
      
      
      const calificacionesAlumno = calificacionesAlumnos[alumno.courseGroupStudentId!];
      if (!calificacionesAlumno) {
        
        nuevasCalificacionesParciales[alumno.courseGroupStudentId!] = { calificacion: 0, porcentajeAsistencia: 0 };
        continue;
      }
      
      let calificacionFinal = 0;
      let totalPonderacion = 0;
      let porcentajeAsistencia = 0;
      
      // 1. Cálculo de Asistencia - USAR DATOS YA CARGADOS EN LUGAR DE HACER NUEVA CONSULTA (siempre se calcula el porcentaje)
      // Usar el mapa de asistencias ya cargado en lugar de hacer una nueva consulta
      const asistenciasAlumno = asistenciasMap[alumno.courseGroupStudentId!]?.[parcialActual] || [];
      

      
      if (asistenciasAlumno.length > 0) {
        const asistenciasPresentes = asistenciasAlumno.filter((att) => att.attend === 1).length;
        const totalAsistencias = asistenciasAlumno.length;
        porcentajeAsistencia = (asistenciasPresentes / totalAsistencias) * 100;
        
        // Solo se suma a la calificación final si la ponderación es mayor a 0
        if (ponderacionesCurso.asistencia > 0) {
          const asistenciaPromedio = (porcentajeAsistencia / 100) * 10;
          const calificacionAsistencia = (asistenciaPromedio * ponderacionesCurso.asistencia) / 100;
          
          
          calificacionFinal += calificacionAsistencia;
          totalPonderacion += ponderacionesCurso.asistencia;
        } else {
          console.log(`ℹ️ Ponderación de asistencia es 0 para alumno ${alumno.courseGroupStudentId}, se muestra el porcentaje pero no se suma a la calificación`);
        }
      } else {
        console.log(`⚠️ No hay asistencias registradas para alumno ${alumno.courseGroupStudentId} en parcial ${parcialActual}`);
      }
      
      // 2. Cálculo de Actividades
      
      
      const actividadesValores = calificacionesAlumno.actividades
        .filter(item => item.grade > 0)
        .map(item => item.grade);
      
      
      
      if (actividadesValores.length > 0) {
        const promedioActividades = actividadesValores.reduce((sum, grade) => sum + grade, 0) / actividadesValores.length;
        const calificacionActividades = (promedioActividades * ponderacionesCurso.actividades) / 100;
        
        
        
        if (ponderacionesCurso.actividades > 0) {
          calificacionFinal += calificacionActividades;
          totalPonderacion += ponderacionesCurso.actividades;
        }
      } else {
        
      }
      
      // 3. Cálculo de Evidencias
      
      
      const evidenciasValores = calificacionesAlumno.evidencias
        .filter(item => item.grade > 0)
        .map(item => item.grade);
      
      
      
      if (evidenciasValores.length > 0) {
        const promedioEvidencias = evidenciasValores.reduce((sum, grade) => sum + grade, 0) / evidenciasValores.length;
        const calificacionEvidencias = (promedioEvidencias * ponderacionesCurso.evidencias) / 100;
        
        
        
        if (ponderacionesCurso.evidencias > 0) {
          calificacionFinal += calificacionEvidencias;
          totalPonderacion += ponderacionesCurso.evidencias;
        }
      } else {
        
      }
      
      // 4. Cálculo de Producto
      
      
      if (calificacionesAlumno.producto.grade > 0) {
        const calificacionProducto = (calificacionesAlumno.producto.grade * ponderacionesCurso.producto) / 100;
        
        
        
        if (ponderacionesCurso.producto > 0) {
          calificacionFinal += calificacionProducto;
          totalPonderacion += ponderacionesCurso.producto;
        }
      } else {
        
      }
      
      // 5. Cálculo de Examen
      
      
      if (calificacionesAlumno.examen.grade > 0) {
        const calificacionExamen = (calificacionesAlumno.examen.grade * ponderacionesCurso.examen) / 100;
        
        
        
        if (ponderacionesCurso.examen > 0) {
          calificacionFinal += calificacionExamen;
          totalPonderacion += ponderacionesCurso.examen;
        }
      } else {
        
      }
      
      // 6. Cálculo Final
      let calificacionParcialFinal = 0;
      if (totalPonderacion > 0) {
        calificacionParcialFinal = (calificacionFinal / totalPonderacion) * 100;
      }
    
      
      // Usar los datos ya cargados en lugar de hacer llamadas adicionales
      const studentGrades = calificacionesMapToUse[alumno.courseGroupStudentId!] || {};
      const parcial1 = studentGrades[1] || 0;
      const parcial2 = studentGrades[2] || 0;
      const parcial3 = studentGrades[3] || 0;
      
      nuevasCalificacionesParciales[alumno.courseGroupStudentId!] = {
        calificacion: Math.round(calificacionParcialFinal * 100) / 100,
        porcentajeAsistencia: Math.round(porcentajeAsistencia * 100) / 100,
        parcial1: parcial1,
        parcial2: parcial2,
        parcial3: parcial3
      };
      

    }
    

    
    setCalificacionesParcialesAlumnos(nuevasCalificacionesParciales);
    
    // Actualizar calificaciones parciales en la base de datos

    await actualizarCalificacionesParcialesEnBD(nuevasCalificacionesParciales);

  };

  // Función para actualizar calificaciones parciales en la base de datos
  const actualizarCalificacionesParcialesEnBD = async (calificaciones: {[key: number]: any}) => {

    
    for (const [courseGroupStudentId, calificacion] of Object.entries(calificaciones)) {
      try {
        const studentId = Number(courseGroupStudentId);
        const calificacionParcial = calificacion.calificacion;
        
        if (calificacionParcial > 0) {

          
          // Verificar si ya existe una calificación parcial para este alumno y parcial
          const existingPartialGrades = await CourseService.getPartialGradesByStudentAndPartial(studentId, selectedPartial);
          
          const partialGradeDto = {
            partial: selectedPartial,
            grade: Math.round(calificacionParcial * 100) / 100, // Redondear a 2 decimales
            date: new Date().toISOString(),
            courseGroupStudentId: studentId
          };
          
          if (existingPartialGrades && existingPartialGrades.length > 0) {
            // Actualizar calificación parcial existente
            const existingPartialGrade = existingPartialGrades[0];

            
            await CourseService.updatePartialGrade(existingPartialGrade.id, partialGradeDto);

          } else {
            // Crear nueva calificación parcial

            
            const newPartialGrade = await CourseService.createPartialGrade(partialGradeDto);

          }
        } else {
          console.log(`⚠️ Calificación parcial 0 o negativa para estudiante ${studentId}, no se guarda`);
        }
      } catch (error) {
        console.error(`❌ Error al procesar calificación parcial para estudiante ${courseGroupStudentId}:`, error);
      }
    }
    

  };

  const cargarCalificacionesAlumnos = async () => {
    if (!selectedCourseGroup || !alumnos.length) return;
    
    try {
      
      
      // Cargar las actividades definidas para el curso (que incluyen las calificaciones)
      const actividadesDefinidasData = await CourseService.getPartialEvaluationsByCourseGroupId(selectedCourseGroup.id!);
      
      
      const nuevasCalificaciones: {[key: number]: any} = {};
      
      for (const alumno of alumnos) {
        
        
        // Inicializar estructura para el alumno
        nuevasCalificaciones[alumno.courseGroupStudentId!] = {
          actividades: Array(10).fill(null).map(() => ({grade: 0, id: null})),
          evidencias: Array(5).fill(null).map(() => ({grade: 0, id: null})),
          producto: {grade: 0, id: null},
          examen: {grade: 0, id: null}
        };
        
        // Mapear las actividades definidas y buscar sus calificaciones
        actividadesDefinidasData.forEach((actividadDefinida: any) => {
          
          
          // Solo procesar actividades del parcial seleccionado
          if (actividadDefinida.partial !== selectedPartial) {
            
            return;
          }
          
          // Buscar el courseGroupStudent específico del alumno
          const courseGroupStudent = actividadDefinida.courseGroup?.coursesGroupsStudents?.find(
            (cgs: any) => cgs.id === alumno.courseGroupStudentId
          );
          
          
          
          // Buscar la calificación específica para esta actividad
          const grade = courseGroupStudent?.partialEvaluationGrades?.find(
            (peg: any) => {
              const matchesActivity = peg.partialEvaluation?.id === actividadDefinida.id;
              
              return matchesActivity;
            }
          );
          
          
          
          if (actividadDefinida.type === 'Actividades' && typeof actividadDefinida.slot === 'number' && actividadDefinida.slot < 10) {
            nuevasCalificaciones[alumno.courseGroupStudentId!].actividades[actividadDefinida.slot] = {
              grade: grade?.grade || 0,
              id: grade?.id || null
            };
            
          } else if (actividadDefinida.type === 'Evidencias' && typeof actividadDefinida.slot === 'number' && actividadDefinida.slot < 5) {
            nuevasCalificaciones[alumno.courseGroupStudentId!].evidencias[actividadDefinida.slot] = {
              grade: grade?.grade || 0,
              id: grade?.id || null
            };
            
          } else if (actividadDefinida.type === 'Producto') {
            nuevasCalificaciones[alumno.courseGroupStudentId!].producto = {
              grade: grade?.grade || 0,
              id: grade?.id || null
            };
            
          } else if (actividadDefinida.type === 'Examen') {
            nuevasCalificaciones[alumno.courseGroupStudentId!].examen = {
              grade: grade?.grade || 0,
              id: grade?.id || null
            };
            
          }
        });
      }
      
      
      
      setCalificacionesAlumnos(nuevasCalificaciones);
      
      // Calcular calificaciones parciales después de cargar las calificaciones
      await calcularCalificacionesParcialesTodosAlumnos(selectedPartial, calificacionesMap);
      
      // Cargar calificaciones finales de todos los alumnos
      await cargarCalificacionesFinalesAlumnos();
    } catch (error) {
      
    }
  };

  // Función para cargar las calificaciones finales de todos los alumnos
  const cargarCalificacionesFinalesAlumnos = async () => {
    if (!selectedCourseGroup?.courseGroupStudents) return;
    
    try {
      const nuevasCalificacionesFinales: {[key: number]: {
        ordinario: number | null;
        extraordinario: number | null;
      }} = {};
      
      for (const alumno of selectedCourseGroup.courseGroupStudents) {
        try {
          const finalGrades = await CourseService.getFinalGradesByCourseGroupStudentId(alumno.courseGroupStudentId!);
          
          if (finalGrades && finalGrades.length > 0) {
            const finalGrade = finalGrades[0];
            nuevasCalificacionesFinales[alumno.courseGroupStudentId!] = {
              ordinario: finalGrade.gradeOrdinary,
              extraordinario: finalGrade.gradeExtraordinary
            };
          } else {
            nuevasCalificacionesFinales[alumno.courseGroupStudentId!] = {
              ordinario: null,
              extraordinario: null
            };
          }
        } catch (error) {
          
          nuevasCalificacionesFinales[alumno.courseGroupStudentId!] = {
            ordinario: null,
            extraordinario: null
          };
        }
      }
      
      setCalificacionesFinalesAlumnos(nuevasCalificacionesFinales);
    } catch (error) {
      
    }
  };

  // 2. Función para calcular la calificación final y asistencia
  const handleVerCalificacionFinal = async (alumno: any) => {
    if (!selectedCourseGroup) return;
    setAlumnoCalificacionFinal(alumno);
    setIsCalificacionFinalModalOpen(true);
    try {
      // Obtener calificaciones parciales desde la base de datos (OPTIMIZADO)
      let parciales: (number | null)[] = [];
      
      // Obtener todas las calificaciones parciales del estudiante en una sola llamada
      const calificacionesMap = await obtenerCalificacionesParcialesOptimizado(selectedCourseGroup.id);
      const studentGrades = calificacionesMap[alumno.courseGroupStudentId] || {};
      
      for (let parcial = 1; parcial <= 3; parcial++) {
        const grade = studentGrades[parcial];
        parciales.push(grade !== undefined ? grade : null);
      }
      
      
      
      // Calcular promedio solo con los parciales válidos
      const parcialesValidos = parciales.filter((p): p is number => p !== null && typeof p === 'number' && !isNaN(p));
      const promedio = parcialesValidos.length > 0 ? (parcialesValidos.reduce((a, b) => a + b, 0) / parcialesValidos.length) : null;
      
      
      
      // Calcular asistencia de los 3 parciales (OPTIMIZADO)
      let asistenciasParciales: any[] = [];
      
      // Obtener todas las asistencias del estudiante en una sola llamada
      const asistenciasMap = await obtenerAsistenciasOptimizado(selectedCourseGroup.id);
      const studentAttendances = asistenciasMap[alumno.courseGroupStudentId] || {};
      
      for (let parcial = 1; parcial <= 3; parcial++) {
        const asistenciasDelParcial = studentAttendances[parcial] || [];
        asistenciasParciales = asistenciasParciales.concat(asistenciasDelParcial);
      }
      
      
      
      const presentesTotales = asistenciasParciales.filter((att: any) => att.attend === 1).length;
      const asistenciaPorcentaje = asistenciasParciales.length > 0 ? Math.round((presentesTotales / asistenciasParciales.length) * 100) : 0;
      
      
      
      // Exentos = promedio redondeado a 2 decimales
      const exentos = promedio !== null ? Math.round(promedio * 100) / 100 : null;

      // --- INTEGRACIÓN FINAL GRADE ---
      try {
        // 1. Consultar si ya existe un FinalGrade
        const finalGrades = await CourseService.getFinalGradesByCourseGroupStudentId(alumno.courseGroupStudentId);
        
        if (!finalGrades || finalGrades.length === 0) {
          // Crear nuevo FinalGrade solo si no existe
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
          setInputOrdinario("");
          setInputExtraordinario("");
          setOrdinarioGuardado(null);
          setExtraordinarioGuardado(null);
          
        } else {
          // Actualizar el FinalGrade existente
          const existingFinalGrade = finalGrades[0];
          
          
          // Solo actualizar el campo grade, preservando las calificaciones existentes
          const dto = {
            grade: promedio !== null ? Math.round(promedio) : 0
          };
          await CourseService.updateFinalGrade(existingFinalGrade.id, dto);
          setFinalGradeId(existingFinalGrade.id);
          
          // Usar los valores existentes del FinalGrade
          setInputOrdinario(existingFinalGrade.gradeOrdinary && existingFinalGrade.gradeOrdinary > 0 ? existingFinalGrade.gradeOrdinary.toString() : "");
          setInputExtraordinario(existingFinalGrade.gradeExtraordinary && existingFinalGrade.gradeExtraordinary > 0 ? existingFinalGrade.gradeExtraordinary.toString() : "");
          setOrdinarioGuardado(existingFinalGrade.gradeOrdinary && existingFinalGrade.gradeOrdinary > 0 ? existingFinalGrade.gradeOrdinary : null);
          setExtraordinarioGuardado(existingFinalGrade.gradeExtraordinary && existingFinalGrade.gradeExtraordinary > 0 ? existingFinalGrade.gradeExtraordinary : null);
          
        }
      } catch (err) {
        
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
                                        period: courseGroup.group!.period
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
                                onClick={() => handleOpenAttendanceModal(asignatura, courseGroup)}
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

            {/* Modal de Alumnos con Tabla de Evaluaciones */}
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                // Resetear estados cuando se cierre el modal
                setCalificacionesLoaded(false);
                setCalificacionesAlumnos({});
                setCalificacionesParcialesAlumnos({});
                setAlumnos([]);
                setSelectedCourse(null);
                setSelectedCourseGroup(null);
                setSelectedGroupId(null);
              }
            }}>
              <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
                <DialogHeader>
                  <div>
                    <DialogTitle>Evaluaciones - {selectedPartial === 1 ? 'Primer' : selectedPartial === 2 ? 'Segundo' : 'Tercer'} Parcial</DialogTitle>
                    <DialogDescription>
                      Calificaciones de todos los alumnos del grupo
                    </DialogDescription>
                  </div>
                </DialogHeader>
                
                <div className="flex items-center gap-4 mb-4 flex-shrink-0 z-20 relative">
                  <div className="flex items-center gap-2">
                    <label htmlFor="parcial-select" className="font-medium">Parcial:</label>
                    <select
                      id="parcial-select"
                      value={selectedPartial}
                      onChange={e => handleParcialChangeEvaluaciones(Number(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      <option value={1} disabled={!selectedCourseGroup?.group?.period?.firstPartialActive}>
                        Primer Parcial {selectedCourseGroup?.group?.period?.firstPartialActive ? '' : '(Inactivo)'}
                      </option>
                      <option value={2} disabled={!selectedCourseGroup?.group?.period?.secondPartialActive}>
                        Segundo Parcial {selectedCourseGroup?.group?.period?.secondPartialActive ? '' : '(Inactivo)'}
                      </option>
                      <option value={3} disabled={!selectedCourseGroup?.group?.period?.thirdPartialActive}>
                        Tercer Parcial {selectedCourseGroup?.group?.period?.thirdPartialActive ? '' : '(Inactivo)'}
                      </option>
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenActividadesModal(selectedCourse!, selectedCourseGroup!)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gestionar Actividades
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenGeneralModal(selectedCourse!, selectedCourseGroup!)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    General
                  </Button>
                </div>

                {isLoadingAlumnos ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                      <p>Cargando alumnos...</p>
                    </div>
                  </div>
                ) : alumnos.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">No hay alumnos inscritos</p>
                      <p className="text-sm">Este grupo aún no tiene alumnos asignados</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <div className="overflow-x-auto h-full">
                      <table className="min-w-[1200px] border border-gray-300 text-center">
                        <thead className="sticky top-0 bg-white z-10">
                          {/* Primera fila de encabezados principales */}
                          <tr>
                            <th rowSpan={3} className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">No.</th>
                            <th rowSpan={3} className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Matrícula</th>
                            <th rowSpan={3} className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Nombre</th>
                            <th colSpan={10} className="bg-blue-100 font-semibold border border-gray-300">Actividades de Aprendizaje</th>
                            <th colSpan={5} className="bg-green-100 font-semibold border border-gray-300">Evidencias de Aprendizaje</th>
                            <th colSpan={2} className="bg-purple-100 font-semibold border border-gray-300">Calificaciones Parciales</th>
                            <th colSpan={3} className="bg-yellow-100 font-semibold border border-gray-300">Calificación Final</th>
                          </tr>
                          
                          {/* Segunda fila - Nombres de actividades */}
                          <tr>
                            {[...Array(10)].map((_, i) => (
                              <th key={"act"+i} className="bg-blue-50 border border-gray-300 px-1 py-1 text-xs">
                                {actividadesDefinidas.actividades[i]?.name || `A${i+1}`}
                              </th>
                            ))}
                            {[...Array(5)].map((_, i) => (
                              <th key={"ev"+i} className="bg-green-50 border border-gray-300 px-1 py-1 text-xs">
                                {actividadesDefinidas.evidencias[i]?.name || `E${i+1}`}
                              </th>
                            ))}
                            <th className="bg-pink-50 border border-gray-300 px-1 py-1 text-xs">Producto</th>
                            <th className="bg-gray-50 border border-gray-300 px-1 py-1 text-xs">Examen</th>
                            <th className="bg-yellow-50 border border-gray-300 px-1 py-1 text-xs">Calificación</th>
                            <th className="bg-yellow-50 border border-gray-300 px-1 py-1 text-xs">% Asistencia</th>
                            <th className="bg-yellow-50 border border-gray-300 px-1 py-1 text-xs">Final</th>
                          </tr>
                          
                          {/* Tercera fila - Porcentajes de ponderación */}
                          <tr>
                            {[...Array(10)].map((_, i) => (
                              <th key={"actp"+i} className="bg-blue-50 border border-gray-300 px-1 py-1 text-xs">
                                {ponderacionesCurso?.actividades ? `${ponderacionesCurso.actividades}%` : '0%'}
                              </th>
                            ))}
                            {[...Array(5)].map((_, i) => (
                              <th key={"evp"+i} className="bg-green-50 border border-gray-300 px-1 py-1 text-xs">
                                {ponderacionesCurso?.evidencias ? `${ponderacionesCurso.evidencias}%` : '0%'}
                              </th>
                            ))}
                            <th className="bg-pink-50 border border-gray-300 px-1 py-1 text-xs">
                              {ponderacionesCurso?.producto ? `${ponderacionesCurso.producto}%` : '0%'}
                            </th>
                            <th className="bg-gray-50 border border-gray-300 px-1 py-1 text-xs">
                              {ponderacionesCurso?.examen ? `${ponderacionesCurso.examen}%` : '0%'}
                            </th>
                            <th className="bg-yellow-50 border border-gray-300 px-1 py-1 text-xs">Final</th>
                            <th className="bg-yellow-50 border border-gray-300 px-1 py-1 text-xs">Total</th>
                            <th className="bg-yellow-50 border border-gray-300 px-1 py-1 text-xs">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alumnos.map((alumno, index) => (
                            <tr key={alumno.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-2 py-1 font-medium">{index + 1}</td>
                              <td className="border border-gray-300 px-2 py-1">{alumno.registrationNumber}</td>
                              <td className="border border-gray-300 px-2 py-1 font-medium text-left">{alumno.fullName}</td>
                              
                              {/* Actividades */}
                              {[...Array(10)].map((_, i) => (
                                <td key={"act"+i} className="border border-gray-300 px-1 py-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    value={calificacionesAlumnos[alumno.courseGroupStudentId!]?.actividades?.[i]?.grade || ''}
                                    className="w-12 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                                    placeholder="0.0"
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      setCalificacionesAlumnos(prev => ({
                                        ...prev,
                                        [alumno.courseGroupStudentId!]: {
                                          ...prev[alumno.courseGroupStudentId!],
                                          actividades: prev[alumno.courseGroupStudentId!]?.actividades.map((act, idx) => 
                                            idx === i ? {...act, grade: value} : act
                                          ) || Array(10).fill({grade: 0, id: null})
                                        }
                                      }));
                                    }}
                                    onBlur={(e) => handleSaveStudentGrade(alumno.courseGroupStudentId!, 'actividades', i, Number(e.target.value))}
                                  />
                                </td>
                              ))}
                              
                              {/* Evidencias */}
                              {[...Array(5)].map((_, i) => (
                                <td key={"ev"+i} className="border border-gray-300 px-1 py-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    value={calificacionesAlumnos[alumno.courseGroupStudentId!]?.evidencias?.[i]?.grade || ''}
                                    className="w-12 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
                                    placeholder="0.0"
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      setCalificacionesAlumnos(prev => ({
                                        ...prev,
                                        [alumno.courseGroupStudentId!]: {
                                          ...prev[alumno.courseGroupStudentId!],
                                          evidencias: prev[alumno.courseGroupStudentId!]?.evidencias.map((ev, idx) => 
                                            idx === i ? {...ev, grade: value} : ev
                                          ) || Array(5).fill({grade: 0, id: null})
                                        }
                                      }));
                                    }}
                                    onBlur={(e) => handleSaveStudentGrade(alumno.courseGroupStudentId!, 'evidencias', i, Number(e.target.value))}
                                  />
                                </td>
                              ))}
                              
                              {/* Producto */}
                              <td className="border border-gray-300 px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  value={calificacionesAlumnos[alumno.courseGroupStudentId!]?.producto?.grade || ''}
                                  className="w-12 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                                  placeholder="0.0"
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setCalificacionesAlumnos(prev => ({
                                      ...prev,
                                      [alumno.courseGroupStudentId!]: {
                                        ...prev[alumno.courseGroupStudentId!],
                                        producto: prev[alumno.courseGroupStudentId!]?.producto ? 
                                          {...prev[alumno.courseGroupStudentId!].producto, grade: value} : 
                                          {grade: value, id: null}
                                      }
                                    }));
                                  }}
                                  onBlur={(e) => handleSaveStudentGrade(alumno.courseGroupStudentId!, 'producto', 0, Number(e.target.value))}
                                />
                              </td>
                              
                              {/* Examen */}
                              <td className="border border-gray-300 px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  value={calificacionesAlumnos[alumno.courseGroupStudentId!]?.examen?.grade || ''}
                                  className="w-12 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-500 rounded"
                                  placeholder="0.0"
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setCalificacionesAlumnos(prev => ({
                                      ...prev,
                                      [alumno.courseGroupStudentId!]: {
                                        ...prev[alumno.courseGroupStudentId!],
                                        examen: prev[alumno.courseGroupStudentId!]?.examen ? 
                                          {...prev[alumno.courseGroupStudentId!].examen, grade: value} : 
                                          {grade: value, id: null}
                                      }
                                    }));
                                  }}
                                  onBlur={(e) => handleSaveStudentGrade(alumno.courseGroupStudentId!, 'examen', 0, Number(e.target.value))}
                                />
                              </td>
                              
                              {/* Calificación Final */}
                              <td className="border border-gray-300 px-1 py-1 font-semibold">
                                {calificacionesParcialesAlumnos[alumno.courseGroupStudentId!]?.calificacion > 0 
                                  ? calificacionesParcialesAlumnos[alumno.courseGroupStudentId!].calificacion.toFixed(2)
                                  : '--'
                                }
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-xs">
                                {calificacionesParcialesAlumnos[alumno.courseGroupStudentId!]?.porcentajeAsistencia !== undefined 
                                  ? `${calificacionesParcialesAlumnos[alumno.courseGroupStudentId!].porcentajeAsistencia.toFixed(1)}%`
                                  : '--'
                                }
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerCalificacionFinal(alumno)}
                                  className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                >
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  Final
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Modal General */}
            <Dialog open={isGeneralModalOpen} onOpenChange={(open) => {
              setIsGeneralModalOpen(open);
              if (!open) {
                // Limpiar estados del modal de General cuando se cierre
                setAlumnosGenerales([]);
                setCalificacionesFinalesGenerales({});
                setCalificacionesGenerales({});
                setIsLoadingGenerales(false);
              }
            }}>
              <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <DialogTitle>Reporte General - {selectedCourseForGeneral?.name}</DialogTitle>
                      <DialogDescription>
                        Promedio final de todos los alumnos del grupo
                      </DialogDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                        💡 Las calificaciones finales se calculan automáticamente basadas en el promedio de los 3 parciales
                      </div>
                      <Button
                        onClick={async () => {
                          for (const alumno of alumnosGenerales) {
                            const courseGroupStudentId = alumno.courseGroupStudentId!;
                            const calificacion = calificacionesGenerales[courseGroupStudentId];
                            
                            if (calificacion && calificacion.promedio > 0) {
                              await calcularYGuardarCalificacionesFinales(courseGroupStudentId, calificacion.promedio);
                            }
                          }
                          toast.success('Calificaciones finales recalculadas automáticamente');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        🔄 Recalcular Finales
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                
                {isLoadingGenerales ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                      <p>Cargando datos...</p>
                    </div>
                  </div>
                ) : alumnosGenerales.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">No hay alumnos inscritos</p>
                      <p className="text-sm">Este grupo aún no tiene alumnos asignados</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <div className="overflow-x-auto h-full">
                      <table className="min-w-[800px] border border-gray-300 text-center">
                        <thead className="sticky top-0 bg-yellow-100 z-10">
                          <tr>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">No.</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Matrícula</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Nombre</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Parcial 1</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Parcial 2</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Parcial 3</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Promedio</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Asistencia</th>
                            <th className="bg-yellow-100 font-semibold border border-gray-300 px-2 py-1">Exentos</th>
                            <th className="bg-red-200 font-semibold border border-gray-300 px-2 py-1">Calif Ordinario</th>
                            <th className="bg-red-200 font-semibold border border-gray-300 px-2 py-1">Ordinario</th>
                            <th className="bg-red-200 font-semibold border border-gray-300 px-2 py-1">Calif Extraordinario</th>
                            <th className="bg-red-200 font-semibold border border-gray-300 px-2 py-1">Extraordinario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alumnosGenerales.map((alumno, index) => {
                            // Obtener datos directamente del estudiante
                            const parcial1 = alumno.partialGrades?.find((pg: any) => pg.partial === 1)?.grade || 0;
                            const parcial2 = alumno.partialGrades?.find((pg: any) => pg.partial === 2)?.grade || 0;
                            const parcial3 = alumno.partialGrades?.find((pg: any) => pg.partial === 3)?.grade || 0;
                            
                            // Calcular promedio
                            const parcialesValidos = [parcial1, parcial2, parcial3]
                              .filter(p => p > 0 && typeof p === 'number' && !isNaN(p));
                            const promedio = parcialesValidos.length > 0 
                              ? Math.round((parcialesValidos.reduce((a, b) => a + b, 0) / parcialesValidos.length) * 100) / 100
                              : 0;
                            
                            // Calcular asistencia
                            const todasLasAsistencias = alumno.attendances || [];
                            const asistenciasPresentes = todasLasAsistencias.filter((att: any) => att.attend === true).length;
                            const asistencia = todasLasAsistencias.length > 0 
                              ? Math.round((asistenciasPresentes / todasLasAsistencias.length) * 100) 
                              : 0;
                            
                            // Obtener calificaciones finales directamente
                            const ordinario = alumno.finalGrade?.gradeOrdinary || null;
                            const extraordinario = alumno.finalGrade?.gradeExtraordinary || null;
                            const finalGradeId = alumno.finalGrade?.id || null;
                            const courseGroupStudentId: number = (alumno.courseGroupStudentId || alumno.id || 0) as number;
                            
                            // ========== CONSOLE.LOG: PROPIEDADES POR COLUMNA ==========
                            if (index === 0) {
                              console.log('📋 ========== PROPIEDADES USADAS EN CADA COLUMNA - Reporte General ==========');
                              console.log('📌 Columna # (Índice):', 'index + 1');
                              console.log('📌 Columna Matrícula:', 'alumno.registrationNumber', '→ Valor:', alumno.registrationNumber);
                              console.log('📌 Columna Nombre:', 'alumno.fullName', '→ Valor:', alumno.fullName);
                              console.log('📌 Columna Parcial 1:', 'alumno.partialGrades.find(pg => pg.partial === 1)?.grade', '→ Valor:', parcial1);
                              console.log('📌 Columna Parcial 2:', 'alumno.partialGrades.find(pg => pg.partial === 2)?.grade', '→ Valor:', parcial2);
                              console.log('📌 Columna Parcial 3:', 'alumno.partialGrades.find(pg => pg.partial === 3)?.grade', '→ Valor:', parcial3);
                              console.log('📌 Columna Promedio:', 'Calculado: promedio de parcial1, parcial2, parcial3', '→ Valor:', promedio);
                              console.log('📌 Columna Asistencia:', 'Calculado desde alumno.attendances', '→ Valor:', asistencia, '%');
                              console.log('📌 Columna Exentos:', 'Calculado: Math.round(promedio)', '→ Valor:', promedio > 0 && Math.round(promedio) < 8 ? 'ORD' : (promedio > 0 ? Math.round(promedio) : '--'));
                              console.log('📌 Columna Calif Ordinario (Input):', 'alumno.finalGrade.gradeOrdinary', '→ Valor:', ordinario);
                              console.log('📌 Columna Ordinario:', 'alumno.finalGrade.gradeOrdinary', '→ Valor:', ordinario);
                              console.log('📌 Columna Calif Extraordinario (Input):', 'alumno.finalGrade.gradeExtraordinary', '→ Valor:', extraordinario);
                              console.log('📌 Columna Extraordinario:', 'alumno.finalGrade.gradeExtraordinary', '→ Valor:', extraordinario);
                              console.log('📋 Datos completos del alumno:', alumno);
                              console.log('📋 ============================================================');
                            }
                            
                            return (
                              <tr key={alumno.id || index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-2 py-1 font-medium">{index + 1}</td>
                                <td className="border border-gray-300 px-2 py-1">{alumno.registrationNumber}</td>
                                <td className="border border-gray-300 px-2 py-1 font-medium text-left">{alumno.fullName}</td>
                                <td className="border border-gray-300 px-2 py-1">{parcial1 > 0 ? parcial1.toFixed(2) : '--'}</td>
                                <td className="border border-gray-300 px-2 py-1">{parcial2 > 0 ? parcial2.toFixed(2) : '--'}</td>
                                <td className="border border-gray-300 px-2 py-1">{parcial3 > 0 ? parcial3.toFixed(2) : '--'}</td>
                                <td className="border border-gray-300 px-2 py-1 font-semibold">{promedio > 0 ? promedio.toFixed(2) : '--'}</td>
                                <td className="border border-gray-300 px-2 py-1">{asistencia > 0 ? `${asistencia}%` : '--'}</td>
                                <td className={`border border-gray-300 px-2 py-1 font-bold ${
                                  promedio > 0 && Math.round(promedio) < 8 ? "bg-red-200 text-red-800" : "bg-green-100"
                                }`}>
                                  {promedio > 0 && Math.round(promedio) < 8 ? 'ORD' : (promedio > 0 ? Math.round(promedio) : '--')}
                                </td>
                                <td className={`border border-gray-300 px-2 py-1 ${
                                  promedio > 0 && Math.round(promedio) < 8 ? "bg-red-200 text-red-800 font-bold text-center" : ""
                                }`}>
                                  {promedio > 0 && Math.round(promedio) < 8 ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.01"
                                      className="w-16 text-center border rounded px-1 py-1 text-sm"
                                      placeholder="--"
                                      value={ordinario !== null && ordinario > 0 ? ordinario : ''}
                                      onChange={async (e) => {
                                        const value = e.target.value === '' ? 0 : Math.round(Number(e.target.value));
                                        const studentId: number = courseGroupStudentId;
                                        
                                        // Actualizar estado local inmediatamente
                                        setCalificacionesFinalesGenerales(prev => ({
                                          ...prev,
                                          [studentId]: {
                                            ...prev[studentId],
                                            ordinario: value
                                          }
                                        }));
                                        
                                        // Actualizar también el estado de alumnosGenerales
                                        setAlumnosGenerales(prev => prev.map(al => {
                                          const alId: number = (al.courseGroupStudentId || al.id || 0) as number;
                                          if (alId === studentId && al.finalGrade) {
                                            return {
                                              ...al,
                                              finalGrade: {
                                                ...al.finalGrade,
                                                id: al.finalGrade.id,
                                                gradeOrdinary: value,
                                                grade: al.finalGrade.grade,
                                                gradeExtraordinary: al.finalGrade.gradeExtraordinary,
                                                date: al.finalGrade.date
                                              }
                                            };
                                          }
                                          return al;
                                        }));
                                        
                                        // Guardar en la base de datos
                                        try {
                                          console.log('🔵 ========== DEBUG: Guardar Calificación Ordinaria ==========');
                                          console.log('🔵 Variables del contexto:', {
                                            studentId,
                                            value,
                                            promedio,
                                            ordinario,
                                            courseGroupStudentId,
                                            finalGradeId
                                          });
                                          
                                          if (finalGradeId) {
                                            // Usar PATCH con el ID del finalGrade que viene del endpoint
                                            const updateData = { gradeOrdinary: value };
                                            console.log('🔵 ACTUALIZANDO FinalGrade existente (PATCH):', {
                                              finalGradeId,
                                              updateData
                                            });
                                            await CourseService.updateFinalGrade(finalGradeId, updateData);
                                          } else {
                                            // Solo crear si no existe (no debería pasar si el endpoint siempre trae finalGrade)
                                            console.warn('⚠️ No se encontró finalGradeId, creando nuevo FinalGrade');
                                            const createData = {
                                              grade: Math.round(promedio),
                                              gradeOrdinary: value,
                                              gradeExtraordinary: 0,
                                              date: new Date().toISOString(),
                                              type: 'final',
                                              courseGroupStudentId: studentId
                                            };
                                            console.log('🔵 CREANDO nuevo FinalGrade:', createData);
                                            await CourseService.createFinalGrade(createData);
                                          }
                                          console.log('🔵 ============================================================');
                                          toast.success('Calificación ordinaria guardada');
                                        } catch (error) {
                                          console.error('❌ Error al guardar calificación ordinaria:', error);
                                          toast.error('Error al guardar calificación ordinaria');
                                        }
                                      }}
                                    />
                                  ) : '--'}
                                </td>
                                <td className={`border border-gray-300 px-2 py-1 text-center ${
                                  ordinario !== null && ordinario > 0 ? "font-semibold" : ""
                                }`}>
                                  {ordinario !== null && ordinario > 0 ? ordinario : '--'}
                                </td>
                                <td className={`border border-gray-300 px-2 py-1 ${
                                  ordinario !== null && ordinario < 6 && ordinario > 0 && promedio > 0 && Math.round(promedio) < 8 ? "bg-red-200 text-red-800 font-bold text-center" : ""
                                }`}>
                                  {ordinario !== null && ordinario < 6 && ordinario > 0 && promedio > 0 && Math.round(promedio) < 8 ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.01"
                                      className="w-16 text-center border rounded px-1 py-1 text-sm"
                                      placeholder="--"
                                      value={extraordinario !== null && extraordinario > 0 ? extraordinario : ''}
                                      onChange={async (e) => {
                                        const value = e.target.value === '' ? 0 : Math.round(Number(e.target.value));
                                        const studentId: number = courseGroupStudentId;
                                        
                                        // Actualizar estado local inmediatamente
                                        setCalificacionesFinalesGenerales(prev => ({
                                          ...prev,
                                          [studentId]: {
                                            ...prev[studentId],
                                            extraordinario: value
                                          }
                                        }));
                                        
                                        // Actualizar también el estado de alumnosGenerales
                                        setAlumnosGenerales(prev => prev.map(al => {
                                          const alId: number = (al.courseGroupStudentId || al.id || 0) as number;
                                          if (alId === studentId && al.finalGrade) {
                                            return {
                                              ...al,
                                              finalGrade: {
                                                ...al.finalGrade,
                                                id: al.finalGrade.id,
                                                gradeExtraordinary: value,
                                                grade: al.finalGrade.grade,
                                                gradeOrdinary: al.finalGrade.gradeOrdinary,
                                                date: al.finalGrade.date
                                              }
                                            };
                                          }
                                          return al;
                                        }));
                                        
                                        // Guardar en la base de datos
                                        try {
                                          console.log('🟡 ========== DEBUG: Guardar Calificación Extraordinaria ==========');
                                          console.log('🟡 Variables del contexto:', {
                                            studentId,
                                            value,
                                            promedio,
                                            ordinario,
                                            extraordinario,
                                            courseGroupStudentId,
                                            finalGradeId
                                          });
                                          
                                          if (finalGradeId) {
                                            // Usar PATCH con el ID del finalGrade que viene del endpoint
                                            const updateData = { gradeExtraordinary: value };
                                            console.log('🟡 ACTUALIZANDO FinalGrade existente (PATCH):', {
                                              finalGradeId,
                                              updateData
                                            });
                                            await CourseService.updateFinalGrade(finalGradeId, updateData);
                                          } else {
                                            // Solo crear si no existe (no debería pasar si el endpoint siempre trae finalGrade)
                                            console.warn('⚠️ No se encontró finalGradeId, creando nuevo FinalGrade');
                                            const createData = {
                                              grade: Math.round(promedio),
                                              gradeOrdinary: ordinario || 0,
                                              gradeExtraordinary: value,
                                              date: new Date().toISOString(),
                                              type: 'final',
                                              courseGroupStudentId: studentId
                                            };
                                            console.log('🟡 CREANDO nuevo FinalGrade:', createData);
                                            await CourseService.createFinalGrade(createData);
                                          }
                                          console.log('🟡 ============================================================');
                                          toast.success('Calificación extraordinaria guardada');
                                        } catch (error) {
                                          console.error('❌ Error al guardar calificación extraordinaria:', error);
                                          toast.error('Error al guardar calificación extraordinaria');
                                        }
                                      }}
                                    />
                                  ) : '--'}
                                </td>
                                <td className={`border border-gray-300 px-2 py-1 text-center ${
                                  extraordinario !== null && extraordinario > 0 ? "font-semibold" : ""
                                }`}>
                                  {extraordinario !== null && extraordinario > 0 ? extraordinario : '--'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
            <PonderacionesModal
              isOpen={isPonderacionesModalOpen}
              onClose={() => setIsPonderacionesModalOpen(false)}
              courseGroup={selectedCourseGroupForPonderaciones}
              onPonderacionesChange={() => {
                // Recalcular calificaciones parciales después de cambiar ponderaciones
                if (alumnos.length > 0) {
                  calcularCalificacionesParcialesTodosAlumnos(selectedPartial, calificacionesMap);
                }
              }}
            />

            {/* Modal de Actividades */}
            <Dialog open={isActividadesModalOpen} onOpenChange={setIsActividadesModalOpen}>
              <DialogContent className="max-w-[90vw]">
                <DialogHeader>
                  <DialogTitle>Actividades del Curso</DialogTitle>
                  <DialogDescription>
                    Define las actividades, evidencias, producto y examen para este curso. Estas actividades aparecerán para todos los alumnos.
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="parcial-actividades" className="font-medium">Parcial:</label>
                    <select
                      id="parcial-actividades"
                      value={selectedPartialForActividades}
                      onChange={e => {
                        const newPartial = Number(e.target.value);
                        
                        
                        // Filtrar y mostrar solo las actividades del parcial seleccionado
                        const actividadesFiltradas = filtrarActividadesPorParcial(todasLasActividades, newPartial);
                        setActividadesDefinidas(actividadesFiltradas);
                        setSelectedPartialForActividades(newPartial);
                      }}
                      className="border rounded px-2 py-1"
                    >
                      <option value={1}>Primer Parcial</option>
                      <option value={2}>Segundo Parcial</option>
                      <option value={3}>Tercer Parcial</option>
                    </select>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[1600px] border border-gray-300 text-center">
                    <thead>
                      <tr>
                        <th colSpan={10} className="bg-blue-100 font-semibold border-r border-gray-300">Actividades de Aprendizaje</th>
                        <th colSpan={5} className="bg-green-100 font-semibold border-r border-gray-300">Evidencias de Aprendizaje</th>
                        <th className="bg-pink-200 font-semibold border-r border-gray-300">Producto del Parcial</th>
                        <th className="bg-gray-400 font-semibold text-white">Examen Parcial</th>
                      </tr>
                      <tr>
                        {[...Array(10)].map((_, i) => (
                          <th key={"act"+i} className="bg-blue-50 border-r border-gray-200">A{i+1}</th>
                        ))}
                        {[...Array(5)].map((_, i) => (
                          <th key={"ev"+i} className="bg-green-50 border-r border-gray-200">E{i+1}</th>
                        ))}
                        <th className="bg-pink-50 border-r border-gray-200">Producto</th>
                        <th className="bg-gray-100">Examen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {/* Inputs de nombre para Actividades */}
                        {[...Array(10)].map((_, i) => {
                          const actividad = actividadesDefinidas.actividades[i];
                          const isCurrentPartial = actividad?.partial === selectedPartialForActividades;
                          const hasActivity = actividad?.id && actividad?.name;
                          
                          if (i === 0) {
                            
                          }
                          
                          return (
                            <td key={"actname"+i} className="px-2 py-1 border-r border-gray-100">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Nombre"
                                  value={isCurrentPartial ? (actividad?.name || '') : ''}
                                  onChange={e => {
                                    setActividadesDefinidas(prev => ({
                                      ...prev,
                                      actividades: prev.actividades.map((item, idx) => 
                                        idx === i ? { ...item, name: e.target.value, partial: selectedPartialForActividades } : item
                                      )
                                    }))
                                  }}
                                  className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                                  disabled={!isCurrentPartial && hasActivity}
                                />
                                <Button
                                  size="sm"
                                  variant={isCurrentPartial && hasActivity ? "outline" : "default"}
                                  className={`h-6 px-2 text-xs ${isCurrentPartial && hasActivity ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                  onClick={() => handleActividadButtonClick('actividades', i)}
                                  disabled={isSavingActividad || (!isCurrentPartial && hasActivity)}
                                >
                                  {isCurrentPartial && hasActivity ? '✏️ Editar' : '➕ Agregar'}
                                </Button>
                              </div>
                            </td>
                          );
                        })}
                        {/* Inputs de nombre para Evidencias */}
                        {[...Array(5)].map((_, i) => {
                          const evidencia = actividadesDefinidas.evidencias[i];
                          const isCurrentPartial = evidencia?.partial === selectedPartialForActividades;
                          const hasEvidencia = evidencia?.id && evidencia?.name;
                          
                          return (
                            <td key={"evname"+i} className="px-2 py-1 border-r border-gray-100">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Nombre"
                                  value={isCurrentPartial ? (evidencia?.name || '') : ''}
                                  onChange={e => {
                                    setActividadesDefinidas(prev => ({
                                      ...prev,
                                      evidencias: prev.evidencias.map((item, idx) => 
                                        idx === i ? { ...item, name: e.target.value, partial: selectedPartialForActividades } : item
                                      )
                                    }))
                                  }}
                                  className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                                  disabled={!isCurrentPartial && hasEvidencia}
                                />
                                <Button
                                  size="sm"
                                  variant={isCurrentPartial && hasEvidencia ? "outline" : "default"}
                                  className={`h-6 px-2 text-xs ${isCurrentPartial && hasEvidencia ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                  onClick={() => handleActividadButtonClick('evidencias', i)}
                                  disabled={isSavingActividad || (!isCurrentPartial && hasEvidencia)}
                                >
                                  {isCurrentPartial && hasEvidencia ? '✏️ Editar' : '➕ Agregar'}
                                </Button>
                              </div>
                            </td>
                          );
                        })}
                        {/* Producto */}
                        <td className="px-2 py-1 border-r border-gray-100">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="text"
                              placeholder="Nombre"
                              value={actividadesDefinidas.producto?.partial === selectedPartialForActividades ? (actividadesDefinidas.producto?.name || '') : ''}
                              onChange={e => {
                                setActividadesDefinidas(prev => ({
                                  ...prev,
                                  producto: { ...prev.producto, name: e.target.value, partial: selectedPartialForActividades }
                                }))
                              }}
                              className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                              disabled={!!(actividadesDefinidas.producto?.partial !== selectedPartialForActividades && actividadesDefinidas.producto?.id && actividadesDefinidas.producto?.name)}
                            />
                            <Button
                              size="sm"
                              variant={actividadesDefinidas.producto?.partial === selectedPartialForActividades && actividadesDefinidas.producto?.id && actividadesDefinidas.producto?.name ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${actividadesDefinidas.producto?.partial === selectedPartialForActividades && actividadesDefinidas.producto?.id && actividadesDefinidas.producto?.name ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handleActividadButtonClick('producto', 0)}
                              disabled={isSavingActividad || !!(actividadesDefinidas.producto?.partial !== selectedPartialForActividades && actividadesDefinidas.producto?.id && actividadesDefinidas.producto?.name)}
                            >
                              {actividadesDefinidas.producto?.partial === selectedPartialForActividades && actividadesDefinidas.producto?.id && actividadesDefinidas.producto?.name ? '✏️ Editar' : '➕ Agregar'}
                            </Button>
                          </div>
                        </td>
                        {/* Examen */}
                        <td className="px-2 py-1">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="text"
                              placeholder="Nombre"
                              value={actividadesDefinidas.examen?.partial === selectedPartialForActividades ? (actividadesDefinidas.examen?.name || '') : ''}
                              onChange={e => {
                                setActividadesDefinidas(prev => ({
                                  ...prev,
                                  examen: { ...prev.examen, name: e.target.value, partial: selectedPartialForActividades }
                                }))
                              }}
                              className="w-20 text-center border rounded px-2 py-1 mx-1 mb-1"
                              disabled={!!(actividadesDefinidas.examen?.partial !== selectedPartialForActividades && actividadesDefinidas.examen?.id && actividadesDefinidas.examen?.name)}
                            />
                            <Button
                              size="sm"
                              variant={actividadesDefinidas.examen?.partial === selectedPartialForActividades && actividadesDefinidas.examen?.id && actividadesDefinidas.examen?.name ? "outline" : "default"}
                              className={`h-6 px-2 text-xs ${actividadesDefinidas.examen?.partial === selectedPartialForActividades && actividadesDefinidas.examen?.id && actividadesDefinidas.examen?.name ? 'border-green-500 text-green-600 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              onClick={() => handleActividadButtonClick('examen', 0)}
                              disabled={isSavingActividad || !!(actividadesDefinidas.examen?.partial !== selectedPartialForActividades && actividadesDefinidas.examen?.id && actividadesDefinidas.examen?.name)}
                            >
                              {actividadesDefinidas.examen?.partial === selectedPartialForActividades && actividadesDefinidas.examen?.id && actividadesDefinidas.examen?.name ? '✏️ Editar' : '➕ Agregar'}
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
            <AttendanceModal
              isOpen={isAttendanceModalOpen}
              onClose={() => setIsAttendanceModalOpen(false)}
              courseGroup={selectedCourseGroupForAttendance}
              course={selectedCourseForAttendance}
            />



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
                    <th className="px-2 py-1">Calif Ordinario</th>
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
                      (calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8
                        ? "bg-red-200 text-red-800"
                        : calificacionesFinales.exentos !== null && calificacionesFinales.exentos >= 8
                          ? "bg-green-100 text-green-800"
                          : "")
                    }>
                      {calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8
                        ? 'ORD'
                        : (calificacionesFinales.exentos !== null ? Math.round(calificacionesFinales.exentos) : '--')}
                    </td>
                    <td className={
                      calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8
                        ? "px-2 py-1 bg-red-200 text-red-800 font-bold text-center"
                        : "px-2 py-1"
                    }>
                      {calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8 ? (
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
                                  
                                  // Actualizar el estado de calificaciones finales
                                  setCalificacionesFinalesAlumnos(prev => ({
                                    ...prev,
                                    [alumnoCalificacionFinal.courseGroupStudentId]: {
                                      ...prev[alumnoCalificacionFinal.courseGroupStudentId],
                                      ordinario: Number(inputOrdinario)
                                    }
                                  }));
                                  
                                  toast.success('Calificación ordinaria guardada correctamente');
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
                        ) : '--'}
                    </td>
                    <td className={
                      calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8
                        ? "px-2 py-1 bg-red-200 text-red-800 font-bold text-center"
                        : "px-2 py-1"
                    }>
                      {calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8 ? (
                          ordinarioGuardado !== null ? (
                            <input
                              type="number"
                              min={0}
                              max={10}
                              className="w-20 text-center border rounded px-2 py-1 mx-1"
                              value={ordinarioGuardado}
                              disabled={true}
                            />
                          ) : (
                            <span className="font-bold">--</span>
                          )
                        ) : '--'}
                    </td>
                    <td className={
                      ordinarioGuardado !== null && ordinarioGuardado < 6 && calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8
                        ? "px-2 py-1 bg-red-200 text-red-800 font-bold text-center"
                        : "px-2 py-1"
                    }>
                      {ordinarioGuardado !== null && ordinarioGuardado < 6 && calificacionesFinales.exentos !== null && calificacionesFinales.exentos < 8 ? (
                          extraordinarioGuardado !== null ? (
                            <div className="flex items-center gap-2 justify-center">
                              <span className="font-bold">{extraordinarioGuardado}</span>
                              <button
                                className="h-6 px-2 text-xs rounded border-green-500 text-green-600 border bg-green-50 hover:bg-green-100 font-semibold"
                                style={{ minWidth: 60 }}
                                disabled={isSavingExtraordinario}
                                onClick={() => {
                                  setInputExtraordinario(extraordinarioGuardado.toString());
                                }}
                              >
                                ✏️ Editar
                              </button>
                            </div>
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
                                    
                                    // Actualizar el estado de calificaciones finales
                                    setCalificacionesFinalesAlumnos(prev => ({
                                      ...prev,
                                      [alumnoCalificacionFinal.courseGroupStudentId]: {
                                        ...prev[alumnoCalificacionFinal.courseGroupStudentId],
                                        extraordinario: Number(inputExtraordinario)
                                      }
                                    }));
                                    
                                    toast.success('Calificación extraordinaria guardada correctamente');
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
