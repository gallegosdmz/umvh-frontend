import ExcelJS from 'exceljs';

export interface IBoleta {
  fullName: string;
  registrationNumber: string;
  groupName: string;
  semester: number;
  periodName: string;
  courses: {
    name: string;
    grades: {
      grade: number;
      partial: number;
    }[];
    finalGrades: {
      gradeOrdinary: number;
      gradeExtraordinary: number;
    }
    // Valores ya calculados por el Excel fuente (formato oficial)
    exentos?: number | string | null;       // Columna "Exentos" (I): número redondeado o "Ord A"
    ordinarioFinal?: number | string | null; // Columna "Ordinario" (K): número o "EXTRA"
  }[]
}

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem("currentUser");
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
    'Content-Type': 'application/json',
    'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
};

export class ExcelDocumentService {
  private static async getLogoBuffer(): Promise<Buffer> {
    const response = await fetch(
      "https://res.cloudinary.com/gallegos-dev/image/upload/v1757356178/Diseño_sin_título_tmov5c.png"
    );
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  static async generateGroupGradesExcel(boletas: IBoleta[]): Promise<Blob> {
    try {
      // console.log('🔍 === INICIO GENERACIÓN DE EXCEL ===');
      // console.log('📋 Group ID recibido:', groupId);
      
      // const response = await fetch(`https://uamvh.cloud/api/groups/${groupId}/find-boletas`, {
      //   method: 'GET',
      //   headers: getAuthHeaders(),
      // });

      // console.log('📡 Respuesta del API:', response.status, response.statusText);

      // if (!response.ok) {
      //   throw new Error(`Error al obtener datos: ${response.status}`);
      // }

      // const boletas: IBoleta[] = await response.json();
      
      console.log('📊 Número de boletas recibidas:', boletas.length);
      
      if (boletas.length === 0) {
        throw new Error('No hay boletas disponibles para este grupo');
      }

      // Crear el workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Calificaciones', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      // Obtener información del grupo (usando la primera boleta)
      const groupInfo = boletas[0];

      // Agregar logo
      try {
        const logoBuffer = await this.getLogoBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });

        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 200, height: 60 }
        });
      } catch (error) {
        console.warn('No se pudo cargar el logo:', error);
      }

      // Información del grupo (empieza en la fila 5 para dar espacio al logo)
      worksheet.mergeCells('A5:F5');
      const titleCell = worksheet.getCell('A5');
      titleCell.value = "Unidad Académica Multidisciplinaria 'VALLE HERMOSO'";
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A6:F6');
      const subtitleCell = worksheet.getCell('A6');
      subtitleCell.value = `Calificaciones - Grupo: ${groupInfo.groupName} | Semestre: ${groupInfo.semester} | Período: ${groupInfo.periodName}`;
      subtitleCell.font = { bold: true, size: 12 };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Espacio
      const startRow = 8;

      // Obtener todas las materias únicas
      const allCourses = new Set<string>();
      boletas.forEach(boleta => {
        boleta.courses.forEach(course => {
          allCourses.add(course.name);
        });
      });
      const coursesList = Array.from(allCourses);

      // Crear encabezados
      const headerRow = worksheet.getRow(startRow);
      headerRow.height = 20;

      // Primera columna: Alumno
      const alumnoCell = headerRow.getCell(1);
      alumnoCell.value = 'Alumno';
      alumnoCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      alumnoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
      };
      alumnoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      alumnoCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Segunda columna: Matrícula
      const matriculaCell = headerRow.getCell(2);
      matriculaCell.value = 'Matrícula';
      matriculaCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      matriculaCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
      };
      matriculaCell.alignment = { horizontal: 'center', vertical: 'middle' };
      matriculaCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Columnas de materias (cada materia tiene 5 sub-columnas: P1, P2, P3, Ord, Ext)
      let currentCol = 3;
      const courseColumnMap = new Map<string, number>();

      coursesList.forEach((courseName, index) => {
        courseColumnMap.set(courseName, currentCol);

        // Encabezado de la materia (merge de 5 columnas)
        const startColLetter = this.getColumnLetter(currentCol);
        const endColLetter = this.getColumnLetter(currentCol + 4);
        worksheet.mergeCells(`${startColLetter}${startRow}:${endColLetter}${startRow}`);
        
        const courseHeaderCell = worksheet.getCell(`${startColLetter}${startRow}`);
        courseHeaderCell.value = courseName;
        courseHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        courseHeaderCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFBC4B26' }
        };
        courseHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        courseHeaderCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Sub-encabezados (P1, P2, P3, Ord, Ext)
        const subHeaders = ['P1', 'P2', 'P3', 'Ord', 'Ext'];
        const subHeaderRow = worksheet.getRow(startRow + 1);
        subHeaderRow.height = 18;

        for (let i = 0; i < subHeaders.length; i++) {
          const cell = subHeaderRow.getCell(currentCol + i);
          cell.value = subHeaders[i];
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD05F27' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }

        currentCol += 5;
      });

      // Agregar columna de Promedio al final
      const promedioCol = currentCol;
      worksheet.mergeCells(`${this.getColumnLetter(promedioCol)}${startRow}:${this.getColumnLetter(promedioCol)}${startRow + 1}`);
      const promedioHeaderCell = worksheet.getCell(`${this.getColumnLetter(promedioCol)}${startRow}`);
      promedioHeaderCell.value = 'Promedio';
      promedioHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      promedioHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
      };
      promedioHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      promedioHeaderCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Merge cells para Alumno y Matrícula en la segunda fila
      worksheet.mergeCells(`A${startRow}:A${startRow + 1}`);
      worksheet.mergeCells(`B${startRow}:B${startRow + 1}`);

      // Agregar datos de los alumnos
      let currentRow = startRow + 2;
      boletas.forEach((boleta) => {
        const row = worksheet.getRow(currentRow);
        row.height = 18;

        // Nombre del alumno
        const nameCell = row.getCell(1);
        nameCell.value = boleta.fullName;
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
        nameCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Matrícula
        const regCell = row.getCell(2);
        regCell.value = boleta.registrationNumber;
        regCell.alignment = { horizontal: 'center', vertical: 'middle' };
        regCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Array para calcular el promedio final de cada materia
        const finalGrades: number[] = [];

        // Calificaciones por materia
        coursesList.forEach((courseName) => {
          const course = boleta.courses.find(c => c.name === courseName);
          const startCol = courseColumnMap.get(courseName)!;

          if (course) {
            // Parcial 1
            const p1 = course.grades.find(g => g.partial === 1)?.grade || 0;
            const p1Cell = row.getCell(startCol);
            p1Cell.value = p1 > 0 ? parseFloat(p1.toFixed(2)) : '';
            p1Cell.alignment = { horizontal: 'center', vertical: 'middle' };
            p1Cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if (p1 < 7 && p1 > 0) {
              p1Cell.font = { color: { argb: 'FFFF0000' } };
            }

            // Parcial 2
            const p2 = course.grades.find(g => g.partial === 2)?.grade || 0;
            const p2Cell = row.getCell(startCol + 1);
            p2Cell.value = p2 > 0 ? parseFloat(p2.toFixed(2)) : '';
            p2Cell.alignment = { horizontal: 'center', vertical: 'middle' };
            p2Cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if (p2 < 7 && p2 > 0) {
              p2Cell.font = { color: { argb: 'FFFF0000' } };
            }

            // Parcial 3
            const p3 = course.grades.find(g => g.partial === 3)?.grade || 0;
            const p3Cell = row.getCell(startCol + 2);
            p3Cell.value = p3 > 0 ? parseFloat(p3.toFixed(2)) : '';
            p3Cell.alignment = { horizontal: 'center', vertical: 'middle' };
            p3Cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if (p3 < 7 && p3 > 0) {
              p3Cell.font = { color: { argb: 'FFFF0000' } };
            }

            // Ordinario
            const ord = course.finalGrades?.gradeOrdinary || 0;
            const ordCell = row.getCell(startCol + 3);
            ordCell.value = ord > 0 ? parseFloat(ord.toFixed(2)) : '';
            ordCell.alignment = { horizontal: 'center', vertical: 'middle' };
            ordCell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if (ord < 7 && ord > 0) {
              ordCell.font = { color: { argb: 'FFFF0000' } };
            }

            // Extraordinario
            const ext = course.finalGrades?.gradeExtraordinary || 0;
            const extCell = row.getCell(startCol + 4);
            extCell.value = ext > 0 ? parseFloat(ext.toFixed(2)) : '';
            extCell.alignment = { horizontal: 'center', vertical: 'middle' };
            extCell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if (ext < 7 && ext > 0) {
              extCell.font = { color: { argb: 'FFFF0000' } };
            }

            // Calcular el promedio final de la materia
            // Si hay calificación ordinaria o extraordinaria, usar esa
            // Si no, calcular el promedio de los 3 parciales
            let finalGrade = 0;
            if (ext > 0) {
              // Prioridad: Extraordinario > Ordinario > Promedio de parciales
              finalGrade = ext;
            } else if (ord > 0) {
              finalGrade = ord;
            } else {
              // Calcular promedio de los 3 parciales
              const parciales = [p1, p2, p3].filter(p => p > 0);
              if (parciales.length > 0) {
                finalGrade = parciales.reduce((sum, grade) => sum + grade, 0) / parciales.length;
              }
            }

            // Agregar al array de promedios finales si hay una calificación válida
            if (finalGrade > 0) {
              finalGrades.push(finalGrade);
            }
          } else {
            // Si el alumno no tiene esta materia, dejar las celdas vacías
            for (let i = 0; i < 5; i++) {
              const cell = row.getCell(startCol + i);
              cell.value = '';
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            }
          }
        });

        // Calcular y agregar el promedio general (promedio de todos los promedios finales)
        const promedio = finalGrades.length > 0 
          ? finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length 
          : 0;
        
        const promedioCell = row.getCell(promedioCol);
        promedioCell.value = promedio > 0 ? parseFloat(promedio.toFixed(2)) : '';
        promedioCell.alignment = { horizontal: 'center', vertical: 'middle' };
        promedioCell.font = { bold: true, size: 11 };
        promedioCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Color según el promedio
        if (promedio >= 7) {
          promedioCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' } // Verde claro
          };
          promedioCell.font = { bold: true, size: 11, color: { argb: 'FF155724' } }; // Verde oscuro
        } else if (promedio > 0) {
          promedioCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' } // Rojo claro
          };
          promedioCell.font = { bold: true, size: 11, color: { argb: 'FFFF0000' } }; // Rojo
        }

        currentRow++;
      });

      // Ajustar anchos de columna
      worksheet.getColumn(1).width = 30; // Alumno
      worksheet.getColumn(2).width = 15; // Matrícula
      
      // Columnas de materias
      for (let i = 3; i < currentCol; i++) {
        worksheet.getColumn(i).width = 8;
      }
      
      // Columna de promedio
      worksheet.getColumn(promedioCol).width = 12;

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      console.log('✅ Excel generado exitosamente');
      console.log('🔍 === FIN GENERACIÓN DE EXCEL ===\n');
      
      return blob;
    } catch (error) {
      console.error('❌ Error generando el Excel:', error);
      throw error;
    }
  }

  static async generateConcentradoFinalExcel(boletas: IBoleta[]): Promise<Blob> {
    try {
      if (boletas.length === 0) {
        throw new Error('No hay boletas disponibles para este grupo');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Calificaciones', {
        pageSetup: {
          paperSize: 9,
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      const groupInfo = boletas[0];

      try {
        const logoBuffer = await this.getLogoBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 200, height: 60 }
        });
      } catch (error) {
        console.warn('No se pudo cargar el logo:', error);
      }

      worksheet.mergeCells('A5:F5');
      const titleCell = worksheet.getCell('A5');
      titleCell.value = "Unidad Académica Multidisciplinaria 'VALLE HERMOSO'";
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A6:F6');
      const subtitleCell = worksheet.getCell('A6');
      subtitleCell.value = `Concentrado Final - Grupo: ${groupInfo.groupName} | Semestre: ${groupInfo.semester} | Período: ${groupInfo.periodName}`;
      subtitleCell.font = { bold: true, size: 12 };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const startRow = 8;

      const allCourses = new Set<string>();
      boletas.forEach(boleta => {
        boleta.courses.forEach(course => {
          allCourses.add(course.name);
        });
      });
      const coursesList = Array.from(allCourses);

      const cellBorder = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      };

      const headerRow = worksheet.getRow(startRow);
      headerRow.height = 20;

      const alumnoCell = headerRow.getCell(1);
      alumnoCell.value = 'Alumno';
      alumnoCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      alumnoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      alumnoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      alumnoCell.border = cellBorder;

      const matriculaCell = headerRow.getCell(2);
      matriculaCell.value = 'Matrícula';
      matriculaCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      matriculaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      matriculaCell.alignment = { horizontal: 'center', vertical: 'middle' };
      matriculaCell.border = cellBorder;

      let currentCol = 3;
      const courseColumnMap = new Map<string, number>();

      coursesList.forEach((courseName) => {
        courseColumnMap.set(courseName, currentCol);

        const startColLetter = this.getColumnLetter(currentCol);
        const endColLetter = this.getColumnLetter(currentCol + 4);
        worksheet.mergeCells(`${startColLetter}${startRow}:${endColLetter}${startRow}`);

        const courseHeaderCell = worksheet.getCell(`${startColLetter}${startRow}`);
        courseHeaderCell.value = courseName;
        courseHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        courseHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBC4B26' } };
        courseHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        courseHeaderCell.border = cellBorder;

        const subHeaders = ['P1', 'P2', 'P3', 'ORD', 'Extra'];
        const subHeaderRow = worksheet.getRow(startRow + 1);
        subHeaderRow.height = 18;

        for (let i = 0; i < subHeaders.length; i++) {
          const cell = subHeaderRow.getCell(currentCol + i);
          cell.value = subHeaders[i];
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD05F27' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = cellBorder;
        }

        currentCol += 5;
      });

      const promedioCol = currentCol;
      worksheet.mergeCells(`${this.getColumnLetter(promedioCol)}${startRow}:${this.getColumnLetter(promedioCol)}${startRow + 1}`);
      const promedioHeaderCell = worksheet.getCell(`${this.getColumnLetter(promedioCol)}${startRow}`);
      promedioHeaderCell.value = 'Promedio';
      promedioHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      promedioHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      promedioHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      promedioHeaderCell.border = cellBorder;

      worksheet.mergeCells(`A${startRow}:A${startRow + 1}`);
      worksheet.mergeCells(`B${startRow}:B${startRow + 1}`);

      let currentRow = startRow + 2;
      boletas.forEach((boleta) => {
        const row = worksheet.getRow(currentRow);
        row.height = 18;

        const nameCell = row.getCell(1);
        nameCell.value = boleta.fullName;
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
        nameCell.border = cellBorder;

        const regCell = row.getCell(2);
        regCell.value = boleta.registrationNumber;
        regCell.alignment = { horizontal: 'center', vertical: 'middle' };
        regCell.border = cellBorder;

        const finalGrades: number[] = [];

        coursesList.forEach((courseName) => {
          const course = boleta.courses.find(c => c.name === courseName);
          const startCol = courseColumnMap.get(courseName)!;

          if (course) {
            const p1 = course.grades.find(g => g.partial === 1)?.grade || 0;
            const p2 = course.grades.find(g => g.partial === 2)?.grade || 0;
            const p3 = course.grades.find(g => g.partial === 3)?.grade || 0;
            const ord = course.finalGrades?.gradeOrdinary || 0;
            const ext = course.finalGrades?.gradeExtraordinary || 0;

            // P1
            const p1Cell = row.getCell(startCol);
            p1Cell.value = p1 > 0 ? parseFloat(p1.toFixed(2)) : '';
            p1Cell.alignment = { horizontal: 'center', vertical: 'middle' };
            p1Cell.border = cellBorder;
            if (p1 < 7 && p1 > 0) p1Cell.font = { color: { argb: 'FFFF0000' } };

            // P2
            const p2Cell = row.getCell(startCol + 1);
            p2Cell.value = p2 > 0 ? parseFloat(p2.toFixed(2)) : '';
            p2Cell.alignment = { horizontal: 'center', vertical: 'middle' };
            p2Cell.border = cellBorder;
            if (p2 < 7 && p2 > 0) p2Cell.font = { color: { argb: 'FFFF0000' } };

            // P3
            const p3Cell = row.getCell(startCol + 2);
            p3Cell.value = p3 > 0 ? parseFloat(p3.toFixed(2)) : '';
            p3Cell.alignment = { horizontal: 'center', vertical: 'middle' };
            p3Cell.border = cellBorder;
            if (p3 < 7 && p3 > 0) p3Cell.font = { color: { argb: 'FFFF0000' } };

            // ===== COLUMNA ORD =====
            // Promedio redondeado de los 3 parciales.
            // Si >= 7: aprobó (exento), se muestra su calificación redondeada.
            // Si < 7: fue a ordinario.
            //   - Si pasó ordinario (ord >= 7): muestra calificación del ordinario.
            //   - Si NO pasó ordinario: muestra "NA" (se va a Extra).
            const ordCell = row.getCell(startCol + 3);

            const parciales = [p1, p2, p3].filter(p => p > 0);
            let promedioRedondeado = 0;
            if (parciales.length > 0) {
              promedioRedondeado = Math.round(
                parciales.reduce((sum, g) => sum + g, 0) / parciales.length
              );
            }

            let ordValue: string | number = '';
            let finalGrade = 0;

            if (promedioRedondeado >= 7) {
              // Aprobó con parciales (exento)
              ordValue = promedioRedondeado;
              finalGrade = promedioRedondeado;
            } else if (promedioRedondeado > 0) {
              // No aprobó parciales, fue a ordinario
              if (ord >= 7) {
                ordValue = ord;
                finalGrade = ord;
              } else {
                // No pasó ordinario -> NA (se va a extraordinario)
                ordValue = 'NA';
                finalGrade = 0;
              }
            }

            ordCell.value = ordValue;
            ordCell.alignment = { horizontal: 'center', vertical: 'middle' };
            ordCell.border = cellBorder;
            if (ordValue === 'NA') {
              ordCell.font = { bold: true, color: { argb: 'FFFF0000' } };
            } else if (typeof ordValue === 'number' && ordValue < 7 && ordValue > 0) {
              ordCell.font = { color: { argb: 'FFFF0000' } };
            }

            // ===== COLUMNA EXTRA =====
            // Solo se llena si el alumno fue a extraordinario (ordValue === 'NA').
            // Si ext < 7: reprobado definitivamente.
            const extCell = row.getCell(startCol + 4);

            if (ordValue === 'NA') {
              if (ext > 0) {
                extCell.value = parseFloat(ext.toFixed(2));
                finalGrade = ext;
                if (ext < 7) {
                  extCell.font = { bold: true, color: { argb: 'FFFF0000' } };
                }
              } else {
                extCell.value = '';
              }
            } else {
              extCell.value = '';
            }

            extCell.alignment = { horizontal: 'center', vertical: 'middle' };
            extCell.border = cellBorder;

            if (finalGrade > 0) {
              finalGrades.push(finalGrade);
            }
          } else {
            for (let i = 0; i < 5; i++) {
              const cell = row.getCell(startCol + i);
              cell.value = '';
              cell.border = cellBorder;
            }
          }
        });

        // Promedio general
        const promedio = finalGrades.length > 0
          ? finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length
          : 0;

        const promedioCell = row.getCell(promedioCol);
        promedioCell.value = promedio > 0 ? parseFloat(promedio.toFixed(2)) : '';
        promedioCell.alignment = { horizontal: 'center', vertical: 'middle' };
        promedioCell.font = { bold: true, size: 11 };
        promedioCell.border = cellBorder;

        if (promedio >= 7) {
          promedioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
          promedioCell.font = { bold: true, size: 11, color: { argb: 'FF155724' } };
        } else if (promedio > 0) {
          promedioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
          promedioCell.font = { bold: true, size: 11, color: { argb: 'FFFF0000' } };
        }

        currentRow++;
      });

      worksheet.getColumn(1).width = 30;
      worksheet.getColumn(2).width = 15;
      for (let i = 3; i < currentCol; i++) {
        worksheet.getColumn(i).width = 8;
      }
      worksheet.getColumn(promedioCol).width = 12;

      const buffer = await workbook.xlsx.writeBuffer();
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } catch (error) {
      console.error('Error generando el Concentrado Final:', error);
      throw error;
    }
  }

  // Resuelve los valores Ord/Extra del formato oficial a partir de las columnas
  // "Exentos" (I) y "Ordinario" (K) ya calculadas por el Excel fuente, con recálculo
  // de respaldo cuando no hay resultados cacheados.
  private static resolveOrdExtra(course: IBoleta['courses'][number]): {
    ord: string | number;
    extra: string | number;
    final: number;
  } {
    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(n) ? null : n;
    };

    const exentosNum = toNum(course.exentos);
    const ordinarioNum = toNum(course.ordinarioFinal);
    const extraNum = course.finalGrades?.gradeExtraordinary
      ? toNum(course.finalGrades.gradeExtraordinary)
      : null;

    let ord: string | number = '';
    let goesToExtra = false;

    if (exentosNum !== null) {
      // Exento: calificación redondeada de los parciales
      ord = Math.round(exentosNum);
    } else if (ordinarioNum !== null) {
      // Fue a ordinario y aprobó (redondear a entero, como exento)
      ord = Math.round(ordinarioNum);
    } else if (
      typeof course.ordinarioFinal === 'string' &&
      course.ordinarioFinal.trim().toUpperCase() === 'EXTRA'
    ) {
      // Fue a ordinario y no aprobó -> se va a extraordinario
      ord = 'NA';
      goesToExtra = true;
    } else {
      // Respaldo: el Excel no trae I/K cacheados, recalcular con los parciales
      const parciales = [
        course.grades.find(g => g.partial === 1)?.grade ?? 0,
        course.grades.find(g => g.partial === 2)?.grade ?? 0,
        course.grades.find(g => g.partial === 3)?.grade ?? 0,
      ].filter(p => p > 0);

      if (parciales.length > 0) {
        const promedio = parciales.reduce((s, g) => s + g, 0) / parciales.length;
        if (promedio >= 8.5) {
          ord = Math.round(promedio);
        } else {
          const califOrd = course.finalGrades?.gradeOrdinary ?? 0;
          const resultadoOrd = promedio * 0.5 + califOrd * 0.5;
          if (resultadoOrd >= 6) {
            ord = Math.round(resultadoOrd);
          } else {
            ord = 'NA';
            goesToExtra = true;
          }
        }
      }
    }

    let extra: string | number = '';
    let final = typeof ord === 'number' ? ord : 0;

    if (goesToExtra) {
      if (extraNum !== null) {
        extra = Math.round(extraNum);
        final = extra;
      }
    }

    return { ord, extra, final };
  }

  static async generateConcentradoSemestreExcel(boletas: IBoleta[]): Promise<Blob> {
    try {
      if (boletas.length === 0) {
        throw new Error('No hay boletas disponibles para este grupo');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Concentrado', {
        pageSetup: {
          paperSize: 9,
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      const groupInfo = boletas[0];

      try {
        const logoBuffer = await this.getLogoBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 200, height: 60 }
        });
      } catch (error) {
        console.warn('No se pudo cargar el logo:', error);
      }

      worksheet.mergeCells('A5:F5');
      const titleCell = worksheet.getCell('A5');
      titleCell.value = "Unidad Académica Multidisciplinaria 'VALLE HERMOSO'";
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A6:F6');
      const subtitleCell = worksheet.getCell('A6');
      subtitleCell.value = `Semestre: ${groupInfo.semester}    Grupo: ${groupInfo.groupName}    Periodo Escolar: ${groupInfo.periodName}`;
      subtitleCell.font = { bold: true, size: 12 };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Código de formato oficial (esquina superior derecha)
      const formCodeCell = worksheet.getCell('A7');
      formCodeCell.value = 'R-OP-81-05-02 Rev. 2';
      formCodeCell.font = { italic: true, size: 9 };
      formCodeCell.alignment = { horizontal: 'left', vertical: 'middle' };

      const startRow = 9;

      const allCourses = new Set<string>();
      boletas.forEach(boleta => {
        boleta.courses.forEach(course => {
          allCourses.add(course.name);
        });
      });
      const coursesList = Array.from(allCourses);

      const cellBorder = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      };

      const headerRow = worksheet.getRow(startRow);
      headerRow.height = 20;

      const headerFixed = [
        { col: 1, label: 'Lista' },
        { col: 2, label: 'Matrícula' },
        { col: 3, label: 'Nombre del Alumno' },
      ];
      headerFixed.forEach(({ col, label }) => {
        worksheet.mergeCells(`${this.getColumnLetter(col)}${startRow}:${this.getColumnLetter(col)}${startRow + 1}`);
        const cell = worksheet.getCell(`${this.getColumnLetter(col)}${startRow}`);
        cell.value = label;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = cellBorder;
      });

      let currentCol = 4;
      const courseColumnMap = new Map<string, number>();

      coursesList.forEach((courseName) => {
        courseColumnMap.set(courseName, currentCol);

        const startColLetter = this.getColumnLetter(currentCol);
        const endColLetter = this.getColumnLetter(currentCol + 1);
        worksheet.mergeCells(`${startColLetter}${startRow}:${endColLetter}${startRow}`);

        const courseHeaderCell = worksheet.getCell(`${startColLetter}${startRow}`);
        courseHeaderCell.value = courseName;
        courseHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        courseHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBC4B26' } };
        courseHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        courseHeaderCell.border = cellBorder;

        const subHeaders = ['Ord', 'Extra'];
        const subHeaderRow = worksheet.getRow(startRow + 1);
        subHeaderRow.height = 18;

        for (let i = 0; i < subHeaders.length; i++) {
          const cell = subHeaderRow.getCell(currentCol + i);
          cell.value = subHeaders[i];
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD05F27' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = cellBorder;
        }

        currentCol += 2;
      });

      const promedioCol = currentCol;
      worksheet.mergeCells(`${this.getColumnLetter(promedioCol)}${startRow}:${this.getColumnLetter(promedioCol)}${startRow + 1}`);
      const promedioHeaderCell = worksheet.getCell(`${this.getColumnLetter(promedioCol)}${startRow}`);
      promedioHeaderCell.value = 'Prom.';
      promedioHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      promedioHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      promedioHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      promedioHeaderCell.border = cellBorder;

      // Acumuladores para los promedios por materia (fila inferior)
      const courseOrdSums = new Map<string, { sum: number; count: number }>();
      coursesList.forEach(c => courseOrdSums.set(c, { sum: 0, count: 0 }));

      let currentRow = startRow + 2;
      let listIndex = 1;
      boletas.forEach((boleta) => {
        const row = worksheet.getRow(currentRow);
        row.height = 18;

        const listCell = row.getCell(1);
        listCell.value = listIndex;
        listCell.alignment = { horizontal: 'center', vertical: 'middle' };
        listCell.border = cellBorder;

        const regCell = row.getCell(2);
        regCell.value = boleta.registrationNumber;
        regCell.alignment = { horizontal: 'center', vertical: 'middle' };
        regCell.border = cellBorder;

        const nameCell = row.getCell(3);
        nameCell.value = boleta.fullName;
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
        nameCell.border = cellBorder;

        const finalGrades: number[] = [];

        coursesList.forEach((courseName) => {
          const course = boleta.courses.find(c => c.name === courseName);
          const startCol = courseColumnMap.get(courseName)!;

          if (course) {
            const { ord, extra, final } = this.resolveOrdExtra(course);

            // ===== COLUMNA ORD =====
            const ordCell = row.getCell(startCol);
            ordCell.value = ord;
            ordCell.alignment = { horizontal: 'center', vertical: 'middle' };
            ordCell.border = cellBorder;
            if (ord === 'NA') {
              ordCell.font = { bold: true, color: { argb: 'FFFF0000' } };
            } else if (typeof ord === 'number' && ord < 7) {
              ordCell.font = { color: { argb: 'FFFF0000' } };
            }

            // ===== COLUMNA EXTRA =====
            const extCell = row.getCell(startCol + 1);
            extCell.value = extra;
            extCell.alignment = { horizontal: 'center', vertical: 'middle' };
            extCell.border = cellBorder;
            if (typeof extra === 'number' && extra < 6) {
              // No aprobó la materia ni con extraordinario
              extCell.font = { bold: true, color: { argb: 'FFFF0000' } };
            }

            // Promedio por materia: solo cuenta el valor numérico de Ord
            if (typeof ord === 'number') {
              const acc = courseOrdSums.get(courseName)!;
              acc.sum += ord;
              acc.count += 1;
            }

            if (final > 0) {
              finalGrades.push(final);
            }
          } else {
            for (let i = 0; i < 2; i++) {
              const cell = row.getCell(startCol + i);
              cell.value = '';
              cell.border = cellBorder;
            }
          }
        });

        // Promedio general del alumno
        const promedio = finalGrades.length > 0
          ? finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length
          : 0;

        const promedioCell = row.getCell(promedioCol);
        promedioCell.value = promedio > 0 ? parseFloat(promedio.toFixed(2)) : '';
        promedioCell.alignment = { horizontal: 'center', vertical: 'middle' };
        promedioCell.border = cellBorder;

        if (promedio >= 7) {
          promedioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
          promedioCell.font = { bold: true, size: 11, color: { argb: 'FF155724' } };
        } else if (promedio > 0) {
          promedioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
          promedioCell.font = { bold: true, size: 11, color: { argb: 'FFFF0000' } };
        } else {
          promedioCell.font = { bold: true, size: 11 };
        }

        currentRow++;
        listIndex++;
      });

      // ===== FILA INFERIOR: promedio por materia (columna Ord) =====
      const footerRow = worksheet.getRow(currentRow);
      footerRow.height = 18;

      const footerLabelCell = footerRow.getCell(1);
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      footerLabelCell.value = 'Promedio por materia';
      footerLabelCell.font = { bold: true };
      footerLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      footerLabelCell.border = cellBorder;

      coursesList.forEach((courseName) => {
        const startCol = courseColumnMap.get(courseName)!;
        const acc = courseOrdSums.get(courseName)!;
        const avg = acc.count > 0 ? acc.sum / acc.count : 0;

        const avgCell = footerRow.getCell(startCol);
        avgCell.value = avg > 0 ? parseFloat(avg.toFixed(2)) : '';
        avgCell.font = { bold: true };
        avgCell.alignment = { horizontal: 'center', vertical: 'middle' };
        avgCell.border = cellBorder;

        // La subcolumna Extra del pie queda vacía pero con borde
        const extraFooter = footerRow.getCell(startCol + 1);
        extraFooter.value = '';
        extraFooter.border = cellBorder;
      });

      const promedioFooterCell = footerRow.getCell(promedioCol);
      promedioFooterCell.value = '';
      promedioFooterCell.border = cellBorder;

      worksheet.getColumn(1).width = 6;
      worksheet.getColumn(2).width = 14;
      worksheet.getColumn(3).width = 32;
      for (let i = 4; i < currentCol; i++) {
        worksheet.getColumn(i).width = 7;
      }
      worksheet.getColumn(promedioCol).width = 10;

      const buffer = await workbook.xlsx.writeBuffer();
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } catch (error) {
      console.error('Error generando el Concentrado por Semestre:', error);
      throw error;
    }
  }

  private static getColumnLetter(col: number): string {
    let letter = '';
    while (col > 0) {
      const remainder = (col - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      col = Math.floor((col - 1) / 26);
    }
    return letter;
  }

  static downloadDocument(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

