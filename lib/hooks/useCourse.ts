import { useState } from 'react';
import { Course } from '../mock-data';
import { CourseService } from '../services/course.service';
import { toast } from 'react-toastify';

export const useCourse = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    const handleGetCourses = async (limit: number = 20, offset: number = 0) => {
        try {
            setLoading(true);
            setError(null);

            const response = await CourseService.get(limit, offset);
            console.log('Respuesta en el hook:', response);
            
            // Si la respuesta es un array directo, lo usamos como items
            const items = Array.isArray(response) ? response : response.items || [];
            const total = response.total || items.length;
            
            setTotalItems(total);
            return items;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener las asignaturas');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (course: Course) => {
        try {
            setLoading(true);
            setError(null);
            const newCourse = await CourseService.create(course);
            toast.success('Asignatura creada correctamente');

            return newCourse;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la asignatura');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async (id: number, course: Course) => {
        try {
            setLoading(true);
            setError(null);
            const updatedCourse = await CourseService.update(id, course);
            toast.success('Asignatura editada correctamente');

            return updatedCourse;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar la asignatura');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            await CourseService.delete(id);

            toast.success('Asignatura eliminada correctamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar la asignatura');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        totalItems,
        handleGetCourses,
        handleCreateCourse,
        handleUpdateCourse,
        handleDeleteCourse
    };
}; 