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
      const response = await fetch(`${API_URL}/groups?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log(response)

      if (!response.ok) {
        throw new Error('Error al obtener los grupos');
      }

      const data = await response.json();
      console.log(data)
      return data;
    } catch (error) {
      console.error('Error en getGroups:', error);
      return [];
    }
  },

  async createGroup(groupData: CreateGroupDto): Promise<Group> {
    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en updateGroup:', error);
      throw error;
    }
  },

  async deleteGroup(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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