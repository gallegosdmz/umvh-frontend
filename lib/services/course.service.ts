import { Course } from "../mock-data";
import { handleError } from "../utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem("currentUser");
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
    'Content-Type': 'application/json',
    'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
};

export const CourseService = {
    async get(limit: number = 20, offset: number = 0) {
        const response = await fetch(`${API_URL}/courses?limit=${limit}&offset=${offset}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        
        console.log('Respuesta del backend:', data);

        if (!response.ok) {
            return handleError(response, 'No se pudieron mostrar las asignaturas');
        }

        return data;
    },

    async create(course: Course) {
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(course)
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo crear la asignatura');
        }

        return data;
    },

    async assignGroup(assignmentData: any) {
        const response = await fetch(`${ API_URL }/courses-groups`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(assignmentData),
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo crear la asignatura');
        }

        return data;
    },

    async getAssignments(id: number, limit: number = 20, offset: number = 0) {
        const response = await fetch(`${API_URL}/courses-groups/${id}?limit=${limit}&offset=${offset}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo crear la asignatura');
        }

        return data;
    },

    async update(id: number, course: Course) {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(course)
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(response)
            return handleError(response, 'No se pudo actualizar la asignatura');
        }

        return data;
    },

    async delete(id: number) {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return handleError(response, 'No se pudo eliminar la asignatura');
        }
    },

    async deleteAssignment(courseGroupId: number) {
        const response = await fetch(`${ API_URL }/courses-groups/${courseGroupId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            return handleError(response, 'No se pudo eliminar la asignación');
        }
    },

    async getById(id: number) {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo mostrar la asignatura');
        }

        return data;
    }
}; 