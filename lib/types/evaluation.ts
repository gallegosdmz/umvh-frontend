import { Ponderacion } from "./ponderaciones";

export interface EvaluationFormData {
  maestro: string;
  grupo: string;
  asignatura: string;
  safis: string;
  ponderaciones: Ponderacion
  alumnos: Array<{
    matricula: string; 
    nombre: string; 
  }>
}