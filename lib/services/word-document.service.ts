import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, Header, ImageRun, PageBreak } from 'docx';

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

export class WordDocumentService {
  private static async getLogoBuffer() {
    const response = await fetch(
      "https://res.cloudinary.com/gallegos-dev/image/upload/v1757356178/Diseño_sin_título_tmov5c.png"
    );
    const blob = await response.blob();
    return await blob.arrayBuffer();
  }

  static async generateGroupBoleta(boletas: IBoletaProcessed[]): Promise<Blob> {
    try {
      const logoBuffer = await this.getLogoBuffer();

      // Crear una sola sección con todas las boletas
      const allChildren: any[] = [];

      boletas.forEach((boleta, index) => {
        // Salto de página antes de cada boleta excepto la primera
        if (index > 0) {
          allChildren.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }

        // Header de la UAT
        allChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
              transformation: {
                width: 150,
                height: 35,
              },
                type: "png",
              }),
            ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Unidad Académica Multidisciplinaria 'VALLE HERMOSO'",
              bold: true,
              size: 20,
              font: "Arial",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        })
        );

        // Contenido de la boleta del alumno
        allChildren.push(...this.generateSingleBoleta(boleta));
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: 16838, // A4 height in TWIPs (now width for landscape)
                  height: 11906, // A4 width in TWIPs (now height for landscape)
                },
                margin: {
                  top: 360, // 0.25 inch - muy reducido
                  right: 360,
                  bottom: 360,
                  left: 360,
                },
              },
            },
            children: allChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      console.log('✅ Documento generado exitosamente');
      console.log('🔍 === FIN GENERACIÓN DE BOLETÍN ===\n');
      return blob;
    } catch (error) {
      console.error('❌ Error generando la boleta:', error);
      throw error;
    }
  }



  private static generateSingleBoleta(boleta: IBoletaProcessed) {
    const children: any[] = [];

    // Información del alumno
    children.push(
      // Tabla de información del alumno
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Nombre del Alumno", bold: true, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                width: { size: 30, type: WidthType.PERCENTAGE },
                verticalAlign: AlignmentType.CENTER,
                shading: {
                  fill: "E8E8E8",
                  type: "clear",
                },
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Matrícula", bold: true, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                shading: {
                  fill: "E8E8E8",
                  type: "clear",
                },
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Grupo", bold: true, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                shading: {
                  fill: "E8E8E8",
                  type: "clear",
                },
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Semestre", bold: true, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                shading: {
                  fill: "E8E8E8",
                  type: "clear",
                },
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Período", bold: true, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                shading: {
                  fill: "E8E8E8",
                  type: "clear",
                },
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.fullName, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                width: { size: 30, type: WidthType.PERCENTAGE },
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.registrationNumber, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.groupName, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.semester.toString(), font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.periodName, font: "Arial", size: 16 })],
                  spacing: { before: 50, after: 50 },
                  alignment: AlignmentType.CENTER,
                })],
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
            ],
          }),

        ],
      }),

      // Título de calificaciones
      new Paragraph({
        spacing: { after: 20 },
      })
    );

    // Tabla de calificaciones
    const allRows = [
      // Encabezados
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Asignatura", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            })],
            width: { size: 22, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6 }, 
              bottom: { style: BorderStyle.SINGLE, size: 6 }, 
              left: { style: BorderStyle.SINGLE, size: 6 }, 
              right: { style: BorderStyle.SINGLE, size: 4 } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Parcial 1", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 150, after: 150 },
            })],
            width: { size: 11, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Parcial 2", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 150, after: 150 },
            })],
            width: { size: 11, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Parcial 3", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 150, after: 150 },
            })],
            width: { size: 12, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Ordinario", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 150, after: 150 },
            })],
            width: { size: 12, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Extraord.", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 150, after: 150 },
            })],
            width: { size: 11, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Prom. General", bold: true, font: "Arial", size: 16 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 150, after: 150 },
            })],
            width: { size: 13, type: WidthType.PERCENTAGE },
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "D3D3D3",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6 }, 
              bottom: { style: BorderStyle.SINGLE, size: 6 }, 
              left: { style: BorderStyle.SINGLE, size: 4 }, 
              right: { style: BorderStyle.SINGLE, size: 6 } 
            },
          }),
        ],
      })
    ];

    // Agregar filas de calificaciones
    boleta.courses.forEach(course => {
      const partial1 = course.grades.find(g => g.partial === 1)?.grade || 0;
      const partial2 = course.grades.find(g => g.partial === 2)?.grade || 0;
      const partial3 = course.grades.find(g => g.partial === 3)?.grade || 0;
      const ordinaryFromBD = course.finalGrades.gradeOrdinary || 0;
      const extraordinary = course.finalGrades.gradeExtraordinary || 0;

      // Calcular promedio general: promedio de los 3 parciales (suma / número de parciales válidos)
      const parcialesValidos = [partial1, partial2, partial3].filter(p => p > 0);
      const promedioCalculado = parcialesValidos.length > 0
        ? (partial1 + partial2 + partial3) / parcialesValidos.length
        : 0;

      // Calcular Ordinario: (Promedio General + gradeOrdinary de BD) / 2
      const ordinary = (promedioCalculado > 0 && ordinaryFromBD > 0)
        ? (promedioCalculado + ordinaryFromBD) / 2
        : (ordinaryFromBD > 0 ? ordinaryFromBD : 0);

      // Lógica de prioridad para Promedio General:
      // 1. Si existe Extraordinario: usar Extraordinario
      // 2. Si no existe Extraordinario pero existe Ordinario calculado: usar Ordinario
      // 3. Si no existe ninguno: usar el promedio calculado
      const promedioGeneral = extraordinary > 0
        ? extraordinary
        : (ordinary > 0
          ? ordinary
          : promedioCalculado);

      allRows.push(new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: course.name, font: "Arial", size: 16 })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.LEFT,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: partial1.toFixed(2), font: "Arial", size: 16 })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: partial2 > 0 ? partial2.toFixed(2) : "", font: "Arial", size: 16 })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: partial3 > 0 ? partial3.toFixed(2) : "", font: "Arial", size: 16 })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: ordinary > 0 ? ordinary.toFixed(2) : "", font: "Arial", size: 16 })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: extraordinary > 0 ? extraordinary.toFixed(2) : "", font: "Arial", size: 16 })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: promedioGeneral > 0 ? promedioGeneral.toFixed(2) : "", font: "Arial", size: 16, bold: true })],
              spacing: { before: 30, after: 30 },
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 4 }, 
              bottom: { style: BorderStyle.SINGLE, size: 4 }, 
              left: { style: BorderStyle.SINGLE, size: 4 }, 
              right: { style: BorderStyle.SINGLE, size: 6 } 
            },
          }),
        ],
      }));
    });

    // Agregar fila de promedio
    const validPartial1Grades = boleta.courses                                                         
      .map(course => course.grades.find(g => g.partial === 1)?.grade)                                  
      .filter((g): g is number => g !== null && g !== undefined && g > 0);                             
    const validPartial2Grades = boleta.courses                                                         
      .map(course => course.grades.find(g => g.partial === 2)?.grade)                                  
      .filter((g): g is number => g !== null && g !== undefined && g > 0);                             
    const validPartial3Grades = boleta.courses                                                         
      .map(course => course.grades.find(g => g.partial === 3)?.grade)                                  
      .filter((g): g is number => g !== null && g !== undefined && g > 0);   

    const avgPartial1 = validPartial1Grades.length > 0 ? validPartial1Grades.reduce((sum, grade) => sum + grade, 0) / validPartial1Grades.length : 0;
    const avgPartial2 = validPartial2Grades.length > 0 ? validPartial2Grades.reduce((sum, grade) => sum + grade, 0) / validPartial2Grades.length : 0;
    const avgPartial3 = validPartial3Grades.length > 0 ? validPartial3Grades.reduce((sum, grade) => sum + grade, 0) / validPartial3Grades.length : 0;

    // Calcular el promedio general de cada curso usando la misma lógica de prioridad
    // y luego promediar esos valores para obtener el promedio general final
    const promediosGeneralesPorCurso = boleta.courses.map(course => {
      const partial1 = course.grades.find(g => g.partial === 1)?.grade || 0;
      const partial2 = course.grades.find(g => g.partial === 2)?.grade || 0;
      const partial3 = course.grades.find(g => g.partial === 3)?.grade || 0;
      const ordinary = course.finalGrades.gradeOrdinary || 0;
      const extraordinary = course.finalGrades.gradeExtraordinary || 0;

      // Calcular promedio calculado de los parciales
      const parcialesValidos = [partial1, partial2, partial3].filter(p => p > 0);
      const promedioCalculado = parcialesValidos.length > 0
        ? (partial1 + partial2 + partial3) / parcialesValidos.length
        : 0;

      // Aplicar lógica de prioridad: extraordinario > ordinario > promedio calculado
      return extraordinary > 0
        ? extraordinary
        : (ordinary > 0
          ? ordinary
          : promedioCalculado);
    }).filter(p => p > 0);

    // Calcular promedio general: promedio de todos los promedios generales de los cursos
    const avgPromedioGeneral = promediosGeneralesPorCurso.length > 0
      ? promediosGeneralesPorCurso.reduce((sum, grade) => sum + grade, 0) / promediosGeneralesPorCurso.length
      : 0;

    // Para la columna "Ordinario" en la fila de promedios, NO promediar las calificaciones ordinarias
    // En su lugar, mostrar vacío o el promedio general calculado
    // (El campo Ordinario en la fila de promedios no tiene sentido promediar)
    const avgOrdinario = 0; // No se promedia, se deja vacío

    // Para la columna "Extraordinario" en la fila de promedios, tampoco se promedia
    const avgExtraordinary = 0; // No se promedia, se deja vacío

    allRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Promedio", bold: true, font: "Arial", size: 16 })]
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6 }, 
              bottom: { style: BorderStyle.SINGLE, size: 6 }, 
              left: { style: BorderStyle.SINGLE, size: 6 }, 
              right: { style: BorderStyle.SINGLE, size: 4 } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: avgPartial1.toFixed(2),
                bold: true,
                font: "Arial",
                size: 16
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: avgPartial2 > 0 ? avgPartial2.toFixed(2) : "",
                bold: true,
                font: "Arial",
                size: 16
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: avgPartial3 > 0 ? avgPartial3.toFixed(2) : "",
                bold: true,
                font: "Arial",
                size: 16
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "", font: "Arial" })],
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "", font: "Arial" })],
              alignment: AlignmentType.CENTER,
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, 
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: avgPromedioGeneral > 0 ? avgPromedioGeneral.toFixed(2) : "",
                bold: true,
                font: "Arial",
                size: 16
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
            verticalAlign: AlignmentType.CENTER,
            shading: {
              fill: "F0F0F0",
              type: "clear",
            },
            borders: { 
              top: { style: BorderStyle.SINGLE, size: 6 }, 
              bottom: { style: BorderStyle.SINGLE, size: 6 }, 
              left: { style: BorderStyle.SINGLE, size: 4 }, 
              right: { style: BorderStyle.SINGLE, size: 6 } 
            },
          }),
        ],
      })
    );

    // Crear la tabla final con todas las filas
    const gradesTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      },
      rows: allRows,
    });

    children.push(gradesTable);

    // Espacio para firmas
    children.push(
      new Paragraph({
        spacing: { after: 20 },
      }),

      // Tabla de firmas
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Firma del Tutor de Grupo", bold: true, font: "Arial", size: 16 })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 150, after: 150 },
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Firma del Padre o Tutor", bold: true, font: "Arial", size: 16 })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 50, after: 50 },
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: AlignmentType.CENTER,
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })],
                    spacing: { before: 0, after: 0 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })],
                    spacing: { before: 0, after: 0 },
                  })
                ],
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })],
                    spacing: { before: 0, after: 0 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })],
                    spacing: { before: 0, after: 0 },
                  })
                ],
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" }, 
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" } 
                },
              }),
            ],
          }),
        ],
      })
    );

    return children;
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
