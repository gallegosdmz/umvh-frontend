import { clsx, type ClassValue } from "clsx"
import { toast } from "react-toastify"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleError(response: Response, fallbackMessage: string) {
  if (response.status === 401) return toast.error('Por favor, inicia sesión nuevamente');
  if (response.status === 403) return toast.error('No tienes permisos suficientes');
  if (response.status === 404) return toast.error('Recurso no encontrado');
  if (response.status === 400) return toast.error('Datos inválidos');

  return toast.error(fallbackMessage);
}