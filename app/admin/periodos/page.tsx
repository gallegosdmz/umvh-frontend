"use client"

import { Period } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { usePeriod } from '@/lib/hooks/usePeriod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PeriodosPage() {
  const { loading, error, totalItems, handleGetPeriods, handleCreatePeriod, handleUpdatePeriod, handleDeletePeriod } = usePeriod();
  const [periodos, setPeriodos] = useState<Period[]>([]);
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<Period | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [openFinishPeriod, setOpenFinishPeriod] = useState(false);
  const [periodToFinish, setPeriodToFinish] = useState<Period | null>(null);

  useEffect(() => {
    loadPeriods();
  }, [currentPage]);

  const loadPeriods = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const data = await handleGetPeriods(itemsPerPage, offset);
      console.log('Datos recibidos en la página:', data);
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar los períodos:', err);
    }
  };

  const formatDateToISO = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const parseDateFromISO = (dateString: string): Date => {
    return parseISO(dateString);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !fechaInicio || !fechaFin) {
      return;
    }

    const periodData: Period = {
      name: nombre,
      startDate: formatDateToISO(fechaInicio),
      endDate: formatDateToISO(fechaFin)
    };

    try {
      if (editingPeriod) {
        await handleUpdatePeriod(editingPeriod.id!, periodData);
      } else {
        await handleCreatePeriod(periodData);
      }
      setOpen(false);
      resetForm();
      loadPeriods();
    } catch (err) {
      console.error('Error al guardar el período:', err);
    }
  };

  const handleEdit = (period: Period) => {
    setEditingPeriod(period);
    setNombre(period.name);
    setFechaInicio(parseDateFromISO(period.startDate));
    setFechaFin(parseDateFromISO(period.endDate));
    setOpen(true);
  };

  const handleDelete = async (period: Period) => {
    setPeriodToDelete(period);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!periodToDelete) return;
    
    try {
      await handleDeletePeriod(periodToDelete.id!);
      setOpenDelete(false);
      setPeriodToDelete(null);
      loadPeriods();
    } catch (err) {
      console.error('Error al eliminar el período:', err);
    }
  };

  const resetForm = () => {
    setNombre("");
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setEditingPeriod(null);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFinishPeriod = async (period: Period) => {
    setPeriodToFinish(period);
    setOpenFinishPeriod(true);
  };

  const confirmFinishPeriod = async () => {
    if (!periodToFinish) return;
    
    try {
      const { id, isDeleted, ...periodData } = periodToFinish;
      await handleUpdatePeriod(periodToFinish.id!, { ...periodData, isActive: false });
      setOpenFinishPeriod(false);
      setPeriodToFinish(null);
      loadPeriods();
    } catch (err) {
      console.error('Error al finalizar el período:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de Periodos</h1>
            <p className="text-gray-600 text-base">Administra los periodos académicos del sistema</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a03d1f] hover:to-[#bc4b26] text-white font-semibold" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Nuevo periodo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>{editingPeriod ? 'Editar periodo' : 'Agregar nuevo periodo'}</DialogTitle>
                <DialogDescription>
                  {editingPeriod ? 'Modifica los campos del periodo académico.' : 'Llena los campos para registrar un nuevo periodo académico.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input 
                    id="nombre" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    placeholder="Ej. 2024-2025 A" 
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="fecha-inicio">Fecha de inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={"w-full justify-start text-left font-normal " + (fechaInicio ? '' : 'text-muted-foreground')}
                        >
                          {fechaInicio ? format(fechaInicio, 'PPP', { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="single"
                          selected={fechaInicio}
                          onSelect={setFechaInicio}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="fecha-fin">Fecha de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={"w-full justify-start text-left font-normal " + (fechaFin ? '' : 'text-muted-foreground')}
                        >
                          {fechaFin ? format(fechaFin, 'PPP', { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="single"
                          selected={fechaFin}
                          onSelect={setFechaFin}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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
        </div>
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el período "{periodToDelete?.name}"? Esta acción no se puede deshacer.
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
        <Dialog open={openFinishPeriod} onOpenChange={setOpenFinishPeriod}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar finalización</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas finalizar el período "{periodToFinish?.name}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpenFinishPeriod(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={confirmFinishPeriod}
                disabled={loading}
              >
                {loading ? 'Finalizando...' : 'Finalizar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-900">Periodos registrados</CardTitle>
            <CardDescription>Consulta, edita o elimina los periodos académicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Fecha de inicio</TableHead>
                    <TableHead className="font-semibold">Fecha de fin</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodos.map((periodo) => (
                    <TableRow key={periodo.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{periodo.name}</TableCell>
                      <TableCell>{format(parseDateFromISO(periodo.startDate), 'PPP', { locale: es })}</TableCell>
                      <TableCell>{format(parseDateFromISO(periodo.endDate), 'PPP', { locale: es })}</TableCell>
                      <TableCell>
                        {periodo.isActive ? (
                          <Badge variant="default">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2 justify-center">
                        {periodo.isActive && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Finalizar período"
                            onClick={() => handleFinishPeriod(periodo)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="Editar"
                          onClick={() => handleEdit(periodo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          title="Eliminar"
                          onClick={() => handleDelete(periodo)}
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
                Mostrando {periodos.length} de {totalItems} períodos
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
      </div>
    </div>
  );
}
