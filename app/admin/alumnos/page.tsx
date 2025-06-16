"use client"

import { Student, Group, Period, CreateGroupDto } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudent } from '@/lib/hooks/useStudent';
import { useGroup } from '@/lib/hooks/useGroup';
import { usePeriod } from '@/lib/hooks/usePeriod';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { Checkbox } from '@/components/ui/checkbox';

interface GroupWithStudents extends Group {
  students?: Student[];
}

export default function AlumnosPage() {
  const { 
    loading: studentLoading, 
    error: studentError, 
    totalItems: studentTotalItems, 
    handleGetStudents, 
    handleCreateStudent, 
    handleUpdateStudent, 
    handleDeleteStudent 
  } = useStudent();

  const { 
    loading: groupLoading, 
    error: groupError, 
    totalItems: groupTotalItems, 
    handleGetGroups, 
    handleCreateGroup, 
    handleUpdateGroup, 
    handleDeleteGroup, 
    handleAssignStudents: assignStudentsToGroup 
  } = useGroup();

  const { 
    loading: periodLoading, 
    error: periodError, 
    handleGetPeriods 
  } = usePeriod();

  const [alumnos, setAlumnos] = useState<Student[]>([]);
  const [grupos, setGrupos] = useState<GroupWithStudents[]>([]);
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
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadItems();
    if (showGrupos) {
      loadPeriods();
    }
  }, [currentPage, showGrupos]);

  useEffect(() => {
    if (openAssignStudents) {
      loadAllStudents();
    }
  }, [openAssignStudents]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, selectedSemester, allStudents]);

  const loadPeriods = async () => {
    try {
      const data = await handleGetPeriods();
      console.log('Períodos cargados (estructura completa):', JSON.stringify(data, null, 2));
      if (Array.isArray(data)) {
        setPeriodos(data);
      } else {
        console.error('Los períodos no son un array:', data);
        setPeriodos([]);
      }
    } catch (err) {
      console.error('Error al cargar los períodos:', err);
      setPeriodos([]);
    }
  };

  const loadItems = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      if (showGrupos) {
        const data = await handleGetGroups(itemsPerPage, offset);
        console.log('Datos de grupos recibidos:', data);
        
        // La respuesta del backend ya viene como un array de grupos
        if (Array.isArray(data)) {
          setGrupos(data);
          setTotalItems(data.length);
        } else {
          console.log('No hay grupos para mostrar');
          setGrupos([]);
          setTotalItems(0);
        }
      } else {
        const data = await handleGetStudents(itemsPerPage, offset);
        setAlumnos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error al cargar los items:', err);
      if (showGrupos) {
        setGrupos([]);
        setTotalItems(0);
      } else {
        setAlumnos([]);
      }
    }
  };

  const loadAllStudents = async () => {
    try {
      const data = await handleGetStudents(1000, 0); // Obtener todos los estudiantes
      setAllStudents(Array.isArray(data) ? data : []);
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
    
    if (selectedSemester && selectedSemester !== "all") {
      filtered = filtered.filter(student => 
        student.semester.toString() === selectedSemester
      );
    }
    
    setFilteredStudents(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre) {
      return;
    }

    try {
      if (showGrupos) {
        if (!periodoId) {
          toast.error('Debes seleccionar un período');
          return;
        }

        const groupData: CreateGroupDto = {
          name: nombre,
          periodId: Number(periodoId)
        };

        if (editingItem && editingItem.id) {
          await handleUpdateGroup(editingItem.id.toString(), groupData);
          toast.success('Grupo actualizado correctamente');
        } else {
          await handleCreateGroup(groupData);
          toast.success('Grupo creado correctamente');
        }
        setOpen(false);
        resetForm();
        await loadItems();
      } else {
        const studentData: Student = {
          fullName: nombre,
          semester: Number(semestre),
          registrationNumber: matricula
        };

        if (editingItem && editingItem.id) {
          await handleUpdateStudent(editingItem.id.toString(), studentData);
        } else {
          await handleCreateStudent(studentData);
        }
        setOpen(false);
        resetForm();
        await loadItems();
      }
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const handleEdit = (item: Student | Group) => {
    setEditingItem(item);
    if ('fullName' in item) {
      setNombre(item.fullName);
      setMatricula(item.registrationNumber);
      setSemestre(item.semester.toString());
    } else {
      setNombre(item.name);
      setPeriodoId(item.period?.id?.toString() || "");
    }
    setOpen(true);
  };

  const handleDelete = async (item: Student | Group) => {
    setItemToDelete(item);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !itemToDelete.id) return;
    
    try {
      if (showGrupos) {
        await handleDeleteGroup(itemToDelete.id.toString());
      } else {
        await handleDeleteStudent(itemToDelete.id.toString());
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

  // Asegurarnos de que los grupos se carguen cuando se cambia a la vista de grupos
  useEffect(() => {
    if (showGrupos) {
      loadItems();
    }
  }, [showGrupos]);

  // Asegurarnos de que los grupos se carguen cuando cambia la página
  useEffect(() => {
    loadItems();
  }, [currentPage]);

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
              ) : (
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
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                  disabled={showGrupos ? groupLoading : studentLoading}
                >
                  {showGrupos ? (groupLoading ? 'Guardando...' : 'Guardar') : (studentLoading ? 'Guardando...' : 'Guardar')}
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
                disabled={showGrupos ? groupLoading : studentLoading}
              >
                {showGrupos ? (groupLoading ? 'Eliminando...' : 'Eliminar') : (studentLoading ? 'Eliminando...' : 'Eliminar')}
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
                        <TableHead className="font-semibold">Semestre</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="font-semibold">Período</TableHead>
                        <TableHead className="font-semibold">Cursos</TableHead>
                      </>
                    )}
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showGrupos ? (
                    grupos.length > 0 ? (
                      grupos.map((grupo) => (
                        <TableRow key={grupo.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{grupo.name}</TableCell>
                          <TableCell>
                            {grupo.period?.name || 'No asignado'}
                          </TableCell>
                          <TableCell>
                            {grupo.coursesGroups?.length || 0} cursos
                          </TableCell>
                          <TableCell className="flex gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Asignar Alumnos"
                              onClick={() => handleAssignStudents(grupo)}
                            >
                              <Users className="h-4 w-4" />
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
                        <TableCell colSpan={4} className="text-center py-4">
                          {groupLoading ? 'Cargando grupos...' : 'No hay grupos disponibles'}
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    alumnos.map((alumno) => (
                      <TableRow key={alumno.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{alumno.fullName}</TableCell>
                        <TableCell>{alumno.registrationNumber}</TableCell>
                        <TableCell>{alumno.semester}</TableCell>
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
                Mostrando {showGrupos ? grupos.length : alumnos.length} de {showGrupos ? groupTotalItems : studentTotalItems} {showGrupos ? 'grupos' : 'alumnos'}
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
                <div className="w-48">
                  <Label htmlFor="semester">Filtrar por semestre</Label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los semestres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semestre {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Semestre</TableHead>
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
                        <TableCell>{student.semester}</TableCell>
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
