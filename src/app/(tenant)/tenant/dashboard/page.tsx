'use client'

import { useRouter } from 'next/navigation'
import { Home, FileText, Receipt, CalendarClock, CreditCard, ArrowRight } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTenantDashboard } from '@/hooks/useTenant'
import { formatCurrency, formatDate, formatPeriod } from '@/utils/format'
import { PAYMENT_METHOD_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import dayjs from 'dayjs'

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantDashboardPage() {
  const router = useRouter()
  const { data, isLoading } = useTenantDashboard()

  const nearestDue = data?.nearestDueDate
  const isDueOverdue = nearestDue ? dayjs(nearestDue).isBefore(dayjs(), 'day') : false

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan" description="Thông tin thuê phòng của bạn" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Home}
          label="Phòng hiện tại"
          value={data?.currentRoom ? `Phòng ${data.currentRoom.roomNumber}` : '—'}
          sub={data?.currentRoom?.property.name ?? 'Chưa có phòng'}
          iconColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={FileText}
          label="Tiền phòng / tháng"
          value={data?.activeContract ? formatCurrency(data.activeContract.rentAmount) : '—'}
          sub={
            data?.activeContract
              ? `${formatDate(data.activeContract.startDate)} – ${formatDate(data.activeContract.endDate)}`
              : 'Chưa có hợp đồng'
          }
          iconColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Receipt}
          label="Hóa đơn chưa TT"
          value={isLoading ? '...' : `${data?.unpaidInvoiceCount ?? 0} hóa đơn`}
          sub={data?.unpaidInvoiceCount ? formatCurrency(data.totalUnpaidAmount) : 'Không có hóa đơn tồn đọng'}
          iconColor={
            (data?.unpaidInvoiceCount ?? 0) > 0
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }
        />
        <StatCard
          icon={CalendarClock}
          label="Hạn thanh toán gần nhất"
          value={nearestDue ? formatDate(nearestDue) : '—'}
          sub={
            nearestDue
              ? isDueOverdue
                ? 'Đã quá hạn'
                : `còn ${dayjs(nearestDue).diff(dayjs(), 'day')} ngày`
              : 'Không có hóa đơn pending'
          }
          iconColor={isDueOverdue ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600'}
        />
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Thanh toán gần đây</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-muted-foreground"
              onClick={() => router.push(ROUTES.TENANT_PAYMENTS)}
            >
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : !data?.recentPayments?.length ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Chưa có lịch sử thanh toán nào
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b text-xs text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">Hóa đơn</th>
                  <th className="text-left px-4 py-3 font-medium">Kỳ</th>
                  <th className="text-right px-4 py-3 font-medium">Số tiền</th>
                  <th className="text-left px-4 py-3 font-medium">Phương thức</th>
                  <th className="text-left px-6 py-3 font-medium">Ngày TT</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-medium">{p.invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatPeriod(p.invoice.period)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                        <CreditCard className="h-3 w-3" />
                        {PAYMENT_METHOD_LABEL[p.paymentMethod]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
