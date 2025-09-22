"use client"

import { Period } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, CheckCircle, BarChart3 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { usePeriod } from '@/lib/hooks/usePeriod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

type PeriodWithPartials = Period & {
  firstPartialActive?: boolean;
  secondPartialActive?: boolean;
  thirdPartialActive?: boolean;
};

// Interfaces para la respuesta de la API de reportes
interface ReportResponse {
  periodId: number;
  generalAverages: GeneralAverage[];
  [groupKey: string]: any; // Claves dinámicas como "groupGRUPOA", "groupGRUPOB", etc.
}

interface GeneralAverage {
  semester: number;
  averagegrade: number;
  totalstudents: string;
}

interface GroupData {
  groupInfo: GroupInfo;
  groupAverages: GroupAverage[];
  groupSubjectAverages: GroupSubjectAverage[];
  failedStudentsBySubject: FailedStudentsBySubject[];
}

interface GroupInfo {
  id: number;
  name: string;
  semester: number;
}

interface GroupAverage {
  groupname: string;
  semester: number;
  averagegrade: number;
  totalstudents: string;
}

interface GroupSubjectAverage {
  groupname: string;
  semester: number;
  coursename: string;
  averagegrade: number;
  totalstudents: string;
}

interface FailedStudentsBySubject {
  coursename: string;
  semester: number;
  failedstudents: string;
  totalstudents: string;
}

