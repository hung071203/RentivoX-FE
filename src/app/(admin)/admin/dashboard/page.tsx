'use client'

import { useRouter } from 'next/navigation'
import { Building2, Users, Home, BarChart3 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { ROUTES } from '@/constants/routes'

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Thống kê toàn bộ hoạt động trên hệ thống"
      />

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
