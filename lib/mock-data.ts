// Datos ficticios para el sistema
export interface User {
  id?: number
  fullName: string
  email: string
  password?: string
  role?: "administrador" | "maestro"
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
}

export interface Course {
  id?: number
  name: string
}

export interface Student {
  id?: number
  fullName: string
  semester: number
  registrationNumber: string
}

export interface CourseGroup {
  id: number;
  course: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    fullName: string;
  };
}

export interface Group {
  id?: number;
  name: string;
  periodId?: number;
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