import ExcelJS from 'exceljs';

// --- Interfaces ---

export interface CourseGradeDetail {
  p1: number;
  p2: number;
  p3: number;
  ord: number;
  ext: number;
  finalGrade: number;
}

export interface StudentGrades {
  fullName: string;
  registrationNumber: string;
  courseGrades: Record<string, CourseGradeDetail>;
  promedio: number;
}

export interface ConcentradoData {
  groupName: string;
  semester: number;
  periodName: string;
  courses: string[];
  students: StudentGrades[];
}

export interface SemesterStatistics {
  semester: number;
  promedioGeneral: number;
  groups: {
    groupName: string;
    promedio: number;
    promediosPorAsignatura: Record<string, number>;
  }[];
  reprobadosPorAsignatura: Record<string, number>;
  allCourses: string[];
}

export interface StatisticsResult {
  promediosGenerales: { semester: number; promedio: number }[];
  semestres: SemesterStatistics[];
}

// --- Parsing ---

export async function parseConcentradoExcel(file: File): Promise<ConcentradoData> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet('Calificaciones') || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error(`No se encontró la hoja "Calificaciones" en ${file.name}`);
  }

  // Fila 6: "Calificaciones - Grupo: X | Semestre: Y | Período: Z"
  const subtitleCell = worksheet.getCell('A6');
  const subtitleValue = String(subtitleCell.value || '');

  const groupMatch = subtitleValue.match(/Grupo:\s*(.+?)\s*\|/);
  const semesterMatch = subtitleValue.match(/Semestre:\s*(\d+)/);
  const periodMatch = subtitleValue.match(/Período:\s*(.+)$/);

  if (!groupMatch || !semesterMatch) {
    throw new Error(
      `No se pudo extraer información del archivo ${file.name}. ` +
      `Se esperaba formato "Calificaciones - Grupo: X | Semestre: Y | Período: Z" en la fila 6.`
    );
  }

  const groupName = groupMatch[1].trim();
  const semester = parseInt(semesterMatch[1], 10);
  const periodName = periodMatch ? periodMatch[1].trim() : '';

  // Fila 8: Headers de cursos (columnas mergeadas cada 5, después de col 2)
  const headerRow = worksheet.getRow(8);
  const courses: string[] = [];
  const courseStartCols: number[] = [];

  // Buscar cursos en la fila de headers
  // Col 1 = Alumno, Col 2 = Matrícula, luego cada 5 cols es un curso
  let col = 3;
  while (col <= headerRow.cellCount + 5) {
    const cellValue = getCellStringValue(headerRow.getCell(col));
    if (cellValue && cellValue !== 'Promedio') {
      courses.push(cellValue);
      courseStartCols.push(col);
      col += 5; // Saltar P1, P2, P3, Ord, Ext
    } else if (cellValue === 'Promedio') {
      break;
    } else {
      col++;
    }
  }

  // La columna de Promedio es la siguiente después del último curso
  const promedioCol = courseStartCols.length > 0
    ? courseStartCols[courseStartCols.length - 1] + 5
    : col;

  // Filas 10+: Datos de alumnos
  const students: StudentGrades[] = [];
  let row = 10;

  while (row <= worksheet.rowCount) {
    const dataRow = worksheet.getRow(row);
    const fullName = getCellStringValue(dataRow.getCell(1));

    if (!fullName) break; // Fin de datos

    const registrationNumber = getCellStringValue(dataRow.getCell(2));

    const courseGrades: Record<string, CourseGradeDetail> = {};

    for (let i = 0; i < courses.length; i++) {
      const startCol = courseStartCols[i];
      const p1 = getCellNumberValue(dataRow.getCell(startCol));
      const p2 = getCellNumberValue(dataRow.getCell(startCol + 1));
      const p3 = getCellNumberValue(dataRow.getCell(startCol + 2));
      const ord = getCellNumberValue(dataRow.getCell(startCol + 3));
      const ext = getCellNumberValue(dataRow.getCell(startCol + 4));

      // Calculo de calificación final (misma lógica que generateGroupGradesExcel)
      let finalGrade = 0;
      if (ext > 0) {
        finalGrade = ext;
      } else if (ord > 0) {
        finalGrade = ord;
      } else {
        const parciales = [p1, p2, p3].filter(p => p > 0);
        if (parciales.length > 0) {
          finalGrade = parciales.reduce((sum, g) => sum + g, 0) / parciales.length;
        }
      }

      courseGrades[courses[i]] = { p1, p2, p3, ord, ext, finalGrade };
    }

    const promedio = getCellNumberValue(dataRow.getCell(promedioCol));

    students.push({ fullName, registrationNumber, courseGrades, promedio });
    row++;
  }

  return { groupName, semester, periodName, courses, students };
}

