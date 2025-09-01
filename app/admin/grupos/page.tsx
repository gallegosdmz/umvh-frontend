"use client"

import { Group } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGroup } from '@/lib/hooks/useGroup';
import { toast } from 'react-toastify';

export default function GruposPage() {
  const { loading, error, totalItems, handleGetGroups, handleCreateGroup, handleUpdateGroup, handleDeleteGroup } = useGroup();
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [nombre, setNombre] = useState("");
  const [periodoId, setPeriodoId] = useState<number | undefined>(undefined);
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Group | null>(null);
  const [editingItem, setEditingItem] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [generatingBoletas, setGeneratingBoletas] = useState<number | null>(null);
  const itemsPerPage = 10;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !periodoId || !semester) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      const groupData = {
        name: nombre,
        periodId: periodoId,
        semester: semester
      };

      if (editingItem) {
        await handleUpdateGroup(editingItem.id?.toString()!, groupData);
      } else {
        await handleCreateGroup(groupData);
      }
      setOpen(false);
      resetForm();
      await loadGroups();
    } catch (err) {
      console.error('Error al guardar:', err);
      toast.error('Error al guardar el grupo');
    }
  };

  const handleEdit = (item: Group) => {
    setEditingItem(item);
    setNombre(item.name);
    setPeriodoId(item.period?.id || undefined);
    setSemester(item.semester || undefined);
    setOpen(true);
  };

  const handleDelete = async (item: Group) => {
    setItemToDelete(item);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await handleDeleteGroup(itemToDelete.id!.toString());
      setOpenDelete(false);
      setItemToDelete(null);
      await loadGroups();
      toast.success('Grupo eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast.error('Error al eliminar el grupo');
    }
  };

  const resetForm = () => {
    setNombre("");
    setPeriodoId(undefined);
    setSemester(undefined);
    setEditingItem(null);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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

  const handleGenerateBoletas = async (groupId: number) => {
    if (!groupId) {
      toast.error('Error: ID de grupo no válido');
      return;
    }

    setGeneratingBoletas(groupId);
    
    try {
      const response = await fetch(`https://uamvh.cloud/api/groups/${groupId}/find-boletas`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mostrar resultado en consola
      console.log(`Boletas generadas para el grupo ${groupId}:`, data);
      
      toast.success('Boletas generadas correctamente. Revisa la consola para ver los detalles.');
      
    } catch (error) {
      console.error(`Error al generar boletas para el grupo ${groupId}:`, error);
      toast.error('Error al generar las boletas');
    } finally {
      setGeneratingBoletas(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de Grupos</h1>
            <p className="text-gray-600 text-base">Administra los grupos del sistema</p>
          </div>
          <Button 
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-semibold" 
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Grupo
          </Button>
        </div>

        <Dialog open={open} onOpenChange={(isOpen: boolean) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? 'Editar Grupo'
                  : 'Agregar nuevo Grupo'
                }
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? 'Modifica los campos del grupo.'
                  : 'Llena los campos para registrar un nuevo grupo.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="nombre">Nombre del Grupo</Label>
                <Input 
                  id="nombre" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  placeholder="Ej. Grupo A - Matemáticas" 
                  required
                />
              </div>
              <div>
                <Label htmlFor="periodo">ID del Período</Label>
                <Input 
                  id="periodo" 
                  type="number"
                  value={periodoId || ''} 
                  onChange={e => setPeriodoId(e.target.value ? parseInt(e.target.value) : undefined)} 
                  placeholder="Ej. 1" 
                  required
                />
              </div>
              <div>
                <Label htmlFor="semester">Semestre</Label>
                <Input 
                  id="semester" 
                  type="number"
                  value={semester || ''} 
                  onChange={e => setSemester(e.target.value ? parseInt(e.target.value) : undefined)} 
                  placeholder="Ej. 1" 
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
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
                ¿Estás seguro de que deseas eliminar el grupo "{itemToDelete?.name}"? Esta acción no se puede deshacer.
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
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-900">Grupos registrados</CardTitle>
            <CardDescription>Consulta, edita o elimina los grupos académicos</CardDescription>
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
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((grupo) => (
                    <TableRow key={grupo.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{grupo.name}</TableCell>
                      <TableCell>{grupo.period?.name || 'No asignado'}</TableCell>
                      <TableCell className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateBoletas(grupo.id!)}
                          disabled={generatingBoletas === grupo.id}
                          className="text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {generatingBoletas === grupo.id ? 'Generando...' : 'Generar Boletas'}
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {filteredGroups.length} de {totalItems} grupos
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
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
