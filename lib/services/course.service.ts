import { Course, Group, Student } from "../mock-data";
import { handleError } from "../utils";
import { EvaluationsDataResponse, FinalDataResponse } from "../../types/api-responses";

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
        const response = await fetch(`${API_URL}/courses`, {
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

    async assignStudentToCourseGroup(courseGroupId: number, studentId: number) {
        const req = {courseGroupId, studentId};

        console.log(req);

        const response = await fetch(`${ API_URL }/courses-groups-students`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(req),
        });

        console.log(response)

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo asignar el estudiante a la materia');
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

    async deleteStudentToCourse(courseGroupStudentId: number) {
        const response = await fetch(`${ API_URL }/courses-groups-students/${courseGroupStudentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) return handleError(response, 'No se pudo eliminar el estudiante');
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
    },

    async getCourseGroupWithStudents(courseGroupId: number) {
        const response = await fetch(`${API_URL}/courses-groups/${courseGroupId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        console.log(data);
        if (!response.ok) throw new Error('Error al obtener el grupo con sus estudiantes');
        return data;
    },

    async getCourseGroupIndividual(courseGroupId: number) {
        const response = await fetch(`${API_URL}/courses-groups/individual/${courseGroupId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        console.log('CourseGroup individual:', data);
        if (!response.ok) throw new Error('Error al obtener el grupo individual');
        return data;
    },

    async getStudentsByCourseGroup(courseGroupId: number, limit: number = 10, offset: number = 0) {
        console.log('Llamando a getStudentsByCourseGroup con:', { courseGroupId, limit, offset });
        const response = await fetch(`${API_URL}/courses-groups-students/findAll/${courseGroupId}?limit=${limit}&offset=${offset}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error al obtener los estudiantes del grupo');
        const data = await response.json();
        console.log('Respuesta de getStudentsByCourseGroup:', data);
        return data;
    },

    async createGradingScheme(gradingSchemeData: { courseGroupId: number; type: string; percentage: number }) {
        const response = await fetch(`${API_URL}/courses-groups-gradingschemes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(gradingSchemeData)
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo crear la ponderación');
        }

        return data;
    },

    async updateGradingScheme(id: number, gradingSchemeData: { courseGroupId: number; type: string; percentage: number }) {
        const response = await fetch(`${API_URL}/courses-groups-gradingschemes/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(gradingSchemeData)
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo actualizar la ponderación');
        }

        return data;
    },

    async createAttendance(attendanceData: { courseGroupStudentId: number; date: string; attend: number; partial: number }) {
        const response = await fetch(`${API_URL}/courses-groups-attendances`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(attendanceData)
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo registrar la asistencia');
        }

        return data;
    },

    async updateAttendance(id: number, attendanceData: { courseGroupStudentId: number; date: string; attend: number; partial: number }) {
        const response = await fetch(`${API_URL}/courses-groups-attendances/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(attendanceData)
        });

        const data = await response.json();

        if (!response.ok) {
            return handleError(response, 'No se pudo actualizar la asistencia');
        }

        return data;
    },

    async getAttendancesByCourseGroupAndDate(courseGroupId: number, date: string) {
        console.log(courseGroupId)
        console.log(date)
        
        const response = await fetch(`${API_URL}/courses-groups-attendances/${courseGroupId}?date=${date}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        console.log(data);

        if (!response.ok) {
            return handleError(response, 'No se pudo obtener las asistencias');
        }

        return data;
    },

    async createPartialEvaluation(dto: any) {
        const response = await fetch(`${API_URL}/partial-evaluations`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        console.log(data)
        if (!response.ok) throw new Error(data.message || 'Error al crear evaluación');
        return data;
    },

    async updatePartialEvaluation(id: number, dto: any) {
        const response = await fetch(`${API_URL}/partial-evaluations/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al editar evaluación');
        return data;
    },

    async getPartialEvaluationsByCourseGroupStudentId(courseGroupStudentId: number) {
        const response = await fetch(`${API_URL}/partial-evaluations/${courseGroupStudentId}`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener evaluaciones parciales');
        return data;
    },

    // NUEVOS MÉTODOS PARA LA NUEVA ESTRUCTURA
    async getPartialEvaluationsByCourseGroupId(courseGroupId: number) {
        const response = await fetch(`${API_URL}/partial-evaluations/${courseGroupId}`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener evaluaciones parciales del curso');
        return data;
    },

    async createPartialEvaluationGrade(dto: any) {
        const response = await fetch(`${API_URL}/partial-evaluation-grades`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al crear calificación de evaluación');
        return data;
    },

    async updatePartialEvaluationGrade(id: number, dto: any) {
        const response = await fetch(`${API_URL}/partial-evaluation-grades/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al editar calificación de evaluación');
        return data;
    },

    async getPartialEvaluationGradesByStudentAndPartial(courseGroupStudentId: number, partial: number) {
        try {
            // Intentar obtener todas las calificaciones del estudiante
            const response = await fetch(`${API_URL}/partial-evaluation-grades`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al obtener calificaciones de evaluaciones parciales');
            
            // Filtrar por courseGroupStudentId y parcial
            const calificacionesDelParcial = data.filter((cal: any) => {
                return cal.courseGroupStudentId === courseGroupStudentId && 
                       cal.partialEvaluation && 
                       cal.partialEvaluation.partial === partial;
            });
            
            return calificacionesDelParcial;
        } catch (error) {
            console.error('Error al obtener calificaciones:', error);
            return [];
        }
    },

    async getAttendancesByCourseGroupStudentAndPartial(courseGroupStudentId: number, partial: number) {
        const response = await fetch(`${API_URL}/courses-groups-attendances/student/${courseGroupStudentId}?partial=${partial}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        console.log('DEBUG SERVICE: ', data);
        if (!response.ok) {
            console.error('Error al obtener asistencias del alumno:', data)
            return []
        }
        return data;
    },

    async getFinalGradesByCourseGroupStudentId(courseGroupStudentId: number) {
      const response = await fetch(`${API_URL}/final-grades/findAll/${courseGroupStudentId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al obtener final grades');
      return data;
    },

    async createFinalGrade(dto: any) {
      const headers = getAuthHeaders();
      const body = JSON.stringify(dto);
      
      console.log('🔴 ========== DEBUG SERVICE: createFinalGrade ==========');
      console.log('🔴 URL:', `${API_URL}/final-grades`);
      console.log('🔴 Method: POST');
      console.log('🔴 Headers:', headers);
      console.log('🔴 Body (stringified):', body);
      console.log('🔴 DTO (original):', dto);
      console.log('🔴 Token presente:', !!headers.Authorization);
      console.log('🔴 Token value:', headers.Authorization ? headers.Authorization.substring(0, 20) + '...' : 'NO TOKEN');
      
      const response = await fetch(`${API_URL}/final-grades`, {
        method: 'POST',
        headers: headers,
        body: body,
      });
      
      console.log('🔴 Response status:', response.status);
      console.log('🔴 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔴 Response data:', data);
      console.log('🔴 ============================================================');
      
      if (!response.ok) throw new Error(data.message || 'Error al crear final grade');
      return data;
    },

    async updateFinalGrade(id: number, dto: any) {
      const headers = getAuthHeaders();
      const body = JSON.stringify(dto);
      
      console.log('🟠 ========== DEBUG SERVICE: updateFinalGrade ==========');
      console.log('🟠 URL:', `${API_URL}/final-grades/${id}`);
      console.log('🟠 Method: PATCH');
      console.log('🟠 Headers:', headers);
      console.log('🟠 Body (stringified):', body);
      console.log('🟠 DTO (original):', dto);
      console.log('🟠 ID:', id);
      console.log('🟠 Token presente:', !!headers.Authorization);
      console.log('🟠 Token value:', headers.Authorization ? headers.Authorization.substring(0, 20) + '...' : 'NO TOKEN');
      
      const response = await fetch(`${API_URL}/final-grades/${id}`, {
        method: 'PATCH',
        headers: headers,
        body: body,
      });
      
      console.log('🟠 Response status:', response.status);
      console.log('🟠 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🟠 Response data:', data);
      console.log('🟠 ============================================================');
      
      if (!response.ok) throw new Error(data.message || 'Error al actualizar final grade');
      return data;
    },

    // MÉTODO PARA GUARDAR LA CALIFICACIÓN PARCIAL FINAL
    async createPartialGrade(dto: { partial: number; grade: number; date: string; courseGroupStudentId: number }) {
      console.log('🔍 DEBUG createPartialGrade - DTO enviado:', dto);
      
      const response = await fetch(`${API_URL}/partial-grades`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG createPartialGrade - Error response:', data);
        throw new Error(data.message || 'Error al crear calificación parcial');
      }
      
      console.log('🔍 DEBUG createPartialGrade - Success, returning:', data);
      return data;
    },

    async updatePartialGrade(id: number, dto: { partial: number; grade: number; date: string; courseGroupStudentId: number }) {
      console.log('🔍 DEBUG updatePartialGrade - ID:', id, 'DTO:', dto);
      
      const response = await fetch(`${API_URL}/partial-grades/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG updatePartialGrade - Error response:', data);
        throw new Error(data.message || 'Error al actualizar calificación parcial');
      }
      
      console.log('🔍 DEBUG updatePartialGrade - Success, returning:', data);
      return data;
    },

    async getPartialGradesByStudentAndPartial(courseGroupStudentId: number, partial: number) {
      console.log('🔍 DEBUG getPartialGradesByStudentAndPartial - courseGroupStudentId:', courseGroupStudentId, 'partial:', partial);
      
      const response = await fetch(`${API_URL}/partial-grades/findAll/${courseGroupStudentId}?partial=${partial}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG getPartialGradesByStudentAndPartial - Error response:', data);
        throw new Error(data.message || 'Error al obtener calificaciones parciales');
      }
      
      console.log('🔍 DEBUG getPartialGradesByStudentAndPartial - Success, returning:', data);
      return data;
    },

    // MÉTODO OPTIMIZADO: Obtener todas las calificaciones parciales de un grupo de estudiantes
    async getPartialGradesByCourseGroup(courseGroupId: number) {
      console.log('🔍 DEBUG getPartialGradesByCourseGroup - courseGroupId:', courseGroupId);
      
      const response = await fetch(`${API_URL}/partial-grades/by-course-group/${courseGroupId}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG getPartialGradesByCourseGroup - Error response:', data);
        throw new Error(data.message || 'Error al obtener calificaciones parciales del grupo');
      }
      
      console.log('🔍 DEBUG getPartialGradesByCourseGroup - Success, returning:', data);
      return data;
    },

    // MÉTODO OPTIMIZADO: Obtener todas las asistencias de un grupo de estudiantes
    async getAttendancesByCourseGroup(courseGroupId: number) {
      console.log('🔍 DEBUG getAttendancesByCourseGroup - courseGroupId:', courseGroupId);
      
      const response = await fetch(`${API_URL}/attendances/by-course-group/${courseGroupId}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG getAttendancesByCourseGroup - Error response:', data);
        throw new Error(data.message || 'Error al obtener asistencias del grupo');
      }
      
      console.log('🔍 DEBUG getAttendancesByCourseGroup - Success, returning:', data);
      return data;
    },

    async deleteAttendance(id: number) {
        const response = await fetch(`${API_URL}/courses-groups-attendances/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            return handleError(response, 'No se pudo eliminar la asistencia');
        }

        return true;
    },

    // MÉTODO SUPER OPTIMIZADO: Obtener toda la información de un grupo en una sola llamada
    async getCourseGroupCompleteData(courseGroupId: number) {
      console.log('🔍 DEBUG getCourseGroupCompleteData - courseGroupId:', courseGroupId);
      
      const response = await fetch(`${API_URL}/courses-groups/${courseGroupId}/complete-data`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG getCourseGroupCompleteData - Error response:', data);
        throw new Error(data.message || 'Error al obtener datos completos del grupo');
      }
      
      console.log('🔍 DEBUG getCourseGroupCompleteData - Success, returning:', data);
      return data;
    },

    // MÉTODO ULTRA OPTIMIZADO: Obtener todos los datos de evaluaciones en una sola petición
    async getCourseGroupEvaluationsData(courseGroupId: number): Promise<EvaluationsDataResponse> {
      console.log('🔍 DEBUG getCourseGroupEvaluationsData - courseGroupId:', courseGroupId);
      
      const response = await fetch(`${API_URL}/courses-groups/${courseGroupId}/evaluations-data`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 DEBUG getCourseGroupEvaluationsData - Error response:', data);
        throw new Error(data.message || 'Error al obtener datos de evaluaciones del grupo');
      }
      
      console.log('🔍 DEBUG getCourseGroupEvaluationsData - Success, returning:', data);
      return data as EvaluationsDataResponse;
    },

    async getCoursesCount(): Promise<number> {
        try {
            const response = await fetch(`${API_URL}/courses/count`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Error al obtener el conteo de cursos');
            }

            const data = await response.json();
            console.log(data)
            return data || 0;
        } catch (error) {
            console.error('Error en getCoursesCount:', error);
            return 0;
        }
    },

    // MÉTODO ESPECÍFICO PARA EL MODAL DE GENERAL: Obtener datos finales del grupo
    async getCourseGroupFinalData(courseGroupId: number): Promise<FinalDataResponse> {
      console.log('🟢 ========== DEBUG SERVICE: getCourseGroupFinalData ==========');
      console.log('🟢 courseGroupId:', courseGroupId);
      console.log('🟢 Tipo de courseGroupId:', typeof courseGroupId);
      console.log('🟢 URL completa:', `${API_URL}/courses-groups/${courseGroupId}/final-data`);
      
      const headers = getAuthHeaders();
      console.log('🟢 Headers:', headers);
      console.log('🟢 Token presente:', !!headers.Authorization);
      
      const response = await fetch(`${API_URL}/courses-groups/${courseGroupId}/final-data`, {
        headers: headers,
      });
      
      console.log('🟢 Response status:', response.status);
      console.log('🟢 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🟢 Response data:', data);
      
      if (!response.ok) {
        console.error('❌ DEBUG getCourseGroupFinalData - Error response:', data);
        console.error('❌ Status:', response.status);
        console.error('❌ ========== FIN DEBUG SERVICE: getCourseGroupFinalData (ERROR) ==========');
        throw new Error(data.message || 'Error al obtener datos finales del grupo');
      }
      
      console.log('🟢 DEBUG getCourseGroupFinalData - Success');
      console.log('🟢 Cantidad de estudiantes:', data.students?.length || 0);
      if (data.students && data.students.length > 0) {
        console.log('🟢 Primer estudiante:', {
          id: data.students[0].id,
          courseGroupStudentId: data.students[0].courseGroupStudentId,
          fullName: data.students[0].fullName,
          hasPartialGrades: !!data.students[0].partialGrades,
          hasFinalGrade: !!data.students[0].finalGrade
        });
      }
      console.log('🟢 ========== FIN DEBUG SERVICE: getCourseGroupFinalData (SUCCESS) ==========');
      return data as FinalDataResponse;
    },
}; 