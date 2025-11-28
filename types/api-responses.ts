export interface EvaluationsDataResponse {
  students: Array<{
    id: number;
    fullName: string;
    registrationNumber: string;
    courseGroupStudentId: number;
  }>;
  
  partialGrades: Array<{
    id: number;
    courseGroupStudentId: number;
    partial: number;
    grade: number;
  }>;
  
  attendances: Array<{
    id: number;
    courseGroupStudentId: number;
    partial: number;
    attend: number;
    date: string; // Formato YYYY-MM-DD
  }>;
  
  partialEvaluations: Array<{
    id: number;
    name: string;
    type: string;
    slot: number;
    partial: number;
  }>;
  
  gradingSchemes: Array<{
    id: number;
    type: string;
    percentage: number;
  }>;
  
  partialEvaluationGrades: Array<{
    id: number;
    courseGroupStudentId: number;
    partialEvaluationId: number;
    grade: number;
    partialEvaluation?: {
      id: number;
      name: string;
      type: string;
      slot: number;
      partial: number;
    };
  }>;
}

// Interfaces para el endpoint de final-data
export interface PartialGradeData {
  partial: number;
  grade: number;
  date: string; // Formato: 'YYYY-MM-DD'
}

export interface AttendanceData {
  partial: number;
  attend: boolean;
  date: string; // Formato: 'YYYY-MM-DD'
}

export interface FinalGradeData {
  id: number;
  grade: number;
  gradeOrdinary: number | null;
  gradeExtraordinary: number | null;
  date: string; // Formato: 'YYYY-MM-DD'
}

export interface StudentData {
  id: number;                        // ID del estudiante (Student.id)
  fullName: string;                  // Nombre completo del estudiante
  registrationNumber: string;        // Número de matrícula
  courseGroupStudentId: number;      // ID de la relación CourseGroupStudent (tabla intermedia)
  attendances: AttendanceData[];     // Lista de asistencias
  partialGrades: PartialGradeData[]; // Lista de calificaciones parciales (solo las más recientes)
  finalGrade: FinalGradeData | null; // Calificación final (la más reciente) o null
}

export interface FinalDataResponse {
  students: StudentData[];
} 