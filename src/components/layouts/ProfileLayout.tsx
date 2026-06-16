'use client'
import { useAuthStore } from '@/stores/auth.store'
import AdminSidebar from './AdminSidebar'
import LandlordSidebar from './LandlordSidebar'
import TenantSidebar from './TenantSidebar'
import Header from './Header'

function SidebarByRole() {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'super_admin' || role === 'admin') return <AdminSidebar />
  if (role === 'tenant') return <TenantSidebar />
  return <LandlordSidebar />
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarByRole />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/40 p-6">{children}</main>
      </div>
    </div>
  )
}
