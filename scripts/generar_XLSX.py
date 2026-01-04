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
        # SECCIÓN 4: Agregar macro para modal de ponderaciones
        # ========================================

        # Código VBA para el modal de ponderaciones
        vba_code_thisworkbook = '''
        Private Sub Workbook_Open()
            ' Solo mostrar si las ponderaciones están en 0
            If Worksheets(1).Range("D7").Value = 0 Then
                frmPonderaciones.Show
            End If
        End Sub
        '''

        # Código VBA para el UserForm
        vba_code_userform = '''
        VERSION 5.00
        Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} frmPonderaciones 
          Caption         =   "Configurar Ponderaciones"
          ClientHeight    =   4500
          ClientLeft      =   120
          ClientTop       =   465
          ClientWidth     =   4560
          OleObjectBlob   =   "frmPonderaciones.frx":0000
          StartUpPosition =   1  'CenterOwner
        End
        '''

        # Código del formulario
        vba_form_code = '''
        Option Explicit

        Private Sub UserForm_Initialize()
            txtAsistencia.Value = "10"
            txtActividades.Value = "20"
            txtEvidencias.Value = "20"
            txtProducto.Value = "20"
            txtExamen.Value = "30"
            UpdateTotal
        End Sub

        Private Sub txtAsistencia_Change()
            UpdateTotal
        End Sub

        Private Sub txtActividades_Change()
            UpdateTotal
        End Sub

        Private Sub txtEvidencias_Change()
            UpdateTotal
        End Sub

        Private Sub txtProducto_Change()
            UpdateTotal
        End Sub

        Private Sub txtExamen_Change()
            UpdateTotal
        End Sub

        Private Sub UpdateTotal()
            Dim total As Double
            On Error Resume Next
            total = Val(txtAsistencia.Value) + Val(txtActividades.Value) + _
                    Val(txtEvidencias.Value) + Val(txtProducto.Value) + Val(txtExamen.Value)
            lblTotal.Caption = "Total: " & total & "%"
            
            If total = 100 Then
                lblTotal.ForeColor = &H008000  ' Verde
                btnAceptar.Enabled = True
            Else
                lblTotal.ForeColor = &H0000FF  ' Rojo
                btnAceptar.Enabled = False
            End If
        End Sub

        Private Sub btnAceptar_Click()
            Dim ws As Worksheet
            Set ws = ThisWorkbook.Worksheets(1)
            
            ' Desproteger temporalmente
            ws.Unprotect Password:="ppcdsalv"
            
            ' Escribir ponderaciones como decimales
            ws.Range("D7").Value = Val(txtAsistencia.Value) / 100
            ws.Range("E7").Value = Val(txtActividades.Value) / 100
            ws.Range("F7").Value = Val(txtEvidencias.Value) / 100
            ws.Range("G7").Value = Val(txtProducto.Value) / 100
            ws.Range("H7").Value = Val(txtExamen.Value) / 100
            
            ' Volver a proteger
            ws.Protect Password:="ppcdsalv", Contents:=True
            
            Me.Hide
            Unload Me
        End Sub

        Private Sub btnCancelar_Click()
            Me.Hide
            Unload Me
        End Sub

        Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
            If CloseMode = vbFormControlMenu Then
                Cancel = True
                Me.Hide
                Unload Me
            End If
        End Sub
        '''

        # Agregar código VBA al workbook
        try:
            # Agregar código a ThisWorkbook
            thisworkbook_module = workbook.VBProject.VBComponents("ThisWorkbook")
            thisworkbook_module.CodeModule.AddFromString(vba_code_thisworkbook)

            # Crear UserForm
            vb_components = workbook.VBProject.VBComponents
            userform = vb_components.Add(3)  # 3 = vbext_ct_MSForm
            userform.Name = "frmPonderaciones"

            # Configurar propiedades del form
            userform.Properties("Caption").Value = "Configurar Ponderaciones"
            userform.Properties("Width").Value = 320
            userform.Properties("Height").Value = 280

            # Agregar controles al form
            designer = userform.Designer

            # Labels y TextBoxes para cada ponderación
            campos = [
                ("Asistencia:", "txtAsistencia", 20),
                ("Actividades:", "txtActividades", 50),
                ("Evidencias:", "txtEvidencias", 80),
                ("Producto Integrador:", "txtProducto", 110),
                ("Examen:", "txtExamen", 140),
            ]

            for label_text, textbox_name, top_pos in campos:
                # Label
                lbl = designer.Controls.Add("Forms.Label.1")
                lbl.Caption = label_text
                lbl.Left = 20
                lbl.Top = top_pos
                lbl.Width = 120
                lbl.Height = 18

                # TextBox
                txt = designer.Controls.Add("Forms.TextBox.1")
                txt.Name = textbox_name
                txt.Left = 150
                txt.Top = top_pos
                txt.Width = 50
                txt.Height = 18

                # Label %
                lbl_pct = designer.Controls.Add("Forms.Label.1")
                lbl_pct.Caption = "%"
                lbl_pct.Left = 205
                lbl_pct.Top = top_pos
                lbl_pct.Width = 20
                lbl_pct.Height = 18

            # Label Total
            lbl_total = designer.Controls.Add("Forms.Label.1")
            lbl_total.Name = "lblTotal"
            lbl_total.Caption = "Total: 100%"
            lbl_total.Left = 20
            lbl_total.Top = 180
            lbl_total.Width = 150
            lbl_total.Height = 20
            lbl_total.Font.Bold = True

            # Botón Aceptar
            btn_ok = designer.Controls.Add("Forms.CommandButton.1")
            btn_ok.Name = "btnAceptar"
            btn_ok.Caption = "Aceptar"
            btn_ok.Left = 80
            btn_ok.Top = 210
            btn_ok.Width = 70
            btn_ok.Height = 25

            # Botón Cancelar
            btn_cancel = designer.Controls.Add("Forms.CommandButton.1")
            btn_cancel.Name = "btnCancelar"
            btn_cancel.Caption = "Cancelar"
            btn_cancel.Left = 160
            btn_cancel.Top = 210
            btn_cancel.Width = 70
            btn_cancel.Height = 25

            # Agregar código al UserForm
            userform.CodeModule.AddFromString(vba_form_code)

        except Exception as e:
            print(f"Advertencia: No se pudo agregar VBA: {e}", file=sys.stderr)
            # Continuar sin el modal si falla
        

        # SECCIÓN 5: Proteger hojas

        # Contraseña para proteger
        password = "ppcdsalv"

        sheet.Protect(
            Password=password,
            DrawingObjects=True,
            Contents=True,
            Scenarios=True,
            AllowFormattingCells=False,
            AllowFormattingColumns=False,
            AllowFormattingRows=False,
            AllowInsertingColumns=False,
            AllowInsertingRows=False,
            AllowInsertingHyperlinks=False,
            AllowDeletingColumns=False,
            AllowDeletingRows=False,
            AllowSorting=False,
            AllowFiltering=False,
            AllowUsingPivotTables=False
        )

        # Proteger otras hojas específicas
        # Hoja 1
        workbook.Worksheets(1).Protect(Password=password, Contents=True)
        # Hoja 2
        workbook.Worksheets(2).Protect(Password=password, Contents=True)
        # Hoja 3
        workbook.Worksheets(3).Protect(Password=password, Contents=True)
        # Hoja 4
        workbook.Worksheets(4).Protect(Password=password, Contents=True)

        sheet.Range("D6:BJ53").Locked = False
        sheet.Protect(Password=password, Contents=True)

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