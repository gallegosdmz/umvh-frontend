# Panel del Director

## Descripción
El panel del director es una interfaz especializada que permite al director de la institución visualizar y analizar el rendimiento académico de todos los alumnos y sus calificaciones en todas las materias a las que están asignados.

## Características Principales

### 🏠 Dashboard Principal (`/director`)
- **Estadísticas Generales**: Muestra el total de alumnos, asignaturas, grupos y promedio general
- **Acciones Rápidas**: Enlaces directos a la gestión de alumnos y reportes
- **Vista Panorámica**: Resumen ejecutivo del estado académico de la institución

### 👥 Gestión de Alumnos (`/director/alumnos`)
- **Lista Completa**: Visualización de todos los alumnos registrados
- **Filtros Avanzados**: 
  - Búsqueda por nombre o matrícula
  - Filtro por grupo
  - Filtro por asignatura
- **Calificaciones Detalladas**: Modal con calificaciones completas por alumno
- **Promedios Generales**: Cálculo automático del rendimiento académico
- **Exportación**: Funcionalidad para descargar reportes

### 📊 Reportes de Calificaciones (`/director/reportes`)
- **Vista General**: Gráficos y estadísticas del rendimiento académico
- **Reportes por Asignatura**: Análisis detallado por materia y grupo
- **Reportes por Alumno**: Rendimiento individual de cada estudiante
- **Gráficos Interactivos**: 
  - Gráficos de barras para promedios por asignatura
  - Gráficos circulares para distribución de calificaciones
- **Filtros de Reporte**: Personalización de reportes por asignatura y grupo

## Funcionalidades Específicas

### Visualización de Calificaciones
- **Parciales**: Calificaciones de los tres parciales
- **Examen Final**: Calificación del examen final
- **Promedio por Asignatura**: Cálculo automático del promedio
- **Promedio General**: Promedio general del alumno
- **Códigos de Color**: 
  - Verde: Excelente (9-10)
  - Azul: Bueno (8-8.9)
  - Amarillo: Promedio (7-7.9)
  - Naranja: Bajo (6-6.9)
  - Rojo: Reprobado (<6)

### Análisis de Rendimiento
- **Tasa de Aprobación**: Porcentaje de alumnos aprobados
- **Tasa de Excelencia**: Porcentaje de alumnos con calificaciones excelentes
- **Distribución de Calificaciones**: Análisis estadístico del rendimiento
- **Comparativas**: Comparación entre grupos y asignaturas

### Filtros y Búsqueda
- **Búsqueda en Tiempo Real**: Filtrado instantáneo de resultados
- **Filtros Múltiples**: Combinación de filtros por grupo y asignatura
- **Paginación**: Navegación eficiente en grandes volúmenes de datos
- **Ordenamiento**: Organización por diferentes criterios

## Estructura de Archivos

```
app/director/
├── layout.tsx          # Layout específico para el director
├── page.tsx            # Dashboard principal
├── alumnos/
│   └── page.tsx        # Gestión de alumnos y calificaciones
└── reportes/
    └── page.tsx        # Reportes y análisis
```

## Roles y Permisos

### Rol de Director
- **Acceso Completo**: Visualización de todos los alumnos y calificaciones
- **Solo Lectura**: No puede modificar calificaciones (solo visualización)
- **Reportes**: Generación de reportes detallados
- **Análisis**: Acceso a estadísticas y gráficos

### Seguridad
- **Autenticación**: Verificación de rol de director
- **Autorización**: Redirección automática si no tiene permisos
- **Protección de Rutas**: Layout específico con validación de rol

## Tecnologías Utilizadas

- **Next.js 15**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos y diseño
- **Recharts**: Gráficos y visualizaciones
- **Radix UI**: Componentes de interfaz
- **Lucide React**: Iconografía

## Instalación y Configuración

1. **Dependencias**: Asegúrate de tener instalado `recharts`:
   ```bash
   npm install recharts
   ```

2. **Configuración de Roles**: El usuario debe tener el rol `"director"` en la base de datos

3. **Acceso**: Navegar a `/director` después de iniciar sesión como director

## Uso

### Acceso al Panel
1. Iniciar sesión con credenciales de director
2. Ser redirigido automáticamente al dashboard del director
3. Navegar entre las diferentes secciones usando el menú

### Generación de Reportes
1. Ir a la sección "Reportes"
2. Seleccionar filtros deseados (asignatura, grupo)
3. Visualizar reportes en diferentes formatos
4. Exportar reportes según sea necesario

### Visualización de Alumnos
1. Ir a la sección "Alumnos"
2. Usar filtros para encontrar alumnos específicos
3. Hacer clic en "Ver Calificaciones" para detalles completos
4. Analizar el rendimiento individual

## Notas de Desarrollo

- **Datos Mock**: Actualmente usa datos ficticios para demostración
- **Integración**: Preparado para integración con API real
- **Responsive**: Diseño adaptativo para diferentes dispositivos
- **Accesibilidad**: Componentes accesibles siguiendo estándares WCAG 