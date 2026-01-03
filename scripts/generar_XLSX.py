import sys
import json
import os

def main():
  if len(sys.argv) != 4:
    print("Uso: python generar_XLSX.py <input_json> <template_path> <output_path>", file=sys.stderr)
    sys.exit(1)
  
  input_json_path = sys.argv[1]
  template_path = sys.argv[2]
  output_path = sys.argv[3]

  # Validar que los archivos existan
  if not os.path.exists(input_json_path):
    print(f"Error: No se encontró el archivo JSON: {input_json_path}", file=sys.stderr)
    sys.exit(1)

  if not os.path.exists(template_path):
    print(f"Error: No se encontró el template: {template_path}", file=sys.stderr)

  # Leer datos de entrada
  try:
    with open(input_json_path, 'r', encoding='utf-8') as f:
      data = json.load(f)
  except json.JSONDecodeError as e:
    print(f"Error: JSON inválido: {e}", file=sys.stderr)
    sys.exit(1)

  # Generar el archvio Excel =
  try:
    generar_evaluacion(data, template_path, output_path)
    print(f"Archivo generado exitosamente: {output_path}")
  except Exception as e:
    print(f"Error al generar archivo: {e}", file=sys.stderr)
    sys.exit(1)

def generar_evaluacion(data: dict, template_path: str, output_path: str):
    """
    Genera el archivo XLSX usando win32com para preservar macros.
    """
    import win32com.client as win32
    from win32com.client import constants

    # Convertir rutas a absolutas (win32com las requiere)
    template_path = os.path.abspath(template_path)
    output_path = os.path.abspath(output_path)

    excel = None
    workbook = None

    try:
        # Iniciar Excel en modo invisible
        excel = win32.gencache.EnsureDispatch('Excel.Application')
        excel.Visible = False
        excel.DisplayAlerts = False

        # Abrir el template
        workbook = excel.Workbooks.Open(template_path)
        sheet = workbook.Worksheets(1)  # Primera hoja

        # ========================================
        # SECCIÓN 1: Metadata
        # Ajusta las celdas según tu template
        # ========================================
        sheet.Range("C5").Value = data.get("grupo", "")
        sheet.Range("C6").Value = data.get("asignatura", "")
        sheet.Range("C7").Value = data.get("maestro", "")

        # ========================================
        # SECCIÓN 2: Ponderaciones
        # Ajusta las celdas según tu template
        # ========================================
        ponderaciones = data.get("ponderaciones", {})
        sheet.Range("D7").Value = ponderaciones.get("asistencia", 0) / 100
        sheet.Range("E7").Value = ponderaciones.get("actividades", 0) / 100
        sheet.Range("F7").Value = ponderaciones.get("evidencias", 0) / 100
        sheet.Range("G7").Value = ponderaciones.get("productoIntegrador", 0) / 100
        sheet.Range("H7").Value = ponderaciones.get("examen", 0) / 100

        # ========================================
        # SECCIÓN 3: Lista de Alumnos
        # Ajusta la fila inicial y columnas según tu template
        # ========================================
        alumnos = data.get("alumnos", [])
        fila_inicio_alumnos = 10  # Fila donde inician los alumnos
        col_numero = "A"          # Columna para número
        col_matricula = "B"       # Columna para matrícula
        col_nombre = "C"          # Columna para nombre

        for i, alumno in enumerate(alumnos):
            fila = fila_inicio_alumnos + i
            sheet.Range(f"{col_numero}{fila}").Value = i + 1
            sheet.Range(f"{col_matricula}{fila}").Value = alumno.get("matricula", "")
            sheet.Range(f"{col_nombre}{fila}").Value = alumno.get("nombre", "")

        # ========================================
        # Guardar archivo
        # ========================================
        # Formato 51 = xlOpenXMLWorkbook (.xlsx)
        # Formato 52 = xlOpenXMLWorkbookMacroEnabled (.xlsm)
        # Usa 52 si tu template tiene macros
        file_format = 52 if template_path.lower().endswith('.xlsm') else 51

        workbook.SaveAs(output_path, FileFormat=file_format)

    finally:
        # Cerrar recursos
        if workbook:
            workbook.Close(SaveChanges=False)
        if excel:
            excel.Quit()

        # Liberar objetos COM
        del workbook
        del excel


if __name__ == "__main__":
    main()