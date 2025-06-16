import { User } from "../mock-data";
import { handleError } from "../utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
    const currentUser = localStorage.getItem('currentUser');
    const user = currentUser ? JSON.parse(currentUser) : null;

    return {
        'Content-Type': 'application/json',
        'Authorization': user?.token ? `Bearer ${user.token}` : ''
    };
}

export const UserService = {
    async login(email: string, password: string) {
        const req = {email, password};

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(req)
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo hacer el logueo');
        }

        return data;
    },

    async get(limit: number = 20, offset: number = 0) {
        const response = await fetch(`${API_URL}/users?limit=${limit}&offset=${offset}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        

        if (!response.ok) {
            return handleError(response, 'No se pudieron mostrar los maestros');
        }

        return data;
    },

    async getById(id: number) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo mostrar el usuario');
        }

        return data;
    },

    async create(user: User) {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(user),
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo crear el usuario');
        }

        return data;
    },

    async update(id: number, user: User) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(user),
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo editar el usuario');
        }

        return data;
    },

    async delete(id: number) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        // Si la respuesta está vacía pero fue exitosa, retornamos un objeto vacío
        if (response.status === 204 || response.status === 200) {
            return {};
        }

        // Si no hay contenido y no fue exitosa, manejamos el error
        if (!response.ok) {
            return handleError(response, 'No se pudo eliminar el período');
        }

        return {};
    }

}