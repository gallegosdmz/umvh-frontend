import { useState } from 'react';
import { UserService } from '../services/user.service';
import { toast } from 'react-toastify';
import { User } from '../mock-data';

export const useTeacher = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    const handleGetTeachers = async (limit: number = 20, offset: number = 0) => {
        try {
            setLoading(true);
            setError(null);

            const response = await UserService.get(limit, offset);
            console.log('Respuesta en el hook:', response);
            
            // Manejar la respuesta según la estructura esperada {users: [], total: number}
            let items: User[] = [];
            let total = 0;
            
            if (response && typeof response === 'object') {
                if (response.users && Array.isArray(response.users)) {
                    items = response.users;
                    total = response.total || 0;
                } else if (response.items && Array.isArray(response.items)) {
                    items = response.items;
                    total = response.total || response.items.length;
                } else if (Array.isArray(response)) {
                    items = response;
                    total = response.length;
                }
            }
            
            setTotalItems(total);
            return { users: items, total };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener los maestros');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeacher = async (teacher: User) => {
        try {
            setLoading(true);
            setError(null);
            const newTeacher = await UserService.create(teacher);
            toast.success('Maestro creado correctamente');

            return newTeacher;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear el maestro');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTeacher = async (id: number, teacher: User) => {
        try {
            setLoading(true);
            setError(null);
            const updatedTeacher = await UserService.update(id, teacher);
            toast.success('Maestro editado correctamente');

            return updatedTeacher;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar el maestro');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeacher = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            await UserService.delete(id);

            toast.success('Maestro eliminado correctamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar el maestro');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        totalItems,
        handleGetTeachers,
        handleCreateTeacher,
        handleUpdateTeacher,
        handleDeleteTeacher
    };
}; 