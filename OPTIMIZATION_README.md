# Optimización de Llamadas al Backend

## Problema Identificado

El frontend estaba haciendo múltiples llamadas individuales al backend para obtener calificaciones parciales de cada estudiante, resultando en:
- **40+ llamadas** para un grupo de 40 estudiantes
- **Lentitud** en la aplicación
- **Sobrecarga** del backend

## Solución Implementada

### 1. Nuevos Endpoints Optimizados

Se han creado nuevos métodos en el servicio que requieren implementación en el backend:

#### A. Obtener Calificaciones Parciales por Grupo
```typescript
GET /api/partial-grades/by-course-group/{courseGroupId}
```
**Descripción**: Obtiene todas las calificaciones parciales de todos los estudiantes de un grupo en una sola llamada.

**Respuesta esperada**:
```json
[
  {
    "id": 1,
    "courseGroupStudentId": 10,
    "partial": 1,
    "grade": 85.5,
    "date": "2024-01-15T00:00:00.000Z"
  },
  {
    "id": 2,
    "courseGroupStudentId": 10,
    "partial": 2,
    "grade": 92.0,
    "date": "2024-02-15T00:00:00.000Z"
  }
  // ... más calificaciones
]
```

#### B. Obtener Asistencias por Grupo
```typescript
GET /api/attendances/by-course-group/{courseGroupId}
```
**Descripción**: Obtiene todas las asistencias de todos los estudiantes de un grupo en una sola llamada.

**Respuesta esperada**:
```json
[
  {
    "id": 1,
    "courseGroupStudentId": 10,
    "date": "2024-01-15",
    "attend": 1,
    "partial": 1
  },
  {
    "id": 2,
    "courseGroupStudentId": 10,
    "date": "2024-01-16",
    "attend": 2,
    "partial": 1
  }
  // ... más asistencias
]
```

#### C. Obtener Datos Completos del Grupo (SUPER OPTIMIZADO)
```typescript
GET /api/course-groups/{courseGroupId}/complete-data
```
**Descripción**: Obtiene TODA la información del grupo en una sola llamada (estudiantes, calificaciones, asistencias, calificaciones finales, evaluaciones parciales).

**Respuesta esperada**:
```json
{
  "students": [
    {
      "id": 10,
      "student": {
        "id": 1,
        "fullName": "Juan Pérez",
        "semester": 3,
        "registrationNumber": "2024001"
      }
    }
    // ... más estudiantes
  ],
  "partialGrades": [
    {
      "id": 1,
      "courseGroupStudentId": 10,
      "partial": 1,
      "grade": 85.5,
      "date": "2024-01-15T00:00:00.000Z"
    }
    // ... más calificaciones
  ],
  "attendances": [
    {
      "id": 1,
      "courseGroupStudentId": 10,
      "date": "2024-01-15",
      "attend": 1,
      "partial": 1
    }
    // ... más asistencias
  ],
  "finalGrades": [
    {
      "id": 1,
      "courseGroupStudentId": 10,
      "gradeOrdinary": 88.5,
      "gradeExtraordinary": 0
    }
    // ... más calificaciones finales
  ],
  "partialEvaluations": [
    {
      "id": 1,
      "name": "Actividad 1",
      "type": "Actividades",
      "partial": 1,
      "courseGroupId": 5,
      "slot": 0
    }
    // ... más evaluaciones
  ]
}
```

### 2. Implementación en el Backend

#### A. Controlador para Calificaciones Parciales
```typescript
// En el controlador de partial-grades
@Get('by-course-group/:courseGroupId')
async getPartialGradesByCourseGroup(@Param('courseGroupId') courseGroupId: number) {
  return this.partialGradesService.findByCourseGroup(courseGroupId);
}
```

#### B. Controlador para Asistencias
```typescript
// En el controlador de attendances
@Get('by-course-group/:courseGroupId')
async getAttendancesByCourseGroup(@Param('courseGroupId') courseGroupId: number) {
  return this.attendancesService.findByCourseGroup(courseGroupId);
}
```

#### C. Controlador para Datos Completos
```typescript
// En el controlador de course-groups
@Get(':id/complete-data')
async getCompleteData(@Param('id') id: number) {
  return this.courseGroupsService.getCompleteData(id);
}
```

### 3. Servicios en el Backend

#### A. Servicio de Calificaciones Parciales
```typescript
// En partial-grades.service.ts
async findByCourseGroup(courseGroupId: number) {
  return this.partialGradesRepository.find({
    where: {
      courseGroupStudent: {
        courseGroup: { id: courseGroupId }
      }
    },
    relations: ['courseGroupStudent']
  });
}
```

#### B. Servicio de Asistencias
```typescript
// En attendances.service.ts
async findByCourseGroup(courseGroupId: number) {
  return this.attendancesRepository.find({
    where: {
      courseGroupStudent: {
        courseGroup: { id: courseGroupId }
      }
    },
    relations: ['courseGroupStudent']
  });
}
```

#### C. Servicio de Grupos de Cursos
```typescript
// En course-groups.service.ts
async getCompleteData(courseGroupId: number) {
  const [students, partialGrades, attendances, finalGrades, partialEvaluations] = await Promise.all([
    this.courseGroupsStudentsRepository.find({
      where: { courseGroup: { id: courseGroupId } },
      relations: ['student']
    }),
    this.partialGradesRepository.find({
      where: {
        courseGroupStudent: {
          courseGroup: { id: courseGroupId }
        }
      },
      relations: ['courseGroupStudent']
    }),
    this.attendancesRepository.find({
      where: {
        courseGroupStudent: {
          courseGroup: { id: courseGroupId }
        }
      },
      relations: ['courseGroupStudent']
    }),
    this.finalGradesRepository.find({
      where: {
        courseGroupStudent: {
          courseGroup: { id: courseGroupId }
        }
      },
      relations: ['courseGroupStudent']
    }),
    this.partialEvaluationsRepository.find({
      where: { courseGroup: { id: courseGroupId } }
    })
  ]);

  return {
    students,
    partialGrades,
    attendances,
    finalGrades,
    partialEvaluations
  };
}
```

### 4. Beneficios de la Optimización

1. **Reducción de llamadas**: De 40+ llamadas a 1 sola llamada
2. **Mejor rendimiento**: La aplicación será mucho más rápida
3. **Menos carga en el backend**: Reducción significativa de la carga del servidor
4. **Mejor experiencia de usuario**: Carga más rápida de los datos

### 5. Implementación Gradual

Si no puedes implementar todos los endpoints de inmediato, puedes implementarlos en este orden:

1. **Primero**: `GET /api/partial-grades/by-course-group/{courseGroupId}`
2. **Segundo**: `GET /api/attendances/by-course-group/{courseGroupId}`
3. **Tercero**: `GET /api/course-groups/{courseGroupId}/complete-data`

El frontend ya está preparado para usar cualquiera de estos métodos según estén disponibles.

### 6. Testing

Para probar que los endpoints funcionan correctamente:

```bash
# Probar calificaciones parciales por grupo
curl -X GET "http://localhost:3000/api/partial-grades/by-course-group/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Probar asistencias por grupo
curl -X GET "http://localhost:3000/api/attendances/by-course-group/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Probar datos completos del grupo
curl -X GET "http://localhost:3000/api/course-groups/1/complete-data" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Notas Importantes

- Asegúrate de que los endpoints incluyan las relaciones necesarias
- Implementa manejo de errores apropiado
- Considera la paginación si los grupos son muy grandes
- Mantén la consistencia en el formato de respuesta
- Documenta los nuevos endpoints en tu API documentation 