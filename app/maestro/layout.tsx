import { RouteGuard } from "@/components/route-guard"

export default function MaestroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["maestro"]}>
      {children}
    </RouteGuard>
  )
} 