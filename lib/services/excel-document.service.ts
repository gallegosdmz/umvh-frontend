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

  static async generateGroupGradesExcel(groupId: string): Promise<Blob> {
    try {
      console.log('🔍 === INICIO GENERACIÓN DE EXCEL ===');
      console.log('📋 Group ID recibido:', groupId);
      
      const response = await fetch(`https://uamvh.cloud/api/groups/${groupId}/find-boletas`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log('📡 Respuesta del API:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.status}`);
      }

      const boletas: IBoleta[] = await response.json();
      
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

        currentRow++;
      });

      // Ajustar anchos de columna
      worksheet.getColumn(1).width = 30; // Alumno
      worksheet.getColumn(2).width = 15; // Matrícula
      
      // Columnas de materias
      for (let i = 3; i < currentCol; i++) {
        worksheet.getColumn(i).width = 8;
      }

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

