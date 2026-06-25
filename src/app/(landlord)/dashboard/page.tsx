'use client'

import { useRouter } from 'next/navigation'
import {
  Home,
  FileText,
  TrendingUp,
  Receipt,
  CalendarClock,
  CreditCard,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLandlordDashboard } from '@/hooks/useLandlord'
import { formatCurrency, formatDate, formatPeriod } from '@/utils/format'
import { PAYMENT_METHOD_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import dayjs from 'dayjs'
import type { MonthlyRevenue } from '@/types/landlord-dashboard.types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  iconColor: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-foreground truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function formatYAxis(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}tr`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

function formatMonthLabel(ym: string) {
  const [year, month] = ym.split('-')
  return `T${parseInt(month)}/${year.slice(2)}`
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function RevenueBarChart({ data }: { data: MonthlyRevenue[] }) {
  const chartData = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={40} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.6, radius: 4 }} />
        <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandlordDashboardPage() {
  const router = useRouter()
  const { data, isLoading } = useLandlordDashboard()

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan" description="Thống kê nhà trọ của bạn" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Home}
          label="Phòng trọ"
          value={
            isLoading
              ? '...'
              : `${data?.rooms.occupied ?? 0}/${data?.rooms.total ?? 0} phòng`
          }
          sub={
            data
              ? `Lấp đầy ${data.rooms.occupancyRate}% · Trống ${data.rooms.available}`
              : undefined
          }
          iconColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={FileText}
          label="Hợp đồng đang hiệu lực"
          value={isLoading ? '...' : String(data?.activeContracts ?? 0)}
          sub="Hợp đồng đang active"
          iconColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Doanh thu tháng này"
          value={isLoading ? '...' : formatCurrency(data?.revenueThisMonth.total ?? 0)}
          sub={
            data?.revenueThisMonth.paymentCount
              ? `${data.revenueThisMonth.paymentCount} lần thanh toán`
              : 'Chưa có thanh toán'
          }
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Receipt}
          label="Hóa đơn chưa thu"
          value={isLoading ? '...' : `${data?.unpaidInvoices.count ?? 0} hóa đơn`}
          sub={
            (data?.unpaidInvoices.count ?? 0) > 0
              ? formatCurrency(data!.unpaidInvoices.total)
              : 'Không có tồn đọng'
          }
          iconColor={
            (data?.unpaidInvoices.count ?? 0) > 0
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Doanh thu 6 tháng gần nhất</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-5 px-6">
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : !data?.monthlyRevenue.length ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <RevenueBarChart data={data.monthlyRevenue} />
              <p className="text-xs text-muted-foreground px-1">
                Tổng 6 tháng: <span className="font-medium text-foreground">{formatCurrency(data.monthlyRevenue.reduce((s, d) => s + d.total, 0))}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row: expiring contracts + recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expiring contracts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-semibold">Sắp hết hạn (30 ngày)</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground"
                onClick={() => router.push(ROUTES.CONTRACTS)}
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
            ) : !data?.expiringContracts.length ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Không có hợp đồng sắp hết hạn
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b text-xs text-muted-foreground">
                    <th className="text-left px-6 py-3 font-medium">Hợp đồng</th>
                    <th className="text-left px-4 py-3 font-medium">Ngày HH</th>
                    <th className="text-right px-6 py-3 font-medium">Còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiringContracts.map((c) => {
                    const daysLeft = dayjs(c.endDate).diff(dayjs(), 'day')
                    const isUrgent = daysLeft <= 7
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium text-xs font-mono">
                            {c.contractNumber ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            P.{c.roomNumber} · {c.propertyName}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.endDate)}</td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isUrgent ? 'text-red-600' : 'text-amber-600'
                            }`}
                          >
                            {isUrgent && <AlertTriangle className="h-3 w-3" />}
                            {daysLeft} ngày
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-base font-semibold">Thanh toán gần đây</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground"
                onClick={() => router.push(ROUTES.PAYMENTS)}
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
            ) : !data?.recentPayments.length ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Chưa có giao dịch nào
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b text-xs text-muted-foreground">
                    <th className="text-left px-6 py-3 font-medium">Hóa đơn / Phòng</th>
                    <th className="text-left px-4 py-3 font-medium">Phương thức</th>
                    <th className="text-right px-6 py-3 font-medium">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-mono text-xs font-medium">{p.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPeriod(p.period)} · P.{p.roomNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                          {PAYMENT_METHOD_LABEL[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABEL]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
