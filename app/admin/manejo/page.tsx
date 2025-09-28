"use client"

import { Group } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ArrowLeft,
  Search,
  Filter,
  Eye,
  ChevronRight
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useGroup } from '@/lib/hooks/useGroup';
import { toast } from 'react-toastify';

// Tipos para la maqueta
interface Student {
  id: number;
  fullName: string;
  registrationNumber: string;
  semester: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
}

interface Grade {
  id: number;
  activityName: string;
  grade: number;
  maxGrade: number;
  partial: number;
  type: 'actividad' | 'evidencia' | 'producto' | 'examen';
}

interface PartialGrade {
  partial: number;
  grade: number;
  percentage: number;
}

interface FinalGrade {
  ordinary: number | null;
  extraordinary: number | null;
}

type ViewMode = 'groups' | 'students' | 'courses' | 'grades';

export default function ManejoPage() {
  const { loading, error, totalItems, handleGetGroups } = useGroup();
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('groups');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Datos mock para la maqueta
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [partialGrades, setPartialGrades] = useState<PartialGrade[]>([]);
  const [finalGrade, setFinalGrade] = useState<FinalGrade | null>(null);
  const [selectedPartial, setSelectedPartial] = useState(1);

  useEffect(() => {
    loadGroups();
  }, [currentPage]);

  useEffect(() => {
    filterGroups();
  }, [searchTerm, grupos]);

  const loadGroups = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await handleGetGroups(itemsPerPage, offset);
      
      if (response && response.groups) {
        setGrupos(response.groups);
      } else if (Array.isArray(response)) {
        setGrupos(response);
      } else {
        setGrupos([]);
      }
    } catch (err) {
      console.error('Error al cargar los grupos:', err);
      toast.error('Error al cargar los grupos');
    }
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

  const handleViewGroup = (grupo: Group) => {
    setSelectedGroup(grupo);
    setCurrentView('students');
    
    // Mock data para estudiantes
    setStudents([
      { id: 1, fullName: 'Juan Pérez García', registrationNumber: '2024001', semester: 1 },
      { id: 2, fullName: 'María López Hernández', registrationNumber: '2024002', semester: 1 },
      { id: 3, fullName: 'Carlos Rodríguez Silva', registrationNumber: '2024003', semester: 1 },
      { id: 4, fullName: 'Ana Martínez Torres', registrationNumber: '2024004', semester: 1 },
      { id: 5, fullName: 'Luis García Morales', registrationNumber: '2024005', semester: 1 },
    ]);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentView('courses');
    
    // Mock data para materias
    setCourses([
      { id: 1, name: 'Matemáticas I', code: 'MAT101', credits: 4 },
      { id: 2, name: 'Física I', code: 'FIS101', credits: 4 },
      { id: 3, name: 'Química I', code: 'QUI101', credits: 3 },
      { id: 4, name: 'Programación I', code: 'PRO101', credits: 4 },
      { id: 5, name: 'Inglés I', code: 'ING101', credits: 2 },
    ]);
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('grades');
    
    // Mock data para calificaciones
    setGrades([
      { id: 1, activityName: 'Tarea 1', grade: 8.5, maxGrade: 10, partial: 1, type: 'actividad' },
      { id: 2, activityName: 'Tarea 2', grade: 9.0, maxGrade: 10, partial: 1, type: 'actividad' },
      { id: 3, activityName: 'Examen Parcial 1', grade: 7.5, maxGrade: 10, partial: 1, type: 'examen' },
      { id: 4, activityName: 'Proyecto 1', grade: 8.0, maxGrade: 10, partial: 1, type: 'producto' },
      { id: 5, activityName: 'Tarea 3', grade: 9.5, maxGrade: 10, partial: 2, type: 'actividad' },
      { id: 6, activityName: 'Tarea 4', grade: 8.8, maxGrade: 10, partial: 2, type: 'actividad' },
      { id: 7, activityName: 'Examen Parcial 2', grade: 8.2, maxGrade: 10, partial: 2, type: 'examen' },
      { id: 8, activityName: 'Tarea 5', grade: 9.2, maxGrade: 10, partial: 3, type: 'actividad' },
      { id: 9, activityName: 'Tarea 6', grade: 8.7, maxGrade: 10, partial: 3, type: 'actividad' },
      { id: 10, activityName: 'Examen Parcial 3', grade: 8.9, maxGrade: 10, partial: 3, type: 'examen' },
      { id: 11, activityName: 'Proyecto Final', grade: 9.1, maxGrade: 10, partial: 3, type: 'producto' },
    ]);
    
    setPartialGrades([
      { partial: 1, grade: 8.25, percentage: 30 },
      { partial: 2, grade: 8.83, percentage: 30 },
      { partial: 3, grade: 9.0, percentage: 40 },
    ]);
    
    setFinalGrade({
      ordinary: 8.5,
      extraordinary: null
    });
  };

  const handleBack = () => {
    switch (currentView) {
      case 'students':
        setCurrentView('groups');
        setSelectedGroup(null);
        break;
      case 'courses':
        setCurrentView('students');
        setSelectedStudent(null);
        break;
      case 'grades':
        setCurrentView('courses');
        setSelectedCourse(null);
        break;
    }
  };

  const handlePartialChange = (partial: number) => {
    setSelectedPartial(partial);
  };

  const getFilteredGrades = () => {
    return grades.filter(grade => grade.partial === selectedPartial);
  };

  const getPartialInfo = () => {
    return partialGrades.find(p => p.partial === selectedPartial);
  };

  const getBreadcrumb = () => {
    const breadcrumbs = ['Grupos'];
    if (selectedGroup) breadcrumbs.push(selectedGroup.name);
    if (selectedStudent) breadcrumbs.push(selectedStudent.fullName);
    if (selectedCourse) breadcrumbs.push(selectedCourse.name);
    return breadcrumbs.join(' > ');
  };

  const renderGroupsView = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-900">Lista de Grupos</CardTitle>
        <CardDescription>Selecciona un grupo para ver sus alumnos</CardDescription>
        <div className="w-full sm:w-64 mt-4">
          <Input
            placeholder="Buscar grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Nombre del Grupo</TableHead>
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold">Semestre</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((grupo) => (
                <TableRow key={grupo.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{grupo.name}</TableCell>
                  <TableCell>{grupo.period?.name || 'No asignado'}</TableCell>
                  <TableCell>{grupo.semester || 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewGroup(grupo)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Alumnos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderStudentsView = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-900">Alumnos del Grupo</CardTitle>
        <CardDescription>Selecciona un alumno para ver sus materias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Nombre Completo</TableHead>
                <TableHead className="font-semibold">Matrícula</TableHead>
                <TableHead className="font-semibold">Semestre</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{student.fullName}</TableCell>
                  <TableCell>{student.registrationNumber}</TableCell>
                  <TableCell>{student.semester}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStudent(student)}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ver Materias
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderCoursesView = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-900">Materias del Alumno</CardTitle>
        <CardDescription>Selecciona una materia para ver las calificaciones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Materia</TableHead>
                <TableHead className="font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Créditos</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCourse(course)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Ver Calificaciones
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderGradesView = () => (
    <div className="space-y-6">
      {/* Resumen de Calificaciones Parciales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Calificaciones Parciales</CardTitle>
          <CardDescription>Resumen por semestre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partialGrades.map((partial) => (
              <div key={partial.partial} className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedPartial === partial.partial 
                  ? 'bg-blue-100 border-2 border-blue-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`} onClick={() => handlePartialChange(partial.partial)}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Parcial {partial.partial}</span>
                  <Badge variant={partial.grade >= 6 ? "default" : "destructive"}>
                    {partial.grade > 0 ? partial.grade.toFixed(2) : '--'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {partial.percentage}% del total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Actividades y Calificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Actividades y Calificaciones</CardTitle>
              <CardDescription>Detalle de actividades del Parcial {selectedPartial}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePartialChange(Math.max(1, selectedPartial - 1))}
                disabled={selectedPartial === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-md">
                <span className="text-sm font-medium">Parcial {selectedPartial}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePartialChange(Math.min(3, selectedPartial + 1))}
                disabled={selectedPartial === 3}
                className="flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Actividad</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold text-center">Calificación</TableHead>
                  <TableHead className="font-semibold text-center">Máximo</TableHead>
                  <TableHead className="font-semibold text-center">Porcentaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredGrades().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <BookOpen className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">No hay actividades en este parcial</p>
                        <p className="text-sm">Las actividades aparecerán cuando se registren calificaciones</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredGrades().map((grade) => (
                    <TableRow key={grade.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{grade.activityName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            grade.type === 'actividad' ? 'default' :
                            grade.type === 'evidencia' ? 'secondary' :
                            grade.type === 'producto' ? 'outline' : 'destructive'
                          }
                        >
                          {grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          grade.grade >= 8 ? 'text-green-600' :
                          grade.grade >= 6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {grade.grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{grade.maxGrade}</TableCell>
                      <TableCell className="text-center">
                        {((grade.grade / grade.maxGrade) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Información del parcial seleccionado */}
          {getPartialInfo() && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-blue-900">Parcial {selectedPartial}</span>
                  <p className="text-sm text-blue-700">
                    {getPartialInfo()?.percentage}% del total • 
                    Calificación: {getPartialInfo()?.grade.toFixed(2)}
                  </p>
                </div>
                <Badge variant={getPartialInfo()?.grade && getPartialInfo()!.grade >= 6 ? "default" : "destructive"}>
                  {getPartialInfo()?.grade && getPartialInfo()!.grade > 0 ? getPartialInfo()!.grade.toFixed(2) : 'Sin calificar'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calificaciones Finales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Calificaciones Finales</CardTitle>
          <CardDescription>Calificación ordinaria y extraordinaria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Ordinario</span>
                <Badge variant={finalGrade?.ordinary && finalGrade.ordinary >= 6 ? "default" : "destructive"}>
                  {finalGrade?.ordinary || '--'}
                </Badge>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Extraordinario</span>
                <Badge variant={finalGrade?.extraordinary && finalGrade.extraordinary >= 6 ? "default" : "destructive"}>
                  {finalGrade?.extraordinary || '--'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Manejo de Grupos</h1>
            <p className="text-gray-600 text-base">Consulta calificaciones por grupo, alumno y materia</p>
            <div className="mt-2 text-sm text-gray-500">
              {getBreadcrumb()}
            </div>
          </div>
          {currentView !== 'groups' && (
            <Button 
              onClick={handleBack}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
        </div>

        {/* Content */}
        {currentView === 'groups' && renderGroupsView()}
        {currentView === 'students' && renderStudentsView()}
        {currentView === 'courses' && renderCoursesView()}
        {currentView === 'grades' && renderGradesView()}
      </div>
    </div>
  );
}
