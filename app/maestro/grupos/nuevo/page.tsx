"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface Periodo {
  id: number
  nombre: string
}

export default function NuevoGrupo() {
  const { data: session } = useSession()
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [periodoId, setPeriodoId] = useState("")
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadPeriodos()
  }, [])

  const loadPeriodos = async () => {
    try {
      const { data, error } = await supabase
        .from("periodos")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre", { ascending: false })

      if (error) throw error
      setPeriodos(data || [])
    } catch (error) {
      console.error("Error loading periodos:", error)
      setError("Error al cargar los periodos")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const maestroId = Number.parseInt(session?.user?.id || "0")

      const { data, error } = await supabase
        .from("grupos")
        .insert({
          nombre,
          periodo_id: Number.parseInt(periodoId),
          maestro_id: maestroId,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/maestro/grupos/${data.id}`)
    } catch (error: any) {
      console.error("Error creating grupo:", error)
      setError(error.message || "Error al crear el grupo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/maestro/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Grupo</h1>
          <p className="text-gray-600 mt-2">Registra un nuevo grupo para el periodo académico</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
            <CardDescription>Completa los datos para crear el nuevo grupo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Grupo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Grupo A, 1er Semestre, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Periodo Académico</Label>
                <Select value={periodoId} onValueChange={setPeriodoId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        {periodo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creando..." : "Crear Grupo"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/maestro/dashboard">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Próximos pasos</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Después de crear el grupo, podrás asignar asignaturas</li>
            <li>• Registrar alumnos en el grupo</li>
            <li>• Configurar ponderaciones para las evaluaciones</li>
            <li>• Comenzar a registrar calificaciones y asistencias</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
