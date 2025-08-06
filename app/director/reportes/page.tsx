"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, ArrowLeft, Download, BarChart3, TrendingUp, TrendingDown, Users, Award, Calendar, Filter } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface ReporteData {
  tipo: string
  fecha: string
  descripcion: string
  estado: "completado" | "en_proceso" | "pendiente"
  archivo?: string
}

interface EstadisticaReporte {
  titulo: string
  valor: number
  cambio: number
  tendencia: "up" | "down" | "stable"
  color: string
}

export default function ReportesPage() {
  const { user } = useAuth()
  const [selectedTipo, setSelectedTipo] = useState("todos")
  const [selectedPeriodo, setSelectedPeriodo] = useState("actual")
  const [loading, setLoading] = useState(false)

  // Datos mock para reportes
  const mockReportes: ReporteData[] = [
    {
      tipo: "Rendimiento General",
      fecha: "2024-01-15",
      descripcion: "Reporte completo de rendimiento académico de todos los grupos",
      estado: "completado",
      archivo: "reporte_rendimiento_general_2024.pdf"
    },
    {
      tipo: "Análisis por Asignatura",
      fecha: "2024-01-10",
      descripcion: "Análisis detallado del rendimiento por asignatura",
      estado: "completado",
      archivo: "analisis_asignaturas_2024.pdf"
    },
    {
      tipo: "Comparativo de Grupos",
      fecha: "2024-01-08",
      descripcion: "Comparación del rendimiento entre diferentes grupos",
      estado: "completado",
      archivo: "comparativo_grupos_2024.pdf"
    },
    {
      tipo: "Tendencias Académicas",
      fecha: "2024-01-05",
      descripcion: "Análisis de tendencias y evolución del rendimiento",
      estado: "en_proceso"
    },
    {
      tipo: "Reporte de Alumnos en Riesgo",
      fecha: "2024-01-03",
      descripcion: "Identificación de alumnos que requieren atención especial",
      estado: "pendiente"
    }
  ]

  const estadisticas: EstadisticaReporte[] = [
    {
      titulo: "Promedio General",
      valor: 8.2,
      cambio: 0.3,
      tendencia: "up",
      color: "from-green-500 to-green-600"
    },
    {
      titulo: "Alumnos Aprobados",
      valor: 85,
      cambio: 5,
      tendencia: "up",
      color: "from-blue-500 to-blue-600"
    },
    {
      titulo: "Alumnos Reprobados",
      valor: 15,
      cambio: -3,
      tendencia: "down",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      titulo: "Asignaturas Críticas",
      valor: 2,
      cambio: -1,
      tendencia: "down",
      color: "from-red-500 to-red-600"
    }
  ]

  const tiposReporte = [
    "Rendimiento General",
    "Análisis por Asignatura", 
    "Comparativo de Grupos",
    "Tendencias Académicas",
    "Reporte de Alumnos en Riesgo",
    "Análisis de Asistencia",
    "Evaluación de Maestros"
  ]

  const periodos = [
    { valor: "actual", nombre: "Periodo Actual" },
    { valor: "anterior", nombre: "Periodo Anterior" },
    { valor: "anual", nombre: "Año Académico" },
    { valor: "personalizado", nombre: "Personalizado" }
  ]

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "completado":
        return "bg-green-100 text-green-800"
      case "en_proceso":
        return "bg-yellow-100 text-yellow-800"
      case "pendiente":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case "completado":
        return "Completado"
      case "en_proceso":
        return "En Proceso"
      case "pendiente":
        return "Pendiente"
      default:
        return "Desconocido"
    }
  }

  const generarReporte = async (tipo: string) => {
    setLoading(true)
    // Simular generación de reporte
    setTimeout(() => {
      setLoading(false)
      // Aquí se podría mostrar una notificación de éxito
    }, 2000)
  }

  const descargarReporte = (archivo: string) => {
    // Simular descarga
    console.log(`Descargando: ${archivo}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/director/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Reportes Académicos</h1>
                <p className="text-gray-600 text-lg">
                  Generación y gestión de informes académicos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1">
                <FileText className="h-3 w-3 mr-1" />
                {mockReportes.length} reportes
              </Badge>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {estadisticas.map((stat, index) => (
            <Card key={index} className={`border-0 shadow-lg bg-gradient-to-br ${stat.color} text-white`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{stat.titulo}</p>
                    <p className="text-3xl font-bold">{stat.valor}</p>
                    <div className="flex items-center mt-2">
                      {stat.tendencia === "up" ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : stat.tendencia === "down" ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : (
                        <div className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs opacity-90">
                        {stat.cambio > 0 ? "+" : ""}{stat.cambio}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {stat.titulo.includes("Promedio") && <Award className="h-8 w-8 opacity-90" />}
                    {stat.titulo.includes("Aprobados") && <Users className="h-8 w-8 opacity-90" />}
                    {stat.titulo.includes("Reprobados") && <TrendingDown className="h-8 w-8 opacity-90" />}
                    {stat.titulo.includes("Críticas") && <BarChart3 className="h-8 w-8 opacity-90" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generar Nuevo Reporte */}
        <Card className="mb-8 border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <FileText className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Generar Nuevo Reporte
            </CardTitle>
            <CardDescription>
              Selecciona el tipo de reporte y periodo para generar un nuevo informe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Reporte</label>
                <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {tiposReporte.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Periodo</label>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.valor} value={periodo.valor}>
                        {periodo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full bg-[#bc4b26] hover:bg-[#d05f27]"
                  onClick={() => generarReporte(selectedTipo)}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Generando..." : "Generar Reporte"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reportes Generados */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <BarChart3 className="h-5 w-5 mr-2 text-[#bc4b26]" />
              Reportes Generados
            </CardTitle>
            <CardDescription>
              Historial de reportes generados y disponibles para descarga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Reporte</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReportes.map((reporte, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{reporte.tipo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(reporte.fecha).toLocaleDateString("es-MX")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {reporte.descripcion}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(reporte.estado)}>
                          {getEstadoText(reporte.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {reporte.archivo && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => descargarReporte(reporte.archivo!)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Reporte Mensual</h3>
                  <p className="text-sm text-gray-600">Generar reporte del mes actual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Análisis de Tendencias</h3>
                  <p className="text-sm text-gray-600">Evaluar evolución académica</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Alumnos en Riesgo</h3>
                  <p className="text-sm text-gray-600">Identificar casos especiales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 