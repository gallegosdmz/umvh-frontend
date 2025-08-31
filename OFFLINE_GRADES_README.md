# Sistema Offline para Calificaciones con Dexie.js

## 🎯 **Descripción**

Este sistema permite a los maestros trabajar con calificaciones sin conexión a internet, utilizando una base de datos local (IndexedDB) a través de Dexie.js. Los datos se sincronizan automáticamente cuando se restaura la conexión.

## 🚀 **Características Principales**

### **Funcionalidades Offline**
- ✅ **Calificaciones de Actividades**: Guardar calificaciones de actividades y evidencias offline
- ✅ **Calificaciones Parciales**: Calcular y guardar calificaciones parciales offline
- ✅ **Calificaciones Finales**: Gestionar calificaciones ordinarias y extraordinarias offline
- ✅ **Actividades Definidas**: Crear y editar actividades del curso offline
- ✅ **Asistencias**: Registrar asistencias offline
- ✅ **Sincronización Automática**: Sincronización automática cuando hay conexión
- ✅ **Sincronización Manual**: Botón para forzar sincronización

### **Indicadores Visuales**
- 🔴 **Rojo**: Modo offline (sin conexión)
- 🟡 **Amarillo**: Datos pendientes de sincronización
- 🟢 **Verde**: Todo sincronizado
- 🔵 **Azul**: Base de datos inicializando

## 📁 **Archivos Implementados**

### **1. Base de Datos (Dexie)**
- `lib/database/grades-database.ts` - Base de datos principal con todas las tablas

### **2. Hook Principal**
- `hooks/use-offline-grades.ts` - Hook para manejar todas las operaciones offline

### **3. Componente de Estado**
- `components/offline-grades-status.tsx` - Indicador visual del estado offline

## 🗄️ **Estructura de la Base de Datos**

### **Tablas Principales**
```typescript
// Calificaciones de actividades/evidencias
partialEvaluationGrades: {
  id?: number
  offlineId: string
  grade: number
  partialEvaluationId: number
  courseGroupStudentId: number
  isOffline: boolean
  timestamp: number
  synced: boolean
}

// Calificaciones parciales
partialGrades: {
  id?: number
  offlineId: string
  partial: number
  grade: number
  date: string
  courseGroupStudentId: number
  isOffline: boolean
  timestamp: number
  synced: boolean
}

// Calificaciones finales
finalGrades: {
  id?: number
  offlineId: string
  grade: number
  gradeOrdinary: number
  gradeExtraordinary: number
  date: string
  type: string
  courseGroupStudentId: number
  isOffline: boolean
  timestamp: number
  synced: boolean
}

// Actividades definidas
partialEvaluations: {
  id?: number
  offlineId: string
  name: string
  partial: number
  type: string
  courseGroupId: number
  slot: number
  isOffline: boolean
  timestamp: number
  synced: boolean
}

// Asistencias
attendances: {
  id?: number
  offlineId: string
  courseGroupStudentId: number
  date: string
  attend: number
  partial: number
  isOffline: boolean
  timestamp: number
  synced: boolean
}
```

## 🔧 **Cómo Usar**

### **1. Importar el Hook**
```typescript
import { useOfflineGrades } from '@/hooks/use-offline-grades'

// En tu componente
const { 
  isDatabaseInitialized,
  savePartialEvaluationGradeOffline,
  updatePartialEvaluationGradeOffline,
  savePartialGradeOffline,
  updatePartialGradeOffline,
  saveFinalGradeOffline,
  updateFinalGradeOffline,
  savePartialEvaluationOffline,
  getCombinedPartialEvaluationGrades,
  getCombinedPartialGrades,
  syncOfflineGrades
} = useOfflineGrades()
```

### **2. Guardar Calificaciones Offline**
```typescript
// Guardar calificación de actividad offline
const offlineId = await savePartialEvaluationGradeOffline(
  grade,                    // Calificación (0-10)
  partialEvaluationId,      // ID de la actividad
  courseGroupStudentId      // ID del estudiante en el grupo
)

// Actualizar calificación existente offline
await updatePartialEvaluationGradeOffline(offlineId, {
  grade: newGrade
})
```

