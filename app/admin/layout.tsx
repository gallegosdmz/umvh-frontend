import { RouteGuard } from "@/components/route-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["administrador"]}>
      {children}
    </RouteGuard>
  )
} 