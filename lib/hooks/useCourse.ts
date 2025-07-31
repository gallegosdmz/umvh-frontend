import { useState } from 'react';
import { Course, CourseGroup } from '../mock-data';
import { CourseService } from '../services/course.service';
import { toast } from 'react-toastify';

export const useCourse = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [allCourses, setAllCourses] = useState<Course[]>([]);

    const handleGetCourses = async (limit: number = 20, offset: number = 0) => {
        try {
            setLoading(true);
            setError(null);

            // Si ya tenemos todos los cursos cargados, aplicar paginación del lado del cliente
            if (allCourses.length > 0) {
                const paginatedCourses = allCourses.slice(offset, offset + limit);
                setTotalItems(allCourses.length);
                return paginatedCourses;
            }

            // Si no tenemos cursos cargados, traer todos del servidor
            const response = await CourseService.get();
            console.log('Respuesta en el hook:', response);
            
            // Si la respuesta es un array directo, lo usamos como items
            const items = Array.isArray(response) ? response : response.items || [];
            
            // Guardar todos los cursos en el estado
            setAllCourses(items);
            setTotalItems(items.length);
            
            // Aplicar paginación del lado del cliente
            const paginatedCourses = items.slice(offset, offset + limit);
            return paginatedCourses;
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

            // Limpiar el cache para forzar recarga
            setAllCourses([]);

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

            // Limpiar el cache para forzar recarga
            setAllCourses([]);

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

            // Limpiar el cache para forzar recarga
            setAllCourses([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar la asignatura');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleGetCourseGroupWithStudents = async (courseGroupId: number) => {
        try {
            const response = await CourseService.getCourseGroupWithStudents(courseGroupId);
            return response;
        } catch (error) {
            console.error('Error al obtener el grupo con sus estudiantes:', error);
            throw error;
        }
    };

    const handleGetStudentsByCourseGroup = async (courseGroupId: number, limit: number = 10, offset: number = 0) => {
        try {
            const response = await CourseService.getStudentsByCourseGroup(courseGroupId, limit, offset);
            return response;
        } catch (error) {
            console.error('Error al obtener los estudiantes del grupo:', error);
            throw error;
        }
    };

    const clearCache = () => {
        setAllCourses([]);
        setTotalItems(0);
    };

    return {
        loading,
        error,
        totalItems,
        handleGetCourses,
        handleCreateCourse,
        handleUpdateCourse,
        handleDeleteCourse,
        handleGetCourseGroupWithStudents,
        handleGetStudentsByCourseGroup,
        clearCache
    };
}; 