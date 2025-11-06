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

export interface FinalDataResponse {
  students: Array<{
    id?: number;
    courseGroupStudentId?: number;
    fullName: string;
    registrationNumber: string;
    semester?: number;
    attendances: Array<{
      partial: number;
      attend: boolean;
      date: string;
    }>;
    partialGrades: Array<{
      partial: number;
      grade: number;
      date: string;
    }>;
    finalGrade: {
      grade: number;
      gradeOrdinary: number;
      gradeExtraordinary: number;
      date: string;
    } | null;
  }>;
} 