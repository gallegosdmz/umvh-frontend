import { useState } from 'react';
import { Group, CreateGroupDto } from '@/lib/mock-data';
import { groupService } from '@/lib/services/group.service';

interface UseGroupReturn {
  loading: boolean;
  error: string | null;
  totalItems: number;
  handleGetGroups: (limit?: number, offset?: number) => Promise<Group[]>;
  handleCreateGroup: (groupData: CreateGroupDto) => Promise<Group>;
  handleUpdateGroup: (id: string, groupData: CreateGroupDto) => Promise<Group>;
  handleDeleteGroup: (id: string) => Promise<void>;
  handleAssignStudents: (groupId: string, studentIds: string[]) => Promise<Group>;
}

export const useGroup = (): UseGroupReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const handleGetGroups = async (limit: number = 20, offset: number = 0): Promise<Group[]> => {
    setLoading(true);
    console.log(`handleGetGroups - Limit: ${limit}, Offset: ${offset}`);
    try {
      const data = await groupService.getGroups(limit, offset);
      console.log('Respuesta del servicio de grupos:', data);
      
      // La respuesta del backend viene como un array directo
      if (Array.isArray(data)) {
        console.log(`Grupos recibidos: ${data.length}`);
        // Si no hay límite o el límite es muy alto, usar la longitud de la respuesta
        // como total (esto es para cuando se cargan todos los grupos)
        if (!limit || limit >= 1000) {
          setTotalItems(data.length);
          console.log(`Total de grupos establecido: ${data.length}`);
        }
        return data;
      }
      
      // Si no tiene ninguna de las estructuras esperadas, devolver array vacío
      console.warn('Formato de respuesta inesperado:', data);
      setTotalItems(0);
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los grupos');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (groupData: CreateGroupDto) => {
    setLoading(true);
    try {
      return await groupService.createGroup(groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (id: string, groupData: CreateGroupDto) => {
    setLoading(true);
    try {
      return await groupService.updateGroup(id, groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    setLoading(true);
    try {
      await groupService.deleteGroup(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudents = async (groupId: string, studentIds: string[]) => {
    setLoading(true);
    try {
      return await groupService.assignStudentsToGroup(groupId, studentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar alumnos al grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    totalItems,
    handleGetGroups,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAssignStudents
  };
}; 