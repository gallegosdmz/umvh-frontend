"use client"

import { Student, Group, Period, CreateGroupDto } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Users, FileText, FileSpreadsheet } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOfflineStudent } from '@/hooks/use-offline-student';
import { useOfflineGroup } from '@/hooks/use-offline-group';
import { useOfflinePeriod } from '@/hooks/use-offline-period';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { Checkbox } from '@/components/ui/checkbox';
import { WordDocumentService } from '@/lib/services/word-document.service';
import { ExcelDocumentService } from '@/lib/services/excel-document.service';

interface GroupWithStudents extends Group {
  students?: Student[];
}

export default function AlumnosPage() {
  const { 
    loading: studentLoading, 
    error: studentError, 
    totalItems: studentTotalItems, 
    students,
    getCombinedStudents, 
    createStudent, 
    updateStudent, 
    deleteStudent,
    isOnline: studentOnline
  } = useOfflineStudent();

  const { 
    loading: groupLoading, 
    error: groupError, 
    totalItems: groupTotalItems, 
    groups,
    getCombinedGroups, 
    createGroup, 
    updateGroup, 
    deleteGroup, 
    assignStudentsToGroup,
    isOnline: groupOnline
  } = useOfflineGroup();

  const { 
    loading: periodLoading, 
    error: periodError, 
    periods,
    getCombinedPeriods,
    isOnline: periodOnline
  } = useOfflinePeriod();

  const [periodos, setPeriodos] = useState<Period[]>([]);
  const [nombre, setNombre] = useState("");
  const [matricula, setMatricula] = useState("");
  const [semestre, setSemestre] = useState("");
  const [periodoId, setPeriodoId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Student | Group | null>(null);
  const [editingItem, setEditingItem] = useState<Student | Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showGrupos, setShowGrupos] = useState(false);
  const itemsPerPage = 20;
  const [openAssignStudents, setOpenAssignStudents] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generatingBoleta, setGeneratingBoleta] = useState<string | null>(null);
  const [generatingExcel, setGeneratingExcel] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadItems();
    if (showGrupos) {
      loadPeriods();
    }
  }, []);

  // Recargar cuando cambie la vista
  useEffect(() => {
    if (showGrupos) {
      loadPeriods();
    }
  }, [showGrupos]);

  // Recargar cuando cambie la página solo para grupos
  useEffect(() => {
    if (showGrupos) {
      loadItems();
    }
  }, [currentPage, showGrupos]);

  // Resetear la página cuando cambie la vista
  useEffect(() => {
    setCurrentPage(1);
  }, [showGrupos]);

  useEffect(() => {
    if (openAssignStudents) {
      loadAllStudents();
    }
  }, [openAssignStudents]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, allStudents]);



  const loadPeriods = async () => {
    try {
      await getCombinedPeriods();
      setPeriodos(periods);
    } catch (error) {
      console.error('Error cargando períodos:', error);
      setPeriodos([]);
    }
  };

  const loadItems = async () => {
    try {
      if (showGrupos) {
        const offset = (currentPage - 1) * itemsPerPage;
        console.log(`Cargando grupos - Página: ${currentPage}, Offset: ${offset}, Limit: ${itemsPerPage}`);
        await getCombinedGroups(itemsPerPage, offset);
        console.log(`Grupos cargados: ${groups.length}, Total: ${groupTotalItems}`);
      } else {
        // Solo cargar estudiantes si no están ya cargados o si es la primera carga
        if (students.length === 0) {
          await getCombinedStudents();
        }
      }
    } catch (err) {
      console.error('Error al cargar los items:', err);
    }
  };

  const loadAllStudents = async () => {
    try {
      await getCombinedStudents();
      setAllStudents(students);
    } catch (err) {
      console.error('Error al cargar todos los estudiantes:', err);
    }
  };

  const filterStudents = () => {
    let filtered = [...allStudents];
    
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(' ').filter(Boolean);
      filtered = filtered.filter(student => {
        const fullName = student.fullName.toLowerCase();
        const registration = student.registrationNumber.toLowerCase();
        return terms.every(term =>
          fullName.includes(term) ||
          registration.includes(term)
      );
      });
    }
    
    // Ya no filtramos por semestre porque los estudiantes ya no tienen semester
    // El filtro de semestre ahora se aplica a los grupos
    
    setFilteredStudents(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre) {
      return;
    }

    setFormLoading(true);

    try {
      if (showGrupos) {
        if (!periodoId || !semestre) {
          toast.error('Debes seleccionar un período y un semestre');
          return;
        }

        const groupData: CreateGroupDto = {
          name: nombre,
          periodId: Number(periodoId),
          semester: Number(semestre)
        };

        if (editingItem && editingItem.id) {
          await updateGroup(editingItem.id.toString(), groupData);
          toast.success('Grupo actualizado correctamente');
        } else {
          await createGroup(groupData);
          toast.success('Grupo creado correctamente');
        }
        setOpen(false);
        resetForm();
        // Recargar los grupos después de crear/editar
        await loadItems();
      } else {
        const studentData: Student = {
          fullName: nombre,
          registrationNumber: matricula
        };

        if (editingItem && editingItem.id) {
          await updateStudent(editingItem.id.toString(), studentData);
        } else {
          await createStudent(studentData);
        }
        setOpen(false);
        resetForm();
        await loadItems();
      }
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item: Student | Group) => {
    setEditingItem(item);
    if ('fullName' in item) {
      setNombre(item.fullName);
      setMatricula(item.registrationNumber);
      setSemestre("");
    } else {
      setNombre(item.name);
      setPeriodoId(item.period?.id?.toString() || "");
      setSemestre(item.semester?.toString() || "");
    }
    setOpen(true);
  };

  const handleDelete = async (item: Student | Group) => {
    setItemToDelete(item);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !itemToDelete.id) return;
    
    setDeleteLoading(true);
    try {
      if (showGrupos) {
        await deleteGroup(itemToDelete.id.toString());
      } else {
        await deleteStudent(itemToDelete.id.toString());
      }
      setOpenDelete(false);
      setItemToDelete(null);
      // Recargar después de eliminar
      await loadItems();
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setMatricula("");
    setSemestre("");
    setPeriodoId("");
    setEditingItem(null);
  };

  const totalPages = Math.ceil((showGrupos ? groupTotalItems : studentTotalItems) / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAssignStudents = (grupo: Group) => {
    setSelectedGroup(grupo);
    setOpenAssignStudents(true);
    loadAllStudents();
  };

  const handleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSaveAssignments = async () => {
    if (!selectedGroup?.id) {
      toast.error('No se ha seleccionado un grupo válido');
      return;
    }
    
    try {
      const studentIdsArray = Array.from(selectedStudents);
      if (studentIdsArray.length === 0) {
        toast.warning('Debes seleccionar al menos un alumno');
        return;
      }

      await assignStudentsToGroup(selectedGroup.id.toString(), studentIdsArray);
      toast.success('Alumnos asignados correctamente');
      setOpenAssignStudents(false);
      setSelectedStudents(new Set());
      // Actualizar la lista de grupos
      await loadItems();
    } catch (err) {
      console.error('Error al asignar alumnos:', err);
      toast.error('Error al asignar alumnos');
    }
  };

  const handleGenerateGroupBoleta = async () => {
    try {
      console.log('🚀 Iniciando generación de boletín general');
      setGeneratingBoleta('general');
      const blob = await WordDocumentService.generateGroupBoleta('general');
      const filename = `Boletines_Grupo_${new Date().toISOString().split('T')[0]}.docx`;
      
      console.log('💾 Descargando archivo:', filename);
      WordDocumentService.downloadDocument(blob, filename);
      toast.success('Boletines generados correctamente');
    } catch (error) {
      console.error('❌ Error generando los boletines:', error);
      toast.error('Error al generar los boletines');
    } finally {
      setGeneratingBoleta(null);
    }
  };

  const handleGenerateIndividualBoleta = async (groupId: string) => {
    try {
      console.log('🚀 Iniciando generación de boletín para grupo:', groupId);
      setGeneratingBoleta(groupId);
      const blob = await WordDocumentService.generateGroupBoleta(groupId);
      const filename = `Boletin_Grupo_${groupId}_${new Date().toISOString().split('T')[0]}.docx`;
      
      console.log('💾 Descargando archivo:', filename);
      WordDocumentService.downloadDocument(blob, filename);
      toast.success('Boletín generado correctamente');
    } catch (error) {
      console.error('❌ Error generando el boletín:', error);
      toast.error('Error al generar el boletín');
    } finally {
      setGeneratingBoleta(null);
    }
  };

  const handleGenerateGroupExcel = async () => {
    try {
      console.log('🚀 Iniciando generación de Excel general');
      setGeneratingExcel('general');
      const blob = await ExcelDocumentService.generateGroupGradesExcel('general');
      const filename = `Calificaciones_Grupo_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      console.log('💾 Descargando archivo:', filename);
      ExcelDocumentService.downloadDocument(blob, filename);
      toast.success('Excel generado correctamente');
    } catch (error) {
      console.error('❌ Error generando el Excel:', error);
      toast.error('Error al generar el Excel');
    } finally {
      setGeneratingExcel(null);
    }
  };

  const handleGenerateIndividualExcel = async (groupId: string) => {
    try {
      console.log('🚀 Iniciando generación de Excel para grupo:', groupId);
      setGeneratingExcel(groupId);
      const blob = await ExcelDocumentService.generateGroupGradesExcel(groupId);
      const filename = `Calificaciones_Grupo_${groupId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      console.log('💾 Descargando archivo:', filename);
      ExcelDocumentService.downloadDocument(blob, filename);
      toast.success('Excel generado correctamente');
    } catch (error) {
      console.error('❌ Error generando el Excel:', error);
      toast.error('Error al generar el Excel');
    } finally {
      setGeneratingExcel(null);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de {showGrupos ? 'Grupos' : 'Alumnos'}</h1>
            <p className="text-gray-600 text-base">Administra los {showGrupos ? 'grupos' : 'alumnos'} del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="view-mode">Alumnos</Label>
              <Switch
                id="view-mode"
                checked={showGrupos}
                onCheckedChange={setShowGrupos}
              />
              <Label htmlFor="view-mode">Grupos</Label>
            </div>
            <Button 
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-semibold" 
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo {showGrupos ? 'grupo' : 'alumno'}
            </Button>
            {showGrupos && (
              <>
                <Button 
                  onClick={() => handleGenerateGroupBoleta()}
                  variant="outline"
                  size="lg"
                  className="border-[#bc4b26] text-[#bc4b26] hover:bg-[#bc4b26] hover:text-white"
                  disabled={generatingBoleta !== null || generatingExcel !== null}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  {generatingBoleta === 'general' ? 'Generando...' : 'Generar Boletín'}
                </Button>
                <Button 
                  onClick={() => handleGenerateGroupExcel()}
                  variant="outline"
                  size="lg"
                  className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  disabled={generatingBoleta !== null || generatingExcel !== null}
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  {generatingExcel === 'general' ? 'Generando...' : 'Generar Excel'}
                </Button>
              </>
            )}

          </div>
        </div>

        <Dialog open={open} onOpenChange={(isOpen: boolean) => {
          setOpen(isOpen);
          if (!isOpen) {
            resetForm();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? `Editar ${showGrupos ? 'grupo' : 'alumno'}`
                  : `Agregar nuevo ${showGrupos ? 'grupo' : 'alumno'}`
                }
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? `Modifica los campos del ${showGrupos ? 'grupo' : 'alumno'}.`
                  : `Llena los campos para registrar un nuevo ${showGrupos ? 'grupo' : 'alumno'}.`
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
                  placeholder={showGrupos ? "Ej. Grupo A" : "Ej. Juan Pérez"} 
                  required
                />
              </div>
              {!showGrupos ? (
                <>
                  <div>
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input 
                      id="matricula" 
                      value={matricula} 
                      onChange={e => setMatricula(e.target.value)} 
                      placeholder="Ej. 2024001" 
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select value={periodoId} onValueChange={setPeriodoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un período" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((periodo) => (
                          <SelectItem key={periodo.id} value={periodo.id?.toString() || ""}>
                            {periodo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="semestre">Semestre</Label>
                    <Input 
                      id="semestre" 
                      type="number"
                      min="1"
                      max="12"
                      value={semestre} 
                      onChange={e => setSemestre(e.target.value)} 
                      placeholder="Ej. 1" 
                      required
                    />
                  </div>
                </>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                  disabled={formLoading}
                >
                  {formLoading ? 'Guardando...' : 'Guardar'}
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
                ¿Estás seguro de que deseas eliminar el {showGrupos ? 'grupo' : 'alumno'} "{itemToDelete ? (showGrupos ? (itemToDelete as Group).name : (itemToDelete as Student).fullName) : ''}"? Esta acción no se puede deshacer.
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
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-900">{showGrupos ? 'Grupos' : 'Alumnos'} registrados</CardTitle>
            <CardDescription>Consulta, edita o elimina los {showGrupos ? 'grupos' : 'alumnos'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    {!showGrupos ? (
                      <>
                        <TableHead className="font-semibold">Matrícula</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="font-semibold">Período</TableHead>
                        <TableHead className="font-semibold">Semestre</TableHead>
                        <TableHead className="font-semibold">Cursos</TableHead>
                      </>
                    )}
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showGrupos ? (
                    groups.length > 0 ? (
                      // Los grupos ya vienen paginados del servidor
                      groups.map((grupo: Group) => (
                        <TableRow key={grupo.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{grupo.name}</TableCell>
                          <TableCell>
                            {grupo.period?.name || 'No asignado'}
                          </TableCell>
                          <TableCell>
                            {grupo.semester?.toString() || 'No asignado'}
                          </TableCell>
                          <TableCell>
                            {grupo.coursesGroups?.length || 0} cursos
                          </TableCell>
                          <TableCell className="flex gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Generar Boletín"
                              onClick={() => handleGenerateIndividualBoleta(grupo.id!.toString())}
                              className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                              disabled={generatingBoleta === grupo.id!.toString() || generatingExcel === grupo.id!.toString()}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Generar Excel"
                              onClick={() => handleGenerateIndividualExcel(grupo.id!.toString())}
                              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                              disabled={generatingBoleta === grupo.id!.toString() || generatingExcel === grupo.id!.toString()}
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Editar"
                              onClick={() => handleEdit(grupo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              title="Eliminar"
                              onClick={() => handleDelete(grupo)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          {groupLoading ? 'Cargando grupos...' : 'No hay grupos disponibles'}
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    // Aplicar paginación a los estudiantes
                    students
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((alumno: Student) => (
                      <TableRow key={alumno.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{alumno.fullName}</TableCell>
                        <TableCell>{alumno.registrationNumber}</TableCell>
                        <TableCell className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Editar"
                            onClick={() => handleEdit(alumno)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            title="Eliminar"
                            onClick={() => handleDelete(alumno)}
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
                Mostrando {showGrupos ? 
                  groups.length : 
                  Math.min(students.length - (currentPage - 1) * itemsPerPage, itemsPerPage)
                } de {showGrupos ? groupTotalItems : studentTotalItems} {showGrupos ? 'grupos' : 'alumnos'}
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
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={openAssignStudents} onOpenChange={setOpenAssignStudents}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asignar Alumnos al Grupo {selectedGroup?.name}</DialogTitle>
              <DialogDescription>
                Selecciona los alumnos que deseas asignar a este grupo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar alumno</Label>
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, apellidos o matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Matrícula</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.has(student.id!.toString())}
                            onCheckedChange={() => handleStudentSelection(student.id!.toString())}
                          />
                        </TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.registrationNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAssignStudents(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveAssignments}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
              >
                Guardar Asignaciones
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
}
