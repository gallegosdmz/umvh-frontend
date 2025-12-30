● CLAUDE.md

  # Consideraciones a tomar encuenta por IA
  - Solo me muestras código (indentado, legible, y con buenas practicas para que yo lo pueda implementar).
  - No implementas nada al menos que yo te lo pida explicitamente.
  - Utiliza las mejores prácticas y patrones de diseño acorde a la solución que me propongas.

  # UMVH Frontend - Generador de Evaluaciones

  ## Descripción del Proyecto

  Aplicación web local (Next.js 15 + React 19) para generar archivos XLSX de evaluación que serán utilizados por maestros para calificar a sus alumnos.

  ### Contexto Histórico
  - Originalmente era una app web en producción con NestJS + PostgreSQL
  - Se descartaron la mayoría de los módulos (maestros, alumnos, etc.)
  - Ahora funciona **localmente en una máquina Windows** únicamente para generar archivos Excel

  ### Problema a Resolver
  El sistema necesita generar archivos XLSX (Excel con macros) a partir de un template. Como el template usa macros de VBA, no es viable manipularlo con librerías JS como `exceljs` (destruyen los macros). La solución es usar **Python con win32com** para manipular el archivo preservando los macros.

  ---

  ## Stack Tecnológico

  - **Frontend**: Next.js 15, React 19, TypeScript
  - **UI**: Tailwind CSS, Radix UI, shadcn/ui
  - **Validación**: Zod, React Hook Form
  - **Script de generación**: Python con pywin32 (win32com)
  - **Base de datos**: No requerida (app local sin persistencia)

  ---

  ## Arquitectura del Módulo de Evaluaciones

  ### Flujo de la Aplicación

  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │   React Form     │────▶│  API Route       │────▶│  Python Script   │
  │                  │     │  /api/evaluaciones│     │  win32com        │
  │  - Metadata      │     │  /generar        │     │                  │
  │  - Ponderaciones │     │                  │     │  1. Abre template│
  │  - Alumnos[]     │     │  spawn('python') │     │  2. Escribe data │
  │                  │     │                  │     │  3. Guarda XLSX  │
  └──────────────────┘     └──────────────────┘     └──────────────────┘
                                                             │
                                ┌─────────────────────────────┘
                                ▼
                      ┌──────────────────┐
                      │  Archivo XLSX    │
                      │  generado        │
                      │  → Descarga      │
                      └──────────────────┘

  ### Estructura de Archivos del Módulo

  app/
  ├── admin/
  │   └── evaluacion/
  │       └── page.tsx              # Vista principal del generador
  ├── api/
  │   └── evaluaciones/
  │       └── generar/
  │           └── route.ts          # API Route que ejecuta Python

  components/
  ├── evaluation-panel/
  │   ├── index.ts
  │   ├── EvaluationCriteriaPanel.tsx  # Panel de ponderaciones (legacy)
  │   └── PercentageSlider.tsx         # Slider de porcentaje (reutilizado)
  ├── student-import/
  │   └── StudentImport.tsx         # Componente para importar Excel de alumnos

  scripts/
  └── generar_XLSX.py               # Script Python con win32com

  templates/
  └── evaluacion_template.XLSX      # Template Excel con macros

  ---

  ## Modelo de Datos

  ### Request para generar evaluación

  ```typescript
  interface GenerarEvaluacionRequest {
    // Metadata
    maestro: string
    semestre: number
    asignatura: string
    safis: string

    // Ponderaciones (deben sumar 100%)
    ponderaciones: {
      asistencia: number
      actividades: number
      evidencias: number
      productoIntegrador: number
      examen: number
    }

    // Alumnos (parseados del Excel importado)
    alumnos: Array<{
      matricula: string
      nombre: string
    }>
  }

  ---
  Pasos de Implementación

  | #   | Tarea                   | Estado          | Descripción                        |
  |-----|-------------------------|-----------------|------------------------------------|
  | 1   | Refactorizar page.tsx   | ✅ Código listo | Quitar mock data, campos editables |
  | 2   | Crear StudentImport.tsx | ⏳ Pendiente    | Componente para importar Excel     |
  | 3   | Crear API Route         | ⏳ Pendiente    | /api/evaluaciones/generar/route.ts |
  | 4   | Crear script Python     | ⏳ Pendiente    | scripts/generar_XLSX.py            |
  | 5   | Integrar descarga       | ⏳ Pendiente    | Retornar archivo al cliente        |

  ---
  Decisiones Técnicas

  ¿Por qué Python con win32com en lugar de VBScript?

  - Mejor integración con Next.js (JSON nativo, subprocess)
  - Manejo de errores robusto (try/except)
  - Código más legible y mantenible
  - Puede usar openpyxl para leer el Excel de alumnos
  - Mejor debugging (VS Code, breakpoints)

  ¿Por qué no usar librerías JS para XLSX?

  - exceljs, xlsx y similares no preservan macros de VBA
  - El template usa macros que son esenciales para el funcionamiento
  - win32com interactúa directamente con Excel preservando todo

  ¿Por qué app local en lugar de web?

  - Requiere Excel instalado en la máquina para win32com
  - No necesita autenticación ni base de datos
  - Simplifica la arquitectura considerablemente

  ---
  UI del Módulo de Evaluaciones

  ┌─────────────────────────────────────────────────────────────────┐
  │  ← Generador de Evaluaciones                                    │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  PASO 1: Información General                                    │
  │  ┌─────────────────────┐  ┌─────────────────────┐               │
  │  │ Nombre del Maestro  │  │ Semestre            │               │
  │  │ [________________]  │  │ [____▼]             │               │
  │  └─────────────────────┘  └─────────────────────┘               │
  │  ┌─────────────────────┐  ┌─────────────────────┐               │
  │  │ Asignatura          │  │ SAFIS (Periodo)     │               │
  │  │ [________________]  │  │ [________________]  │               │
  │  └─────────────────────┘  └─────────────────────┘               │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │  PASO 2: Ponderaciones                    Total: 100% ✓         │
  │  ┌─────────────────────────────────────────────────────────┐    │
  │  │ Asistencia          ████████░░░░░░░░░░░░  10%           │    │
  │  │ Actividades         ████████████████░░░░  20%           │    │
  │  │ Evidencias          ████████████████░░░░  20%           │    │
  │  │ Producto Integrador ████████████████░░░░  20%           │    │
  │  │ Examen              ██████████████████████████░░  30%   │    │
  │  └─────────────────────────────────────────────────────────┘    │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │  PASO 3: Lista de Alumnos                                       │
  │  ┌─────────────────────────────────────────────────────────┐    │
  │  │  📄 Importar Excel                                      │    │
  │  │  [Seleccionar archivo...]                               │    │
  │  │                                                         │    │
  │  │  Vista previa: 25 alumnos cargados                      │    │
  │  │  ┌──────────────────────────────────────────────────┐   │    │
  │  │  │ # │ Matrícula  │ Nombre                          │   │    │
  │  │  │ 1 │ 2024001    │ García López, Juan              │   │    │
  │  │  │ 2 │ 2024002    │ Martínez Ruiz, María            │   │    │
  │  │  └──────────────────────────────────────────────────┘   │    │
  │  └─────────────────────────────────────────────────────────┘    │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                         [Generar Evaluación 📥] │
  └─────────────────────────────────────────────────────────────────┘

  ---
  Requisitos del Entorno

  Para desarrollo (Linux/Mac/Windows)

  - Node.js 18+
  - pnpm

  Para generación de XLSX (solo Windows)

  - Python 3.x
  - pywin32 (pip install pywin32)
  - Microsoft Excel instalado

  ---
  Comandos Útiles

  # Desarrollo
  pnpm dev

  # Build
  pnpm build

  # Instalar dependencias Python (en Windows)
  pip install pywin32 openpyxl

  ---
  Notas Importantes

  1. El template XLSX debe estar en templates/evaluacion_template.xlsx
  2. El script Python solo funcionará en Windows con Excel instalado
  3. Los alumnos se importan desde un archivo .xlsx con columnas: Matrícula, Nombre
  4. Las ponderaciones siempre deben sumar 100%

