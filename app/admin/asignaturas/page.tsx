"use client"

import { Course, User, Group, Student } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Users, UserPlus, Upload, FileSpreadsheet } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
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
import { studentService } from '@/lib/services/student.service';
// Importación dinámica de xlsx para evitar problemas de tipos
const XLSX = require('xlsx');

interface ImportedStudent {
  numero: string;
  matricula: string;
  nombre: string;
  isValid: boolean;
}

export default function AsignaturasPage() {
  const router = useRouter();
  const { loading: courseLoading, error: courseError, totalItems: courseTotalItems, handleGetCourses, handleCreateCourse, handleUpdateCourse, handleDeleteCourse, clearCache } = useCourse();
  const { loading: teacherLoading, error: teacherError, totalItems: teacherTotalItems, handleGetTeachers, handleCreateTeacher, handleUpdateTeacher, handleDeleteTeacher } = useTeacher();
  const { handleGetGroups } = useGroup();
  const { loading: studentLoading, error: studentError, totalItems: studentTotalItems, handleGetStudents, handleGetStudentsByGroup, handleGetStudentsNotInCourseGroup } = useStudent();
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


  const [openViewTeacherAssignmentsModal, setOpenViewTeacherAssignmentsModal] = useState(false);
  const [selectedTeacherAssignments, setSelectedTeacherAssignments] = useState<any[]>([]);
  const [currentTeacherAssignmentsPage, setCurrentTeacherAssignmentsPage] = useState(1);
  const teacherAssignmentsPerPage = 5;
  const [openDeleteAssignmentModal, setOpenDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);
  const [openViewStudentsModal, setOpenViewStudentsModal] = useState(false);
  const [selectedCourseGroupStudents, setSelectedCourseGroupStudents] = useState<Student[]>([]);
  const [selectedCourseGroupForStudents, setSelectedCourseGroupForStudents] = useState<any>(null);
  const [currentStudentsPage, setCurrentStudentsPage] = useState(1);
  const studentsPerPage = 10;
  const [totalStudents, setTotalStudents] = useState(0);
  const [allCourseGroupStudents, setAllCourseGroupStudents] = useState<Student[]>([]);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Variables para el modal de asignación de alumnos a CourseGroup
  const [openAssignStudentsModal, setOpenAssignStudentsModal] = useState(false);
  const [selectedCourseGroupForAssignment, setSelectedCourseGroupForAssignment] = useState<any>(null);
  const [studentsForAssignment, setStudentsForAssignment] = useState<Student[]>([]);
  const [filteredStudentsForAssignment, setFilteredStudentsForAssignment] = useState<Student[]>([]);
  const [selectedStudentsForAssignment, setSelectedStudentsForAssignment] = useState<Set<string>>(new Set());
  const [searchTermForAssignment, setSearchTermForAssignment] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignedStudentsToCourseGroup, setAssignedStudentsToCourseGroup] = useState<Student[]>([]);
  const [importedStudentsForSelection, setImportedStudentsForSelection] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(1);
  const [totalAssignmentStudents, setTotalAssignmentStudents] = useState(0);
  const assignmentStudentsPerPage = 50;

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
  }, [searchTerm, grupos, maestros, alumnos, importedStudentsForSelection]);

  // useEffect para logging del estado de estudiantes
  useEffect(() => {
    if (currentStep === 'students') {
      // Estado de estudiantes actualizado
    }
  }, [alumnos, filteredStudents, currentStep, importedStudentsForSelection]);

  // useEffect para cargar alumnos cuando se cambia al paso de estudiantes
  useEffect(() => {
    if (currentStep === 'students') {
      loadStudents();
    }
  }, [currentStep]);

  // useEffect específico para manejar cambios en alumnos importados
  useEffect(() => {
    if (importedStudentsForSelection.length > 0) {
      setFilteredStudents(importedStudentsForSelection);
    }
  }, [importedStudentsForSelection]);

  useEffect(() => {
    if (openViewAssignmentsModal && selectedCourse?.id) {
      loadAssignmentsForCourse();
    }
  }, [openViewAssignmentsModal, selectedCourse?.id]);

  useEffect(() => {
    if (openViewStudentsModal && selectedCourseGroupForStudents?.id) {
      loadStudentsForCourseGroup();
    }
  }, [currentStudentsPage, openViewStudentsModal, selectedCourseGroupForStudents?.id, allCourseGroupStudents]);

  // Removido el useEffect problemático que causaba bucles infinitos

  useEffect(() => {
    if (openAssignStudentsModal) {
      filterStudentsForAssignment();
    }
  }, [searchTermForAssignment]);

  useEffect(() => {
    if (openAssignStudentsModal && selectedCourseGroupForAssignment?.id) {
      // Usar la nueva función que maneja la paginación ordenada
      loadStudentsForAssignmentWithId(selectedCourseGroupForAssignment.id, assignedStudentsToCourseGroup);
    }
  }, [currentAssignmentPage, searchTermForAssignment, openAssignStudentsModal, selectedCourseGroupForAssignment?.id]);

  const loadItems = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      if (showMaestros) {
        const response = await handleGetTeachers(itemsPerPage, offset);
        if (response && response.users) {
          setMaestros(response.users);
          setFilteredTeachers(response.users);
        } else if (Array.isArray(response)) {
          setMaestros(response);
          setFilteredTeachers(response);
        }
      } else {
        const response = await handleGetCourses(itemsPerPage, offset);
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
      
      const response = await handleGetGroups(itemsPerPage, offset);
      
      // El hook useGroup ahora retorna { groups: Group[], total: number }
      if (response && response.groups) {
        setGrupos(response.groups);
      } else if (Array.isArray(response)) {
        // Fallback para compatibilidad
        setGrupos(response);
      } else {
        setGrupos([]);
      }
    } catch (err) {
      console.error('Error al cargar los grupos:', err);
      setGrupos([]);
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
      if (data && data.users) {
        setMaestros(data.users);
      } else if (Array.isArray(data)) {
        setMaestros(data);
      } else {
        setMaestros([]);
      }
    } catch (err) {
      console.error('Error al cargar los maestros:', err);
    }
  };

  const loadStudents = async () => {
    try {
      // Si hay alumnos importados, no cargar nada del servidor
      if (importedStudentsForSelection.length > 0) {
        return;
      }

      // Si estamos en el paso de estudiantes y hay un grupo seleccionado,
      // cargar solo los alumnos de ese grupo
      if (currentStep === 'students' && selectedGroup?.id) {
        const offset = (currentStudentPage - 1) * itemsPerPage;
        const data = await handleGetStudentsByGroup(selectedGroup.id, itemsPerPage, offset);
        const processedData = Array.isArray(data) ? data : [];
        setAlumnos(processedData);
      } else {
        // Si no hay grupo seleccionado, cargar todos los alumnos
        const offset = (currentStudentPage - 1) * itemsPerPage;
        const response = await handleGetStudents(itemsPerPage, offset);
        
        // Manejar la nueva estructura del endpoint
        let students: Student[] = [];
        if (response && typeof response === 'object') {
          if (response.students && Array.isArray(response.students)) {
            students = response.students;
          } else if (Array.isArray(response)) {
            // Fallback para compatibilidad
            students = response;
          }
        }
        
        setAlumnos(students);
      }
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



  const handleConfirmAssignment = async () => {
    if (!selectedCourse || !selectedGroup || !selectedTeacher) {
      toast.error('Debes seleccionar un grupo y un maestro');
      return;
    }

    const assignmentData = {
      courseId: selectedCourse.id,
      groupId: selectedGroup.id,
      userId: selectedTeacher.id
    };

    try {
      // Crear el CourseGroup
      const courseGroupResponse = await CourseService.assignGroup(assignmentData);
      
      // Asignar estudiantes si se seleccionaron
      if (selectedStudents.size > 0) {
        const studentIds = Array.from(selectedStudents);
        
        let courseGroupId = null;

        if (typeof courseGroupResponse === 'number') {
          courseGroupId = courseGroupResponse;
        } else if (courseGroupResponse && typeof courseGroupResponse === 'object') {
          if (courseGroupResponse.id) {
            courseGroupId = courseGroupResponse.id;
          } else if (courseGroupResponse.courseGroup?.id) {
            courseGroupId = courseGroupResponse.courseGroup.id;
          } else if (courseGroupResponse.data?.id) {
            courseGroupId = courseGroupResponse.data.id;
          } else {
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
        }
        
        if (courseGroupId) {
          let assignedCount = 0;
          let errorCount = 0;
          
          for (const studentId of studentIds) {
            try {
              await CourseService.assignStudentToCourseGroup(courseGroupId, parseInt(studentId));
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
    setImportedStudentsForSelection([]);
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
    // Determinar qué lista de alumnos usar
    const studentsToFilter = importedStudentsForSelection.length > 0 ? importedStudentsForSelection : alumnos;
    
    if (!searchTerm) {
      setFilteredStudents(studentsToFilter);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = studentsToFilter.filter(alumno => 
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

  const handleSelectAllStudents = () => {
    const allStudentIds = filteredStudents.map(student => student.id?.toString() || '');
    setSelectedStudents(new Set(allStudentIds));
  };

  const handleDeselectAllStudents = () => {
    setSelectedStudents(new Set());
  };

  const loadAssignmentsForCourse = async () => {
    if (!selectedCourse?.id) return;
    
    try {
      const response = await CourseService.getAssignments(selectedCourse.id, 1000, 0);
      
      let assignments = [];
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        assignments = response;
      } else if (response && typeof response === 'object') {
        if (response.items && Array.isArray(response.items)) {
          assignments = response.items;
        } else if (response.data && Array.isArray(response.data)) {
          assignments = response.data;
        } else {
          assignments = [];
        }
      }
      
      setSelectedCourseAssignments(assignments);
    } catch (err) {
      console.error('Error al cargar las asignaciones:', err);
      toast.error('Error al cargar las asignaciones');
      setSelectedCourseAssignments([]);
    }
  };

  const handleViewAssignments = async (course: Course) => {
    if (!course.id) {
      toast.error('Error: ID de curso no válido');
      return;
    }

    setSelectedCourse(course);
    setOpenViewAssignmentsModal(true);
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
        const response = await CourseService.getAssignments(selectedCourse.id, 1000, 0);
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

  const loadStudentsForCourseGroup = async () => {
    if (!selectedCourseGroupForStudents?.id) return;
    
    try {
      // Si es la primera vez que se carga, obtener todos los estudiantes
      if (allCourseGroupStudents.length === 0) {
        const response = await CourseService.getStudentsByCourseGroup(selectedCourseGroupForStudents.id, 1000, 0);
        
        let students = [];
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(response)) {
          students = response;
        } else if (response && typeof response === 'object') {
          if (response.items && Array.isArray(response.items)) {
            students = response.items;
          } else if (response.data && Array.isArray(response.data)) {
            students = response.data;
          } else {
            students = [];
          }
        }
        
        // Extraer los objetos Student de la respuesta (pueden venir anidados)
        const processedStudents = students.map((item: any) => {
          const student = (typeof item === 'object' && item !== null && item.student) ? item.student : item;
          return student;
        });
        
        setAllCourseGroupStudents(processedStudents);
        setTotalStudents(processedStudents.length);
      }
      
      // Aplicar paginación del lado del cliente
      const startIndex = (currentStudentsPage - 1) * studentsPerPage;
      const endIndex = startIndex + studentsPerPage;
      const paginatedStudents = allCourseGroupStudents.slice(startIndex, endIndex);
      
      setSelectedCourseGroupStudents(paginatedStudents);
      
    } catch (err) {
      console.error('Error al cargar los estudiantes:', err);
      toast.error('Error al cargar los estudiantes');
      setSelectedCourseGroupStudents([]);
      setTotalStudents(0);
      setAllCourseGroupStudents([]);
    }
  };

  const handleViewStudents = async (assignment: any) => {
    if (!assignment.id) {
      toast.error('Error: ID de asignación no válido');
      return;
    }

    setSelectedCourseGroupForStudents(assignment);
    setOpenViewStudentsModal(true);
    setCurrentStudentsPage(1);
    setAllCourseGroupStudents([]); // Limpiar para forzar recarga
  };

  const handleStudentsPageChange = (newPage: number) => {
    setCurrentStudentsPage(newPage);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // Buscar la primera fila que contenga los encabezados correctos
        let headerRowIndex = 0;
        const headerKeywords = ['MATRICULA', 'NOMBRE', 'NO', 'NO.'];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] || [];
          const rowString = row.map((cell: any) => (cell ? cell.toString().toUpperCase() : '')).join(' ');
          if (headerKeywords.every(keyword => rowString.includes(keyword))) {
            headerRowIndex = i;
            break;
          }
        }
        const headers = jsonData[headerRowIndex] as string[];
        const dataRows = jsonData.slice(headerRowIndex + 1);

        // Validación robusta de headers
        const requiredHeaders = [
          { key: 'numero', variants: ['NO.', 'NO', 'NÚMERO', 'NUMERO'] },
          { key: 'matricula', variants: ['MATRICULA', 'MATRÍCULA', 'MATRICULA '] },
          { key: 'nombre', variants: ['NOMBRE', 'NOMBRE '] }
        ];

        const headerMap: Record<string, number> = {};
        headers.forEach((header, idx) => {
          const normalized = header?.toString().toUpperCase().replace(/[^A-Z0-9.ÁÉÍÓÚÜÑ]/g, '').trim();
          requiredHeaders.forEach(req => {
            if (req.variants.some(variant => normalized === variant.replace(/[^A-Z0-9.ÁÉÍÓÚÜÑ]/g, '').trim())) {
              headerMap[req.key] = idx;
            }
          });
        });

        const missing = requiredHeaders.filter(req => headerMap[req.key] === undefined).map(req => req.variants[0]);
        if (missing.length > 0) {
          toast.error(`Columnas faltantes: ${missing.join(', ')}`);
          return;
        }

        // Procesar los datos usando el headerMap y dataRows
        const processedStudents = dataRows.map((row: any) => ({
          numero: row[headerMap['numero']]?.toString() || '',
          matricula: row[headerMap['matricula']]?.toString() || '',
          nombre: row[headerMap['nombre']]?.toString() || '',
          isValid: row[headerMap['matricula']] && row[headerMap['nombre']]
        })).filter((student: ImportedStudent) => student.isValid);

        if (processedStudents.length === 0) {
          toast.error('No se encontraron datos válidos en el archivo');
          return;
        }

        setImportedStudents(processedStudents);
        toast.success(`${processedStudents.length} alumnos importados correctamente`);
        setOpenImportModal(true);
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        toast.error('Error al procesar el archivo Excel');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportStudents = async () => {
    if (importedStudents.length === 0) {
      toast.error('No hay alumnos para importar');
      return;
    }

    setImportLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const successfullyImportedStudents: Student[] = [];

      for (const student of importedStudents) {
        try {
          // Mapear los datos del Excel a la estructura de la API
          const studentData = {
            fullName: student.nombre,        // Columna NOMBRE del Excel
            registrationNumber: student.matricula  // Columna MATRICULA del Excel
          };

          // Llamar a la API para crear el estudiante
          const createdStudent = await studentService.createStudent(studentData);
          successfullyImportedStudents.push(createdStudent);
          
          successCount++;
        } catch (error) {
          console.error('Error al crear estudiante:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} alumnos importados correctamente`);
        // Guardar los alumnos importados para mostrarlos en el modal de asignación
        setImportedStudentsForSelection(successfullyImportedStudents);
        // Actualizar el estado de alumnos en el modal de asignación
        setAlumnos(successfullyImportedStudents);
        // No actualizar filteredStudents aquí, dejar que el useEffect lo haga
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} alumnos no se pudieron importar`);
      }

      setOpenImportModal(false);
      setImportedStudents([]);
      
      // Recargar la lista de estudiantes
      await loadStudents();
      
    } catch (error) {
      console.error('Error en la importación:', error);
      toast.error('Error al importar los alumnos');
    } finally {
      setImportLoading(false);
    }
  };

  // Funciones para asignar alumnos a un CourseGroup específico
  const loadAssignedStudentsToCourseGroup = async (courseGroupId: number): Promise<Student[]> => {
    try {
      const response = await CourseService.getStudentsByCourseGroup(courseGroupId, 1000, 0);
      
      let students = [];
      
      if (Array.isArray(response)) {
        students = response;
      } else if (response && typeof response === 'object') {
        if (response.items && Array.isArray(response.items)) {
          students = response.items;
        } else if (response.data && Array.isArray(response.data)) {
          students = response.data;
        }
      }
      
      // Extraer los objetos Student de la respuesta (pueden venir anidados)
      const assignedStudents = students.map((item: any) => {
        const student = (typeof item === 'object' && item !== null && item.student) ? item.student : item;
        return student;
      });
      
      setAssignedStudentsToCourseGroup(assignedStudents);
      return assignedStudents;
    } catch (err) {
      console.error('Error al cargar los alumnos asignados:', err);
      setAssignedStudentsToCourseGroup([]);
      return [];
    }
  };

  const loadStudentsForAssignmentWithId = async (courseGroupId: number, assignedStudents: Student[]) => {
    try {
      setStudentsLoading(true);
      
      // Cargar estudiantes usando el endpoint específico para estudiantes no asignados
      const offset = (currentAssignmentPage - 1) * assignmentStudentsPerPage;
      
      const response = await handleGetStudentsNotInCourseGroup(
        courseGroupId, 
        assignmentStudentsPerPage, 
        offset,
        searchTermForAssignment || undefined
      );
      
      console.log('Respuesta del endpoint getStudentsNotInCourseGroup:', response);
      
      // Manejar la nueva estructura del endpoint
      let students: Student[] = [];
      let total = 0;
      let limit = assignmentStudentsPerPage;
      let responseOffset = offset;
      
      if (response && typeof response === 'object') {
        if (response.students && Array.isArray(response.students)) {
          students = response.students;
          total = response.total || 0;
          limit = response.limit || assignmentStudentsPerPage;
          responseOffset = response.offset || offset;
        } else if (Array.isArray(response)) {
          // Fallback para compatibilidad
          students = response;
          total = response.length;
        }
      }
      
      // Actualizar el total de estudiantes
      setTotalAssignmentStudents(total);
      
      // Guardar los alumnos de la página actual (manteniendo el orden del servidor)
      setStudentsForAssignment(students);
      setFilteredStudentsForAssignment(students);
    } catch (err) {
      console.error('Error al cargar los alumnos para asignación:', err);
      toast.error('Error al cargar los alumnos');
      setStudentsForAssignment([]);
      setFilteredStudentsForAssignment([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleAssignStudentsToCourseGroup = async (assignment: any) => {
    setSelectedCourseGroupForAssignment(assignment);
    setOpenAssignStudentsModal(true);
    setSearchTermForAssignment("");
    setSelectedStudentsForAssignment(new Set());
    setCurrentAssignmentPage(1); // Resetear a la primera página
    
    try {
      // Cargar los alumnos asignados al CourseGroup primero
      const assignedStudents = await loadAssignedStudentsToCourseGroup(assignment.id);
      
      // Establecer el estado antes de cargar los estudiantes
      setAssignedStudentsToCourseGroup(assignedStudents);
      
      // Luego cargar todos los alumnos y filtrar los no asignados
      // Usar assignment.id directamente en lugar de selectedCourseGroupForAssignment
      await loadStudentsForAssignmentWithId(assignment.id, assignedStudents);
    } catch (error) {
      console.error('Error al cargar datos para asignación:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const loadStudentsForAssignment = async (assignedStudents: Student[]) => {
    try {
      setStudentsLoading(true);
      
      if (!selectedCourseGroupForAssignment?.id) {
        console.error('No hay courseGroup seleccionado');
        return;
      }
      
      // Cargar estudiantes usando el endpoint específico para estudiantes no asignados
      const offset = (currentAssignmentPage - 1) * assignmentStudentsPerPage;
      const response = await handleGetStudentsNotInCourseGroup(
        selectedCourseGroupForAssignment.id, 
        assignmentStudentsPerPage, 
        offset,
        searchTermForAssignment || undefined
      );
      
      console.log('Respuesta del endpoint getStudentsNotInCourseGroup:', response);
      
      // Manejar la nueva estructura del endpoint
      let students: Student[] = [];
      let total = 0;
      
      if (response && typeof response === 'object') {
        if (response.students && Array.isArray(response.students)) {
          students = response.students;
          total = response.total || 0;
        } else if (Array.isArray(response)) {
          // Fallback para compatibilidad
          students = response;
          total = response.length;
        }
      }
      
      // Actualizar el total de estudiantes
      setTotalAssignmentStudents(total);
      
      // Guardar los alumnos de la página actual
      setStudentsForAssignment(students);
      setFilteredStudentsForAssignment(students);
    } catch (err) {
      console.error('Error al cargar los alumnos para asignación:', err);
      toast.error('Error al cargar los alumnos');
      setStudentsForAssignment([]);
      setFilteredStudentsForAssignment([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const filterStudentsForAssignment = () => {
    // Con el nuevo endpoint, la búsqueda se maneja en el servidor
    // Solo necesitamos recargar los datos cuando cambie el término de búsqueda
    if (openAssignStudentsModal && selectedCourseGroupForAssignment?.id) {
      // Resetear a la primera página cuando se busca
      setCurrentAssignmentPage(1);
      // La carga se hará en el useEffect que observa currentAssignmentPage
    }
  };

  const handleStudentAssignmentSelect = (student: Student) => {
    const studentId = student.id?.toString() || '';
    setSelectedStudentsForAssignment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAllStudentsForAssignment = () => {
    const allStudentIds = filteredStudentsForAssignment.map(student => student.id?.toString() || '');
    setSelectedStudentsForAssignment(new Set(allStudentIds));
  };

  const handleDeselectAllStudentsForAssignment = () => {
    setSelectedStudentsForAssignment(new Set());
  };

  // Función eliminada ya que no necesitamos paginación en el modal de asignación de alumnos

  const handleConfirmStudentsAssignment = async () => {
    if (!selectedCourseGroupForAssignment?.id) {
      toast.error('Error: No se pudo obtener el ID del grupo');
      return;
    }

    if (selectedStudentsForAssignment.size === 0) {
      toast.error('Debes seleccionar al menos un alumno');
      return;
    }

    setAssignmentLoading(true);
    try {
      const studentIds = Array.from(selectedStudentsForAssignment);
      let assignedCount = 0;
      let errorCount = 0;
      
      for (const studentId of studentIds) {
                  try {
            await CourseService.assignStudentToCourseGroup(selectedCourseGroupForAssignment.id, parseInt(studentId));
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

      setOpenAssignStudentsModal(false);
      resetStudentsAssignmentModal();
      
      // Recargar las asignaciones si el modal de asignaciones está abierto
      if (openViewAssignmentsModal && selectedCourse?.id) {
        await loadAssignmentsForCourse();
      }
      
    } catch (err) {
      console.error('Error al asignar estudiantes:', err);
      toast.error('Error al asignar los estudiantes');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const resetStudentsAssignmentModal = () => {
    setSelectedCourseGroupForAssignment(null);
    setSelectedStudentsForAssignment(new Set());
    setSearchTermForAssignment("");
    setStudentsForAssignment([]);
    setFilteredStudentsForAssignment([]);
    setAssignedStudentsToCourseGroup([]);
    setStudentsLoading(false);
    setCurrentAssignmentPage(1);
    setTotalAssignmentStudents(0);
  };

  const handleAssignmentPageChange = (newPage: number) => {
    setCurrentAssignmentPage(newPage);
    // Los datos se recargarán automáticamente por el useEffect
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
                  disabled={currentPage >= Math.ceil((showMaestros ? teacherTotalItems : courseTotalItems) / itemsPerPage)}
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
                Selecciona un grupo, un maestro y opcionalmente alumnos del grupo seleccionado para esta asignatura
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
                  <div className="border rounded-lg flex-1 overflow-auto min-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nombre del Grupo</TableHead>
                          <TableHead>Período</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGroups.map((grupo) => (
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
                      Mostrando {filteredGroups.length} grupos
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
                        disabled={filteredGroups.length < itemsPerPage}
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
                  <div className="border rounded-lg flex-1 overflow-auto min-h-[300px]">
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
                        Selecciona Alumnos {importedStudentsForSelection.length > 0 ? 'Importados' : `del Grupo ${selectedGroup?.name}`} (Opcional)
                        {selectedStudents.size > 0 && (
                          <span className="ml-2 text-sm text-blue-600 font-normal">
                            ({selectedStudents.size} seleccionado{selectedStudents.size !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {importedStudentsForSelection.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImportedStudentsForSelection([]);
                            // Recargar los alumnos del grupo
                            if (selectedGroup?.id) {
                              loadStudents();
                            }
                            // Limpiar también filteredStudents para que se recargue
                            setFilteredStudents([]);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Ver alumnos del grupo
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOpenImportModal(true);
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Importar alumnos
                      </Button>
                      <div className="w-64">
                        <Input
                          placeholder="Buscar por nombre o matrícula..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {selectedStudents.size > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeselectAllStudents}
                        >
                          Deseleccionar todos
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllStudents}
                        >
                          Seleccionar todos
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedStudents.size > 0 && (
                        <span>
                          {selectedStudents.size} de {filteredStudents.length} alumnos {importedStudentsForSelection.length > 0 ? 'importados' : 'del grupo seleccionado'}{selectedStudents.size !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg flex-1 overflow-auto min-h-[300px]">
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
                      Mostrando {filteredStudents.length} alumnos {importedStudentsForSelection.length > 0 ? 'importados' : `del grupo ${selectedGroup?.name}`}
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
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setOpenAssignModal(false)}>
                  Cancelar
                </Button>
                {(currentStep === 'teachers' || currentStep === 'students') && (
                  <Button 
                    onClick={handleConfirmAssignment}
                    className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                    disabled={!selectedTeacher}
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
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Asignaciones de {selectedCourse?.name}</DialogTitle>
              <DialogDescription>
                Grupos y maestros asignados a esta asignatura
              </DialogDescription>
            </DialogHeader>

            <div className="border rounded-lg flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Maestro</TableHead>
                    <TableHead>Correo del Maestro</TableHead>
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
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="icon"
                              title="Ver alumnos asignados"
                              onClick={() => handleViewStudents(assignment)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Asignar alumnos"
                              onClick={() => handleAssignStudentsToCourseGroup(assignment)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              title="Eliminar asignación"
                              onClick={() => confirmDeleteAssignment(assignment)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No hay asignaciones registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>



            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setOpenViewAssignmentsModal(false);
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTeacherAssignments.length > 0 ? (
                    getPaginatedTeacherAssignments().map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{assignment.course?.name || 'N/A'}</TableCell>
                        <TableCell>{assignment.group?.name || 'N/A'}</TableCell>
                        <TableCell>{assignment.group?.period?.name || 'No asignado'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
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

        <Dialog open={openViewStudentsModal} onOpenChange={setOpenViewStudentsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Alumnos asignados a {selectedCourseGroupForStudents?.group?.name}</DialogTitle>
              <DialogDescription>
                Lista de alumnos asignados al grupo {selectedCourseGroupForStudents?.group?.name} en la asignatura {selectedCourse?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="border rounded-lg flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCourseGroupStudents.length > 0 ? (
                    selectedCourseGroupStudents.map((studentObj: any, index: number) => {
                      // Si viene anidado en student
                      const alumno = (typeof studentObj === 'object' && studentObj !== null && (studentObj as any).student) ? (studentObj as any).student : studentObj;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{alumno.fullName}</TableCell>
                          <TableCell>{alumno.registrationNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Asignado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No hay alumnos asignados a este grupo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {selectedCourseGroupStudents.length} de {totalStudents} alumnos
              </div>
              <div className="flex items-center gap-2">
                                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStudentsPageChange(currentStudentsPage - 1);
                    }}
                    disabled={currentStudentsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Página {currentStudentsPage} de {Math.ceil(totalStudents / studentsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStudentsPageChange(currentStudentsPage + 1);
                    }}
                    disabled={currentStudentsPage >= Math.ceil(totalStudents / studentsPerPage)}
                  >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setOpenViewStudentsModal(false);
                setCurrentStudentsPage(1);
                setSelectedCourseGroupStudents([]);
                setSelectedCourseGroupForStudents(null);
                setTotalStudents(0);
                setAllCourseGroupStudents([]); // Limpiar todos los estudiantes
              }}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Importación de Alumnos */}
        <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Importar Alumnos desde Excel</DialogTitle>
              <DialogDescription>
                Sube un archivo Excel (.xlsx) con las columnas: No., MATRICULA, NOMBRE
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo Excel
                </Button>
                <p className="text-sm text-gray-600">
                  Formatos soportados: .xlsx, .xls
                </p>
              </div>

              {importedStudents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      Alumnos a importar ({importedStudents.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportedStudents([])}
                    >
                      Limpiar
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg max-h-60 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No.</TableHead>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Nombre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importedStudents.map((student, index) => (
                          <TableRow key={index}>
                            <TableCell>{student.numero}</TableCell>
                            <TableCell className="font-medium">{student.matricula}</TableCell>
                            <TableCell>{student.nombre}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenImportModal(false);
                  setImportedStudents([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportStudents}
                disabled={importedStudents.length === 0 || importLoading}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
              >
                {importLoading ? 'Importando...' : `Importar ${importedStudents.length} alumnos`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Asignación de Alumnos a CourseGroup */}
        <Dialog open={openAssignStudentsModal} onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetStudentsAssignmentModal();
          }
          setOpenAssignStudentsModal(isOpen);
        }}>
          <DialogContent className="max-w-4xl max-h-[98vh] w-[98vw] sm:w-[95vw] flex flex-col p-3">
            <DialogHeader className="pb-3 flex-shrink-0">
              <DialogTitle className="text-lg sm:text-xl">Asignar Alumnos a {selectedCourseGroupForAssignment?.group?.name}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Selecciona los alumnos que deseas asignar al grupo {selectedCourseGroupForAssignment?.group?.name} en la asignatura {selectedCourse?.name}
                {assignedStudentsToCourseGroup.length > 0 && (
                  <span className="block mt-2 text-xs sm:text-sm text-blue-600">
                    Actualmente hay {assignedStudentsToCourseGroup.length} alumno{assignedStudentsToCourseGroup.length !== 1 ? 's' : ''} asignado{assignedStudentsToCourseGroup.length !== 1 ? 's' : ''} a este grupo
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Header con controles */}
              <div className="flex flex-col gap-2 mb-2 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold flex-shrink-0">
                    Selecciona Alumnos
                    {selectedStudentsForAssignment.size > 0 && (
                      <span className="ml-2 text-sm text-blue-600 font-normal">
                        ({selectedStudentsForAssignment.size} seleccionado{selectedStudentsForAssignment.size !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h3>
                  <div className="w-full sm:w-64 flex-shrink-0">
                    <Input
                      placeholder="Buscar por nombre o matrícula..."
                      value={searchTermForAssignment}
                      onChange={(e) => setSearchTermForAssignment(e.target.value)}
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                {/* Controles de selección */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedStudentsForAssignment.size > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAllStudentsForAssignment}
                        className="text-xs"
                      >
                        Deseleccionar todos
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllStudentsForAssignment}
                        className="text-xs"
                      >
                        Seleccionar todos
                      </Button>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 text-right">
                    {selectedStudentsForAssignment.size > 0 && (
                      <span>
                        {selectedStudentsForAssignment.size} de {filteredStudentsForAssignment.length} alumnos seleccionado{selectedStudentsForAssignment.size !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tabla con scroll mejorado */}
              <div className="border rounded-lg flex-1 overflow-hidden min-h-0">
                <div className="overflow-y-auto" style={{ height: '400px' }}>
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 sm:w-12 bg-gray-50 sticky top-0 z-10 text-xs sm:text-sm"></TableHead>
                        <TableHead className="bg-gray-50 sticky top-0 z-10 text-xs sm:text-sm">Nombre Completo</TableHead>
                        <TableHead className="bg-gray-50 sticky top-0 z-10 text-xs sm:text-sm">Matrícula</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm">Cargando alumnos...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredStudentsForAssignment.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                            <span className="text-sm">
                              {searchTermForAssignment ? 'No se encontraron alumnos que coincidan con la búsqueda' : 'No hay alumnos disponibles para asignar'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudentsForAssignment.map((alumno, index) => (
                          <TableRow 
                            key={alumno.id}
                            className={`cursor-pointer hover:bg-gray-50 ${selectedStudentsForAssignment.has(alumno.id?.toString() || '') ? 'bg-gray-50' : ''}`}
                            onClick={() => handleStudentAssignmentSelect(alumno)}
                          >
                            <TableCell className="w-10 sm:w-12">
                              <Checkbox
                                checked={selectedStudentsForAssignment.has(alumno.id?.toString() || '')}
                                onCheckedChange={() => handleStudentAssignmentSelect(alumno)}
                              />
                            </TableCell>
                            <TableCell className="font-medium max-w-0 truncate">
                              <div className="truncate text-xs sm:text-sm" title={alumno.fullName}>
                                {index + 1}. {alumno.fullName}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-0 truncate">
                              <div className="truncate text-xs sm:text-sm" title={alumno.registrationNumber}>
                                {alumno.registrationNumber}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Footer de información */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t flex-shrink-0">
                <div className="text-xs sm:text-sm text-gray-600">
                  {studentsLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Cargando estudiantes...</span>
                    </span>
                  ) : (
                    <>
                      Mostrando {filteredStudentsForAssignment.length} de {totalAssignmentStudents} alumnos disponibles para asignar
                      {assignedStudentsToCourseGroup.length > 0 && (
                        <span className="text-blue-600 ml-2">
                          ({assignedStudentsToCourseGroup.length} ya asignado{assignedStudentsToCourseGroup.length !== 1 ? 's' : ''})
                        </span>
                      )}
                      <span className="text-gray-500 ml-2">
                        (Ordenados según la base de datos)
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignmentPageChange(currentAssignmentPage - 1)}
                    disabled={currentAssignmentPage === 1 || studentsLoading}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium">
                    Página {currentAssignmentPage} de {Math.max(1, Math.ceil(totalAssignmentStudents / assignmentStudentsPerPage))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignmentPageChange(currentAssignmentPage + 1)}
                    disabled={currentAssignmentPage >= Math.max(1, Math.ceil(totalAssignmentStudents / assignmentStudentsPerPage)) || studentsLoading}
                    className="text-xs"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setOpenAssignStudentsModal(false)}
                className="w-full sm:w-auto text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmStudentsAssignment}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold w-full sm:w-auto text-sm"
                disabled={selectedStudentsForAssignment.size === 0 || assignmentLoading}
              >
                {assignmentLoading ? 'Asignando...' : `Asignar ${selectedStudentsForAssignment.size} alumno${selectedStudentsForAssignment.size !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
