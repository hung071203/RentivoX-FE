'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, DoorOpen, FileText, Receipt, Wallet, Building2 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Tổng quan', href: ROUTES.TENANT_DASHBOARD, icon: LayoutDashboard },
  { label: 'Phòng của tôi', href: ROUTES.TENANT_ROOM, icon: DoorOpen },
  { label: 'Hợp đồng', href: ROUTES.TENANT_CONTRACTS, icon: FileText },
  { label: 'Hóa đơn', href: ROUTES.TENANT_INVOICES, icon: Receipt },
  { label: 'Thanh toán', href: ROUTES.TENANT_PAYMENTS, icon: Wallet },
]

export default function TenantSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Building2 className="h-[17px] w-[17px] text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[17px] tracking-tight text-foreground">
            RentivoX
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
            Thuê
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
          Của tôi
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
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