// --- Cómputo de estadísticas ---

export function computeStatistics(concentrados: ConcentradoData[]): StatisticsResult {
  // Agrupar por semestre
  const semesterMap = new Map<number, ConcentradoData[]>();

  for (const c of concentrados) {
    const existing = semesterMap.get(c.semester) || [];
    existing.push(c);
    semesterMap.set(c.semester, existing);
  }

  const sortedSemesters = Array.from(semesterMap.keys()).sort((a, b) => a - b);

  const promediosGenerales: { semester: number; promedio: number }[] = [];
  const semestres: SemesterStatistics[] = [];

  for (const sem of sortedSemesters) {
    const concentradosSem = semesterMap.get(sem)!;

    // Todas las asignaturas del semestre
    const allCoursesSet = new Set<string>();
    concentradosSem.forEach(c => c.courses.forEach(course => allCoursesSet.add(course)));
    const allCourses = Array.from(allCoursesSet);

    // Promedio general del semestre (promedio de todos los alumnos)
    let totalPromedio = 0;
    let totalStudents = 0;
    for (const c of concentradosSem) {
      for (const s of c.students) {
        if (s.promedio > 0) {
          totalPromedio += s.promedio;
          totalStudents++;
        }
      }
    }
    const promedioGeneral = totalStudents > 0 ? totalPromedio / totalStudents : 0;
    promediosGenerales.push({ semester: sem, promedio: parseFloat(promedioGeneral.toFixed(2)) });

    // Datos por grupo
    const groups = concentradosSem.map(c => {
      // Promedio del grupo
      const validStudents = c.students.filter(s => s.promedio > 0);
      const groupPromedio = validStudents.length > 0
        ? validStudents.reduce((sum, s) => sum + s.promedio, 0) / validStudents.length
        : 0;

      // Promedio por asignatura del grupo
      const promediosPorAsignatura: Record<string, number> = {};
      for (const course of allCourses) {
        const grades = c.students
          .map(s => s.courseGrades[course]?.finalGrade || 0)
          .filter(g => g > 0);
        promediosPorAsignatura[course] = grades.length > 0
          ? parseFloat((grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(2))
          : 0;
      }

      return {
        groupName: c.groupName,
        promedio: parseFloat(groupPromedio.toFixed(2)),
        promediosPorAsignatura,
      };
    });

    // Reprobados por asignatura (todos los grupos del semestre)
    const reprobadosPorAsignatura: Record<string, number> = {};
    for (const course of allCourses) {
      let count = 0;
      for (const c of concentradosSem) {
        for (const s of c.students) {
          const fg = s.courseGrades[course]?.finalGrade || 0;
          if (fg > 0 && fg < 7) {
            count++;
          }
        }
      }
      reprobadosPorAsignatura[course] = count;
    }

    semestres.push({
      semester: sem,
      promedioGeneral: parseFloat(promedioGeneral.toFixed(2)),
      groups,
      reprobadosPorAsignatura,
      allCourses,
    });
  }

  return { promediosGenerales, semestres };
}

// --- Helpers ---

function getCellStringValue(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && 'result' in val) return String(val.result || '');
  if (typeof val === 'object' && 'richText' in val) {
    return (val as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join('');
  }
  return String(val).trim();
}

function getCellNumberValue(cell: ExcelJS.Cell): number {
  const val = cell.value;
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'result' in val) {
    const num = Number(val.result);
    return isNaN(num) ? 0 : num;
  }
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}
