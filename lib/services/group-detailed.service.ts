const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://uamvh.cloud/api';

const getAuthHeaders = () => {
  const currentUser = localStorage.getItem("currentUser");
  const user = currentUser ? JSON.parse(currentUser) : null;

  return {
    'Content-Type': 'application/json',
    'Authorization': user?.token ? `Bearer ${user.token}` : ''
  };
};

export interface PartialEvaluationGradeDto {
  id: number;
  grade: number;
}

export interface PartialEvaluationDto {
  id: number;
  name: string;
  partial: number;
  type: string;
  slot: number;
  grades: PartialEvaluationGradeDto[];
}

export interface PartialGradeDto {
  id: number;
  partial: number;
  grade: number;
  date: Date;
}

export interface CourseDto {
  id: number;
  name: string;
  semester: number;
  partialGrades: PartialGradeDto[];
  partialEvaluations: PartialEvaluationDto[];
}

export interface StudentDto {
  id: number;
  fullName: string;
  registrationNumber: string;
  courses: CourseDto[];
}

export interface GroupDetailedDto {
  id: number;
  name: string;
  semester: number;
  period: {
    id: number;
    name: string;
  };
  students: StudentDto[];
}

export interface GroupStudentsDetailedResponseDto {
  groups: GroupDetailedDto[];
  total: number;
}

export class GroupDetailedService {
  static async getDetailedGroups(): Promise<GroupStudentsDetailedResponseDto> {
    try {
      const response = await fetch(`${API_URL}/groups/detailed-students`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });


      if (!response.ok) {
        throw new Error(`Error al obtener grupos detallados: ${response.status}`);
      }

      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error en getDetailedGroups:', error);
      throw error;
    }
  }
}
