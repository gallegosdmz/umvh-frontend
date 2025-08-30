"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users } from "lucide-react"
import { CourseService } from "@/lib/services/course.service"
import { useOfflineAttendance } from "@/hooks/use-offline-attendance"
import { toast } from 'react-toastify'

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
  offlineId?: string; // ID temporal para asistencias offline
}

interface Student {
  id: number;
  fullName: string;
  semester: number;
  registrationNumber: string;
  courseGroupStudentId?: number;
  attend?: number;
  attendanceId?: number | string | null;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseGroup: any;
  course: any;
}

export function AttendanceModal({ isOpen, onClose, courseGroup, course }: AttendanceModalProps) {
  const { 
    isOnline: isAttendanceOnline, 
    getOfflineAttendances, 
    saveAttendanceOffline, 
    updateAttendanceOffline, 
    syncOfflineAttendances 
  } = useOfflineAttendance()

  // Estados de asistencia
  const [asistenciaAlumnos, setAsistenciaAlumnos] = useState<Student[]>([])
  const [asistenciaFecha, setAsistenciaFecha] = useState<string>("")
  const [asistenciaParcial, setAsistenciaParcial] = useState<number>(1)
  const [isLoadingAsistencia, setIsLoadingAsistencia] = useState(false)
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)
  const [isLoadingDateChange, setIsLoadingDateChange] = useState(false)

  // Cargar alumnos cuando se abra el modal
  useEffect(() => {
    if (isOpen && courseGroup) {
      loadAlumnosForAttendance()
    }
  }, [isOpen, courseGroup])

  // Cargar alumnos del grupo para asistencia
  const loadAlumnosForAttendance = async () => {
    if (!courseGroup?.id) return
    
    setIsLoadingAsistencia(true)
    try {
      // Cargar todos los alumnos del grupo
      const response = await CourseService.getStudentsByCourseGroup(courseGroup.id, 100, 0)
      const students = Array.isArray(response) ? response : response.items || []
      
      // Obtener las asistencias existentes para la fecha actual y parcial desde el backend
      let existingAttendances: AttendanceData[] = []
      try {
        if (isAttendanceOnline) {
          const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(courseGroup.id, asistenciaFecha || new Date().toISOString().slice(0, 10))
          existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        }
        // Filtrar por parcial
        existingAttendances = existingAttendances.filter((att: AttendanceData) => att.partial === asistenciaParcial)
        
        // Obtener asistencias offline para la misma fecha y parcial
        const offlineAttendances = getOfflineAttendances(courseGroup.id, asistenciaFecha || new Date().toISOString().slice(0, 10), asistenciaParcial)
        
        // Combinar asistencias online y offline, dando prioridad a las offline (más recientes)
        const offlineMap = new Map()
        offlineAttendances.forEach(att => {
          offlineMap.set(att.courseGroupStudentId, att)
        })
        
        // Reemplazar o agregar asistencias offline
        existingAttendances = existingAttendances.filter(att => 
          !offlineMap.has(att.courseGroupStudent?.id || att.courseGroupStudentId)
        )
        existingAttendances = [...existingAttendances, ...offlineAttendances]
        
      } catch (attendanceError) {
        console.log('Error cargando asistencias online, usando solo offline:', attendanceError)
        // Si falla online, usar solo offline
        existingAttendances = getOfflineAttendances(courseGroup.id, asistenciaFecha || new Date().toISOString().slice(0, 10), asistenciaParcial)
      }
      
      // Crear un mapa de asistencias por courseGroupStudentId
      const attendanceMap = new Map()
      const attendanceIdMap = new Map()
      existingAttendances.forEach((att: AttendanceData) => {
        const courseGroupStudentId = att.courseGroupStudent?.id || att.courseGroupStudentId
        attendanceMap.set(courseGroupStudentId, att.attend)
        attendanceIdMap.set(courseGroupStudentId, att.id)
      })
      
      const mappedStudents = students.map((item: any) => {
        const courseGroupStudentId = item.id
        const attendValue = attendanceMap.has(courseGroupStudentId) ? attendanceMap.get(courseGroupStudentId) : 1
        const attendanceId = attendanceIdMap.has(courseGroupStudentId) ? attendanceIdMap.get(courseGroupStudentId) : null
        
        return {
          id: item.student.id,
          fullName: item.student.fullName,
          semester: item.student.semester,
          registrationNumber: item.student.registrationNumber,
          courseGroupStudentId: courseGroupStudentId,
          attend: attendValue,
          attendanceId: attendanceId
        }
      })
      
      setAsistenciaAlumnos(mappedStudents)
      
      // Establecer fecha actual por defecto si no hay fecha
      if (!asistenciaFecha) {
        setAsistenciaFecha(new Date().toISOString().slice(0, 10))
      }
      
    } catch (error) {
      console.error('Error al cargar los alumnos para asistencia:', error)
      toast.error('Error al cargar los alumnos')
      setAsistenciaAlumnos([])
    } finally {
      setIsLoadingAsistencia(false)
    }
  }

  // Guardar asistencias
  const handleSaveAttendance = async () => {
    if (!asistenciaFecha || asistenciaAlumnos.length === 0) {
      toast.error('Por favor selecciona una fecha, un parcial y verifica que hay alumnos')
      return
    }

    setIsSavingAttendance(true)
    
    try {
      // Procesar cada asistencia individualmente
      for (const alumno of asistenciaAlumnos) {
        if (!alumno.courseGroupStudentId) {
          console.error('❌ courseGroupStudentId es requerido para:', alumno)
          continue
        }
        
        const attendanceData = {
          courseGroupStudentId: alumno.courseGroupStudentId as number,
          date: asistenciaFecha,
          attend: alumno.attend || 1,
          partial: asistenciaParcial
        }
        
        try {
          if (alumno.attendanceId) {
            // ACTUALIZAR ASISTENCIA EXISTENTE
            if (isAttendanceOnline) {
              if (typeof alumno.attendanceId === 'number') {
                const updatedAttendance = await CourseService.updateAttendance(alumno.attendanceId, attendanceData)
                if (updatedAttendance) {
                  console.log('Asistencia actualizada online:', updatedAttendance)
                } else {
                  toast.error(`Error al actualizar asistencia de ${alumno.fullName}`)
                }
              } else {
                toast.error(`ID de asistencia inválido para ${alumno.fullName}`)
              }
            } else {
              // Modo offline: actualizar localmente
              if (typeof alumno.attendanceId === 'number') {
                const updatedAttendance = await updateAttendanceOffline(alumno.attendanceId, attendanceData)
                if (updatedAttendance) {
                  console.log('Asistencia actualizada offline:', updatedAttendance)
                  toast.info('Asistencia guardada offline. Se sincronizará cuando haya conexión.')
                } else {
                  toast.error(`Error al actualizar asistencia offline de ${alumno.fullName}`)
                }
              } else {
                toast.error(`ID de asistencia inválido para ${alumno.fullName}`)
              }
            }
          } else {
            // CREAR NUEVA ASISTENCIA
            if (isAttendanceOnline) {
              const newAttendance = await CourseService.createAttendance(attendanceData)
              if (newAttendance && newAttendance.id) {
                // Actualizar el attendanceId en el estado local
                const updatedAlumnos = asistenciaAlumnos.map(a => 
                  a.id === alumno.id 
                    ? { ...a, attendanceId: newAttendance.id }
                    : a
                )
                setAsistenciaAlumnos(updatedAlumnos)
                console.log('Asistencia creada online:', newAttendance)
              } else {
                console.error('❌ No se recibió ID válido del servidor para la nueva asistencia')
                toast.error(`Error al crear asistencia de ${alumno.fullName}`)
              }
            } else {
              // Modo offline: crear localmente
              const newAttendance = await saveAttendanceOffline(attendanceData)
              if (newAttendance) {
                // Actualizar el attendanceId en el estado local con el ID offline
                const updatedAlumnos = asistenciaAlumnos.map(a => 
                  a.id === alumno.id 
                    ? { ...a, attendanceId: newAttendance.offlineId }
                    : a
                )
                setAsistenciaAlumnos(updatedAlumnos)
                console.log('Asistencia creada offline:', newAttendance)
                toast.info('Asistencia guardada offline. Se sincronizará cuando haya conexión.')
              } else {
                toast.error(`Error al crear asistencia offline de ${alumno.fullName}`)
              }
            }
          }
        } catch (error) {
          console.error('Error procesando asistencia:', error)
          
          // Si falla online, intentar guardar offline
          if (isAttendanceOnline) {
            try {
              console.log('Fallback a modo offline para:', alumno.fullName)
              if (alumno.attendanceId && typeof alumno.attendanceId === 'number') {
                await updateAttendanceOffline(alumno.attendanceId, attendanceData)
              } else {
                await saveAttendanceOffline(attendanceData)
              }
              toast.info(`Asistencia de ${alumno.fullName} guardada offline debido a error de conexión`)
            } catch (offlineError) {
              console.error('Error también en modo offline:', offlineError)
              toast.error(`Error al procesar asistencia de ${alumno.fullName}`)
            }
          } else {
            toast.error(`Error al procesar asistencia de ${alumno.fullName}`)
          }
        }
      }
      
      toast.success('Asistencia guardada correctamente')
      
    } catch (error) {
      console.error('Error al guardar la asistencia:', error)
      toast.error('Error al guardar la asistencia')
    } finally {
      setIsSavingAttendance(false)
    }
  }

  // Cambiar parcial
  const handleParcialChange = (newParcial: number) => {
    setAsistenciaParcial(newParcial)
    
    if (!courseGroup?.id || !asistenciaFecha) return
    
    setIsLoadingDateChange(true)
    
    // Obtener las asistencias existentes para la nueva fecha y parcial desde el backend
    const loadAttendancesForParcial = async () => {
      try {
        let existingAttendances: AttendanceData[] = []
        
        if (isAttendanceOnline) {
          const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(courseGroup.id, asistenciaFecha)
          existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        }
        
        // Filtrar por parcial
        let filteredAttendances = existingAttendances.filter((att: AttendanceData) => att.partial === newParcial)
        
        // Obtener asistencias offline para la misma fecha y parcial
        const offlineAttendances = getOfflineAttendances(courseGroup.id, asistenciaFecha, newParcial)
        
        // Combinar asistencias online y offline, dando prioridad a las offline
        const offlineMap = new Map()
        offlineAttendances.forEach(att => {
          offlineMap.set(att.courseGroupStudentId, att)
        })
        
        // Reemplazar o agregar asistencias offline
        filteredAttendances = filteredAttendances.filter(att => 
          !offlineMap.has(att.courseGroupStudent?.id || att.courseGroupStudentId)
        )
        const combinedAttendances = [...filteredAttendances, ...offlineAttendances]
        
        // Crear un mapa de asistencias por courseGroupStudentId
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        combinedAttendances.forEach((att: AttendanceData) => {
          const courseGroupStudentId = att.courseGroupStudent?.id || att.courseGroupStudentId
          if (courseGroupStudentId) {
            dateAttendanceMap.set(courseGroupStudentId, att.attend)
            dateAttendanceIdMap.set(courseGroupStudentId, att.id || att.offlineId)
          }
        })
        
        // Actualizar las asistencias de los alumnos
        const updatedAlumnos = asistenciaAlumnos.map(alumno => {
          const attendValue = dateAttendanceMap.has(alumno.courseGroupStudentId) ? dateAttendanceMap.get(alumno.courseGroupStudentId) : 1
          const attendanceId = dateAttendanceIdMap.has(alumno.courseGroupStudentId) ? dateAttendanceIdMap.get(alumno.courseGroupStudentId) : null
          
          return {
            ...alumno,
            attend: attendValue,
            attendanceId: attendanceId
          }
        })
        
        setAsistenciaAlumnos(updatedAlumnos)
      } catch (error) {
        console.log('Error cargando asistencias, usando solo offline:', error)
        
        // Si falla online, usar solo offline
        const offlineAttendances = getOfflineAttendances(courseGroup.id, asistenciaFecha, newParcial)
        
        // Crear mapas solo con datos offline
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        offlineAttendances.forEach((att: AttendanceData) => {
          dateAttendanceMap.set(att.courseGroupStudentId, att.attend)
          dateAttendanceIdMap.set(att.courseGroupStudentId, att.offlineId)
        })
        
        // Actualizar las asistencias de los alumnos
        const updatedAlumnos = asistenciaAlumnos.map(alumno => {
          const attendValue = dateAttendanceMap.has(alumno.courseGroupStudentId) ? dateAttendanceMap.get(alumno.courseGroupStudentId) : 1
          const attendanceId = dateAttendanceIdMap.has(alumno.courseGroupStudentId) ? dateAttendanceIdMap.get(alumno.courseGroupStudentId) : null
          
          return {
            ...alumno,
            attend: attendValue,
            attendanceId: attendanceId
          }
        })
        
        setAsistenciaAlumnos(updatedAlumnos)
      } finally {
        setIsLoadingDateChange(false)
      }
    }
    
    loadAttendancesForParcial()
  }

  // Cambiar fecha
  const handleDateChange = (newDate: string) => {
    setAsistenciaFecha(newDate)
    
    if (!courseGroup?.id) return
    
    setIsLoadingDateChange(true)
    
    // Obtener las asistencias existentes para la nueva fecha desde el backend
    const loadAttendancesForDate = async () => {
      try {
        let existingAttendances: AttendanceData[] = []
        
        if (isAttendanceOnline) {
          const attendancesResponse = await CourseService.getAttendancesByCourseGroupAndDate(courseGroup.id, newDate)
          existingAttendances = Array.isArray(attendancesResponse) ? attendancesResponse : attendancesResponse.items || []
        }
        
        // Filtrar por parcial
        let filteredAttendances = existingAttendances.filter((att: AttendanceData) => att.partial === asistenciaParcial)
        
        // Obtener asistencias offline para la misma fecha y parcial
        const offlineAttendances = getOfflineAttendances(courseGroup.id, newDate, asistenciaParcial)
        
        // Combinar asistencias online y offline, dando prioridad a las offline
        const offlineMap = new Map()
        offlineAttendances.forEach(att => {
          offlineMap.set(att.courseGroupStudentId, att)
        })
        
        // Reemplazar o agregar asistencias offline
        filteredAttendances = filteredAttendances.filter(att => 
          !offlineMap.has(att.courseGroupStudent?.id || att.courseGroupStudentId)
        )
        const combinedAttendances = [...filteredAttendances, ...offlineAttendances]
        
        // Crear un mapa de asistencias por courseGroupStudentId
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        combinedAttendances.forEach((att: AttendanceData) => {
          const courseGroupStudentId = att.courseGroupStudent?.id || att.courseGroupStudentId
          if (courseGroupStudentId) {
            dateAttendanceMap.set(courseGroupStudentId, att.attend)
            dateAttendanceIdMap.set(courseGroupStudentId, att.id || att.offlineId)
          }
        })
        
        // Actualizar las asistencias de los alumnos
        const updatedAlumnos = asistenciaAlumnos.map(alumno => {
          const attendValue = dateAttendanceMap.has(alumno.courseGroupStudentId) ? dateAttendanceMap.get(alumno.courseGroupStudentId) : 1
          const attendanceId = dateAttendanceIdMap.has(alumno.courseGroupStudentId) ? dateAttendanceIdMap.get(alumno.courseGroupStudentId) : null
          
          return {
            ...alumno,
            attend: attendValue,
            attendanceId: attendanceId
          }
        })
        
        setAsistenciaAlumnos(updatedAlumnos)
      } catch (error) {
        console.log('Error cargando asistencias, usando solo offline:', error)
        
        // Si falla online, usar solo offline
        const offlineAttendances = getOfflineAttendances(courseGroup.id, newDate, asistenciaParcial)
        
        // Crear mapas solo con datos offline
        const dateAttendanceMap = new Map()
        const dateAttendanceIdMap = new Map()
        
        offlineAttendances.forEach((att: AttendanceData) => {
          dateAttendanceMap.set(att.courseGroupStudentId, att.attend)
          dateAttendanceIdMap.set(att.courseGroupStudentId, att.offlineId)
        })
        
        // Actualizar las asistencias de los alumnos
        const updatedAlumnos = asistenciaAlumnos.map(alumno => {
          const attendValue = dateAttendanceMap.has(alumno.courseGroupStudentId) ? dateAttendanceMap.get(alumno.courseGroupStudentId) : 1
          const attendanceId = dateAttendanceIdMap.has(alumno.courseGroupStudentId) ? dateAttendanceIdMap.get(alumno.courseGroupStudentId) : null
          
          return {
            ...alumno,
            attend: attendValue,
            attendanceId: attendanceId
          }
        })
        
        setAsistenciaAlumnos(updatedAlumnos)
      } finally {
        setIsLoadingDateChange(false)
      }
    }
    
    loadAttendancesForDate()
  }

  // Cerrar modal y limpiar estados
  const handleClose = () => {
    setAsistenciaAlumnos([])
    setAsistenciaFecha("")
    setAsistenciaParcial(1)
    setIsLoadingAsistencia(false)
    setIsSavingAttendance(false)
    setIsLoadingDateChange(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] flex flex-col p-0 sm:p-6">
        <DialogHeader className="px-4 sm:px-0 pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            Asistencia - {asistenciaParcial === 1 ? 'Primer' : asistenciaParcial === 2 ? 'Segundo' : 'Tercer'} Parcial
          </DialogTitle>
          <DialogDescription className="text-sm">
            Selecciona los alumnos presentes y ausentes para el parcial seleccionado
            {!isAttendanceOnline && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs sm:text-sm">
                ⚠️ Modo Offline: Las asistencias se guardarán localmente y se sincronizarán cuando haya conexión.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {/* Controles de fecha y parcial - Responsive */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="asistenciaFecha" className="font-medium text-sm whitespace-nowrap">Fecha:</label>
            <input
              id="asistenciaFecha"
              type="date"
              value={asistenciaFecha}
              onChange={e => handleDateChange(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
              disabled={isLoadingDateChange}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="asistenciaParcial" className="font-medium text-sm whitespace-nowrap">Parcial:</label>
            <select
              id="asistenciaParcial"
              value={asistenciaParcial}
              onChange={e => handleParcialChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
              disabled={isLoadingDateChange}
            >
              <option value={1}>Primer Parcial</option>
              <option value={2}>Segundo Parcial</option>
              <option value={3}>Tercer Parcial</option>
            </select>
          </div>
        </div>
        
        {/* Contenido principal - Responsive */}
        <div className="flex-1 overflow-hidden px-4 sm:px-0">
          <div className="rounded-md border h-full flex flex-col">
            {/* Vista de escritorio - Tabla */}
            <div className="hidden md:block overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full w-full border-separate" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
                <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm" style={{ width: '8%' }}>No.</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm" style={{ width: '25%' }}>Nombre Completo</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm" style={{ width: '15%' }}>Matrícula</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm" style={{ width: '15%' }}>Estado</th>
                    <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm" style={{ width: '12%' }}>Presente</th>
                    <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm" style={{ width: '12%' }}>Ausente</th>
                    <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm" style={{ width: '13%' }}>Retardo</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingAsistencia || isLoadingDateChange ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                          <p className="text-sm">{isLoadingDateChange ? 'Cargando asistencias...' : 'Cargando alumnos...'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : asistenciaAlumnos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="h-12 w-12 mb-4" />
                          <p className="text-lg font-medium">No hay alumnos en este grupo</p>
                          <p className="text-sm">Agrega alumnos al grupo para tomar asistencia</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    asistenciaAlumnos.map((alumno, index) => (
                      <tr key={alumno.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 text-center font-medium text-xs sm:text-sm" style={{ width: '8%' }}>{index + 1}</td>
                        <td className="font-medium px-2 sm:px-4 py-2 text-xs sm:text-sm" style={{ width: '25%' }}>{alumno.fullName}</td>
                        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm" style={{ width: '15%' }}>{alumno.registrationNumber}</td>
                        <td className="px-2 sm:px-4 py-2" style={{ width: '15%' }}>
                          {alumno.attendanceId ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              ✓ Creada
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                              ⚠ Nueva
                            </Badge>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-center" style={{ width: '12%' }}>
                          <input
                            type="checkbox"
                            checked={alumno.attend === 1}
                            onChange={(e) => {
                              const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                a.id === alumno.id ? { ...a, attend: e.target.checked ? 1 : 2 } : a
                              );
                              setAsistenciaAlumnos(updatedAlumnos);
                            }}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-center" style={{ width: '12%' }}>
                          <input
                            type="checkbox"
                            checked={alumno.attend === 2}
                            onChange={(e) => {
                              const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                a.id === alumno.id ? { ...a, attend: e.target.checked ? 2 : 1 } : a
                              );
                              setAsistenciaAlumnos(updatedAlumnos);
                            }}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-center" style={{ width: '13%' }}>
                          <input
                            type="checkbox"
                            checked={alumno.attend === 3}
                            onChange={(e) => {
                              const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                a.id === alumno.id ? { ...a, attend: e.target.checked ? 3 : 1 } : a
                              );
                              setAsistenciaAlumnos(updatedAlumnos);
                            }}
                            className="w-4 h-4"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Vista móvil - Cards */}
            <div className="md:hidden overflow-y-auto flex-1">
              {isLoadingAsistencia || isLoadingDateChange ? (
                <div className="flex flex-col items-center justify-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                  <p className="text-sm">{isLoadingDateChange ? 'Cargando asistencias...' : 'Cargando alumnos...'}</p>
                </div>
              ) : asistenciaAlumnos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 py-8">
                  <Users className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">No hay alumnos en este grupo</p>
                  <p className="text-sm">Agrega alumnos al grupo para tomar asistencia</p>
                </div>
              ) : (
                <div className="space-y-3 p-2">
                  {asistenciaAlumnos.map((alumno, index) => (
                    <div key={alumno.id} className="border rounded-lg p-3 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-semibold">{alumno.fullName}</span>
                        </div>
                        {alumno.attendanceId ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            ✓ Creada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                            ⚠ Nueva
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        Matrícula: {alumno.registrationNumber}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`presente-${alumno.id}`}
                            checked={alumno.attend === 1}
                            onChange={(e) => {
                              const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                a.id === alumno.id ? { ...a, attend: e.target.checked ? 1 : 2 } : a
                              );
                              setAsistenciaAlumnos(updatedAlumnos);
                            }}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`presente-${alumno.id}`} className="text-sm font-medium text-green-700">Presente</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`ausente-${alumno.id}`}
                            checked={alumno.attend === 2}
                            onChange={(e) => {
                              const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                a.id === alumno.id ? { ...a, attend: e.target.checked ? 2 : 1 } : a
                              );
                              setAsistenciaAlumnos(updatedAlumnos);
                            }}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`ausente-${alumno.id}`} className="text-sm font-medium text-red-700">Ausente</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`retardo-${alumno.id}`}
                            checked={alumno.attend === 3}
                            onChange={(e) => {
                              const updatedAlumnos = asistenciaAlumnos.map((a) =>
                                a.id === alumno.id ? { ...a, attend: e.target.checked ? 3 : 1 } : a
                              );
                              setAsistenciaAlumnos(updatedAlumnos);
                            }}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`retardo-${alumno.id}`} className="text-sm font-medium text-orange-700">Retardo</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer - Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 flex-shrink-0 px-4 sm:px-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSavingAttendance}
            className="w-full sm:w-auto"
          >
            Cerrar
          </Button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {!isAttendanceOnline && (
              <Button
                variant="outline"
                onClick={() => syncOfflineAttendances(async (attendance) => {
                  if (attendance.offlineId) {
                    // Es una asistencia offline, crear online
                    const { CourseService } = await import('@/lib/services/course.service')
                    return await CourseService.createAttendance({
                      courseGroupStudentId: attendance.courseGroupStudentId,
                      date: attendance.date,
                      attend: attendance.attend,
                      partial: attendance.partial
                    })
                  } else if (attendance.id) {
                    // Es una asistencia existente, actualizar online
                    const { CourseService } = await import('@/lib/services/course.service')
                    return await CourseService.updateAttendance(attendance.id, {
                      courseGroupStudentId: attendance.courseGroupStudentId,
                      date: attendance.date,
                      attend: attendance.attend,
                      partial: attendance.partial
                    })
                  }
                })}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                🔄 Sincronizar Offline
              </Button>
            )}
            <Button
              variant="default"
              onClick={handleSaveAttendance}
              disabled={isSavingAttendance || asistenciaAlumnos.length === 0}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {isSavingAttendance ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