export default function PeriodosPage() {
  const { loading, error, totalItems, handleGetPeriods, handleCreatePeriod, handleUpdatePeriod, handleDeletePeriod } = usePeriod();
  const [periodos, setPeriodos] = useState<PeriodWithPartials[]>([]);
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<PeriodWithPartials | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<PeriodWithPartials | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [openFinishPeriod, setOpenFinishPeriod] = useState(false);
  const [periodToFinish, setPeriodToFinish] = useState<PeriodWithPartials | null>(null);
  const [firstPartialActive, setFirstPartialActive] = useState(false);
  const [secondPartialActive, setSecondPartialActive] = useState(false);
  const [thirdPartialActive, setThirdPartialActive] = useState(false);
  const [openCharts, setOpenCharts] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

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

    const periodData: PeriodWithPartials = {
      name: nombre,
      startDate: formatDateToISO(fechaInicio),
      endDate: formatDateToISO(fechaFin),
      firstPartialActive: firstPartialActive,
      secondPartialActive: secondPartialActive,
      thirdPartialActive: thirdPartialActive
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

  const handleEdit = (period: PeriodWithPartials) => {
    setEditingPeriod(period);
    setNombre(period.name);
    setFechaInicio(parseDateFromISO(period.startDate));
    setFechaFin(parseDateFromISO(period.endDate));
    
    // Establecer el estado de cada parcial
    setFirstPartialActive(period.firstPartialActive || false);
    setSecondPartialActive(period.secondPartialActive || false);
    setThirdPartialActive(period.thirdPartialActive || false);
    
    setOpen(true);
  };

  const handleDelete = async (period: PeriodWithPartials) => {
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
    setFirstPartialActive(false);
    setSecondPartialActive(false);
    setThirdPartialActive(false);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFinishPeriod = async (period: PeriodWithPartials) => {
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

  const getAuthHeaders = () => {
    const currentUser = localStorage.getItem("currentUser");
    const user = currentUser ? JSON.parse(currentUser) : null;
  
    return {
      'Content-Type': 'application/json',
      'Authorization': user?.token ? `Bearer ${user.token}` : ''
    };
  };

  const generateReport = async (periodId: number) => {
    setLoadingReport(true);
    setReportError(null);
    setReportData(null);
    
    try {
      const response = await fetch(`https://uamvh.cloud/api/final-grades/reports?periodId=${periodId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: ReportResponse = await response.json();
      console.log('Datos del reporte recibidos:', data);
      console.log('generalAverages:', data.generalAverages);
      console.log('groupAverages:', data.groupAverages);
      console.log('groupSubjectAverages:', data.groupSubjectAverages);
      console.log('failedStudentsBySubject:', data.failedStudentsBySubject);
      
      // Debug de datos procesados
      console.log('Datos procesados generalAverages:', processGeneralAveragesData(data.generalAverages));
      console.log('Datos procesados groupAverages:', processGroupAveragesData(data.groupAverages));
      
      setReportData(data);
      setOpenCharts(true);
    } catch (err) {
      console.error('Error al generar el reporte:', err);
      setReportError(err instanceof Error ? err.message : 'Error desconocido al generar el reporte');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleGenerateReport = () => {
    if (selectedPeriodId) {
      generateReport(selectedPeriodId);
    }
  };

  // Función para procesar datos de promedios generales
  const processGeneralAveragesData = (data: GeneralAverage[]) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      semestre: `Semestre ${item.semester || 'N/A'}`,
      promedio: item.averagegrade || 0,
      estudiantes: parseInt(item.totalstudents) || 0,
      label: `${(item.averagegrade || 0).toFixed(1)}`
    }));
  };

  // Función para procesar datos de promedios por grupo
  const processGroupAveragesData = (data: GroupAverage[]) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      grupo: item.groupname || 'Sin nombre',
      semestre: item.semester || 0,
      promedio: item.averagegrade || 0,
      estudiantes: parseInt(item.totalstudents) || 0,
      label: `${(item.averagegrade || 0).toFixed(1)}`
    }));
  };

  // Función para procesar datos de promedios por grupo y materia
  const processGroupSubjectAveragesData = (data: GroupSubjectAverage[]) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      materia: item.coursename || 'Sin nombre',
      grupo: item.groupname || 'Sin grupo',
      semestre: item.semester || 0,
      promedio: item.averagegrade || 0,
      estudiantes: parseInt(item.totalstudents) || 0,
      label: `${(item.averagegrade || 0).toFixed(1)}`
    }));
  };

  // Función para procesar datos de estudiantes reprobados
  const processFailedStudentsData = (data: FailedStudentsBySubject[]) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const failedStudents = parseInt(item.failedstudents) || 0;
      const totalStudents = parseInt(item.totalstudents) || 1; // Evitar división por 0
      const porcentaje = totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0;
      
      return {
        materia: item.coursename || 'Sin nombre',
        semestre: item.semester || 0,
        reprobados: failedStudents,
        total: totalStudents,
        porcentaje: porcentaje.toFixed(1),
        label: `${failedStudents}/${totalStudents}`
      };
    });
  };

  // Colores para las gráficas
  const COLORS = ['#bc4b26', '#d05f27', '#e67e22', '#f39c12', '#f1c40f', '#2ecc71', '#27ae60', '#16a085', '#3498db', '#2980b9', '#9b59b6', '#8e44ad'];

  // Función para exportar a PDF usando Puppeteer
  const exportToPDF = async () => {
    if (!reportData) return;
    
    setExportingPDF(true);
    
    try {
      // Llamar a la API de generación de PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData,
          periodId: reportData.periodId
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Obtener el PDF como blob
      const pdfBlob = await response.blob();
      
      // Crear URL del blob y descargar
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-calificaciones-periodo-${reportData.periodId}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Agregar al DOM temporalmente para activar la descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setExportingPDF(false);
    }
  };

  // Función para obtener grupos únicos
  const getUniqueGroups = () => {
    if (!reportData) return [];
    const groups: string[] = [];
    
    // Buscar todas las claves que empiecen con "group"
    Object.keys(reportData).forEach(key => {
      if (key.startsWith('group') && reportData[key]?.groupInfo?.name) {
        groups.push(reportData[key].groupInfo.name);
      }
    });
    
    return groups.sort();
  };

  // Función para obtener datos de un grupo específico
  const getGroupData = (groupName: string) => {
    if (!reportData) return { groupAverages: [], groupSubjectAverages: [], failedStudents: [] };
    
    // Buscar la clave del grupo
    const groupKey = Object.keys(reportData).find(key => 
      key.startsWith('group') && reportData[key]?.groupInfo?.name === groupName
    );
    
    if (!groupKey || !reportData[groupKey]) {
      return { groupAverages: [], groupSubjectAverages: [], failedStudents: [] };
    }
    
    const groupData = reportData[groupKey] as GroupData;
    
    return {
      groupAverages: groupData.groupAverages || [],
      groupSubjectAverages: groupData.groupSubjectAverages || [],
      failedStudents: groupData.failedStudentsBySubject || []
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de Periodos</h1>
            <p className="text-gray-600 text-base">Administra los periodos académicos del sistema</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="period-select" className="text-sm font-medium">
                Período:
              </Label>
              <select
                id="period-select"
                value={selectedPeriodId || ''}
                onChange={(e) => setSelectedPeriodId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#bc4b26] focus:border-transparent"
                disabled={loadingReport}
              >
                <option value="">Seleccionar período</option>
                {periodos.map((periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.name}
                  </option>
                ))}
              </select>
            </div>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleGenerateReport}
              disabled={!selectedPeriodId || loadingReport}
              className="border-[#bc4b26] text-[#bc4b26] hover:bg-[#bc4b26] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              {loadingReport ? 'Generando...' : 'Ver Gráficas'}
            </Button>
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
                <div className="flex gap-4">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      id="firstPartialActive"
                      type="checkbox"
                      checked={firstPartialActive}
                      onChange={(e) => setFirstPartialActive(e.target.checked)}
                    />
                    <Label htmlFor="firstPartialActive">
                      Primer Parcial: {firstPartialActive ? 'Abierto' : 'Cerrado'}
                    </Label>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      id="secondPartialActive"
                      type="checkbox"
                      checked={secondPartialActive}
                      onChange={(e) => setSecondPartialActive(e.target.checked)}
                    />
                    <Label htmlFor="secondPartialActive">
                      Segundo Parcial: {secondPartialActive ? 'Abierto' : 'Cerrado'}
                    </Label>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      id="thirdPartialActive"
                      type="checkbox"
                      checked={thirdPartialActive}
                      onChange={(e) => setThirdPartialActive(e.target.checked)}
                    />
                    <Label htmlFor="thirdPartialActive">
                      Tercer Parcial: {thirdPartialActive ? 'Abierto' : 'Cerrado'}
                    </Label>
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
        <Dialog open={openCharts} onOpenChange={setOpenCharts}>
          <DialogContent className="max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reporte de Calificaciones Finales</DialogTitle>
              <DialogDescription>
                {reportData ? `Datos del período ID: ${reportData.periodId}` : 'Visualiza estadísticas y análisis de calificaciones'}
              </DialogDescription>
              {reportData && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={exportToPDF}
                    disabled={exportingPDF}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {exportingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        📄 Exportar PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-6">
              {loadingReport ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bc4b26] mx-auto mb-4"></div>
                  <p>Generando reporte...</p>
                </div>
              ) : reportError ? (
                <div className="text-center text-red-500 py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-medium">Error al generar el reporte</p>
                    <p className="text-sm mt-1">{reportError}</p>
                  </div>
                </div>
              ) : reportData ? (
                <div id="charts-container" className="space-y-8">
                  {/* Promedios Generales por Semestre (Global) */}
                  {reportData.generalAverages && reportData.generalAverages.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        📊 Promedios Generales por Semestre
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={processGeneralAveragesData(reportData.generalAverages)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semestre" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value.toFixed(1)}`, 
                              name === 'promedio' ? 'Promedio' : 'Estudiantes'
                            ]}
                            labelFormatter={(label) => `Semestre: ${label}`}
                          />
                          <Legend />
                          <Bar dataKey="promedio" fill="#bc4b26" name="Promedio">
                            <LabelList 
                              dataKey="label" 
                              position="top" 
                              style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Gráficas agrupadas por Grupo */}
                  {getUniqueGroups().map((groupName, groupIndex) => {
                    const groupData = getGroupData(groupName);
                    const color = COLORS[groupIndex % COLORS.length];
                    
                    return (
                      <div key={groupName} className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border-2 border-gray-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                            GRUPO
                          </span>
                          {groupName}
                        </h2>
                        
                        <div className="space-y-6">
                          {/* Promedio del Grupo */}
                          {groupData.groupAverages.length > 0 && (
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                📈 Promedio del Grupo
                              </h3>
                              <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={processGroupAveragesData(groupData.groupAverages)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="grupo" />
                                  <YAxis domain={[0, 10]} />
                                  <Tooltip 
                                    formatter={(value: number, name: string) => [
                                      `${value.toFixed(1)}`, 
                                      name === 'promedio' ? 'Promedio' : 'Estudiantes'
                                    ]}
                                    labelFormatter={(label) => `Grupo: ${label}`}
                                  />
                                  <Legend />
                                  <Bar dataKey="promedio" fill={color} name="Promedio">
                                    <LabelList 
                                      dataKey="label" 
                                      position="top" 
                                      style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Estudiantes Reprobados del Grupo */}
                          {groupData.failedStudents.length > 0 && (
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                ❌ Estudiantes Reprobados
                              </h3>
                              <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={processFailedStudentsData(groupData.failedStudents)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="materia" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                  />
                                  <YAxis />
                                  <Tooltip 
                                    formatter={(value: number, name: string) => {
                                      if (name === 'reprobados') {
                                        return [value, 'Reprobados'];
                                      }
                                      return [value, 'Total'];
                                    }}
                                    labelFormatter={(label, payload) => {
                                      if (payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return `Materia: ${label} - ${data.porcentaje}% reprobados`;
                                      }
                                      return `Materia: ${label}`;
                                    }}
                                  />
                                  <Legend />
                                  <Bar dataKey="reprobados" fill="#e74c3c" name="Reprobados">
                                    <LabelList 
                                      dataKey="label" 
                                      position="top" 
                                      style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                  </Bar>
                                  <Bar dataKey="total" fill="#95a5a6" name="Total" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>

                        {/* Promedios por Materia del Grupo */}
                        {groupData.groupSubjectAverages.length > 0 && (
                          <div className="mt-6 bg-white p-4 rounded-lg border shadow-sm">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">
                              📚 Promedios por Materia
                            </h3>
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart data={processGroupSubjectAveragesData(groupData.groupSubjectAverages)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="materia" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={100}
                                />
                                <YAxis domain={[0, 10]} />
                                <Tooltip 
                                  formatter={(value: number, name: string) => [
                                    `${value.toFixed(1)}%`, 
                                    name === 'promedio' ? 'Promedio' : 'Estudiantes'
                                  ]}
                                  labelFormatter={(label) => `Materia: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="promedio" fill={color} name="Promedio">
                                  <LabelList 
                                    dataKey="label" 
                                    position="top" 
                                    style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona un período para generar el reporte</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setOpenCharts(false);
                  setReportData(null);
                  setReportError(null);
                }}
              >
                Cerrar
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
