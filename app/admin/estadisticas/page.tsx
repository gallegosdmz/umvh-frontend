"use client"

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, BarChart3, FileSpreadsheet, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import {
  parseConcentradoExcel,
  computeStatistics,
  type ConcentradoData,
  type StatisticsResult,
} from '@/lib/services/statistics.service';

// Paleta de colores para grupos en las gráficas
const GROUP_COLORS = [
  '#bc4b26', '#003d5c', '#d05f27', '#004a73', '#e8842c',
  '#2a7ab5', '#f5a623', '#1a5276', '#c0392b', '#27ae60',
];

interface LoadedFile {
  file: File;
  groupName: string;
  semester: number;
  periodName: string;
}

export default function EstadisticasPage() {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concentrados, setConcentrados] = useState<ConcentradoData[]>([]);
  const [statistics, setStatistics] = useState<StatisticsResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.promediosGenerales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="semester"
                        tickFormatter={(val) => `Semestre ${val}`}
                      />
                      <YAxis domain={[0, 10]} />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(2), 'Promedio']}
                        labelFormatter={(label) => `Semestre ${label}`}
                      />
                      <Bar dataKey="promedio" name="Promedio" radius={[4, 4, 0, 0]}>
                        {statistics.promediosGenerales.map((_, index) => (
                          <Cell key={index} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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
                              {sem.groups.map((_, index) => (
                                <Cell key={index} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={sem.allCourses.map(course => {
                              const entry: Record<string, string | number> = { name: course };
                              sem.groups.forEach(g => {
                                entry[g.groupName] = g.promediosPorAsignatura[course] || 0;
                              });
                              return entry;
                            })}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-25}
                              textAnchor="end"
                              height={80}
                              interval={0}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis domain={[0, 10]} />
                            <Tooltip formatter={(value: number) => value.toFixed(2)} />
                            <Legend />
                            {sem.groups.map((g, index) => (
                              <Bar
                                key={g.groupName}
                                dataKey={g.groupName}
                                fill={GROUP_COLORS[index % GROUP_COLORS.length]}
                                radius={[2, 2, 0, 0]}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={sem.allCourses.map(course => ({
                              name: course,
                              reprobados: sem.reprobadosPorAsignatura[course] || 0,
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-25}
                              textAnchor="end"
                              height={80}
                              interval={0}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip formatter={(value: number) => [value, 'Reprobados']} />
                            <Bar dataKey="reprobados" name="Reprobados" fill="#c0392b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
