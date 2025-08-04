"use client"

import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GraduationCap, User, LogOut, Settings, Home } from "lucide-react"

export function Navigation() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // No mostrar la navegación en la página de login
  if (!user || pathname === "/auth/signin") return null

  const isAdmin = user.role === "administrador"
  const isDirector = user.role === "director"
  const dashboardPath = isAdmin ? "/admin/dashboard" : isDirector ? "/director" : "/maestro/dashboard"

  const handleLogout = () => {
    logout()
    router.push("/auth/signin")
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={dashboardPath} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gradient-to-br from-[#bc4b26] to-[#d05f27] rounded-lg mr-3">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#bc4b26] to-[#d05f27] bg-clip-text text-transparent">
                  Sistema Escolar
                </span>
                <div className="text-xs text-gray-500">
                  {isAdmin ? "Panel de Administración" : isDirector ? "Panel del Director" : "Panel del Maestro"}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <div className="text-right">
                <div className="font-medium text-gray-900">{user.fullName}</div>
                <div className="text-gray-500 capitalize">{user.role}</div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200"
                >
                  <User className="h-5 w-5 text-[#bc4b26]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <div className="font-medium text-gray-900">{user.fullName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize mt-1">{user.role}</div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href={dashboardPath} className="cursor-pointer">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
