# Sistema Offline de Toma de Asistencia

## Descripción
El sistema de Toma de Asistencia ahora funciona completamente offline, permitiendo registrar asistencias sin conexión a internet.

## Características
- ✅ Registro offline de asistencias
- 🔄 Sincronización automática cuando hay conexión
- 💾 Almacenamiento local en localStorage
- 🚨 Indicadores visuales de estado offline
- 🔁 Botón manual de sincronización

## Cómo Usar

### Modo Online
- Las asistencias se guardan directamente en el servidor
- Funcionamiento normal sin cambios

### Modo Offline
- Las asistencias se guardan localmente
- Aparece advertencia de modo offline
- Botón de sincronización disponible

### Sincronización
- Automática cuando se restaura la conexión
- Manual con botón "🔄 Sincronizar Offline"
- Los datos offline tienen prioridad sobre los online

## Estructura
- **Hook**: `useOfflineAttendance`
- **Almacenamiento**: localStorage
- **Sincronización**: Automática y manual
- **Limpieza**: Datos antiguos se eliminan automáticamente

## Solución de Problemas
1. Verificar conexión a internet
2. Usar botón de sincronización manual
3. Revisar consola del navegador
4. Verificar que el servidor esté disponible
