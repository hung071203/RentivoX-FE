'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
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
  { label: 'Dãy nhà trọ', href: ROUTES.PROPERTIES, icon: Building2 },
  { label: 'Phòng', href: ROUTES.ROOMS, icon: DoorOpen },
  { label: 'Khách thuê', href: ROUTES.TENANTS, icon: Users },
  { label: 'Hợp đồng', href: ROUTES.CONTRACTS, icon: FileText },
  { label: 'Dịch vụ', href: ROUTES.SERVICES, icon: Wrench },
  { label: 'Chỉ số điện/nước', href: ROUTES.METER_READINGS, icon: Zap },
  { label: 'Hóa đơn', href: ROUTES.INVOICES, icon: Receipt },
  { label: 'Thanh toán', href: ROUTES.PAYMENTS, icon: Wallet },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-sidebar flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <span className="font-bold text-xl tracking-tight text-primary">RentivoX</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
