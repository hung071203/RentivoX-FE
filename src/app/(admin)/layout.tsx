import RoleGuard from '@/components/auth/RoleGuard'
import AdminLayout from '@/components/layouts/AdminLayout'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={['super_admin', 'admin']}>
      <AdminLayout>{children}</AdminLayout>
    </RoleGuard>
  )
}
