export interface EvaluationFormData {
  maestro: string;
  grupo: string;
  asignatura: string;
  safis: string;
  alumnos: Array<{
    matricula: string; 
    nombre: string; 
  }>
}