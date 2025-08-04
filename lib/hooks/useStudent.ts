import { useState } from 'react';
import { studentService } from '@/lib/services/student.service';
import { Student } from '@/lib/mock-data';

export const useStudent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const handleGetStudents = async (limit: number = 20, offset: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudents(limit, offset);
      setTotalItems(data.total);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los alumnos');
      return { students: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };



  const handleCreateStudent = async (student: Omit<Student, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      return await studentService.createStudent(student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el alumno');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async (id: string, student: Partial<Student>) => {
    setLoading(true);
    setError(null);
    try {
      return await studentService.updateStudent(id, student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el alumno');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await studentService.deleteStudent(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el alumno');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetStudentsByGroup = async (groupId: number, limit: number = 20, offset: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentsByGroup(groupId, limit, offset);
      setTotalItems(data.length);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los alumnos del grupo');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleGetStudentsNotInCourseGroup = async (courseGroupId: number, limit: number = 20, offset: number = 0, searchTerm?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentsNotInCourseGroup(courseGroupId, limit, offset, searchTerm);
      setTotalItems(data.total);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los alumnos no asignados');
      return { students: [], total: 0, limit, offset };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    totalItems,
    handleGetStudents,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteStudent,
    handleGetStudentsByGroup,
    handleGetStudentsNotInCourseGroup,
  };
}; 