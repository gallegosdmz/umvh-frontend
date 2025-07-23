interface OfflineAction {
  id: string
  type: 'student' | 'teacher' | 'course' | 'group' | 'period'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

class OfflineSyncService {
  private static instance: OfflineSyncService
  private isOnline: boolean = true
  private syncQueue: OfflineAction[] = []

  private constructor() {
    // Solo inicializar en el cliente
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.initializeEventListeners()
      this.loadPendingActions()
    }
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService()
    }
    return OfflineSyncService.instance
  }

  private initializeEventListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingActions()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private loadPendingActions() {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('offlineActions')
      if (saved) {
        this.syncQueue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error cargando acciones offline:', error)
    }
  }

  private savePendingActions() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('offlineActions', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Error guardando acciones offline:', error)
    }
  }

  // Agregar acción a la cola de sincronización
  addOfflineAction(action: Omit<OfflineAction, 'timestamp'>) {
    const offlineAction: OfflineAction = {
      ...action,
      timestamp: Date.now()
    }

    this.syncQueue.push(offlineAction)
    this.savePendingActions()

    // Si está online, intentar sincronizar inmediatamente
    if (this.isOnline) {
      this.syncPendingActions()
    }
  }

  // Sincronizar acciones pendientes
  private async syncPendingActions() {
    if (!this.isOnline || this.syncQueue.length === 0) return

    const actionsToSync = [...this.syncQueue]
    const successfulActions: string[] = []

    for (const action of actionsToSync) {
      try {
        await this.performAction(action)
        successfulActions.push(action.id)
      } catch (error) {
        console.error(`Error sincronizando acción ${action.id}:`, error)
      }
    }

    // Remover acciones exitosas de la cola
    this.syncQueue = this.syncQueue.filter(
      action => !successfulActions.includes(action.id)
    )
    this.savePendingActions()
  }

  // Ejecutar acción específica
  private async performAction(action: OfflineAction) {
    const { type, action: actionType, data } = action

    switch (type) {
      case 'student':
        await this.syncStudentAction(actionType, data)
        break
      case 'teacher':
        await this.syncTeacherAction(actionType, data)
        break
      case 'course':
        await this.syncCourseAction(actionType, data)
        break
      case 'group':
        await this.syncGroupAction(actionType, data)
        break
      case 'period':
        await this.syncPeriodAction(actionType, data)
        break
      default:
        throw new Error(`Tipo de acción no soportado: ${type}`)
    }
  }

  // Métodos específicos para cada tipo de entidad
  private async syncStudentAction(action: string, data: any) {
    console.log('Sincronizando estudiante:', action, data)
    
    try {
      const { studentService } = await import('./student.service')
      
      switch (action) {
        case 'create':
          await studentService.createStudent(data)
          break
        case 'update':
          await studentService.updateStudent(data.id, data)
          break
        case 'delete':
          await studentService.deleteStudent(data.id)
          break
        default:
          throw new Error(`Acción no soportada: ${action}`)
      }
    } catch (error) {
      console.error('Error sincronizando estudiante:', error)
      throw error
    }
  }

  private async syncTeacherAction(action: string, data: any) {
    // Implementar lógica específica para maestros
    console.log('Sincronizando maestro:', action, data)
    // Aquí harías las llamadas a tu API
  }

  private async syncCourseAction(action: string, data: any) {
    // Implementar lógica específica para cursos
    console.log('Sincronizando curso:', action, data)
    // Aquí harías las llamadas a tu API
  }

  private async syncGroupAction(action: string, data: any) {
    console.log('Sincronizando grupo:', action, data)
    
    try {
      const { groupService } = await import('./group.service')
      
      switch (action) {
        case 'create':
          await groupService.createGroup(data)
          break
        case 'update':
          await groupService.updateGroup(data.id, data)
          break
        case 'delete':
          await groupService.deleteGroup(data.id)
          break
        default:
          throw new Error(`Acción no soportada: ${action}`)
      }
    } catch (error) {
      console.error('Error sincronizando grupo:', error)
      throw error
    }
  }

  private async syncPeriodAction(action: string, data: any) {
    // Implementar lógica específica para períodos
    console.log('Sincronizando período:', action, data)
    // Aquí harías las llamadas a tu API
  }

  // Obtener estado de conexión
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  // Obtener acciones pendientes
  getPendingActions(): OfflineAction[] {
    return [...this.syncQueue]
  }

  // Limpiar todas las acciones pendientes (útil para testing)
  clearPendingActions() {
    this.syncQueue = []
    this.savePendingActions()
  }

  // Forzar sincronización manual
  async forceSync() {
    await this.syncPendingActions()
  }
}

export const offlineSyncService = OfflineSyncService.getInstance() 