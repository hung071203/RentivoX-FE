import RoleGuard from '@/components/auth/RoleGuard'
import TenantLayout from '@/components/layouts/TenantLayout'

export default function TenantGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles="tenant">
      <TenantLayout>{children}</TenantLayout>
    </RoleGuard>
  )
}