### **3. Obtener Datos Combinados**
```typescript
// Obtener calificaciones combinadas (online + offline)
const combinedGrades = await getCombinedPartialEvaluationGrades(
  courseGroupStudentId,
  onlineGrades              // Datos del servidor
)

// Obtener calificaciones parciales combinadas
const combinedPartialGrades = await getCombinedPartialGrades(
  courseGroupStudentId,
  partial,                  // Número de parcial
  onlinePartialGrades       // Datos del servidor
)
```

### **4. Sincronización**
```typescript
// Sincronización automática (se ejecuta cuando hay conexión)
// No requiere acción manual

// Sincronización manual
await syncOfflineGrades()
```

## 🎨 **Integración en el Componente Principal**

### **1. Agregar el Hook**
```typescript
// Hook para manejar calificaciones offline
const { 
  isDatabaseInitialized,
  savePartialEvaluationGradeOffline,
  updatePartialEvaluationGradeOffline,
  savePartialGradeOffline,
  updatePartialGradeOffline,
  saveFinalGradeOffline,
  updateFinalGradeOffline,
  savePartialEvaluationOffline,
  getCombinedPartialEvaluationGrades,
  getCombinedPartialGrades,
  syncOfflineGrades
} = useOfflineGrades()
```

### **2. Modificar la Función de Guardado**
```typescript
const handleSaveStudentGrade = async (courseGroupStudentId: number, type: string, index: number, grade: number) => {
  try {
    // ... verificación de actividad definida ...

    // Intentar guardar online primero
    try {
      if (currentGrade.id) {
        await CourseService.updatePartialEvaluationGrade(currentGrade.id, dto)
        toast.success("Calificación actualizada")
      } else {
        const result = await CourseService.createPartialEvaluationGrade(dto)
        // ... actualizar estado local ...
        toast.success("Calificación guardada")
      }
    } catch (onlineError) {
      console.log('⚠️ Error online, guardando offline:', onlineError)
      
      // Guardar offline si falla la conexión
      if (isDatabaseInitialized) {
        try {
          if (currentGrade.id) {
            await updatePartialEvaluationGradeOffline(currentGrade.id.toString(), {
              grade: grade,
              partialEvaluationId: actividadDefinida.id,
              courseGroupStudentId: courseGroupStudentId
            })
          } else {
            const offlineId = await savePartialEvaluationGradeOffline(
              grade,
              actividadDefinida.id,
              courseGroupStudentId
            )
            // ... actualizar estado local con offlineId ...
          }
          toast.success("Calificación guardada offline")
        } catch (offlineError) {
          console.error('❌ Error guardando offline:', offlineError)
          toast.error("Error al guardar la calificación offline")
          return
        }
      } else {
        toast.error("Error de conexión y base de datos offline no disponible")
        return
      }
    }

    // ... recalcular calificaciones parciales ...
  } catch (error) {
    console.error('Error al guardar calificación:', error)
    toast.error("Error al guardar la calificación")
  }
}
```

### **3. Agregar el Componente de Estado**
```typescript
// Al final del componente, antes del cierre
{/* Componente de estado offline para calificaciones */}
<OfflineGradesStatus />
```

## 🔄 **Flujo de Sincronización**

### **1. Modo Online**
- Los datos se guardan directamente en el servidor
- Funcionamiento normal sin cambios

### **2. Modo Offline**
- Los datos se guardan en la base de datos local
- Se marca como `synced: false`
- Aparece indicador rojo "Offline"

### **3. Sincronización Automática**
- Cuando se restaura la conexión
- Se ejecuta `syncOfflineGrades()` automáticamente
- Los datos se envían al servidor
- Se marca como `synced: true`
- Se eliminan de la base de datos local

### **4. Sincronización Manual**
- Botón "🔄 Sincronizar Manualmente" disponible
- Útil cuando hay problemas de conexión intermitente

## 📱 **Indicadores de Estado**

