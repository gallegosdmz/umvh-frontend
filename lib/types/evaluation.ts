import { Ponderacion } from "./ponderaciones";

export interface EvaluationFormData {
  maestro: string;
  semestre: number | null;
  asignatura: string;
  safis: string;
  ponderaciones: Ponderacion
  alumnos: Array<{
    no: string; 
    matricula: string; 
    nombre: string; 
  }>
}