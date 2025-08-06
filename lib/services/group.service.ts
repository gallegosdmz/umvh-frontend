import { Group, CreateGroupDto } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
    const currentUser = localStorage.getItem('currentUser');
    const user = currentUser ? JSON.parse(currentUser) : null;

    return {
        'Content-Type': 'application/json',
        'Authorization': user?.token ? `Bearer ${user.token}` : ''
    };
}

export const groupService = {
  async getGroups(limit: number = 20, offset: number = 0): Promise<Group[]> {
    try {
      const url = new URL(`${API_URL}/groups`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log('URL de grupos:', url.toString());
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Error al obtener los grupos');
      }

      const data = await response.json();
      console.log('Datos de grupos:', data);
      
      // El endpoint retorna un array directo de grupos
      if (Array.isArray(data)) {
        return data;
      }
      
      // Si por alguna razón retorna otra estructura, intentar extraer los grupos
      if (data && typeof data === 'object' && 'groups' in data) {
        return data.groups;
      }
      
      return [];
    } catch (error) {
      console.error('Error en getGroups:', error);
      return [];
    }
  },

  async getGroupsForDirector(limit: number = 10, offset: number = 0): Promise<{ groups: any[], total: number }> {
    try {
      const url = new URL(`${API_URL}/groups/findAllForDirector`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log('URL de grupos para director:', url.toString());
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Error al obtener los grupos para director');
      }

      const data = await response.json();
      console.log('Datos de grupos para director:', data);
      
      return {
        groups: data.groups || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error en getGroupsForDirector:', error);
      return { groups: [], total: 0 };
    }
  },

  async getGroupsCount(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/groups/count`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener el conteo de grupos');
      }

      const data = await response.json();
      return data || 0;
    } catch (error) {
      console.error('Error en getGroupsCount:', error);
      return 0;
    }
  },

  async createGroup(groupData: CreateGroupDto): Promise<Group> {
    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error('Error al crear el grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createGroup:', error);
      throw error;
    }
  },

  async updateGroup(id: string, groupData: CreateGroupDto): Promise<Group> {
    try {
      const response = await fetch(`${API_URL}/groups/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData),
      });

      console.log(response)

      if (!response.ok) {
        throw new Error('Error al actualizar el grupo');
      }

      return await response.json();
    } catch (error) {
      console.log(error)
      console.error('Error en updateGroup:', error);
      throw error;
    }
  },

  async deleteGroup(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/groups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el grupo');
      }
    } catch (error) {
      console.error('Error en deleteGroup:', error);
      throw error;
    }
  },

  async assignStudentsToGroup(groupId: string, studentIds: string[]): Promise<Group> {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ studentIds }),
      });

      if (!response.ok) {
        throw new Error('Error al asignar alumnos al grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en assignStudentsToGroup:', error);
      throw error;
    }
  },
}; 