### **Estado Principal**
- **🔴 Offline**: Sin conexión a internet
- **🟡 X Pendientes**: Datos pendientes de sincronización
- **🟢 Sincronizado**: Todo actualizado

### **Panel Expandido**
- **Conexión**: Estado de la conexión a internet
- **Base de datos**: Estado de la base de datos local
- **Sincronización**: Cantidad de elementos pendientes
- **Botón de sincronización**: Para forzar sincronización manual

## 🚨 **Manejo de Errores**

### **Errores Online**
- Se capturan y se redirigen al modo offline
- Se muestra mensaje "Error online, guardando offline"

### **Errores Offline**
- Se muestran en consola para debugging
- Se muestran toasts de error al usuario
- Los datos se mantienen en la base de datos local

### **Errores de Base de Datos**
- Se verifica `isDatabaseInitialized` antes de operaciones
- Se muestran mensajes claros al usuario

## 🧹 **Limpieza Automática**

### **Datos Antiguos**
- Se eliminan automáticamente datos de más de 30 días
- Se ejecuta al inicializar la base de datos
- Configurable en `cleanupOldData(daysOld)`

### **Datos Sincronizados**
- Se eliminan automáticamente después de sincronización exitosa
- Se mantienen solo los datos pendientes

## 🔧 **Configuración Avanzada**

### **Cambiar Tiempo de Limpieza**
```typescript
// Limpiar datos de más de 60 días
await cleanupOldData(60)
```

### **Verificar Datos Pendientes**
```typescript
const hasPending = await hasPendingData()
if (hasPending) {
  console.log('Hay datos pendientes de sincronización')
}
```

### **Obtener Datos No Sincronizados**
```typescript
const unsyncedData = await gradesDB.getUnsyncedData()
console.log('Datos pendientes:', unsyncedData)
```

## 📊 **Monitoreo y Debugging**

### **Logs de Consola**
- ✅ Operaciones exitosas
- ⚠️ Cambios a modo offline
- ❌ Errores de sincronización
- 🔄 Proceso de sincronización

### **Estado de la Base de Datos**
- Inicialización automática
- Verificación de conectividad
- Conteo de elementos pendientes

## 🎯 **Casos de Uso**

### **1. Conexión Intermitente**
- Los maestros pueden trabajar normalmente
- Los datos se guardan offline automáticamente
- Se sincronizan cuando hay conexión estable

### **2. Sin Conexión**
- Trabajo completamente offline
- Todas las calificaciones se guardan localmente
- Sincronización automática al restaurar conexión

### **3. Conexión Lenta**
- Fallback automático a modo offline
- Sincronización en segundo plano
- Experiencia de usuario fluida

## 🚀 **Ventajas del Sistema**

### **Para los Maestros**
- ✅ Trabajo ininterrumpido sin importar la conexión
- ✅ No se pierden datos por problemas de red
- ✅ Indicadores claros del estado del sistema
- ✅ Sincronización automática y transparente

### **Para el Sistema**
- ✅ Reducción de errores por problemas de red
- ✅ Mejor experiencia de usuario
- ✅ Datos consistentes entre online y offline
- ✅ Fácil mantenimiento y debugging

## 🔮 **Futuras Mejoras**

### **Funcionalidades Planeadas**
- [ ] Sincronización selectiva (elegir qué sincronizar)
- [ ] Historial de sincronizaciones
- [ ] Backup automático de datos offline
- [ ] Notificaciones push de estado de sincronización
- [ ] Métricas de rendimiento offline

### **Optimizaciones**
- [ ] Compresión de datos offline
- [ ] Sincronización incremental
- [ ] Cache inteligente de datos frecuentes
- [ ] Sincronización en segundo plano

---

## 📞 **Soporte**

Si tienes problemas con el sistema offline:

1. **Verificar conexión a internet**
2. **Revisar consola del navegador**
3. **Usar botón de sincronización manual**
4. **Verificar que la base de datos esté inicializada**
5. **Contactar al equipo de desarrollo**

---

**Desarrollado con ❤️ para maestros que trabajan en zonas con conexión limitada**
