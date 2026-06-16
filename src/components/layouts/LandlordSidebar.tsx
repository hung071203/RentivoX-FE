'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Wrench,
  Zap,
  Receipt,
  Wallet,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Tổng quan', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Dãy nhà trọ', href: ROUTES.PROPERTIES, icon: Building2 },
  { label: 'Phòng', href: ROUTES.ROOMS, icon: DoorOpen },
  { label: 'Khách thuê', href: ROUTES.TENANTS, icon: Users },
  { label: 'Hợp đồng', href: ROUTES.CONTRACTS, icon: FileText },
  { label: 'Dịch vụ', href: ROUTES.SERVICES, icon: Wrench },
  { label: 'Chỉ số điện/nước', href: ROUTES.METER_READINGS, icon: Zap },
  { label: 'Hóa đơn', href: ROUTES.INVOICES, icon: Receipt },
  { label: 'Thanh toán', href: ROUTES.PAYMENTS, icon: Wallet },
]

export default function LandlordSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Building2 className="h-[17px] w-[17px] text-white" />
        </div>
        <span className="font-bold text-[17px] tracking-tight text-foreground">
          RentivoX
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
          Quản lý
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== ROUTES.DASHBOARD && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
