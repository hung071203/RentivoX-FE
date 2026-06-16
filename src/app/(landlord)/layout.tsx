import RoleGuard from '@/components/auth/RoleGuard'
import LandlordLayout from '@/components/layouts/LandlordLayout'

export default function LandlordGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="landlord">
      <LandlordLayout>{children}</LandlordLayout>
    </RoleGuard>
  )
}
