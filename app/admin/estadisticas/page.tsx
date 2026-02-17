"use client"

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, BarChart3, FileSpreadsheet, Loader2, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import {
  parseConcentradoExcel,
  computeStatistics,
  type ConcentradoData,
  type StatisticsResult,
  type SemesterStatistics,
} from '@/lib/services/statistics.service';

// Paleta de colores para grupos en las gráficas
const GROUP_COLORS = [
  '#bc4b26', '#003d5c', '#d05f27', '#004a73', '#e8842c',
  '#2a7ab5', '#f5a623', '#1a5276', '#c0392b', '#27ae60',
];

// Dimensiones para captura PDF (landscape A4 proporciones)
const PDF_WIDTH = 1120;
const PDF_HEIGHT = 720;

interface LoadedFile {
  file: File;
  groupName: string;
  semester: number;
  periodName: string;
}

// Componentes de gráficas reutilizables (para pantalla y PDF)
function ChartPromediosGenerales({ data }: { data: StatisticsResult['promediosGenerales'] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="semester" tickFormatter={(val) => `Semestre ${val}`} />
        <YAxis domain={[0, 10]} />
        <Tooltip
          formatter={(value: number) => [value.toFixed(2), 'Promedio']}
          labelFormatter={(label) => `Semestre ${label}`}
        />
        <Bar dataKey="promedio" name="Promedio" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="promedio" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 12, fontWeight: 'bold', fill: '#333' }} />
          {data.map((_, index) => (
            <Cell key={index} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartPromediosPorGrupo({ sem }: { sem: SemesterStatistics }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sem.groups.map(g => ({ name: g.groupName, promedio: g.promedio }))}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 10]} />
        <Tooltip formatter={(value: number) => [value.toFixed(2), 'Promedio']} />
        <Bar dataKey="promedio" name="Promedio" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="promedio" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 12, fontWeight: 'bold', fill: '#333' }} />
          {sem.groups.map((_, index) => (
            <Cell key={index} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartPromediosPorGrupoAsignatura({ sem }: { sem: SemesterStatistics }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sem.allCourses.map(course => {
          const entry: Record<string, string | number> = { name: course };
          sem.groups.forEach(g => {
            entry[g.groupName] = g.promediosPorAsignatura[course] || 0;
          });
          return entry;
        })}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-25} textAnchor="end" height={100} interval={0} tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} />
        <Tooltip formatter={(value: number) => value.toFixed(2)} />
        <Legend />
        {sem.groups.map((g, index) => (
          <Bar key={g.groupName} dataKey={g.groupName} fill={GROUP_COLORS[index % GROUP_COLORS.length]} radius={[2, 2, 0, 0]}>
            <LabelList position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fill: '#333' }} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartReprobados({ sem }: { sem: SemesterStatistics }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sem.allCourses.map(course => ({
          name: course,
          reprobados: sem.reprobadosPorAsignatura[course] || 0,
        }))}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-25} textAnchor="end" height={100} interval={0} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip formatter={(value: number) => [value, 'Reprobados']} />
        <Bar dataKey="reprobados" name="Reprobados" fill="#c0392b" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="reprobados" position="top" style={{ fontSize: 12, fontWeight: 'bold', fill: '#333' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function EstadisticasPage() {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concentrados, setConcentrados] = useState<ConcentradoData[]>([]);
  const [statistics, setStatistics] = useState<StatisticsResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setParsing(true);
    setError(null);

    const newFiles: LoadedFile[] = [];
    const newConcentrados: ConcentradoData[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.xlsx')) {
        errors.push(`${file.name}: No es un archivo .xlsx`);
        continue;
      }
      try {
        const data = await parseConcentradoExcel(file);
        newFiles.push({
          file,
          groupName: data.groupName,
          semester: data.semester,
          periodName: data.periodName,
        });
        newConcentrados.push(data);
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setLoadedFiles(prev => [...prev, ...newFiles]);
    setConcentrados(prev => [...prev, ...newConcentrados]);
    setParsing(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setLoadedFiles(prev => prev.filter((_, i) => i !== index));
    setConcentrados(prev => prev.filter((_, i) => i !== index));
    setStatistics(null);
  }, []);

  const clearAll = useCallback(() => {
    setLoadedFiles([]);
    setConcentrados([]);
    setStatistics(null);
    setError(null);
  }, []);

  const generateStatistics = useCallback(() => {
    if (concentrados.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const result = computeStatistics(concentrados);
      setStatistics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar estadísticas');
    }
    setGenerating(false);
  }, [concentrados]);

  const exportPDF = useCallback(async () => {
    if (!statistics || !pdfContainerRef.current) return;
    setExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const chartElements = pdfContainerRef.current.querySelectorAll<HTMLElement>('[data-pdf-chart]');

      for (let i = 0; i < chartElements.length; i++) {
        const el = chartElements[i];

        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) pdf.addPage();

        // Margen de 10mm
        const margin = 10;
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = pageHeight - margin * 2;

        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      }

      pdf.save('Estadisticas_Calificaciones.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar PDF');
    }

    setExporting(false);
  }, [statistics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-[#bc4b26] mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
              <p className="text-gray-600">Carga los concentrados de calificaciones para generar gráficas</p>
            </div>
          </div>
        </div>

        {/* Upload zone */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Cargar Concentrados</CardTitle>
            <CardDescription>
              Sube los archivos Excel generados con &quot;Generar Concentrado Excel&quot; de cada grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-[#bc4b26] bg-orange-50'
                  : 'border-gray-300 hover:border-[#bc4b26] hover:bg-orange-50/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {parsing ? (
                <Loader2 className="h-10 w-10 mx-auto text-[#bc4b26] animate-spin mb-2" />
              ) : (
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              )}
              <p className="text-gray-600 font-medium">
                {parsing ? 'Procesando archivos...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-gray-400 mt-1">Solo archivos .xlsx (concentrados de calificaciones)</p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Error messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            )}

            {/* Loaded files list */}
            {loadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Archivos cargados ({loadedFiles.length})
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-700">
                    Limpiar todo
                  </Button>
                </div>
                {loadedFiles.map((lf, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lf.file.name}</p>
                        <p className="text-xs text-gray-500">
                          Grupo: <span className="font-medium">{lf.groupName}</span>
                          {' | '}Semestre: <span className="font-medium">{lf.semester}</span>
                          {lf.periodName && <>{' | '}Período: <span className="font-medium">{lf.periodName}</span></>}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={generateStatistics}
                  disabled={generating || loadedFiles.length === 0}
                  className="w-full mt-3 bg-gradient-to-r from-[#bc4b26] to-[#d05f27] hover:from-[#a3401f] hover:to-[#b85220] text-white"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
                  ) : (
                    <><BarChart3 className="h-4 w-4 mr-2" /> Generar Estadísticas</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts section */}
        {statistics && (
          <div className="space-y-6">
            {/* Export PDF button */}
            <div className="flex justify-end">
              <Button
                onClick={exportPDF}
                disabled={exporting}
                variant="outline"
                className="border-[#003d5c] text-[#003d5c] hover:bg-[#003d5c] hover:text-white"
              >
                {exporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exportando PDF...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> Exportar PDF</>
                )}
              </Button>
            </div>

            {/* Promedios Generales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#bc4b26]" />
                  Promedios Generales por Semestre
                </CardTitle>
                <CardDescription>
                  Promedio general de todos los alumnos por cada semestre
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartPromediosGenerales data={statistics.promediosGenerales} />
                </div>
              </CardContent>
            </Card>

            {/* Tabs por semestre */}
            <Tabs defaultValue={String(statistics.semestres[0]?.semester || 1)}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                {statistics.semestres.map((sem) => (
                  <TabsTrigger key={sem.semester} value={String(sem.semester)}>
                    Semestre {sem.semester}
                  </TabsTrigger>
                ))}
              </TabsList>

              {statistics.semestres.map((sem) => (
                <TabsContent key={sem.semester} value={String(sem.semester)} className="space-y-6">
                  {/* Promedios por Grupo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Promedios por Grupo</CardTitle>
                      <CardDescription>Promedio general de cada grupo en el semestre {sem.semester}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ChartPromediosPorGrupo sem={sem} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Promedios por Grupo por Asignatura */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Promedios por Grupo por Asignatura</CardTitle>
                      <CardDescription>Promedio de cada asignatura desglosado por grupo en el semestre {sem.semester}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ChartPromediosPorGrupoAsignatura sem={sem} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alumnos Reprobados por Asignatura */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Alumnos Reprobados por Asignatura</CardTitle>
                      <CardDescription>Cantidad de alumnos con calificación final menor a 7 por asignatura en el semestre {sem.semester}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ChartReprobados sem={sem} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Hidden off-screen container for PDF rendering */}
        {statistics && (
          <div
            ref={pdfContainerRef}
            style={{ position: 'fixed', left: '-10000px', top: 0 }}
            aria-hidden="true"
          >
            {/* Página 1: Promedios Generales */}
            <div
              data-pdf-chart="promedios-generales"
              style={{ width: PDF_WIDTH, height: PDF_HEIGHT, background: '#fff', padding: 32 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111', margin: 0 }}>
                  Promedios Generales por Semestre
                </h2>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
                  Promedio general de todos los alumnos por cada semestre
                </p>
              </div>
              <div style={{ width: PDF_WIDTH - 64, height: PDF_HEIGHT - 120 }}>
                <ChartPromediosGenerales data={statistics.promediosGenerales} />
              </div>
            </div>

            {/* Páginas por semestre */}
            {statistics.semestres.map((sem) => (
              <React.Fragment key={sem.semester}>
                {/* Promedios por Grupo */}
                <div
                  data-pdf-chart={`sem${sem.semester}-promedios-grupo`}
                  style={{ width: PDF_WIDTH, height: PDF_HEIGHT, background: '#fff', padding: 32 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111', margin: 0 }}>
                      Promedios por Grupo - Semestre {sem.semester}
                    </h2>
                    <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
                      Promedio general de cada grupo
                    </p>
                  </div>
                  <div style={{ width: PDF_WIDTH - 64, height: PDF_HEIGHT - 120 }}>
                    <ChartPromediosPorGrupo sem={sem} />
                  </div>
                </div>

                {/* Promedios por Grupo por Asignatura */}
                <div
                  data-pdf-chart={`sem${sem.semester}-promedios-asignatura`}
                  style={{ width: PDF_WIDTH, height: PDF_HEIGHT, background: '#fff', padding: 32 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111', margin: 0 }}>
                      Promedios por Grupo por Asignatura - Semestre {sem.semester}
                    </h2>
                    <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
                      Promedio de cada asignatura desglosado por grupo
                    </p>
                  </div>
                  <div style={{ width: PDF_WIDTH - 64, height: PDF_HEIGHT - 120 }}>
                    <ChartPromediosPorGrupoAsignatura sem={sem} />
                  </div>
                </div>

                {/* Reprobados por Asignatura */}
                <div
                  data-pdf-chart={`sem${sem.semester}-reprobados`}
                  style={{ width: PDF_WIDTH, height: PDF_HEIGHT, background: '#fff', padding: 32 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111', margin: 0 }}>
                      Alumnos Reprobados por Asignatura - Semestre {sem.semester}
                    </h2>
                    <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
                      Cantidad de alumnos con calificación final menor a 7
                    </p>
                  </div>
                  <div style={{ width: PDF_WIDTH - 64, height: PDF_HEIGHT - 120 }}>
                    <ChartReprobados sem={sem} />
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
