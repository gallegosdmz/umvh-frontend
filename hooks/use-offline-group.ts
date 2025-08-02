'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGroup } from '@/lib/hooks/useGroup'
import { useOfflineStorage } from './use-offline-storage'
import { Group, CreateGroupDto } from '@/lib/mock-data'
import { toast } from 'react-toastify'

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem('currentUser');
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
      'Content-Type': 'application/json',
      'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
}

export function useOfflineGroup() {
  const {
    loading: groupLoading,
    error: groupError,
    totalItems: groupTotalItems,
    handleGetGroups,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAssignStudents
  } = useGroup()

  const { isOnline, saveOfflineAction, syncOfflineActions } = useOfflineStorage()
  const [offlineGroups, setOfflineGroups] = useState<Group[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const lastLoadRef = useRef<{ limit?: number; offset?: number; timestamp: number }>({ timestamp: 0 })

  // Cargar grupos offline al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('offline_groups')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setOfflineGroups(parsed)
        setGroups(parsed)
      } catch (error) {
        console.error('Error cargando grupos offline:', error)
      }
    }
    setIsInitialized(true)
  }, [])

  // Verificar conectividad real al servidor
  const checkServerConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://uamvh.cloud'}/groups`, {
        method: 'HEAD',
        headers: getAuthHeaders(),
        cache: 'no-cache'
      })
      return response.ok
    } catch (error) {
      console.log('Servidor no disponible:', error)
      return false
    }
  }, [])

  // Combinar datos online y offline
  const getCombinedGroups = useCallback(async (limit?: number, offset?: number) => {
    // Evitar llamadas duplicadas en un corto período de tiempo
    const now = Date.now()
    const lastLoad = lastLoadRef.current
    if (lastLoad.limit === limit && lastLoad.offset === offset && (now - lastLoad.timestamp) < 1000) {
      console.log('Evitando llamada duplicada a getCombinedGroups')
      return
    }

    lastLoadRef.current = { limit, offset, timestamp: now }
    setLoading(true)
    console.log(`getCombinedGroups - Limit: ${limit}, Offset: ${offset}, Online: ${isOnline}`)
    
    try {
      if (isOnline) {
        // Verificar conectividad real al servidor
        const serverAvailable = await checkServerConnectivity()
        console.log(`Servidor disponible: ${serverAvailable}`)
        if (serverAvailable) {
          // Solo intentar cargar del servidor si está disponible
          const response = await handleGetGroups(limit, offset)
          console.log(`Respuesta del servidor:`, response)
          if (response && response.groups) {
            setGroups(response.groups)
            // Guardar en localStorage para uso offline
            localStorage.setItem('offline_groups', JSON.stringify(response.groups))
            setOfflineGroups(response.groups)
            // Actualizar el total si no se ha establecido
            if (response.total > 0) {
              console.log(`Total de grupos establecido: ${response.total}`)
            }
          }
        } else {
          // Servidor no disponible, usar datos offline con paginación local
          console.log('Servidor no disponible, usando datos offline')
          const startIndex = offset || 0
          const endIndex = startIndex + (limit || 20)
          const paginatedGroups = offlineGroups.slice(startIndex, endIndex)
          console.log(`Grupos offline paginados: ${paginatedGroups.length} de ${offlineGroups.length}`)
          setGroups(paginatedGroups)
        }
      } else {
        // Usar datos offline con paginación local
        console.log('Modo offline: usando datos locales')
        const startIndex = offset || 0
        const endIndex = startIndex + (limit || 20)
        const paginatedGroups = offlineGroups.slice(startIndex, endIndex)
        console.log(`Grupos offline paginados: ${paginatedGroups.length} de ${offlineGroups.length}`)
        setGroups(paginatedGroups)
      }
    } catch (error) {
      console.error('Error cargando grupos:', error)
      // En caso de error, usar datos offline con paginación local
      const startIndex = offset || 0
      const endIndex = startIndex + (limit || 20)
      const paginatedGroups = offlineGroups.slice(startIndex, endIndex)
      setGroups(paginatedGroups)
    } finally {
      setLoading(false)
    }
  }, [isOnline, handleGetGroups, offlineGroups, checkServerConnectivity])

  // Cargar todos los grupos para obtener el total - solo una vez al inicializar
  const loadAllGroupsForTotal = useCallback(async () => {
    if (!isInitialized) return
    
    try {
      if (isOnline) {
        const serverAvailable = await checkServerConnectivity()
        if (serverAvailable) {
          const response = await handleGetGroups(1000, 0) // Obtener todos
          if (response && response.groups) {
            setOfflineGroups(response.groups)
            localStorage.setItem('offline_groups', JSON.stringify(response.groups))
          }
        }
      }
    } catch (error) {
      console.error('Error cargando todos los grupos:', error)
    }
  }, [isOnline, handleGetGroups, checkServerConnectivity, isInitialized])

  // Cargar todos los grupos solo una vez al inicializar
  useEffect(() => {
    if (isInitialized) {
      loadAllGroupsForTotal()
    }
  }, [isInitialized, loadAllGroupsForTotal])

  // Crear grupo con soporte offline
  const createGroup = useCallback(async (groupData: CreateGroupDto) => {
    const newGroup: Group = {
      ...groupData,
      id: Date.now() // Usar timestamp como ID temporal
    }

    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await handleCreateGroup(groupData)
          toast.success('Grupo creado exitosamente')
          await getCombinedGroups()
        } catch (error) {
          console.error('Error creando grupo online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: newGroup.id!.toString(),
            type: 'group',
            action: 'create',
            data: groupData
          })
          
          // Agregar a lista local
          const updatedGroups = [...groups, newGroup]
          setGroups(updatedGroups)
          setOfflineGroups(updatedGroups)
          localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
          
          toast.info('Grupo guardado offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: newGroup.id!.toString(),
          type: 'group',
          action: 'create',
          data: groupData
        })
        
        // Agregar a lista local
        const updatedGroups = [...groups, newGroup]
        setGroups(updatedGroups)
        setOfflineGroups(updatedGroups)
        localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
        
        toast.info('Grupo guardado offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: newGroup.id!.toString(),
        type: 'group',
        action: 'create',
        data: groupData
      })
      
      // Agregar a lista local
      const updatedGroups = [...groups, newGroup]
      setGroups(updatedGroups)
      setOfflineGroups(updatedGroups)
      localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
      
      toast.info('Grupo guardado offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleCreateGroup, groups, saveOfflineAction, getCombinedGroups, checkServerConnectivity])

  // Actualizar grupo con soporte offline
  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          // Convertir updates a CreateGroupDto
          const groupData: CreateGroupDto = {
            name: updates.name || '',
            periodId: updates.periodId || 0,
            semester: updates.semester || 0
          }
          await handleUpdateGroup(id, groupData)
          toast.success('Grupo actualizado exitosamente')
          await getCombinedGroups()
        } catch (error) {
          console.error('Error actualizando grupo online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id,
            type: 'group',
            action: 'update',
            data: { id, ...updates }
          })
          
          // Actualizar lista local
          const updatedGroups = groups.map(group => 
            group.id?.toString() === id ? { ...group, ...updates } : group
          )
          setGroups(updatedGroups)
          setOfflineGroups(updatedGroups)
          localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
          
          toast.info('Cambios guardados offline. Se sincronizarán cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id,
          type: 'group',
          action: 'update',
          data: { id, ...updates }
        })
        
        // Actualizar lista local
        const updatedGroups = groups.map(group => 
          group.id?.toString() === id ? { ...group, ...updates } : group
        )
        setGroups(updatedGroups)
        setOfflineGroups(updatedGroups)
        localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
        
        toast.info('Cambios guardados offline. Se sincronizarán cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id,
        type: 'group',
        action: 'update',
        data: { id, ...updates }
      })
      
      // Actualizar lista local
      const updatedGroups = groups.map(group => 
        group.id?.toString() === id ? { ...group, ...updates } : group
      )
      setGroups(updatedGroups)
      setOfflineGroups(updatedGroups)
      localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
      
      toast.info('Cambios guardados offline. Se sincronizarán cuando haya conexión.')
    }
  }, [isOnline, handleUpdateGroup, groups, saveOfflineAction, getCombinedGroups, checkServerConnectivity])

  // Eliminar grupo con soporte offline
  const deleteGroup = useCallback(async (id: string) => {
    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await handleDeleteGroup(id)
          toast.success('Grupo eliminado exitosamente')
          await getCombinedGroups()
        } catch (error) {
          console.error('Error eliminando grupo online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id,
            type: 'group',
            action: 'delete',
            data: { id }
          })
          
          // Remover de lista local
          const updatedGroups = groups.filter(group => group.id?.toString() !== id)
          setGroups(updatedGroups)
          setOfflineGroups(updatedGroups)
          localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
          
          toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id,
          type: 'group',
          action: 'delete',
          data: { id }
        })
        
        // Remover de lista local
        const updatedGroups = groups.filter(group => group.id?.toString() !== id)
        setGroups(updatedGroups)
        setOfflineGroups(updatedGroups)
        localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
        
        toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id,
        type: 'group',
        action: 'delete',
        data: { id }
      })
      
      // Remover de lista local
      const updatedGroups = groups.filter(group => group.id?.toString() !== id)
      setGroups(updatedGroups)
      setOfflineGroups(updatedGroups)
      localStorage.setItem('offline_groups', JSON.stringify(updatedGroups))
      
      toast.info('Eliminación guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleDeleteGroup, groups, saveOfflineAction, getCombinedGroups, checkServerConnectivity])

  // Asignar estudiantes a grupo con soporte offline
  const assignStudentsToGroup = useCallback(async (groupId: string, studentIds: string[]) => {
    if (isOnline) {
      // Verificar conectividad real al servidor
      const serverAvailable = await checkServerConnectivity()
      if (serverAvailable) {
        try {
          await handleAssignStudents(groupId, studentIds)
          toast.success('Estudiantes asignados exitosamente')
          await getCombinedGroups()
        } catch (error) {
          console.error('Error asignando estudiantes online:', error)
          
          // Si falla online, guardar offline
          saveOfflineAction({
            id: groupId,
            type: 'group',
            action: 'update',
            data: { groupId, studentIds, action: 'assign_students' }
          })
          
          toast.info('Asignación guardada offline. Se sincronizará cuando haya conexión.')
        }
      } else {
        // Servidor no disponible, guardar offline
        saveOfflineAction({
          id: groupId,
          type: 'group',
          action: 'update',
          data: { groupId, studentIds, action: 'assign_students' }
        })
        
        toast.info('Asignación guardada offline. Se sincronizará cuando haya conexión.')
      }
    } else {
      // Guardar offline directamente
      saveOfflineAction({
        id: groupId,
        type: 'group',
        action: 'update',
        data: { groupId, studentIds, action: 'assign_students' }
      })
      
      toast.info('Asignación guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleAssignStudents, saveOfflineAction, getCombinedGroups, checkServerConnectivity])

  // Sincronizar acciones offline cuando vuelve la conexión
  useEffect(() => {
    if (isOnline) {
      syncOfflineActions()
    }
  }, [isOnline, syncOfflineActions])

  return {
    groups,
    loading: loading || groupLoading,
    error: groupError,
    totalItems: groupTotalItems || offlineGroups.length, // Usar el total del hook useGroup o la longitud offline
    isOnline,
    getCombinedGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    assignStudentsToGroup
  }
} 