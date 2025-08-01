# Formato de Excel para Importar Alumnos

## Estructura Requerida

El archivo Excel debe contener las siguientes columnas en el orden especificado:

| No. | MATRICULA | NOMBRE |
|-----|-----------|--------|
| 1   | 2024001   | Juan Pérez González |
| 2   | 2024002   | María García López |
| 3   | 2024003   | Carlos Rodríguez Martínez |

## Especificaciones

### Columnas Requeridas

1. **No.** - Número de orden (opcional, pero recomendado)
   - Variantes aceptadas: `NO.`, `NO`, `NÚMERO`, `NUMERO`

2. **MATRICULA** - Número de matrícula del estudiante
   - Variantes aceptadas: `MATRICULA`, `MATRÍCULA`, `MATRICULA `
   - **Requerido**: Sí
   - **Formato**: Texto o número

3. **NOMBRE** - Nombre completo del estudiante
   - Variantes aceptadas: `NOMBRE`, `NOMBRE `
   - **Requerido**: Sí
   - **Formato**: Texto

### Formatos de Archivo Soportados

- `.xlsx` (Excel 2007 y posteriores)
- `.xls` (Excel 97-2003)

### Validaciones

- El sistema detectará automáticamente la fila de encabezados
- Solo se importarán filas que tengan tanto matrícula como nombre
- Las filas vacías o con datos incompletos serán ignoradas
- No se permiten matrículas duplicadas

### Ejemplo de Archivo

```excel
| No. | MATRICULA | NOMBRE                    |
|-----|-----------|---------------------------|
| 1   | 2024001   | Juan Pérez González       |
| 2   | 2024002   | María García López        |
| 3   | 2024003   | Carlos Rodríguez Martínez |
| 4   | 2024004   | Ana López Fernández       |
| 5   | 2024005   | Pedro Sánchez Ruiz        |
```

### Notas Importantes

1. **Encabezados**: Los encabezados deben estar en la primera fila del archivo
2. **Datos**: Los datos deben comenzar desde la segunda fila
3. **Caracteres especiales**: Se aceptan acentos y caracteres especiales en los nombres
4. **Espacios**: Los espacios extra en los encabezados son tolerados
5. **Orden**: El orden de las columnas puede variar, el sistema las detectará automáticamente

### Proceso de Importación

1. Hacer clic en el botón "Importar Excel"
2. Seleccionar el archivo Excel
3. El sistema validará el formato y mostrará una vista previa
4. Confirmar la importación
5. Los estudiantes se crearán automáticamente en el sistema

### Errores Comunes

- **Columnas faltantes**: Asegúrate de que el archivo tenga las columnas MATRICULA y NOMBRE
- **Datos vacíos**: Las filas sin matrícula o nombre serán ignoradas
- **Formato incorrecto**: Usa solo archivos .xlsx o .xls
- **Encabezados incorrectos**: Verifica que los nombres de las columnas coincidan exactamente 