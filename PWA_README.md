# Implementación PWA - Sistema de Gestión Escolar

## Descripción

Esta implementación convierte el Sistema de Gestión Escolar en una Progressive Web App (PWA) que permite a los maestros y administradores trabajar sin conexión a internet o con conexión limitada.

## Características Implementadas

### 1. **Instalación PWA**
- Banner de instalación automático
- Soporte para instalación en dispositivos móviles y desktop
- Iconos adaptativos para diferentes tamaños de pantalla

### 2. **Funcionalidad Offline**
- Cache de recursos estáticos (CSS, JS, imágenes)
- Almacenamiento local de datos usando localStorage
- Cola de sincronización para acciones pendientes

### 3. **Indicadores de Estado**
- Indicador de conexión a internet
- Estado de sincronización de datos
- Notificaciones de acciones pendientes

### 4. **Sincronización Inteligente**
- Sincronización automática cuando se restaura la conexión
- Sincronización manual con botón de fuerza
- Manejo de errores de sincronización

## Archivos Implementados

### Configuración Principal
- `next.config.mjs` - Configuración de next-pwa
- `public/manifest.json` - Manifesto de la PWA
- `app/layout.tsx` - Metadatos y configuración PWA

### Componentes
- `components/offline-status.tsx` - Indicador de estado offline
- `components/pwa-install-prompt.tsx` - Banner de instalación
- `components/sync-status.tsx` - Estado de sincronización

### Hooks y Servicios
- `hooks/use-offline-storage.ts` - Hook para almacenamiento offline
- `lib/services/offline-sync.service.ts` - Servicio de sincronización

## Cómo Usar

### Para Desarrolladores

1. **Instalar dependencias:**
   ```bash
   pnpm add next-pwa
   ```

2. **Configurar next.config.mjs:**
   ```javascript
   import withPWA from 'next-pwa'
   
   const config = withPWA({
     dest: 'public',
     register: true,
     skipWaiting: true,
     disable: process.env.NODE_ENV === 'development',
     runtimeCaching: [...]
   })(nextConfig)
   ```

3. **Usar el hook de almacenamiento offline:**
   ```javascript
   import { useOfflineStorage } from '@/hooks/use-offline-storage'
   
   const { isOnline, saveOfflineAction } = useOfflineStorage()
   
   // Guardar acción offline
   saveOfflineAction({
     id: 'unique-id',
     type: 'student',
     action: 'create',
     data: studentData
   })
   ```

### Para Usuarios

1. **Instalar la aplicación:**
   - En Chrome/Edge: Aparecerá un banner de instalación
   - En móviles: Usar "Agregar a pantalla de inicio"

2. **Usar sin conexión:**
   - Los datos se guardan localmente
   - Las acciones se sincronizan automáticamente cuando hay conexión

3. **Verificar estado:**
   - Indicadores en la esquina superior derecha
   - Estado de sincronización en la esquina inferior derecha

## Configuración de Cache

La PWA utiliza una estrategia de cache "Network First" que:
- Intenta cargar desde la red primero
- Si falla, usa datos cacheados
- Cachea automáticamente recursos estáticos

## Sincronización de Datos

### Tipos de Entidades Soportadas
- Estudiantes (`student`)
- Maestros (`teacher`)
- Cursos (`course`)
- Grupos (`group`)
- Períodos (`period`)

### Acciones Soportadas
- Crear (`create`)
- Actualizar (`update`)
- Eliminar (`delete`)

### Flujo de Sincronización
1. Usuario realiza acción offline
2. Acción se guarda en cola local
3. Cuando hay conexión, se sincroniza automáticamente
4. Se eliminan acciones exitosas de la cola

## Personalización

### Cambiar Iconos
1. Reemplazar `public/favicon.png` con iconos de 192x192 y 512x512
2. Actualizar referencias en `manifest.json`

### Modificar Colores
1. Cambiar `theme_color` en `manifest.json`
2. Actualizar `theme-color` en `layout.tsx`

### Agregar Nuevos Tipos de Datos
1. Extender el tipo `OfflineAction` en `offline-sync.service.ts`
2. Agregar método de sincronización específico
3. Actualizar el switch en `performAction`

## Testing

### Probar Funcionalidad Offline
1. Abrir DevTools (F12)
2. Ir a pestaña "Application" > "Service Workers"
3. Marcar "Offline"
4. Realizar acciones en la aplicación

### Verificar Instalación PWA
1. En Chrome: Verificar que aparece el banner de instalación
2. En móviles: Verificar que se puede agregar a pantalla de inicio

## Troubleshooting

### Problemas Comunes

1. **PWA no se instala:**
   - Verificar que el manifest.json es válido
   - Comprobar que los iconos existen
   - Asegurar que se sirve desde HTTPS

2. **Datos no se sincronizan:**
   - Verificar conexión a internet
   - Revisar console para errores
   - Usar botón de sincronización manual

3. **Cache no funciona:**
   - Verificar configuración de next-pwa
   - Limpiar cache del navegador
   - Revisar Service Worker en DevTools

## Próximas Mejoras

- [ ] Sincronización con Supabase
- [ ] Notificaciones push
- [ ] Background sync
- [ ] Compresión de datos offline
- [ ] Métricas de uso offline 