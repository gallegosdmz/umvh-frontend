import { RouteGuard } from "@/components/route-guard"

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["director"]}>
      {children}
    </RouteGuard>
  )
} 