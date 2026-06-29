'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Home, BarChart3, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { useBroadcastNotification } from '@/hooks/useNotifications'
import { ROUTES } from '@/constants/routes'

// ─── Broadcast dialog ─────────────────────────────────────────────────────────

const broadcastSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  message: z.string().min(1, 'Nội dung không được để trống'),
  target: z.enum(['all', 'landlord', 'tenant']),
})
type BroadcastForm = z.infer<typeof broadcastSchema>

function BroadcastDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const broadcast = useBroadcastNotification()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { target: 'all' },
  })

  function onSubmit(values: BroadcastForm) {
    broadcast.mutate(values, {
      onSuccess: () => { reset(); onClose() },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gửi thông báo hệ thống</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Tiêu đề <span className="text-destructive">*</span></Label>
            <Input {...register('title')} placeholder="Nhập tiêu đề thông báo" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nội dung <span className="text-destructive">*</span></Label>
            <textarea
              {...register('message')}
              placeholder="Nhập nội dung thông báo"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Đối tượng nhận <span className="text-destructive">*</span></Label>
            <Select value={watch('target')} onValueChange={(v) => setValue('target', v as 'all' | 'landlord' | 'tenant')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả người dùng</SelectItem>
                <SelectItem value="landlord">Chủ trọ</SelectItem>
                <SelectItem value="tenant">Người thuê</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>
              Hủy
            </Button>
            <Button type="submit" disabled={broadcast.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {broadcast.isPending ? 'Đang gửi...' : 'Gửi thông báo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  onClick,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  sub?: string
  onClick?: () => void
}) {
  return (
    <Card
      className={onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Occupancy bar ────────────────────────────────────────────────────────────

function OccupancyBar({ occupied, total }: { occupied: number; total: number }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-14 text-right shrink-0">
        {occupied}/{total} ({pct}%)
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data, isLoading } = useAdminDashboard()
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  return (
    <div className="space-y-6">
      <BroadcastDialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Tổng quan hệ thống"
          description="Thống kê toàn bộ hoạt động trên hệ thống"
        />
        <Button onClick={() => setBroadcastOpen(true)} className="gap-2 shrink-0">
          <Send className="h-4 w-4" />
          Gửi thông báo
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chủ trọ"
          value={isLoading ? '—' : (data?.totalLandlords ?? 0)}
          icon={Users}
          onClick={() => router.push(`${ROUTES.ADMIN_USERS}?role=landlord`)}
        />
        <StatCard
          label="Người thuê"
          value={isLoading ? '—' : (data?.totalTenants ?? 0)}
          icon={Users}
          onClick={() => router.push(`${ROUTES.ADMIN_USERS}?role=tenant`)}
        />
        <StatCard
          label="Nhà trọ"
          value={isLoading ? '—' : (data?.totalProperties ?? 0)}
          icon={Building2}
          onClick={() => router.push(ROUTES.ADMIN_PROPERTIES)}
        />
        <StatCard
          label="Tỷ lệ lấp đầy"
          value={isLoading ? '—' : `${data?.occupancyRate ?? 0}%`}
          icon={BarChart3}
          sub={
            data
              ? `${data.occupiedRooms} / ${data.totalRooms} phòng đang ở`
              : undefined
          }
        />
      </div>

      {/* Top landlords */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top chủ trọ nhiều phòng nhất</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[280px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Chủ trọ</TableHead>
                <TableHead className="text-center">Nhà trọ</TableHead>
                <TableHead className="text-center">Tổng phòng</TableHead>
                <TableHead className="pr-6">Lấp đầy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : !data?.topLandlords?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                    Chưa có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                data.topLandlords.map((landlord, idx) => (
                  <TableRow key={landlord.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{landlord.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{landlord.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {landlord.totalProperties}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {landlord.totalRooms}
                    </TableCell>
                    <TableCell className="pr-6">
                      <OccupancyBar
                        occupied={landlord.occupiedRooms}
                        total={landlord.totalRooms}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
