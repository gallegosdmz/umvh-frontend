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
        sheet.Range("D7").Value = 0 / 100
        sheet.Range("E7").Value = 0 / 100
        sheet.Range("F7").Value = 0 / 100
        sheet.Range("G7").Value = 0 / 100
        sheet.Range("H7").Value = 0 / 100

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
        # SECCIÓN 5: Agregar modal VBA para ponderaciones
        # ========================================

        # Código VBA para ThisWorkbook (se ejecuta al abrir)
        vba_thisworkbook = '''
        Private Sub Workbook_Open()
            ' Mostrar modal solo si las ponderaciones están en 0
            If Worksheets(1).Range("D7").Value = 0 Then
                frmPonderaciones.Show
            End If
        End Sub
        '''

        # Código VBA para el UserForm
        vba_userform = '''
        Option Explicit

        Private Sub UserForm_Initialize()
            txtAsistencia.Value = "10"
            txtActividades.Value = "20"
            txtEvidencias.Value = "20"
            txtProducto.Value = "20"
            txtExamen.Value = "30"
            ActualizarTotal
        End Sub

        Private Sub txtAsistencia_Change()
            ActualizarTotal
        End Sub

        Private Sub txtActividades_Change()
            ActualizarTotal
        End Sub

        Private Sub txtEvidencias_Change()
            ActualizarTotal
        End Sub

        Private Sub txtProducto_Change()
            ActualizarTotal
        End Sub

        Private Sub txtExamen_Change()
            ActualizarTotal
        End Sub

        Private Sub ActualizarTotal()
            Dim total As Double
            On Error Resume Next
            total = Val(txtAsistencia.Value) + Val(txtActividades.Value) + _
                    Val(txtEvidencias.Value) + Val(txtProducto.Value) + Val(txtExamen.Value)
            lblTotal.Caption = "Total: " & total & "%"
            
            If total = 100 Then
                lblTotal.ForeColor = &H008000
                btnAceptar.Enabled = True
            Else
                lblTotal.ForeColor = &H0000FF
                btnAceptar.Enabled = False
            End If
        End Sub

        Private Sub btnAceptar_Click()
            Dim ws As Worksheet
            Set ws = ThisWorkbook.Worksheets(1)
            
            ws.Unprotect Password:="ppcdsalv"
            
            ws.Range("D7").Value = Val(txtAsistencia.Value) / 100
            ws.Range("E7").Value = Val(txtActividades.Value) / 100
            ws.Range("F7").Value = Val(txtEvidencias.Value) / 100
            ws.Range("G7").Value = Val(txtProducto.Value) / 100
            ws.Range("H7").Value = Val(txtExamen.Value) / 100
            
            ws.Protect Password:="ppcdsalv", Contents:=True
            
            Unload Me
        End Sub

        Private Sub btnCancelar_Click()
            Unload Me
        End Sub

        Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
            If CloseMode = vbFormControlMenu Then
                Cancel = True
            End If
        End Sub
        '''

        try:
            # Agregar código a ThisWorkbook
            thisworkbook_module = workbook.VBProject.VBComponents("ThisWorkbook")
            thisworkbook_module.CodeModule.AddFromString(vba_thisworkbook)

            # Crear UserForm
            vb_components = workbook.VBProject.VBComponents
            userform = vb_components.Add(3)  # 3 = vbext_ct_MSForm
            userform.Name = "frmPonderaciones"
            userform.Properties("Caption").Value = "Configurar Ponderaciones"
            userform.Properties("Width").Value = 300
            userform.Properties("Height").Value = 260

            # Obtener el diseñador del form
            designer = userform.Designer

            # Crear controles
            campos = [
                ("Asistencia (%):", "txtAsistencia", 20),
                ("Actividades (%):", "txtActividades", 50),
                ("Evidencias (%):", "txtEvidencias", 80),
                ("Producto Int. (%):", "txtProducto", 110),
                ("Examen (%):", "txtExamen", 140),
            ]

            for label_text, textbox_name, top_pos in campos:
                # Label
                lbl = designer.Controls.Add("Forms.Label.1")
                lbl.Caption = label_text
                lbl.Left = 20
                lbl.Top = top_pos
                lbl.Width = 100
                lbl.Height = 18

                # TextBox
                txt = designer.Controls.Add("Forms.TextBox.1")
                txt.Name = textbox_name
                txt.Left = 130
                txt.Top = top_pos
                txt.Width = 50
                txt.Height = 18

            # Label Total
            lbl_total = designer.Controls.Add("Forms.Label.1")
            lbl_total.Name = "lblTotal"
            lbl_total.Caption = "Total: 100%"
            lbl_total.Left = 20
            lbl_total.Top = 175
            lbl_total.Width = 120
            lbl_total.Height = 20

            # Botón Aceptar
            btn_ok = designer.Controls.Add("Forms.CommandButton.1")
            btn_ok.Name = "btnAceptar"
            btn_ok.Caption = "Aceptar"
            btn_ok.Left = 60
            btn_ok.Top = 200
            btn_ok.Width = 70
            btn_ok.Height = 25

            # Botón Cancelar
            btn_cancel = designer.Controls.Add("Forms.CommandButton.1")
            btn_cancel.Name = "btnCancelar"
            btn_cancel.Caption = "Cancelar"
            btn_cancel.Left = 140
            btn_cancel.Top = 200
            btn_cancel.Width = 70
            btn_cancel.Height = 25

            # Agregar código al UserForm
            userform.CodeModule.AddFromString(vba_userform)

            print("Modal VBA agregado exitosamente")

        except Exception as e:
            print(f"Advertencia: No se pudo agregar VBA: {e}", file=sys.stderr)


        # ========================================
        # SECCIÓN 4: Proteger hojas
        # ========================================
        password = "ppcdsalv"

        for i in range(1, 5):  # Hojas 1 a 4
            ws = workbook.Worksheets(i)

            # Bloquear todas las celdas
            ws.Cells.Locked = True

            # Desbloquear rango D7:BJ53 manejando celdas combinadas
            for row in range(7, 54):  # Filas 7-53
                for col in range(4, 63):  # Columnas D(4) a BJ(62)
                    try:
                        cell = ws.Cells(row, col)
                        # Si es celda combinada, desbloquear todo el MergeArea
                        if cell.MergeCells:
                            cell.MergeArea.Locked = False
                        else:
                            cell.Locked = False
                    except:
                        pass  # Ignorar errores

            # Proteger la hoja
            ws.Protect(
                Password=password,
                DrawingObjects=True,
                Contents=True,
                Scenarios=True
            )


        # ========================================
        # Guardar archivo
        # ========================================
        # Formato 51 = xlOpenXMLWorkbook (.xlsx)
        # Formato 52 = xlOpenXMLWorkbookMacroEnabled (.xlsm)
        # Usa 52 si tu template tiene macros
        file_format = 52

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