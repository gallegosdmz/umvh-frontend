import { useState, useCallback } from 'react';
import { Group, CreateGroupDto, GroupForDirector, GroupsResponse } from '@/lib/mock-data';
import { groupService } from '@/lib/services/group.service';

interface UseGroupReturn {
  loading: boolean;
  error: string | null;
  totalItems: number;
  handleGetGroups: (limit?: number, offset?: number) => Promise<{ groups: Group[], total: number }>;
  handleGetGroupsForDirector: (limit?: number, offset?: number) => Promise<GroupsResponse>;
  handleCreateGroup: (groupData: CreateGroupDto) => Promise<Group>;
  handleUpdateGroup: (id: string, groupData: CreateGroupDto) => Promise<Group>;
  handleDeleteGroup: (id: string) => Promise<void>;
  handleAssignStudents: (groupId: string, studentIds: string[]) => Promise<Group>;
}

export const useGroup = (): UseGroupReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const handleGetGroups = useCallback(async (limit: number = 20, offset: number = 0): Promise<{ groups: Group[], total: number }> => {
    setLoading(true);
    console.log(`handleGetGroups - Limit: ${limit}, Offset: ${offset}`);
    try {
      const data = await groupService.getGroups(limit, offset);
      console.log('Respuesta del servicio de grupos:', data);
      
      // La respuesta del backend viene como un array directo
      if (Array.isArray(data)) {
        console.log(`Grupos recibidos: ${data.length}`);
        
        // Solo actualizar el total si es una llamada para obtener todos los grupos (limit alto)
        // o si aún no se ha establecido un total
        if (limit >= 1000 || totalItems === 0) {
          setTotalItems(data.length);
          console.log(`Total de grupos establecido: ${data.length}`);
        }
        
        return { groups: data, total: totalItems || data.length };
      }
      
      // Si viene con la estructura { groups: [], total: number }
      if (data && typeof data === 'object' && 'groups' in data && 'total' in data) {
        console.log(`Grupos recibidos: ${data.groups.length}, Total: ${data.total}`);
        setTotalItems(data.total);
        return data;
      }
      
      // Si no tiene ninguna de las estructuras esperadas, devolver estructura por defecto
      console.warn('Formato de respuesta inesperado:', data);
      return { groups: [], total: totalItems };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los grupos');
      return { groups: [], total: totalItems };
    } finally {
      setLoading(false);
    }
  }, [totalItems]);

  const handleGetGroupsForDirector = useCallback(async (limit: number = 10, offset: number = 0): Promise<GroupsResponse> => {
    setLoading(true);
    console.log(`handleGetGroupsForDirector - Limit: ${limit}, Offset: ${offset}`);
    try {
      const data = await groupService.getGroupsForDirector(limit, offset);
      console.log('Respuesta del servicio de grupos para director:', data);
      setTotalItems(data.total);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los grupos para director');
      return { groups: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateGroup = useCallback(async (groupData: CreateGroupDto) => {
    setLoading(true);
    try {
      return await groupService.createGroup(groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateGroup = useCallback(async (id: string, groupData: CreateGroupDto) => {
    setLoading(true);
    try {
      return await groupService.updateGroup(id, groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteGroup = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await groupService.deleteGroup(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAssignStudents = useCallback(async (groupId: string, studentIds: string[]) => {
    setLoading(true);
    try {
      return await groupService.assignStudentsToGroup(groupId, studentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar alumnos al grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    totalItems,
    handleGetGroups,
    handleGetGroupsForDirector,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAssignStudents
  };
}; 