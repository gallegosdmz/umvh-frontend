"use client"

import { Course, User, Group, Student } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Users, UserPlus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCourse } from '@/lib/hooks/useCourse';
import { useTeacher } from '@/lib/hooks/useTeacher';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useGroup } from '@/lib/hooks/useGroup';
import { useStudent } from '@/lib/hooks/useStudent';
import { toast } from 'react-toastify';
import { Checkbox } from '@/components/ui/checkbox';
import { CourseService } from '@/lib/services/course.service';

export default function AsignaturasPage() {
  const router = useRouter();
  const { loading: courseLoading, error: courseError, totalItems: courseTotalItems, handleGetCourses, handleCreateCourse, handleUpdateCourse, handleDeleteCourse } = useCourse();
  const { loading: teacherLoading, error: teacherError, totalItems: teacherTotalItems, handleGetTeachers, handleCreateTeacher, handleUpdateTeacher, handleDeleteTeacher } = useTeacher();
  const { handleGetGroups } = useGroup();
  const { loading: studentLoading, error: studentError, totalItems: studentTotalItems, handleGetStudents } = useStudent();
  const [asignaturas, setAsignaturas] = useState<Course[]>([]);
  const [maestros, setMaestros] = useState<User[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Course | User | null>(null);
  const [editingItem, setEditingItem] = useState<Course | User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMaestros, setShowMaestros] = useState(false);
  const itemsPerPage = 5;
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState<'groups' | 'teachers' | 'students'>('groups');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [currentTeacherPage, setCurrentTeacherPage] = useState(1);
  const [currentGroupPage, setCurrentGroupPage] = useState(1);
  const [currentStudentPage, setCurrentStudentPage] = useState(1);
  const [alumnos, setAlumnos] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [openViewAssignmentsModal, setOpenViewAssignmentsModal] = useState(false);
  const [selectedCourseAssignments, setSelectedCourseAssignments] = useState<any[]>([]);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(1);
  const assignmentsPerPage = 5;
  const [schedule, setSchedule] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [openViewTeacherAssignmentsModal, setOpenViewTeacherAssignmentsModal] = useState(false);
  const [selectedTeacherAssignments, setSelectedTeacherAssignments] = useState<any[]>([]);
  const [currentTeacherAssignmentsPage, setCurrentTeacherAssignmentsPage] = useState(1);
  const teacherAssignmentsPerPage = 5;
  const [openDeleteAssignmentModal, setOpenDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, [currentPage, showMaestros]);

  useEffect(() => {
    if (openAssignModal) {
      if (currentStep === 'teachers') {
        loadTeachers();
      } else if (currentStep === 'students') {
        loadStudents();
      } else {
        loadGroups();
      }
    }
  }, [currentTeacherPage, currentGroupPage, currentStudentPage, currentStep]);

  useEffect(() => {
    if (openAssignModal) {
      filterGroups();
      filterTeachers();
      filterStudents();
    }
  }, [searchTerm, grupos, maestros, alumnos]);

  useEffect(() => {
    if (openViewAssignmentsModal && selectedCourse?.id) {
      handleViewAssignments(selectedCourse);
    }
  }, [currentAssignmentPage]);

  const loadItems = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      if (showMaestros) {
        const response = await handleGetTeachers(itemsPerPage, offset);
        console.log('Respuesta de maestros:', response);
        if (Array.isArray(response)) {
          setMaestros(response);
          setFilteredTeachers(response);
        } else if (response && response.items) {
          setMaestros(response.items);
          setFilteredTeachers(response.items);
        }
      } else {
        const response = await handleGetCourses(itemsPerPage, offset);
        console.log('Respuesta de asignaturas:', response);
        if (Array.isArray(response)) {
          setAsignaturas(response);
        } else if (response && response.items) {
          setAsignaturas(response.items);
        }
      }
    } catch (err) {
      console.error('Error al cargar los items:', err);
      toast.error('Error al cargar los datos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre) {
      return;
    }

    try {
      if (showMaestros) {
        const teacherData: User = {
          fullName: nombre,
          email: email
        };

        if (editingItem) {
          await handleUpdateTeacher(editingItem.id!, teacherData);
        } else {
          await handleCreateTeacher(teacherData);
        }
      } else {
        const courseData: Course = {
          name: nombre
        };

        if (editingItem) {
          await handleUpdateCourse(editingItem.id!, courseData);
        } else {
          await handleCreateCourse(courseData);
        }
      }
      setOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const handleEdit = (item: Course | User) => {
    setEditingItem(item);
    if ('fullName' in item) {
      setNombre(item.fullName);
      setEmail(item.email);
    } else {
      setNombre(item.name);
    }
    setOpen(true);
  };

  const handleDelete = async (item: Course | User) => {
    setItemToDelete(item);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (showMaestros) {
        await handleDeleteTeacher(itemToDelete.id!);
      } else {
        await handleDeleteCourse(itemToDelete.id!);
      }
      setOpenDelete(false);
      setItemToDelete(null);
      await loadItems();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setEditingItem(null);
  };

  const totalPages = Math.ceil((showMaestros ? teacherTotalItems : courseTotalItems) / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleNewItem = () => {
    if (showMaestros) {
      router.push('/admin/maestros/nuevo');
    } else {
      setOpen(true);
    }
  };

  const loadGroups = async () => {
    try {
      const offset = (currentGroupPage - 1) * itemsPerPage;
      const data = await handleGetGroups(itemsPerPage, offset);
      setGrupos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar los grupos:', err);
    }
  };

  const handleAssignClick = (course: Course) => {
    setSelectedCourse(course);
    setOpenAssignModal(true);
    setCurrentStep('groups');
    loadGroups();
    loadTeachers();
    loadStudents();
  };

  const loadTeachers = async () => {
    try {
      const offset = (currentTeacherPage - 1) * itemsPerPage;
      const data = await handleGetTeachers(itemsPerPage, offset);
      setMaestros(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar los maestros:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const offset = (currentStudentPage - 1) * itemsPerPage;
      const data = await handleGetStudents(itemsPerPage, offset);
      setAlumnos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar los alumnos:', err);
    }
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setCurrentStep('teachers');
  };

  const handleTeacherSelect = (teacher: User) => {
    setSelectedTeacher(teacher);
    setCurrentStep('students');
  };

  const validateSchedule = (value: string) => {
    const scheduleRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!value) {
      setScheduleError("El horario es requerido");
      return false;
    }
    if (!scheduleRegex.test(value)) {
      setScheduleError("Formato inválido. Use el formato HH:MM - HH:MM (ej: 8:00 - 9:00)");
      return false;
    }
    setScheduleError("");
    return true;
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSchedule(value);
    validateSchedule(value);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedCourse || !selectedGroup || !selectedTeacher) {
      toast.error('Debes seleccionar un grupo y un maestro');
      return;
    }

    if (!validateSchedule(schedule)) {
      return;
    }

    const assignmentData = {
      courseId: selectedCourse.id,
      groupId: selectedGroup.id,
      userId: selectedTeacher.id,
      schedule: schedule
    };

    console.log('Datos de asignación:', assignmentData);

    try {
      // Crear el CourseGroup
      const courseGroupResponse = await CourseService.assignGroup(assignmentData);
      console.log('CourseGroup creado:', courseGroupResponse);
      
      // Asignar estudiantes si se seleccionaron
      if (selectedStudents.size > 0) {
        const studentIds = Array.from(selectedStudents);
        console.log('Estudiantes seleccionados:', studentIds);
        
        // Obtener el ID del CourseGroup creado
        let courseGroupId = null;
        
        // Intentar diferentes estructuras posibles de la respuesta
        if (courseGroupResponse.id) {
          courseGroupId = courseGroupResponse.id;
        } else if (courseGroupResponse.courseGroup?.id) {
          courseGroupId = courseGroupResponse.courseGroup.id;
        } else if (courseGroupResponse.data?.id) {
          courseGroupId = courseGroupResponse.data.id;
        } else if (typeof courseGroupResponse === 'object' && courseGroupResponse !== null) {
          // Buscar recursivamente el ID en la respuesta
          const findId = (obj: any): number | null => {
            if (obj && typeof obj === 'object') {
              if (obj.id && typeof obj.id === 'number') {
                return obj.id;
              }
              for (const key in obj) {
                const result = findId(obj[key]);
                if (result !== null) {
                  return result;
                }
              }
            }
            return null;
          };
          courseGroupId = findId(courseGroupResponse);
        }
        
        console.log('CourseGroup ID encontrado:', courseGroupId);
        console.log('Respuesta completa:', courseGroupResponse);
        
        if (courseGroupId) {
          // Asignar cada estudiante al CourseGroup
          let assignedCount = 0;
          let errorCount = 0;
          
          for (const studentId of studentIds) {
            try {
              await CourseService.assignStudentToCourseGroup(courseGroupId, parseInt(studentId));
              console.log(`Estudiante ${studentId} asignado al CourseGroup ${courseGroupId}`);
              assignedCount++;
            } catch (studentError) {
              console.error(`Error al asignar estudiante ${studentId}:`, studentError);
              errorCount++;
            }
          }
          
          // Mostrar mensajes de resultado
          if (assignedCount > 0) {
            toast.success(`${assignedCount} estudiante${assignedCount !== 1 ? 's' : ''} asignado${assignedCount !== 1 ? 's' : ''} correctamente`);
          }
          
          if (errorCount > 0) {
            toast.error(`${errorCount} estudiante${errorCount !== 1 ? 's' : ''} no se pudo${errorCount !== 1 ? 'n' : ''} asignar`);
          }
        } else {
          console.error('No se pudo obtener el ID del CourseGroup creado');
          console.error('Respuesta completa:', courseGroupResponse);
          toast.error('Error: No se pudo obtener el ID del grupo creado');
        }
      }
      
      let successMessage = 'Asignación realizada correctamente';
      
      if (selectedStudents.size > 0) {
        successMessage += ` con ${selectedStudents.size} estudiante${selectedStudents.size !== 1 ? 's' : ''} asignado${selectedStudents.size !== 1 ? 's' : ''}`;
      }
      
      toast.success(successMessage);
      setOpenAssignModal(false);
      resetAssignmentModal();
    } catch (err) {
      console.error('Error al asignar:', err);
      toast.error('Error al realizar la asignación');
    }
  };

  const resetAssignmentModal = () => {
    setSelectedCourse(null);
    setSelectedGroup(null);
    setSelectedTeacher(null);
    setSelectedStudents(new Set());
    setCurrentStep('groups');
    setSchedule("");
    setScheduleError("");
  };

  const filterGroups = () => {
    if (!searchTerm) {
      setFilteredGroups(grupos);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = grupos.filter(grupo => 
      grupo.name.toLowerCase().includes(searchLower) ||
      grupo.period?.name?.toLowerCase().includes(searchLower)
    );
    setFilteredGroups(filtered);
  };

  const filterTeachers = () => {
    if (!searchTerm) {
      setFilteredTeachers(maestros);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = maestros.filter(maestro => 
      maestro.fullName.toLowerCase().includes(searchLower) ||
      maestro.email.toLowerCase().includes(searchLower)
    );
    setFilteredTeachers(filtered);
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(alumnos);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = alumnos.filter(alumno => 
      alumno.fullName.toLowerCase().includes(searchLower) ||
      alumno.registrationNumber.toLowerCase().includes(searchLower)
    );
    setFilteredStudents(filtered);
  };

  const handleGroupPageChange = (newPage: number) => {
    setCurrentGroupPage(newPage);
  };

  const handleTeacherPageChange = (newPage: number) => {
    setCurrentTeacherPage(newPage);
  };

  const handleStudentPageChange = (newPage: number) => {
    setCurrentStudentPage(newPage);
  };

  const handleStudentSelect = (student: Student) => {
    const studentId = student.id?.toString() || '';
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleViewAssignments = async (course: Course) => {
    if (!course.id) {
      toast.error('Error: ID de curso no válido');
      return;
    }

    setSelectedCourse(course);
    setOpenViewAssignmentsModal(true);
    try {
      const offset = (currentAssignmentPage - 1) * assignmentsPerPage;
      const response = await CourseService.getAssignments(course.id, assignmentsPerPage, offset);
      // Asegurarnos de que siempre sea un array
      const assignments = Array.isArray(response) ? response : [];
      setSelectedCourseAssignments(assignments);
    } catch (err) {
      console.error('Error al cargar las asignaciones:', err);
      toast.error('Error al cargar las asignaciones');
      setSelectedCourseAssignments([]);
    }
  };

  const handleAssignmentPageChange = (newPage: number) => {
    setCurrentAssignmentPage(newPage);
  };

  const handleViewTeacherAssignments = (teacher: User) => {
    setSelectedTeacher(teacher);
    setOpenViewTeacherAssignmentsModal(true);
    // Los datos ya vienen en el objeto teacher.coursesGroups
    setSelectedTeacherAssignments(teacher.coursesGroups || []);
    setCurrentTeacherAssignmentsPage(1);
  };

  const handleTeacherAssignmentsPageChange = (newPage: number) => {
    setCurrentTeacherAssignmentsPage(newPage);
  };

  const getPaginatedTeacherAssignments = () => {
    const startIndex = (currentTeacherAssignmentsPage - 1) * teacherAssignmentsPerPage;
    const endIndex = startIndex + teacherAssignmentsPerPage;
    return selectedTeacherAssignments.slice(startIndex, endIndex);
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await CourseService.deleteAssignment(assignmentId);
      toast.success('Asignación eliminada correctamente');
      setOpenDeleteAssignmentModal(false);
      setAssignmentToDelete(null);
      // Recargar las asignaciones
      if (selectedCourse?.id) {
        const offset = (currentAssignmentPage - 1) * assignmentsPerPage;
        const response = await CourseService.getAssignments(selectedCourse.id, assignmentsPerPage, offset);
        setSelectedCourseAssignments(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      console.error('Error al eliminar la asignación:', err);
      toast.error('Error al eliminar la asignación');
    }
  };

  const confirmDeleteAssignment = (assignment: any) => {
    setAssignmentToDelete(assignment);
    setOpenDeleteAssignmentModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de {showMaestros ? 'Maestros' : 'Asignaturas'}</h1>
            <p className="text-gray-600 text-base">Administra los {showMaestros ? 'maestros' : 'asignaturas'} académicos del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="view-mode">Asignaturas</Label>
              <Switch
                id="view-mode"
                checked={showMaestros}
                onCheckedChange={setShowMaestros}
              />
              <Label htmlFor="view-mode">Maestros</Label>
            </div>
            {!showMaestros && (
              <Button 
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-semibold" 
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva asignatura
              </Button>
            )}
            {showMaestros && (
              <Button 
                onClick={handleNewItem}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-semibold" 
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo maestro
              </Button>
            )}
          </div>
        </div>

        <Dialog open={open} onOpenChange={(isOpen: boolean) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? `Editar ${showMaestros ? 'maestro' : 'asignatura'}`
                  : `Agregar nuevo ${showMaestros ? 'maestro' : 'asignatura'}`
                }
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? `Modifica los campos del ${showMaestros ? 'maestro' : 'asignatura'}.`
                  : `Llena los campos para registrar un nuevo ${showMaestros ? 'maestro' : 'asignatura'}.`
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input 
                  id="nombre" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  placeholder={showMaestros ? "Ej. Juan Pérez" : "Ej. Matemáticas I"} 
                  required
                />
              </div>
              {showMaestros && (
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Ej. juan.perez@escuela.com" 
                    required
                  />
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                  disabled={showMaestros ? teacherLoading : courseLoading}
                >
                  {showMaestros ? (teacherLoading ? 'Guardando...' : 'Guardar') : (courseLoading ? 'Guardando...' : 'Guardar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el {showMaestros ? 'maestro' : 'asignatura'} "{itemToDelete ? (showMaestros ? (itemToDelete as User).fullName : (itemToDelete as Course).name) : ''}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpenDelete(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={showMaestros ? teacherLoading : courseLoading}
              >
                {showMaestros ? (teacherLoading ? 'Eliminando...' : 'Eliminar') : (courseLoading ? 'Eliminando...' : 'Eliminar')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-900">{showMaestros ? 'Maestros' : 'Asignaturas'} registrados</CardTitle>
            <CardDescription>Consulta, edita o elimina los {showMaestros ? 'maestros' : 'asignaturas'} académicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre Completo</TableHead>
                    {showMaestros && <TableHead className="font-semibold">Email</TableHead>}
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showMaestros ? (
                    maestros.map((maestro) => (
                      <TableRow key={maestro.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{maestro.fullName}</TableCell>
                        <TableCell>{maestro.email}</TableCell>
                        <TableCell className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Ver Asignaciones"
                            onClick={() => handleViewTeacherAssignments(maestro)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Editar"
                            onClick={() => handleEdit(maestro)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            title="Eliminar"
                            onClick={() => handleDelete(maestro)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    asignaturas.map((asignatura) => (
                      <TableRow key={asignatura.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{asignatura.name}</TableCell>
                        <TableCell className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Ver Asignaciones"
                            onClick={() => handleViewAssignments(asignatura)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Asignar Grupo y Maestro"
                            onClick={() => handleAssignClick(asignatura)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Editar"
                            onClick={() => handleEdit(asignatura)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            title="Eliminar"
                            onClick={() => handleDelete(asignatura)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {showMaestros ? maestros.length : asignaturas.length} de {showMaestros ? teacherTotalItems : courseTotalItems} {showMaestros ? 'maestros' : 'asignaturas'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Página {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={maestros.length < itemsPerPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={openAssignModal} onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetAssignmentModal();
            setSearchTerm("");
          }
          setOpenAssignModal(isOpen);
        }}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Asignar Grupo, Maestro y Alumnos a {selectedCourse?.name}</DialogTitle>
              <DialogDescription>
                Selecciona un grupo, un maestro y opcionalmente alumnos para esta asignatura
              </DialogDescription>
              <div className="flex items-center justify-center space-x-4 mt-4">
                <div className={`flex items-center space-x-2 ${currentStep === 'groups' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 'groups' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    1
                  </div>
                  <span className="text-sm">Grupo</span>
                </div>
                <div className={`w-8 h-0.5 ${currentStep === 'teachers' || currentStep === 'students' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'teachers' ? 'text-blue-600' : currentStep === 'students' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 'teachers' || currentStep === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <span className="text-sm">Maestro</span>
                </div>
                <div className={`w-8 h-0.5 ${currentStep === 'students' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'students' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    3
                  </div>
                  <span className="text-sm">Alumnos</span>
                </div>
              </div>
            </DialogHeader>

            <div className="relative flex-1 overflow-hidden">
              <div className={`absolute inset-0 transition-transform duration-300 ${currentStep === 'groups' ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Selecciona un Grupo</h3>
                    <div className="w-64">
                      <Input
                        placeholder="Buscar grupo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nombre del Grupo</TableHead>
                          <TableHead>Período</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grupos.map((grupo) => (
                          <TableRow 
                            key={grupo.id}
                            className={`cursor-pointer hover:bg-gray-50 ${selectedGroup?.id === grupo.id ? 'bg-gray-50' : ''}`}
                            onClick={() => handleGroupSelect(grupo)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedGroup?.id === grupo.id}
                                onCheckedChange={() => handleGroupSelect(grupo)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{grupo.name}</TableCell>
                            <TableCell>{grupo.period?.name || 'No asignado'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {grupos.length} grupos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGroupPageChange(currentGroupPage - 1)}
                        disabled={currentGroupPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Página {currentGroupPage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGroupPageChange(currentGroupPage + 1)}
                        disabled={grupos.length < itemsPerPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`absolute inset-0 transition-transform duration-300 ${currentStep === 'teachers' ? 'translate-x-0' : currentStep === 'groups' ? 'translate-x-full' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep('groups')}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                      <h3 className="text-lg font-semibold">Selecciona un Maestro</h3>
                    </div>
                    <div className="w-64">
                      <Input
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Correo Electrónico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeachers.map((maestro) => (
                          <TableRow 
                            key={maestro.id}
                            className={`cursor-pointer hover:bg-gray-50 ${selectedTeacher?.id === maestro.id ? 'bg-gray-50' : ''}`}
                            onClick={() => handleTeacherSelect(maestro)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedTeacher?.id === maestro.id}
                                onCheckedChange={() => handleTeacherSelect(maestro)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{maestro.fullName}</TableCell>
                            <TableCell>{maestro.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {filteredTeachers.length} maestros
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTeacherPageChange(currentTeacherPage - 1)}
                        disabled={currentTeacherPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Página {currentTeacherPage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTeacherPageChange(currentTeacherPage + 1)}
                        disabled={filteredTeachers.length < itemsPerPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`absolute inset-0 transition-transform duration-300 ${currentStep === 'students' ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep('teachers')}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                      <h3 className="text-lg font-semibold">
                        Selecciona Alumnos (Opcional)
                        {selectedStudents.size > 0 && (
                          <span className="ml-2 text-sm text-blue-600 font-normal">
                            ({selectedStudents.size} seleccionado{selectedStudents.size !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="w-64">
                      <Input
                        placeholder="Buscar por nombre o matrícula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Matrícula</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((alumno) => (
                          <TableRow 
                            key={alumno.id}
                            className={`cursor-pointer hover:bg-gray-50 ${selectedStudents.has(alumno.id?.toString() || '') ? 'bg-gray-50' : ''}`}
                            onClick={() => handleStudentSelect(alumno)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.has(alumno.id?.toString() || '')}
                                onCheckedChange={() => handleStudentSelect(alumno)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{alumno.fullName}</TableCell>
                            <TableCell>{alumno.registrationNumber}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {filteredStudents.length} alumnos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStudentPageChange(currentStudentPage - 1)}
                        disabled={currentStudentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Página {currentStudentPage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStudentPageChange(currentStudentPage + 1)}
                        disabled={filteredStudents.length < itemsPerPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-4">
              {(currentStep === 'teachers' || currentStep === 'students') && (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Horario de la clase</Label>
                    <Input
                      id="schedule"
                      placeholder="Ej: 8:00 - 9:00"
                      value={schedule}
                      onChange={handleScheduleChange}
                      className={scheduleError ? "border-red-500" : ""}
                    />
                    {scheduleError && (
                      <p className="text-sm text-red-500">{scheduleError}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setOpenAssignModal(false)}>
                  Cancelar
                </Button>
                {(currentStep === 'teachers' || currentStep === 'students') && (
                  <Button 
                    onClick={handleConfirmAssignment}
                    className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                    disabled={!selectedTeacher || !!scheduleError}
                  >
                    Confirmar Asignación
                    {currentStep === 'students' && selectedStudents.size > 0 && (
                      <span className="ml-2 text-xs">
                        ({selectedStudents.size} alumno{selectedStudents.size !== 1 ? 's' : ''})
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openViewAssignmentsModal} onOpenChange={setOpenViewAssignmentsModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Asignaciones de {selectedCourse?.name}</DialogTitle>
              <DialogDescription>
                Grupos y maestros asignados a esta asignatura
              </DialogDescription>
            </DialogHeader>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Maestro</TableHead>
                    <TableHead>Correo del Maestro</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(selectedCourseAssignments) && selectedCourseAssignments.length > 0 ? (
                    selectedCourseAssignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{assignment.group?.name || 'N/A'}</TableCell>
                        <TableCell>{assignment.group?.period?.name || 'No asignado'}</TableCell>
                        <TableCell>{assignment.user?.fullName || 'N/A'}</TableCell>
                        <TableCell>{assignment.user?.email || 'N/A'}</TableCell>
                        <TableCell>{assignment.schedule || 'No asignado'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            title="Eliminar asignación"
                            onClick={() => confirmDeleteAssignment(assignment)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No hay asignaciones registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {selectedCourseAssignments.length} asignaciones
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignmentPageChange(currentAssignmentPage - 1)}
                  disabled={currentAssignmentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Página {currentAssignmentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignmentPageChange(currentAssignmentPage + 1)}
                  disabled={selectedCourseAssignments.length < assignmentsPerPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setOpenViewAssignmentsModal(false);
                setCurrentAssignmentPage(1);
              }}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openViewTeacherAssignmentsModal} onOpenChange={setOpenViewTeacherAssignmentsModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Asignaciones de {selectedTeacher?.fullName}</DialogTitle>
              <DialogDescription>
                Grupos y asignaturas asignadas a este maestro
              </DialogDescription>
            </DialogHeader>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Horario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTeacherAssignments.length > 0 ? (
                    getPaginatedTeacherAssignments().map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{assignment.course?.name || 'N/A'}</TableCell>
                        <TableCell>{assignment.group?.name || 'N/A'}</TableCell>
                        <TableCell>{assignment.group?.period?.name || 'No asignado'}</TableCell>
                        <TableCell>{assignment.schedule || 'No asignado'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No hay asignaciones registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {getPaginatedTeacherAssignments().length} de {selectedTeacherAssignments.length} asignaciones
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTeacherAssignmentsPageChange(currentTeacherAssignmentsPage - 1)}
                  disabled={currentTeacherAssignmentsPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Página {currentTeacherAssignmentsPage} de {Math.ceil(selectedTeacherAssignments.length / teacherAssignmentsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTeacherAssignmentsPageChange(currentTeacherAssignmentsPage + 1)}
                  disabled={currentTeacherAssignmentsPage >= Math.ceil(selectedTeacherAssignments.length / teacherAssignmentsPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenViewTeacherAssignmentsModal(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDeleteAssignmentModal} onOpenChange={setOpenDeleteAssignmentModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la asignación del grupo "{assignmentToDelete?.group?.name}" con el maestro "{assignmentToDelete?.user?.fullName}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenDeleteAssignmentModal(false);
                  setAssignmentToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteAssignment(assignmentToDelete?.id)}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
