'use client'
import { useRef, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  Receipt,
  CircleCheck,
  Clock,
  CalendarClock,
  CalendarX2,
  CircleX,
  FilePen,
  Wallet,
  Megaphone,
  Loader2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useSocketInit,
} from '@/hooks/useNotifications'
import { ROUTES } from '@/constants/routes'
import { formatDateTime } from '@/utils/format'
import type { Notification, NotificationData } from '@/types/notification.types'
import { cn } from '@/lib/utils'

// ─── Deep link helper ─────────────────────────────────────────────────────────

function resolveDeepLink(role: string, data: NotificationData | null): string | null {
  if (!data) return null
  if (role === 'landlord') {
    if (data.invoiceId) return `${ROUTES.INVOICES}?invoiceId=${data.invoiceId}`
    if (data.paymentId) return ROUTES.PAYMENTS
    if (data.contractId) return ROUTES.CONTRACTS
  }
  if (role === 'tenant') {
    if (data.invoiceId) return `${ROUTES.TENANT_INVOICES}?invoiceId=${data.invoiceId}`
    if (data.paymentId) return ROUTES.TENANT_PAYMENTS
    if (data.contractId) return ROUTES.TENANT_CONTRACTS
  }
  return null
}

// ─── Notification type icon ───────────────────────────────────────────────────

type IconConfig = { icon: LucideIcon; bg: string; color: string }

const NOTI_ICON_MAP: Record<string, IconConfig> = {
  invoice_created:        { icon: Receipt,       bg: 'bg-blue-100',    color: 'text-blue-600' },
  invoice_paid:           { icon: CircleCheck,   bg: 'bg-emerald-100', color: 'text-emerald-600' },
  invoice_due_soon:       { icon: Clock,         bg: 'bg-amber-100',   color: 'text-amber-600' },
  contract_expiring_soon: { icon: CalendarClock, bg: 'bg-orange-100',  color: 'text-orange-600' },
  contract_expired:       { icon: CalendarX2,    bg: 'bg-red-100',     color: 'text-red-600' },
  contract_terminated:    { icon: CircleX,       bg: 'bg-red-100',     color: 'text-red-600' },
  amendment_applied:      { icon: FilePen,       bg: 'bg-purple-100',  color: 'text-purple-600' },
  payment_recorded:       { icon: Wallet,        bg: 'bg-emerald-100', color: 'text-emerald-600' },
  system_announcement:    { icon: Megaphone,     bg: 'bg-indigo-100',  color: 'text-indigo-600' },
}
const DEFAULT_ICON: IconConfig = { icon: Bell, bg: 'bg-muted', color: 'text-muted-foreground' }

function NotiIconBubble({ type, size = 'md' }: { type: string; size?: 'md' | 'lg' }) {
  const { icon: Icon, bg, color } = NOTI_ICON_MAP[type] ?? DEFAULT_ICON
  return (
    <span
      className={cn(
        'rounded-full flex items-center justify-center shrink-0',
        size === 'lg' ? 'h-12 w-12' : 'h-9 w-9',
        bg,
      )}
    >
      <Icon className={cn(size === 'lg' ? 'h-5 w-5' : 'h-4 w-4', color)} />
    </span>
  )
}

// ─── Toast khi nhận notification mới qua socket ──────────────────────────────

function NotiToastContent({
  noti,
  toastId,
  onClick,
}: {
  noti: Notification
  toastId: string | number
  onClick?: () => void
}) {
  const { bg, color, icon: Icon } = NOTI_ICON_MAP[noti.type] ?? DEFAULT_ICON
  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-background border border-border rounded-xl shadow-lg px-4 py-3.5 w-80',
        onClick && 'cursor-pointer hover:bg-muted transition-colors',
      )}
      onClick={onClick}
    >
      <span className={cn('rounded-full flex items-center justify-center shrink-0 h-9 w-9 mt-0.5', bg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug line-clamp-1">{noti.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{noti.message}</p>
      </div>
      <button
        className="shrink-0 mt-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => { e.stopPropagation(); toast.dismiss(toastId) }}
        aria-label="Đóng"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Single item in dropdown ──────────────────────────────────────────────────

function NotiItem({
  noti,
  onAction,
}: {
  noti: Notification
  onAction: (noti: Notification) => void
}) {
  return (
    <DropdownMenuItem
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer rounded-none focus:rounded-none',
        !noti.isRead && 'bg-primary/5',
      )}
      onClick={() => onAction(noti)}
    >
      <NotiIconBubble type={noti.type} />
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={cn('text-sm leading-snug', !noti.isRead && 'font-semibold')}>{noti.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{noti.message}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{formatDateTime(noti.createdAt)}</p>
      </div>
      {!noti.isRead && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </DropdownMenuItem>
  )
}

// ─── Detail modal (system_announcement / no deep link) ───────────────────────

function NotiDetailDialog({
  noti,
  onClose,
}: {
  noti: Notification | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!noti} onOpenChange={(o) => { if (!o) onClose() }}>
      {noti && (
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <NotiIconBubble type={noti.type} size="lg" />
              <DialogTitle className="text-left text-base leading-snug">
                {noti.title}
              </DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed">{noti.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(noti.createdAt)}</p>
        </DialogContent>
      )}
    </Dialog>
  )
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread'

// ─── Tab list with infinite scroll ───────────────────────────────────────────

function NotiList({
  tab,
  onAction,
}: {
  tab: Tab
  onAction: (noti: Notification) => void
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications(tab === 'unread' ? { isRead: false } : {})

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (items.length === 0 && !isFetchingNextPage) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
      </div>
    )
  }

  return (
    <>
      {items.map((noti, idx) => (
        <div key={noti.id}>
          <NotiItem noti={noti} onAction={onAction} />
          {idx < items.length - 1 && <DropdownMenuSeparator className="my-0" />}
        </div>
      ))}

      <div ref={sentinelRef} className="h-px" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground/60 py-3">
          Đã hiển thị tất cả
        </p>
      )}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [tab, setTab] = useState<Tab>('all')
  const [detailNoti, setDetailNoti] = useState<Notification | null>(null)

  useSocketInit((noti) => {
    const link = resolveDeepLink(user?.role ?? '', noti.data)
    toast.custom(
      (t) => (
        <NotiToastContent
          noti={noti}
          toastId={t}
          onClick={
            link
              ? () => { toast.dismiss(t); router.push(link) }
              : () => { toast.dismiss(t); setDetailNoti(noti) }
          }
        />
      ),
      { duration: 6000 },
    )
  })
  useUnreadCount()

  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  function handleAction(noti: Notification) {
    if (!noti.isRead) markAsRead.mutate(noti.id)
    const link = resolveDeepLink(user?.role ?? '', noti.data)
    if (link) {
      router.push(link)
    } else {
      setDetailNoti(noti)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">Thông báo</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {([
              { key: 'all',    label: 'Tất cả' },
              { key: 'unread', label: 'Chưa đọc' },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  tab === key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto overflow-x-hidden">
            <NotiList key={tab} tab={tab} onAction={handleAction} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotiDetailDialog noti={detailNoti} onClose={() => setDetailNoti(null)} />
    </>
  )
}
