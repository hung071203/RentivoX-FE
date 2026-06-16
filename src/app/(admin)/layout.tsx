import RoleGuard from '@/components/auth/RoleGuard'
import AdminLayout from '@/components/layouts/AdminLayout'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <AdminLayout>{children}</AdminLayout>
    </RoleGuard>
  )
}
