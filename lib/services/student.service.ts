import { Student } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
    const currentUser = localStorage.getItem('currentUser');
    const user = currentUser ? JSON.parse(currentUser) : null;

    return {
        'Content-Type': 'application/json',
        'Authorization': user?.token ? `Bearer ${user.token}` : ''
    };
}

export const studentService = {
  async getStudents(limit: number = 20, offset: number = 0): Promise<Student[]> {
    try {
      const response = await fetch(`${API_URL}/students?limit=${limit}&offset=${offset}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error al obtener los alumnos');
      return await response.json();
    } catch (error) {
      console.error('Error en getStudents:', error);
      throw error;
    }
  },

  async getStudentsNotInCourseGroup(courseGroupId: number, limit: number = 20, offset: number = 0, searchTerm?: string): Promise<Student[]> {
    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const url = `${API_URL}/students/not-in-course-group/${courseGroupId}?limit=${limit}&offset=${offset}${searchParam}`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener los alumnos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getStudents:', error);
      throw error;
    }
  },

  async createStudent(student: Student): Promise<Student> {
    try {
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(student),
      });
      if (!response.ok) throw new Error('Error al crear el alumno');
      return await response.json();
    } catch (error) {
      console.error('Error en createStudent:', error);
      throw error;
    }
  },

  async updateStudent(id: string, student: Partial<Student>): Promise<Student> {
    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(student),
      });
      if (!response.ok) throw new Error('Error al actualizar el alumno');
      return await response.json();
    } catch (error) {
      console.error('Error en updateStudent:', error);
      throw error;
    }
  },

  async deleteStudent(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error al eliminar el alumno');
    } catch (error) {
      console.error('Error en deleteStudent:', error);
      throw error;
    }
  },
}; 