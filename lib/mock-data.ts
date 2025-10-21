// Datos ficticios para el sistema
export interface User {
  id?: number
  fullName: string
  email: string
  password?: string
  role?: "administrador" | "maestro" | "director"
  coursesGroups?: {
    course: {
      id: number
      name: string
    }
    group: {
      id: number
      name: string
      period?: {
        id: number
        name: string
      }
    }
    schedule?: string
  }[]
}

export interface Period {
  id?: number
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
  isDeleted?: boolean
  firstPartialActive?: boolean
  secondPartialActive?: boolean
  thirdPartialActive?: boolean
}

export interface Course {
  id?: number
  name: string
  coursesGroups?: Array<{
    id?: number
    schedule: string
    isDeleted: boolean
    group?: {
      id?: number
      name: string
      semester: number
      period: Period
    }
    user?: {
      id?: number
      fullName: string
      email: string
      role: string
    }
  }>
}

export interface Student {
  id?: number;
  fullName: string;
  registrationNumber: string;
  courseGroupStudent?: CourseGroupStudent;
}

export interface CourseGroup {
  id?: number;
  course?: {
    id?: number;
    name: string;
  };
  group?: {
    id?: number;
    name: string;
    semester: number;
    period?: Period;
  };
  user?: {
    id?: number;
    fullName: string;
    email: string;
    role: string;
  };
  coursesGroupsStudents?: {
    id?: number;
    student: Student;
  };
  coursesGroupsGradingschemes?: GradingScheme[];
}

export interface CourseGroupStudent {
  id?: number;
  courseGroup: CourseGroup;
  student: Student;
}

export interface GradingScheme {
  id?: number;
  courseGroupId: number;
  type: string;
  percentage: number;
}

export interface Group {
  id?: number;
  name: string;
  periodId?: number;
  semester?: number;
  period?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  coursesGroups?: CourseGroup[];
  isDeleted?: boolean;
}

export interface CreateGroupDto {
  name: string;
  periodId: number;
  semester: number;
}

export interface AsignaturaGrupo {
  id: number
  asignaturaId: number
  grupoId: number
  maestroId: number
  valorExencion: number
  alumnos: number[]
  ponderaciones: Ponderacion[]
}

export interface Ponderacion {
  rubro: "asistencia" | "actividades" | "evidencias" | "producto" | "examen"
  porcentaje: number
}

export interface Evaluacion {
  id: number
  asignaturaGrupoId: number
  alumnoId: number
  parcial: 1 | 2 | 3
  rubro: string
  calificacion: number
}

export interface Asistencia {
  id: number
  asignaturaGrupoId: number
  alumnoId: number
  fecha: string
  presente: boolean
  parcial: 1 | 2 | 3
}

// Nuevas interfaces para el endpoint del director
export interface CourseGroupStudent {
  id?: number
  student: Student
  coursesGroupsAttendances?: Attendance[]
  finalGrades?: FinalGrade[]
  partialEvaluationGrades?: PartialEvaluationGrade[]
  partialGrades?: PartialGrade[]
}

export interface Attendance {
  id?: number
  date: string
  isPresent: boolean
  partial: number
}

export interface FinalGrade {
  id?: number
  grade: number
  partial: number
}

export interface PartialEvaluationGrade {
  id?: number
  grade: number
  evaluationType: string
  partial: number
}

export interface PartialGrade {
  id?: number
  grade: number
  partial: number
}

export interface PartialEvaluation {
  id?: number
  name: string
  partial: number
  percentage: number
}

export interface CourseGroupForDirector {
  id?: number
  course: {
    id?: number
    name: string
  }
  user: {
    id?: number
    fullName: string
    email: string
    role: string
  }
  coursesGroupsStudents: CourseGroupStudent[]
  partialEvaluations: PartialEvaluation[]
}

export interface GroupForDirector {
  id?: number
  name: string
  semester?: number
  period?: {
    id: number
    name: string
    startDate: string
    endDate: string
    isActive: boolean
  }
  coursesGroups: CourseGroupForDirector[]
  isDeleted?: boolean
}

export interface PaginationDto {
  limit?: number
  offset?: number
}

export interface GroupsResponse {
  groups: GroupForDirector[]
  total: number
}
