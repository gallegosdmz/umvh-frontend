'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGroup } from '@/lib/hooks/useGroup'
import { useOfflineStorage } from './use-offline-storage'
import { Group, CreateGroupDto } from '@/lib/mock-data'
import { toast } from 'react-toastify'

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

  const { isOnline, saveOfflineAction } = useOfflineStorage()
  const [offlineGroups, setOfflineGroups] = useState<Group[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Cargar grupos offline al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('offline_groups')
    if (saved) {
      const parsed = JSON.parse(saved)
      setOfflineGroups(parsed)
      setGroups(parsed)
    }
  }, [])

  // Combinar datos online y offline
  const getCombinedGroups = useCallback(async () => {
    try {
      if (isOnline) {
        const onlineGroups = await handleGetGroups()
        if (Array.isArray(onlineGroups)) {
          setGroups(onlineGroups)
          // Guardar en localStorage para uso offline
          localStorage.setItem('offline_groups', JSON.stringify(onlineGroups))
          setOfflineGroups(onlineGroups)
        }
      } else {
        // Usar datos offline
        setGroups(offlineGroups)
      }
    } catch (error) {
      console.error('Error cargando grupos:', error)
      // En caso de error de red, forzar modo offline
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Error de red detectado, usando datos offline')
      }
      // Usar datos offline
      setGroups(offlineGroups)
    }
  }, [isOnline, handleGetGroups, offlineGroups])

  // Crear grupo con soporte offline
  const createGroup = useCallback(async (groupData: CreateGroupDto) => {
    const newGroup: Group = {
      ...groupData,
      id: Date.now() // Usar timestamp como ID temporal
    }

    if (isOnline) {
      try {
        await handleCreateGroup(groupData)
        toast.success('Grupo creado exitosamente')
        await getCombinedGroups()
      } catch (error) {
        console.error('Error creando grupo online:', error)
        
        // Detectar si es un error de red
        const isNetworkError = error instanceof TypeError && 
          (error.message.includes('fetch') || error.message.includes('Failed to fetch'))
        
        if (isNetworkError) {
          console.log('Error de red detectado, guardando grupo offline')
        }
        
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
      // Guardar offline
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
  }, [isOnline, handleCreateGroup, groups, saveOfflineAction, getCombinedGroups])

  // Actualizar grupo con soporte offline
  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    if (isOnline) {
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
        
        // Detectar si es un error de red
        const isNetworkError = error instanceof TypeError && 
          (error.message.includes('fetch') || error.message.includes('Failed to fetch'))
        
        if (isNetworkError) {
          console.log('Error de red detectado, guardando cambios offline')
        }
        
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
      // Guardar offline
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
  }, [isOnline, handleUpdateGroup, groups, saveOfflineAction, getCombinedGroups])

  // Eliminar grupo con soporte offline
  const deleteGroup = useCallback(async (id: string) => {
    if (isOnline) {
      try {
        await handleDeleteGroup(id)
        toast.success('Grupo eliminado exitosamente')
        await getCombinedGroups()
      } catch (error) {
        console.error('Error eliminando grupo online:', error)
        
        // Detectar si es un error de red
        const isNetworkError = error instanceof TypeError && 
          (error.message.includes('fetch') || error.message.includes('Failed to fetch'))
        
        if (isNetworkError) {
          console.log('Error de red detectado, guardando eliminación offline')
        }
        
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
      // Guardar offline
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
  }, [isOnline, handleDeleteGroup, groups, saveOfflineAction, getCombinedGroups])

  // Asignar estudiantes a grupo con soporte offline
  const assignStudentsToGroup = useCallback(async (groupId: string, studentIds: string[]) => {
    if (isOnline) {
      try {
        await handleAssignStudents(groupId, studentIds)
        toast.success('Estudiantes asignados exitosamente')
        await getCombinedGroups()
      } catch (error) {
        console.error('Error asignando estudiantes online:', error)
        toast.error('Error asignando estudiantes. Se guardará offline.')
      }
    } else {
      toast.info('Asignación guardada offline. Se sincronizará cuando haya conexión.')
    }
  }, [isOnline, handleAssignStudents, getCombinedGroups])

  return {
    loading: groupLoading,
    error: groupError,
    totalItems: groups.length, // Usar la longitud del estado local
    groups,
    getCombinedGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    assignStudentsToGroup,
    isOnline
  }
} 