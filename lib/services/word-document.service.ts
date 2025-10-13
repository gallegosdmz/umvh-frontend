import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, Header, ImageRun } from 'docx';

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

export class WordDocumentService {
  private static async getLogoBuffer() {
    const response = await fetch(
      "https://res.cloudinary.com/gallegos-dev/image/upload/v1757356178/Diseño_sin_título_tmov5c.png"
    );
    const blob = await response.blob();
    return await blob.arrayBuffer();
  }

  static async generateGroupBoleta(groupId: string): Promise<Blob> {
    try {
      console.log('🔍 === INICIO GENERACIÓN DE BOLETÍN ===');
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
      console.log('📦 DATA COMPLETA DE BOLETAS:', JSON.stringify(boletas, null, 2));
      
      // Inspeccionar cada boleta
      boletas.forEach((boleta, index) => {
        console.log(`\n👤 === BOLETA ${index + 1} ===`);
        console.log('Alumno:', boleta.fullName);
        console.log('Matrícula:', boleta.registrationNumber);
        console.log('Grupo:', boleta.groupName);
        console.log('Semestre:', boleta.semester);
        console.log('Período:', boleta.periodName);
        console.log('Número de cursos:', boleta.courses?.length || 0);
        
        if (boleta.courses && boleta.courses.length > 0) {
          boleta.courses.forEach((course, courseIndex) => {
            console.log(`  📚 Curso ${courseIndex + 1}: ${course.name}`);
            console.log(`     Calificaciones parciales:`, course.grades);
            console.log(`     Calificación ordinario:`, course.finalGrades?.gradeOrdinary);
            console.log(`     Calificación extraordinario:`, course.finalGrades?.gradeExtraordinary);
          });
        }
      });

      if (boletas.length === 0) {
        throw new Error('No hay boletas disponibles para este grupo');
      }

      const logoBuffer = await this.getLogoBuffer();

      const doc = new Document({
        sections: this.generateSections(boletas, logoBuffer),
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

  private static generateSections(boletas: IBoleta[], logoBuffer: ArrayBuffer) {
    return boletas.map(boleta => ({
      properties: {
        page: {
          size: {
            width: 16838, // A4 height in TWIPs (now width for landscape)
            height: 11906, // A4 width in TWIPs (now height for landscape)
          },
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Header de la UAT
        new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: {
                width: 230,
                height: 60,
              },
              type: "png",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Unidad Académica Multidisciplinaria 'VALLE HERMOSO'",
              bold: true,
              size: 24,
              font: "Arial",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        // Contenido de la boleta del alumno
        ...this.generateSingleBoleta(boleta),
      ],
    }));
  }



  private static generateSingleBoleta(boleta: IBoleta) {
    const children: any[] = [];

    // Información del alumno
    children.push(
      // Tabla de información del alumno
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Nombre del Alumno", bold: true, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Matrícula", bold: true, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Grupo", bold: true, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Semestre", bold: true, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Período", bold: true, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.fullName, font: "Arial" })],
                  spacing: { before: 150, after: 150 },

                })],
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.registrationNumber, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.groupName, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.semester.toString(), font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),

              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: boleta.periodName, font: "Arial" })],
                  spacing: { before: 150, after: 150 },
                })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
            ],
          }),

        ],
      }),

      // Título de calificaciones
      new Paragraph({
        spacing: { after: 100 },
      })
    );

    // Tabla de calificaciones
    const allRows = [
      // Encabezados
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Asignatura", bold: true, font: "Arial" })]
            })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Parcial 1", bold: true, font: "Arial" })]
            })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Parcial 2", bold: true, font: "Arial" })]
            })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Parcial 3", bold: true, font: "Arial" })]
            })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Ordinario", bold: true, font: "Arial" })]
            })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Extraord.", bold: true, font: "Arial" })]
            })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
        ],
      })
    ];

    // Agregar filas de calificaciones
    boleta.courses.forEach(course => {
      const partial1 = course.grades.find(g => g.partial === 1)?.grade || 0;
      const partial2 = course.grades.find(g => g.partial === 2)?.grade || 0;
      const partial3 = course.grades.find(g => g.partial === 3)?.grade || 0;
      const ordinary = course.finalGrades.gradeOrdinary || 0;
      const extraordinary = course.finalGrades.gradeExtraordinary || 0;

      allRows.push(new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: course.name, font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: partial1.toFixed(2), font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: partial2 > 0 ? partial2.toFixed(2) : "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: partial3 > 0 ? partial3.toFixed(2) : "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: ordinary > 0 ? ordinary.toFixed(2) : "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: extraordinary > 0 ? extraordinary.toFixed(2) : "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
        ],
      }));
    });

    // Agregar fila de promedio
    const validPartial1Grades = boleta.courses
      .map(course => course.grades.find(g => g.partial === 1)?.grade)
      .filter((g): g is number => g !== undefined && g > 0);
    const validPartial2Grades = boleta.courses
      .map(course => course.grades.find(g => g.partial === 2)?.grade)
      .filter((g): g is number => g !== undefined && g > 0);

    const avgPartial1 = validPartial1Grades.length > 0 ? validPartial1Grades.reduce((sum, grade) => sum + grade, 0) / validPartial1Grades.length : 0;
    const avgPartial2 = validPartial2Grades.length > 0 ? validPartial2Grades.reduce((sum, grade) => sum + grade, 0) / validPartial2Grades.length : 0;

    allRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "Promedio", bold: true, font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: avgPartial1.toFixed(2),
                bold: true,
                font: "Arial"
              })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: avgPartial2.toFixed(2),
                bold: true,
                font: "Arial"
              })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "", font: "Arial" })]
            })],
            borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
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
      rows: allRows,
    });

    children.push(gradesTable);

    // Espacio para firmas
    children.push(
      new Paragraph({
        spacing: { after: 100 },
      }),

      // Tabla de firmas
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Firma del Tutor de Grupo", bold: true, font: "Arial" })]
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Firma del Padre o Tutor", bold: true, font: "Arial" })]
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  })
                ],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "", font: "Arial" })]
                  })
                ],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
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
