import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { writeFile, unlink, readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { z } from "zod";
import { existsSync } from 'fs';

interface PythonResult {
  success: boolean;
  output?: string;
  error?: string;
}

const PonderacionSchema = z.object({
  asistencia: z.number().min(0).max(100),
  actividades: z.number().min(0).max(100),
  evidencias: z.number().min(0).max(100),
  productoIntegrador: z.number().min(0).max(100),
  examen: z.number().min(0).max(100),
});

const AlumnoSchema = z.object({
  matricula: z.string().min(1),
  nombre: z.string().min(1),
});

const EvaluacionRequestSchema = z.object({
  maestro: z.string().min(1, 'El nombre del maestro es requerido'),
  grupo: z.string().min(1, 'El grupo es requerido'),
  asignatura: z.string().min(1, 'La asignatura es requerida'),
  safis: z.string().min(1, 'El periodo es requerido'),
  ponderaciones: PonderacionSchema.refine(
    (p) => p.asistencia + p.actividades + p.evidencias + p.productoIntegrador + p.examen === 100,
    { message: 'Las ponderaciones deben sumar 100%' }
  ),
  alumnos: z.array(AlumnoSchema).min(1, 'Debe haber al menos un alumno'),
});

type EvaluacionRequest = z.infer<typeof EvaluacionRequestSchema>;

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const body = await request.json();

    // Validar datos de entrada
    const parseResult = EvaluacionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data: EvaluacionRequest = parseResult.data;

    // Generar nombres únicos para archivos temporales
    const uuid = randomUUID();
    const inputJsonPath = join(process.cwd(), 'temp', `input_${uuid}.json`);
    const outputXlsxPath = join(process.cwd(), 'temp', `output_${uuid}.xlsm`); // CAMBIO

    tempFiles.push(inputJsonPath, outputXlsxPath);

    // Escribir datos de entrada como JSON para el script Python
    await writeFile(inputJsonPath, JSON.stringify(data, null, 2), 'utf-8');

    // Rutas del script y template
    const scriptPath = join(process.cwd(), 'scripts', 'generar_XLSX.py');
    const templatePath = join(process.cwd(), 'templates', 'Template.xlsx');

    // Ejecutar script Python
    const pythonResult = await executePythonScript(scriptPath, [
      inputJsonPath,
      templatePath,
      outputXlsxPath,
    ]);

    if (!pythonResult.success) {
      console.error('Error en script Python: ', pythonResult.error);
      
      return NextResponse.json(
        { error: 'Error al generar el archivo', details: pythonResult.error },
        { status: 500 }
      );
    }

    // Leer el archivo generado
    const xlsxBuffer = await readFile(outputXlsxPath);
    const uint8Array = new Uint8Array(xlsxBuffer);

    // Limpiar archivos temporales
    await cleanupTempFiles(tempFiles);

    // Generar nombre del archivo de descarga
    const safeAsignatura = data.asignatura.replace(/[^a-zA-Z0-9]/g, "_");
    const safeSafis = data.safis.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `evaluacion_${safeAsignatura}_${safeSafis}.xlsm`;
    
    // Retornar el archivo Excel
    return new NextResponse(uint8Array, {
      headers: {
          "Content-Type": "application/vnd.ms-excel.sheet.macroEnabled.12",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });

  } catch (e) {
    console.error('Error en API de evaluaciones: ', e);

    // Limpiar archivos temporales en caso de error
    await cleanupTempFiles(tempFiles);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

function executePythonScript(scriptPath: string, args: string[]): Promise<PythonResult> {
  return new Promise((resolve) => {
    const python = spawn('python', [scriptPath, ...args]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        resolve({ success: false, error: stderr || `Proceso terminó con código ${ code }`});
      }
    });

    python.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

async function cleanupTempFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      await unlink(file)
    } catch {
      
    }
  }
}