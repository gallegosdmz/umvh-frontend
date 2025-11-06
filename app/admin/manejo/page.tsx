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
  ChevronRight,
  Loader2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useGroup } from '@/lib/hooks/useGroup';
import { toast } from 'react-toastify';
import { 
  GroupDetailedService, 
  GroupDetailedDto, 
  StudentDto, 
  CourseDto, 
  PartialEvaluationDto,
  PartialGradeDto
} from '@/lib/services/group-detailed.service';

// Tipos para la maqueta (mantenidos para compatibilidad)
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
  const [grupos, setGrupos] = useState<GroupDetailedDto[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('groups');
  const [selectedGroup, setSelectedGroup] = useState<GroupDetailedDto | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDto | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGroups, setFilteredGroups] = useState<GroupDetailedDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para datos reales de la API
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [partialGrades, setPartialGrades] = useState<PartialGrade[]>([]);
  const [finalGrade, setFinalGrade] = useState<FinalGrade | null>(null);
  const [selectedPartial, setSelectedPartial] = useState(1);
  
  // Estados de carga
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [currentPage]);

  useEffect(() => {
    filterGroups();
  }, [searchTerm, grupos]);

  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await GroupDetailedService.getDetailedGroups();
      setGrupos(response.groups);
    } catch (err) {
      console.error('Error al cargar los grupos:', err);
      toast.error('Error al cargar los grupos');
    } finally {
      setIsLoadingGroups(false);
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

  const handleViewGroup = (grupo: GroupDetailedDto) => {
    setSelectedGroup(grupo);
    setCurrentView('students');
    setStudents(grupo.students);
  };

  const handleViewStudent = (student: StudentDto) => {
    setSelectedStudent(student);
    setCurrentView('courses');
    setCourses(student.courses);
  };

  const handleViewCourse = (course: CourseDto) => {
    setSelectedCourse(course);
    setCurrentView('grades');
    
    // Console.log para ver la data completa del curso
    console.log('=== DATA COMPLETA DEL CURSO ===');
    console.log('Course:', course);
    console.log('Partial Grades:', course.partialGrades);
    console.log('Partial Evaluations:', course.partialEvaluations);
    
    // Procesar calificaciones parciales
    const partialGradesData = course.partialGrades.map(pg => ({
      partial: pg.partial,
      grade: pg.grade,
      percentage: pg.partial === 1 ? 30 : pg.partial === 2 ? 30 : 40
    }));
    setPartialGrades(partialGradesData);
    
    // Procesar evaluaciones parciales como actividades
    const gradesData: Grade[] = [];
    course.partialEvaluations.forEach(evaluation => {
      console.log('Processing evaluation:', evaluation);
      evaluation.grades.forEach(grade => {
        const gradeData = {
          id: grade.id,
          activityName: evaluation.name,
          grade: grade.grade,
          maxGrade: 10, // Asumiendo escala de 10
          partial: evaluation.partial,
          type: evaluation.type as 'actividad' | 'evidencia' | 'producto' | 'examen'
        };
        console.log('Adding grade:', gradeData);
        gradesData.push(gradeData);
      });
    });
    
    console.log('=== GRADES DATA FINAL ===');
    console.log('All grades:', gradesData);
    console.log('Grades by partial:', {
      partial1: gradesData.filter(g => g.partial === 1),
      partial2: gradesData.filter(g => g.partial === 2),
      partial3: gradesData.filter(g => g.partial === 3)
    });
    
    setGrades(gradesData);
    
    // Calcular calificación final (promedio de parciales)
    const finalGradeValue = partialGradesData.length > 0 
      ? partialGradesData.reduce((sum, pg) => sum + pg.grade, 0) / partialGradesData.length 
      : 0;
    
    setFinalGrade({
      ordinary: finalGradeValue > 0 ? finalGradeValue : null,
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
    console.log(`=== CAMBIANDO A PARCIAL ${partial} ===`);
    console.log('Previous partial:', selectedPartial);
    console.log('New partial:', partial);
    setSelectedPartial(partial);
  };

  const getFilteredGrades = () => {
    const filteredGrades = grades.filter(grade => grade.partial === selectedPartial);
    console.log(`=== FILTRADO PARA PARCIAL ${selectedPartial} ===`);
    console.log('Selected Partial:', selectedPartial);
    console.log('All grades:', grades);
    console.log('Filtered grades:', filteredGrades);
    return filteredGrades;
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
        {isLoadingGroups ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando grupos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Nombre del Grupo</TableHead>
                  <TableHead className="font-semibold">Período</TableHead>
                  <TableHead className="font-semibold">Semestre</TableHead>
                  <TableHead className="font-semibold">Estudiantes</TableHead>
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Users className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">No hay grupos disponibles</p>
                        <p className="text-sm">Los grupos aparecerán cuando se registren en el sistema</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((grupo) => (
                    <TableRow key={grupo.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{grupo.name}</TableCell>
                      <TableCell>{grupo.period?.name || 'No asignado'}</TableCell>
                      <TableCell>{grupo.semester || 'N/A'}</TableCell>
                      <TableCell>{grupo.students?.length || 0} estudiantes</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
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
                <TableHead className="font-semibold">Materias</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">No hay alumnos en este grupo</p>
                      <p className="text-sm">Los alumnos aparecerán cuando se asignen al grupo</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.registrationNumber}</TableCell>
                    <TableCell>{student.courses?.length || 0} materias</TableCell>
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
                ))
              )}
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
                <TableHead className="font-semibold">Semestre</TableHead>
                <TableHead className="font-semibold">Evaluaciones</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <BookOpen className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">No hay materias asignadas</p>
                      <p className="text-sm">Las materias aparecerán cuando se asignen al alumno</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.semester}</TableCell>
                    <TableCell>{course.partialEvaluations?.length || 0} evaluaciones</TableCell>
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
                ))
              )}
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
