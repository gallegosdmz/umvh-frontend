import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { reportData, periodId } = await request.json();
    
    if (!reportData || !periodId) {
      return NextResponse.json({ error: 'Datos del reporte requeridos' }, { status: 400 });
    }

    // Configuración de Puppeteer que funciona en diferentes entornos
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Configurar viewport para orientación horizontal
    await page.setViewport({ width: 1400, height: 900 });
    
    // Crear HTML con las gráficas
    const html = generateHTML(reportData, periodId);
    
    // Cargar el HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Esperar a que el contenido esté completamente renderizado
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    });
    
    // Espera adicional para asegurar que las gráficas se rendericen completamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Devolver el PDF
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-calificaciones-periodo-${periodId}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function generateHTML(reportData: any, periodId: number): string {
  const groups = Object.keys(reportData).filter(key => key.startsWith('group'));
  
  // Procesar datos para las gráficas
  const generalData = reportData.generalAverages?.map((item: any) => ({
    semestre: `Semestre ${item.semester}`,
    promedio: item.averagegrade,
    estudiantes: parseInt(item.totalstudents)
  })) || [];

  // Agrupar datos por semestre para el PDF
  const groupDataBySemester = (data: any[]) => {
    if (!Array.isArray(data)) return {};
    
    return data.reduce((groups: any, item: any) => {
      const semester = item.semester || 0;
      if (!groups[semester]) {
        groups[semester] = [];
      }
      groups[semester].push({
        grupo: item.groupname,
        promedio: item.averagegrade,
        estudiantes: parseInt(item.totalstudents)
      });
      return groups;
    }, {});
  };

  const groupedBySemester = groupDataBySemester(reportData.groupAveragesBySemester || []);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Calificaciones</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #bc4b26;
          padding-bottom: 20px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #6b7280;
        }
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
          page-break-after: always;
        }
        .section:last-child {
          page-break-after: auto;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
          background: #f3f4f6;
          padding: 10px;
          border-left: 4px solid #bc4b26;
        }
        .group-section {
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: #f9fafb;
        }
        .charts-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 20px;
        }
        .chart-full {
          width: 100%;
        }
        .group-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          background: #dbeafe;
          padding: 8px;
          border-radius: 4px;
        }
        .chart-container {
          margin-bottom: 20px;
          background: white;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
          page-break-inside: avoid;
          page-break-after: always;
        }
        .chart-container:last-child {
          page-break-after: auto;
        }
        .chart-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #374151;
        }
        .chart {
          width: 100%;
          height: 400px;
          position: relative;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Reporte de Calificaciones Finales</div>
        <div class="subtitle">Período ID: ${periodId} | Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
      </div>

      <!-- Promedios Generales -->
      ${reportData.generalAverages && reportData.generalAverages.length > 0 ? `
        <div class="section">
          <div class="section-title">📊 Promedios Generales por Semestre</div>
          <div class="chart-container">
            <div class="chart-title">Promedios por Semestre</div>
            <div class="chart">
              <canvas id="general-chart"></canvas>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Promedios por Grupo y Semestre - Agrupados por Semestre -->
      ${Object.entries(groupedBySemester).map(([semester, data]) => `
        <div class="section">
          <div class="section-title">📈 Promedios por Grupo - Semestre ${semester}</div>
          <div class="chart-container">
            <div class="chart-title">Promedios por Grupo</div>
            <div class="chart">
              <canvas id="group-averages-${semester}-chart"></canvas>
            </div>
          </div>
        </div>
      `).join('')}

      <!-- Grupos -->
      ${groups.map((groupKey, index) => {
        const groupData = reportData[groupKey];
        if (!groupData) return '';
        
        const groupName = groupData.groupInfo?.name || groupKey.replace('group', '');
        
        return `
          <div class="section">
            <div class="group-section">
              <div class="group-title">GRUPO ${groupName}</div>
              
              <!-- Gráficas en columna vertical -->
              <div class="charts-column">
                <!-- Promedio del Grupo -->
                ${groupData.groupAverages && groupData.groupAverages.length > 0 ? `
                  <div class="chart-container chart-full">
                    <div class="chart-title">📈 Promedio del Grupo</div>
                    <div class="chart">
                      <canvas id="group-avg-${index}"></canvas>
                    </div>
                  </div>
                ` : ''}

                <!-- Estudiantes Reprobados -->
                ${groupData.failedStudentsBySubject && groupData.failedStudentsBySubject.length > 0 ? `
                  <div class="chart-container chart-full">
                    <div class="chart-title">❌ Estudiantes Reprobados</div>
                    <div class="chart">
                      <canvas id="failed-${index}"></canvas>
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Promedios por Materia -->
              ${groupData.groupSubjectAverages && groupData.groupSubjectAverages.length > 0 ? `
                <div class="chart-container">
                  <div class="chart-title">📚 Promedios por Materia</div>
                  <div class="chart">
                    <canvas id="subjects-${index}"></canvas>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}

      <script>
        // Datos globales
        const generalData = ${JSON.stringify(generalData)};
        const groupedBySemester = ${JSON.stringify(groupedBySemester)};
        const groups = ${JSON.stringify(groups)};
        const reportData = ${JSON.stringify(reportData)};

        // Función para crear gráfica de barras con Chart.js
        function createBarChart(canvasId, data, labelKey, valueKey, color = '#bc4b26', title = '') {
          const canvas = document.getElementById(canvasId);
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          const labels = data.map(item => item[labelKey]);
          const values = data.map(item => item[valueKey]);
          
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: title || valueKey,
                data: values,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 10
                }
              },
              plugins: {
                legend: {
                  display: true
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.parsed.y.toFixed(1);
                    }
                  }
                },
                datalabels: {
                  display: true,
                  color: '#374151',
                  font: {
                    size: 12,
                    weight: 'bold'
                  },
                  anchor: 'end',
                  align: 'top',
                  formatter: function(value) {
                    return value.toFixed(1);
                  }
                }
              }
            }
          });
        }

        // Función para crear gráfica de barras doble
        function createDoubleBarChart(canvasId, data, labelKey, valueKey1, valueKey2, color1 = '#e74c3c', color2 = '#95a5a6') {
          const canvas = document.getElementById(canvasId);
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          const labels = data.map(item => item[labelKey]);
          const values1 = data.map(item => item[valueKey1]);
          const values2 = data.map(item => item[valueKey2]);
          
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Reprobados',
                  data: values1,
                  backgroundColor: color1,
                  borderColor: color1,
                  borderWidth: 1
                },
                {
                  label: 'Total',
                  data: values2,
                  backgroundColor: color2,
                  borderColor: color2,
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: true
                },
                datalabels: {
                  display: true,
                  color: '#374151',
                  font: {
                    size: 12,
                    weight: 'bold'
                  },
                  anchor: 'end',
                  align: 'top',
                  formatter: function(value, context) {
                    if (context.datasetIndex === 0) {
                      return value; // Para reprobados
                    }
                    return ''; // No mostrar etiqueta para el total
                  }
                }
              }
            }
          });
        }

        // Registrar el plugin de datalabels
        Chart.register(ChartDataLabels);

        // Crear gráficas cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', function() {
          // Gráfica general
          if (generalData.length > 0) {
            createBarChart('general-chart', generalData, 'semestre', 'promedio', '#bc4b26', 'Promedio');
          }

          // Gráficas de promedios por grupo y semestre - una por cada semestre
          Object.entries(groupedBySemester).forEach(([semester, data]) => {
            if (data && data.length > 0) {
              createBarChart('group-averages-' + semester + '-chart', data, 'grupo', 'promedio', '#d05f27', 'Promedio');
            }
          });

          // Gráficas por grupo
          groups.forEach((groupKey, index) => {
            const groupData = reportData[groupKey];
            if (!groupData) return;

            // Promedio del grupo
            if (groupData.groupAverages && groupData.groupAverages.length > 0) {
              const groupAvgData = groupData.groupAverages.map(item => ({
                grupo: item.groupname,
                promedio: item.averagegrade,
                estudiantes: parseInt(item.totalstudents)
              }));
              createBarChart('group-avg-' + index, groupAvgData, 'grupo', 'promedio', '#d05f27', 'Promedio');
            }

            // Estudiantes reprobados
            if (groupData.failedStudentsBySubject && groupData.failedStudentsBySubject.length > 0) {
              const failedData = groupData.failedStudentsBySubject.map(item => ({
                materia: item.coursename,
                reprobados: parseInt(item.failedstudents),
                total: parseInt(item.totalstudents)
              }));
              createDoubleBarChart('failed-' + index, failedData, 'materia', 'reprobados', 'total', '#e74c3c', '#95a5a6');
            }

            // Promedios por materia
            if (groupData.groupSubjectAverages && groupData.groupSubjectAverages.length > 0) {
              const subjectData = groupData.groupSubjectAverages.slice(0, 10).map(item => ({
                materia: item.coursename,
                promedio: item.averagegrade,
                estudiantes: parseInt(item.totalstudents)
              }));
              createBarChart('subjects-' + index, subjectData, 'materia', 'promedio', '#e67e22', 'Promedio');
            }
          });
        });
      </script>
    </body>
    </html>
  `;
}
