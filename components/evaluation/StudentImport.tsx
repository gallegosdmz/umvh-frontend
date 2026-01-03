import { Alumno } from "@/lib/types/alumno";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

import ExcelJS from 'exceljs';

interface AlumnoImportProps {
  onStudentChange: (alumnos: Alumno[]) => void,
  alumnos: Alumno[],
}

export function StudentImport({ onStudentChange, alumnos }: AlumnoImportProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseExcel = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet)
        throw new Error('El archivo no contiene hojas de cálculo');

      const parsedAlumnos: Alumno[] = [];

      worksheet.eachRow((row) => {
        const matriculaCell = row.getCell(3).value;
        const nombreCell = row.getCell(4).value;

        const matricula = matriculaCell?.toString().trim();
        const nombre = nombreCell?.toString().trim();

        // Validaciones reales según tu Excel
        if (
          matricula &&
          nombre &&
          /^\d{8,}$/.test(matricula) // matrícula válida
        ) {
          parsedAlumnos.push({
            matricula,
            nombre,
          });
        }
      });

      if (parsedAlumnos.length === 0) {
        throw new Error(
          'No se encontraron alumnos válidos en el archivo.'
        );
      }


      setFileName(file.name);
      onStudentChange(parsedAlumnos);

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al procesar el archivo';

      setError(message);
      onStudentChange([]);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, [onStudentChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file)
      parseExcel(file);
  }

  const handleClear = () => {
    setFileName(null);
    setError(null);
    onStudentChange([]);

    if (inputRef.current)
      inputRef.current.value = '';
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      parseExcel(file);
    } else {
      setError('Solo se permitan archivos Excel (.xlsx, .xls)');
    }
  }, [parseExcel]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Lista de Alumnos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Procesando archivo..."
            ) : fileName ? (
              <span className="text-foreground font-medium">{fileName}</span>
            ) : (
              <>
                Arrastra un archivo Excel o{" "}
                <span className="text-primary font-medium">haz clic para seleccionar</span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formatos: .xlsx, .xls | Columnas: Matrícula, Nombre
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Table */}
        {alumnos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Vista previa: {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""} cargado{alumnos.length !== 1 ? "s" : ""}
              </p>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
            <ScrollArea className="h-[250px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-32">Matrícula</TableHead>
                    <TableHead>Nombre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alumnos.map((alumno, index) => (
                    <TableRow key={alumno.matricula}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono">{alumno.matricula}</TableCell>
                      <TableCell>{alumno.nombre}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )

}