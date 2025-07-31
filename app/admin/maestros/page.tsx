"use client"

import { User } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeacher } from '@/lib/hooks/useTeacher';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function MaestrosPage() {
  const router = useRouter();
  const { loading, error, totalItems, handleGetTeachers, handleCreateTeacher, handleUpdateTeacher, handleDeleteTeacher } = useTeacher();
  const [maestros, setMaestros] = useState<User[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<User | null>(null);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMaestros();
  }, [currentPage]);

  const loadMaestros = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await handleGetTeachers(itemsPerPage, offset);
      console.log('Respuesta de maestros:', response);
      
      if (response && response.users) {
        setMaestros(response.users);
      } else {
        setMaestros([]);
      }
    } catch (err) {
      console.error('Error al cargar los maestros:', err);
      toast.error('Error al cargar los datos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !email) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const teacherData: User = {
        fullName: nombre,
        email: email
      };

      if (editingItem) {
        await handleUpdateTeacher(editingItem.id!, teacherData);
      } else {
        await handleCreateTeacher(teacherData);
      }
      setOpen(false);
      resetForm();
      await loadMaestros();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const handleEdit = (maestro: User) => {
    setEditingItem(maestro);
    setNombre(maestro.fullName);
    setEmail(maestro.email);
    setOpen(true);
  };

  const handleDelete = async (maestro: User) => {
    setItemToDelete(maestro);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await handleDeleteTeacher(itemToDelete.id!);
      setOpenDelete(false);
      setItemToDelete(null);
      await loadMaestros();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setEditingItem(null);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleNewItem = () => {
    router.push('/admin/maestros/nuevo');
  };

  const handleViewAssignments = (maestro: User) => {
    // Aquí puedes implementar la lógica para ver las asignaciones del maestro
    toast.info('Funcionalidad de ver asignaciones en desarrollo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de Maestros</h1>
            <p className="text-gray-600 text-base">Administra los maestros académicos del sistema</p>
          </div>
          <Button 
            onClick={handleNewItem}
            className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-semibold" 
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo maestro
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
                  ? 'Editar maestro'
                  : 'Agregar nuevo maestro'
                }
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? 'Modifica los campos del maestro.'
                  : 'Llena los campos para registrar un nuevo maestro.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input 
                  id="nombre" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  placeholder="Ej. Juan Pérez" 
                  required
                />
              </div>
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
                ¿Estás seguro de que deseas eliminar el maestro "{itemToDelete?.fullName}"? Esta acción no se puede deshacer.
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
            <CardTitle className="text-xl font-bold text-gray-900">Maestros registrados</CardTitle>
            <CardDescription>Consulta, edita o elimina los maestros académicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre Completo</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maestros.map((maestro) => (
                    <TableRow key={maestro.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{maestro.fullName}</TableCell>
                      <TableCell>{maestro.email}</TableCell>
                      <TableCell className="flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="Ver Asignaciones"
                          onClick={() => handleViewAssignments(maestro)}
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {maestros.length} de {totalItems} maestros
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