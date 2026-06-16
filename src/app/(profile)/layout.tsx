import RoleGuard from '@/components/auth/RoleGuard'
import ProfileLayout from '@/components/layouts/ProfileLayout'

export default function ProfileGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={['super_admin', 'admin', 'landlord', 'tenant']}>
      <ProfileLayout>{children}</ProfileLayout>
    </RoleGuard>
  )
}
