"use client"

import ExcelJS from 'exceljs';
import { Student, Group, Period, CreateGroupDto } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Users, FileText, FileSpreadsheet, X } from 'lucide-react';
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

interface IBoletaProcessed {
  fullName: string;
  registrationNumber: string;
  groupName: string;
  periodName: string;
  semester: number;
  courses: {
    name: string;
    grades: {
      grade: number | null;
      partial: number;
    }[];
    finalGrades: {
      gradeOrdinary: number | null;
      gradeExtraordinary: number | null;
    };
    promedioFinal: number | null;
  }[];
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
  const [editingItem, setEditingItem] = useState<Student | Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showGrupos, setShowGrupos] = useState(false);
  const itemsPerPage = 20;
  const [openAssignStudents, setOpenAssignStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [generatingBoleta, setGeneratingBoleta] = useState<string | null>(null);
  const [generatingExcel, setGeneratingExcel] = useState<string | null>(null);
  const [openBoletaModal, setOpenBoletaModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedData, setProcessedData] = useState<Map<string, IBoletaProcessed>>(new Map());
  const [boletaPeriodo, setBoletaPeriodo] = useState("");
  const [boletaSemestre, setBoletaSemestre] = useState("");
  const [openWarningsModal, setOpenWarningsModal] = useState(false);
  const [processingWarnings, setProcessingWarnings] = useState<string[]>([]);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);

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

  // Funciones                                                                                           
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  // Procesar todos los archivos Excel                                                                   
  const processAllExcelFiles = async (
    files: File[],
    periodName: string,
    semester: number
  ): Promise<{ dataMap: Map<string, IBoletaProcessed>, warnings: string[], errors: string[] }> => {
    const dataMap = new Map<string, IBoletaProcessed>();
    const warnings: string[] = [];
    const errors: string[] = [];
    const processedMatriculasInFile = new Set<string>(); // Para detectar duplicados en el mismo archivo

    for (const file of files) {
      try {
        processedMatriculasInFile.clear(); // Limpiar para cada archivo
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          warnings.push(`⚠️ Archivo "${file.name}": No contiene hojas de cálculo válidas`);
          continue;
        }

        // Validar estructura básica del archivo
        try {
          getCellValue(worksheet.getCell('C5'));
          getCellValue(worksheet.getCell('C6'));
          getCellValue(worksheet.getCell('C7'));
        } catch (e) {
          errors.push(`❌ Archivo "${file.name}": Estructura inválida (faltan encabezados)`);
          continue;
        }

        const groupName = String(getCellValue(worksheet.getCell('C5')) || '').trim();
        const asignatura = String(getCellValue(worksheet.getCell('C6')) || '').trim();
        const docente = String(getCellValue(worksheet.getCell('C7')) || '').trim();

        if (!asignatura) {
          warnings.push(`⚠️ Archivo "${file.name}": No se encontró nombre de asignatura`);
        }

        console.log(`📁 Procesando: ${file.name}`);
        console.log(`   Grupo: ${groupName}, Asignatura: ${asignatura}, Docente: ${docente}`);

        let row = 10;
        let alumnosEnArchivo = 0;

        while (true) {
          const matriculaCell = worksheet.getCell(`B${row}`);
          const matricula = getCellValue(matriculaCell);

          // Detectar fin de datos (celda vacía o nula)
          if (!matricula || matricula === '' || matricula === null) {
            break;
          }

          const registrationNumber = String(matricula).trim();
          
          // Validar matrícula
          if (!registrationNumber || registrationNumber === '') {
            row++;
            continue;
          }

          // CASO EDGE 1: Detectar duplicados en el mismo archivo
          if (processedMatriculasInFile.has(registrationNumber)) {
            warnings.push(`⚠️ Archivo "${file.name}": Matrícula ${registrationNumber} duplicada en la fila ${row}`);
            row++;
            continue;
          }
          processedMatriculasInFile.add(registrationNumber);

          const fullName = String(getCellValue(worksheet.getCell(`C${row}`)) || '').trim();

          // Validar que tenga nombre
          if (!fullName || fullName === '') {
            warnings.push(`⚠️ Archivo "${file.name}": Matrícula ${registrationNumber} sin nombre en fila ${row}`);
            row++;
            continue;
          }

          const parcial1 = getNumericValue(worksheet.getCell(`D${row}`));
          const parcial2 = getNumericValue(worksheet.getCell(`E${row}`));
          const parcial3 = getNumericValue(worksheet.getCell(`F${row}`));
          const promedio = getNumericValue(worksheet.getCell(`G${row}`));
          const ordinario = getNumericValue(worksheet.getCell(`J${row}`));
          const extraordinario = getNumericValue(worksheet.getCell(`L${row}`));

          let promedioFinal: number | null;
          if (extraordinario !== null) {
            promedioFinal = extraordinario;
          } else if (ordinario !== null) {
            promedioFinal = ordinario;
          } else {
            promedioFinal = promedio;
          }

          const courseData = {
            name: asignatura,
            grades: [
              { grade: parcial1, partial: 1 },
              { grade: parcial2, partial: 2 },
              { grade: parcial3, partial: 3 },
            ],
            finalGrades: {
              gradeOrdinary: ordinario,
              gradeExtraordinary: extraordinario,
            },
            promedioFinal,
          };

          if (dataMap.has(registrationNumber)) {
            const existing = dataMap.get(registrationNumber)!;
            
            // CASO EDGE 2: Alumno con misma matrícula pero nombre diferente
            if (existing.fullName !== fullName && existing.fullName !== '' && fullName !== '') {
              // Usar el nombre más completo (más largo)
              if (fullName.length > existing.fullName.length) {
                warnings.push(`⚠️ Matrícula ${registrationNumber}: Nombre diferente detectado. Original: "${existing.fullName}", Nuevo: "${fullName}". Se usará el más completo.`);
                existing.fullName = fullName;
              } else {
                warnings.push(`⚠️ Matrícula ${registrationNumber}: Nombre diferente detectado. Original: "${existing.fullName}", Nuevo: "${fullName}". Se mantiene el original.`);
              }
            }

            // CASO EDGE 3: Diferente grupo para el mismo alumno
            if (existing.groupName !== groupName && groupName !== '') {
              warnings.push(`⚠️ Matrícula ${registrationNumber}: Diferente grupo detectado. Original: "${existing.groupName}", Nuevo: "${groupName}". Se mantiene el original.`);
            }

            // CASO EDGE 4: Materia duplicada para el mismo alumno
            const materiaExistente = existing.courses.find(c => c.name === asignatura);
            if (materiaExistente) {
              warnings.push(`⚠️ Matrícula ${registrationNumber}: Materia "${asignatura}" duplicada. Se reemplazará con los datos más recientes.`);
              // Reemplazar la materia existente en lugar de duplicar
              const index = existing.courses.findIndex(c => c.name === asignatura);
              existing.courses[index] = courseData;
            } else {
              existing.courses.push(courseData);
            }
          } else {
            dataMap.set(registrationNumber, {
              fullName,
              registrationNumber,
              groupName,
              periodName,
              semester,
              courses: [courseData],
            });
          }

          alumnosEnArchivo++;
          row++;
        }

        console.log(`   Alumnos procesados: ${alumnosEnArchivo}`);
      } catch (error) {
        const errorMsg = `❌ Error procesando archivo "${file.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    // Mostrar resumen de advertencias y errores
    if (warnings.length > 0) {
      console.warn('📋 Advertencias durante el procesamiento:');
      warnings.forEach(w => console.warn(w));
    }

    if (errors.length > 0) {
      console.error('❌ Errores durante el procesamiento:');
      errors.forEach(e => console.error(e));
    }

    // CASO EDGE 5: Validar que todos los alumnos tengan al menos una materia
    const alumnosSinMaterias: string[] = [];
    dataMap.forEach((boleta, matricula) => {
      if (boleta.courses.length === 0) {
        alumnosSinMaterias.push(matricula);
      }
    });

    if (alumnosSinMaterias.length > 0) {
      warnings.push(`⚠️ ${alumnosSinMaterias.length} alumno(s) sin materias: ${alumnosSinMaterias.join(', ')}`);
    }

    // Mostrar resumen final
    console.log(`\n✅ Procesamiento completado:`);
    console.log(`   Total de alumnos: ${dataMap.size}`);
    console.log(`   Advertencias: ${warnings.length}`);
    console.log(`   Errores: ${errors.length}`);

    return { dataMap, warnings, errors };
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // Limpiar datos procesados cuando se elimina un archivo                                             
    setProcessedData(new Map());
  };

  // Función para obtener el valor real de una celda                                                     
  const getCellValue = (cell: ExcelJS.Cell): string | number | null => {
    if (cell.value === null || cell.value === undefined) {
      return null;
    }

    if (typeof cell.value === 'object') {
      const val = cell.value as any;
      if (val.result !== undefined) {
        return val.result;
      }
      if (val.richText) {
        return val.richText.map((rt: any) => rt.text).join('');
      }
      if (val.text) {
        return val.text;
      }
      return null;
    }

    return cell.value as string | number;
  };

  // Función para obtener valor numérico de una celda                                                    
  const getNumericValue = (cell: ExcelJS.Cell): number | null => {
    const value = getCellValue(cell);
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  };

  const handleGenerateBoletas = async () => {
    if (selectedFiles.length === 0) return;

    if (!boletaPeriodo || !boletaSemestre) {
      toast.error('Debes ingresar el período y el semestre');
      return;
    }

    setGeneratingBoleta('modal');
    // Limpiar advertencias y errores previos
    setProcessingWarnings([]);
    setProcessingErrors([]);
    try {
      const { dataMap, warnings, errors } = await processAllExcelFiles(
        selectedFiles,
        boletaPeriodo,
        Number(boletaSemestre)
      );
      setProcessedData(dataMap);
      setProcessingWarnings(warnings);
      setProcessingErrors(errors);

      const boletasArray = Array.from(dataMap.values());

      // Mostrar modal con advertencias/errores si existen
      if (warnings.length > 0 || errors.length > 0) {
        setOpenWarningsModal(true);
      }

      console.log('📊 ===== DATOS PROCESADOS =====');
      console.log(`Total de alumnos: ${boletasArray.length}`);

      boletasArray.forEach((boleta, index) => {
        console.log(`\n👤 Alumno ${index + 1}:`);
        console.log(`   Nombre: ${boleta.fullName}`);
        console.log(`   Matrícula: ${boleta.registrationNumber}`);
        console.log(`   Grupo: ${boleta.groupName}`);
        console.log(`   Período: ${boleta.periodName}`);
        console.log(`   Semestre: ${boleta.semester}`);
        console.log(`   Materias: ${boleta.courses.length}`);

        boleta.courses.forEach((course) => {
          console.log(`\n   📚 ${course.name}:`);
          console.log(`      Parcial 1: ${course.grades[0].grade ?? 'N/A'}`);
          console.log(`      Parcial 2: ${course.grades[1].grade ?? 'N/A'}`);
          console.log(`      Parcial 3: ${course.grades[2].grade ?? 'N/A'}`);
          console.log(`      Ordinario: ${course.finalGrades.gradeOrdinary ?? 'N/A'}`);
          console.log(`      Extraordinario: ${course.finalGrades.gradeExtraordinary ?? 'N/A'}`);
          console.log(`      Promedio Final: ${course.promedioFinal ?? 'N/A'}`);
        });
      });

      console.log('\n📊 ===== FIN DATOS PROCESADOS =====');

      // Generar el documento Word                                                                       
      const blob = await WordDocumentService.generateGroupBoleta(boletasArray);
      const filename = `Boletas_${boletaPeriodo}_${new Date().toISOString().split('T')[0]}.docx`;
      WordDocumentService.downloadDocument(blob, filename);

      // Mensaje de éxito adaptado según si hay advertencias
      if (warnings.length > 0 || errors.length > 0) {
        toast.success(`Boletas generadas: ${boletasArray.length} alumnos. Revisa las advertencias.`, {
          autoClose: 4000,
        });
      } else {
        toast.success(`Boletas generadas correctamente: ${boletasArray.length} alumnos`);
      }

      setOpenBoletaModal(false);
      setSelectedFiles([]);
      setBoletaPeriodo("");
      setBoletaSemestre("");

    } catch (error) {
      console.error('Error generando boletas:', error);
      toast.error('Error al procesar los archivos');
    } finally {
      setGeneratingBoleta(null);
    }
  };

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

    setFilteredStudents(filtered);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de Alumnos y Grupos</h1>
            <p className="text-gray-600 text-base">Administra los grupos y alumnos del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setOpenBoletaModal(true)}
              variant="outline"
              size="lg"
              className="border-[#bc4b26] text-[#bc4b26] hover:bg-[#bc4b26] hover:text-white"
            >
              <FileText className="h-5 w-5 mr-2" />
              Generar Boletín
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
          </div>
        </div>

        {/* Modal para generar boletas */}
        <Dialog open={openBoletaModal} onOpenChange={setOpenBoletaModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generar Boletas</DialogTitle>
              <DialogDescription>
                Sube los archivos Excel de calificaciones para generar las boletas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Período y Semestre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boleta-periodo">Período</Label>
                  <Input
                    id="boleta-periodo"
                    value={boletaPeriodo}
                    onChange={e => setBoletaPeriodo(e.target.value)}
                    placeholder="Ej. Enero - Junio 2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boleta-semestre">Semestre</Label>
                  <Input
                    id="boleta-semestre"
                    type="number"
                    min="1"
                    max="12"
                    value={boletaSemestre}
                    onChange={e => setBoletaSemestre(e.target.value)}
                    placeholder="Ej. 1"
                    required
                  />
                </div>
              </div>

              {/* Input de archivos */}
              <div className="space-y-2">
                <Label htmlFor="excel-files">Archivos Excel</Label>
                <Input
                  id="excel-files"
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Puedes seleccionar múltiples archivos Excel (.xlsx, .xls, .xlsm)
                </p>
              </div>

              {/* Lista de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Archivos seleccionados ({selectedFiles.length})</Label>
                  <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span className="text-sm truncate max-w-[300px]">
                            {file.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenBoletaModal(false);
                  setSelectedFiles([]);
                  setBoletaPeriodo("");
                  setBoletaSemestre("");
                  setProcessingWarnings([]);
                  setProcessingErrors([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateBoletas}
                disabled={selectedFiles.length === 0 || generatingBoleta !== null}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
              >
                {generatingBoleta === 'modal' ? 'Generando...' : 'Generar Boletas'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para mostrar advertencias y errores */}
        <Dialog open={openWarningsModal} onOpenChange={setOpenWarningsModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {processingErrors.length > 0 && (
                  <span className="text-red-600">⚠️ Errores y Advertencias</span>
                )}
                {processingErrors.length === 0 && processingWarnings.length > 0 && (
                  <span className="text-yellow-600">⚠️ Advertencias</span>
                )}
              </DialogTitle>
              <DialogDescription>
                Se encontraron {processingWarnings.length} advertencia(s) y {processingErrors.length} error(es) durante el procesamiento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Errores */}
              {processingErrors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600 flex items-center gap-2">
                    <span>❌ Errores ({processingErrors.length})</span>
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                    {processingErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span className="flex-1">{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advertencias */}
              {processingWarnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                    <span>⚠️ Advertencias ({processingWarnings.length})</span>
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2 max-h-[300px] overflow-y-auto">
                    {processingWarnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span className="flex-1">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Las boletas se generaron correctamente, pero algunos datos pueden requerir revisión.
                  {processingErrors.length > 0 && (
                    <span className="block mt-1">Algunos archivos no pudieron procesarse completamente.</span>
                  )}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setOpenWarningsModal(false);
                  setProcessingWarnings([]);
                  setProcessingErrors([]);
                }}
                className="bg-gradient-to-r from-[#bc4b26] to-[#d05f27] text-white font-semibold"
              >
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
