"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { User } from "./mock-data"
import { UserService } from "./services/user.service"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Usuario administrador por defecto (sin autenticación requerida)
  const defaultUser: User = {
    id: 1,
    fullName: "Administrador",
    email: "admin@sistema.edu",
    role: "administrador",
  }

  const [user, setUser] = useState<User | null>(defaultUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Verificar si hay una sesión guardada (opcional)
    try {
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const usuario = await UserService.login(email, password);

    console.log(usuario);

    if (usuario.statusCode === 400) return false

    if (usuario) {
      setUser(usuario)
      try {
        localStorage.setItem("currentUser", JSON.stringify(usuario))
      } catch (error) {
        console.error("Error saving user to localStorage:", error)
      }
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem("currentUser")
    } catch (error) {
      console.error("Error removing user from localStorage:", error)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
