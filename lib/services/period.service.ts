import { Period } from "@/lib/mock-data";
import { handleError } from "../utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem("currentUser");
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
    'Content-Type': 'application/json',
    'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
};

export const periodService = {
  async getPeriods(limit?: number, offset?: number): Promise<{ items: Period[], total: number }> {
    try {
      const url = new URL(`${API_URL}/periods`);
      if (limit) url.searchParams.append('limit', limit.toString());
      if (offset) url.searchParams.append('offset', offset.toString());

      const response = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener los períodos');
      return await response.json();
    } catch (error) {
      console.error('Error en getPeriods:', error);
      throw error;
    }
  },

  async createPeriod(period: Omit<Period, 'id'>): Promise<Period> {
    try {
      const response = await fetch(`${API_URL}/periods`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(period),
      });
      
      if (!response.ok) throw new Error('Error al crear el período');
      return await response.json();
    } catch (error) {
      console.error('Error en createPeriod:', error);
      throw error;
    }
  },

  async updatePeriod(id: number, period: Partial<Period>): Promise<Period> {
    try {
      const response = await fetch(`${API_URL}/periods/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(period),
      });
      if (!response.ok) throw new Error('Error al actualizar el período');
      return await response.json();
    } catch (error) {
      console.error('Error en updatePeriod:', error);
      throw error;
    }
  },

  async deletePeriod(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/periods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al eliminar el período');
    } catch (error) {
      console.error('Error en deletePeriod:', error);
      throw error;
    }
  },
};