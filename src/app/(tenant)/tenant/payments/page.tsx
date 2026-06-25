'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useTenantPayments, useTenantPayment } from '@/hooks/useTenant'
import { formatCurrency, formatDate, formatPeriod } from '@/utils/format'
import { PAYMENT_METHOD_LABEL, INVOICE_STATUS_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import type { PaymentMethod } from '@/types/payment.types'

// ─── Method badge ─────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: PaymentMethod }) {
  const colors: Record<PaymentMethod, string> = {
    cash: 'bg-sky-50 text-sky-700 ring-sky-200',
    transfer: 'bg-violet-50 text-violet-700 ring-violet-200',
    other: 'bg-gray-50 text-gray-500 ring-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[method]}`}>
      <CreditCard className="h-3 w-3" />
      {PAYMENT_METHOD_LABEL[method]}
    </span>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function PaymentDetailSheet({
  paymentId,
  open,
  onClose,
}: {
  paymentId: string | null
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { data: payment } = useTenantPayment(paymentId ?? '')
  if (!payment) return null

  const inv = payment.invoice
  const room = inv?.contract?.room
  const property = room?.property

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="font-mono text-base">
            {payment.referenceCode ?? '—'}
          </SheetTitle>
          <SheetDescription>
            Chi tiết thanh toán
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Amount */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 px-5 py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Số tiền thanh toán</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Ngày thanh toán</p>
              <p className="font-medium">{formatDate(payment.paymentDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Phương thức</p>
              <MethodBadge method={payment.paymentMethod} />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Nguồn</p>
              <p className="font-medium">
                {payment.source === 'manual' ? 'Thủ công' : 'Tự động'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Người ghi nhận</p>
              <p className="font-medium truncate">{payment.recordedBy?.fullName ?? '—'}</p>
            </div>
          </div>

          {payment.notes && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Ghi chú</p>
              <p className="text-sm text-muted-foreground">{payment.notes}</p>
            </div>
          )}

          {/* Invoice card */}
          {inv && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Hóa đơn liên quan
              </h3>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold truncate">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatPeriod(inv.period)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 shrink-0 ${
                    inv.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : inv.status === 'unpaid'
                      ? 'bg-amber-50 text-amber-700 ring-amber-200'
                      : 'bg-gray-50 text-gray-500 ring-gray-200'
                  }`}>
                    {INVOICE_STATUS_LABEL[inv.status]}
                  </span>
                </div>
                {room && (
                  <p className="text-xs text-muted-foreground">
                    Phòng {room.roomNumber}{property ? ` · ${property.name}` : ''}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tổng hóa đơn</span>
                  <span className="font-semibold">{formatCurrency(inv.totalAmount)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={() => {
                    onClose()
                    router.push(`${ROUTES.TENANT_INVOICES}?invoiceId=${inv.id}`)
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Xem hóa đơn
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantPaymentsPage() {
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const params = {
    page,
    limit: 20,
    ...(methodFilter !== 'all' ? { paymentMethod: methodFilter as PaymentMethod } : {}),
  }

  const { data, isLoading } = useTenantPayments(params)
  const payments = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  function openDetail(id: string) {
    setSelectedId(id)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Thanh toán" description="Lịch sử thanh toán hóa đơn" />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v as PaymentMethod | 'all'); setPage(1) }}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[200px]" />
              <col className="w-[200px]" />
              <col className="w-[140px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
              <col className="w-[56px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Mã TT</TableHead>
                <TableHead>Hóa đơn / Kỳ</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Ngày TT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                    Chưa có lịch sử thanh toán nào
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openDetail(p.id)}
                  >
                    <TableCell>
                      <p className="font-mono text-xs font-medium truncate">{p.referenceCode ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs font-semibold truncate">{p.invoice?.invoiceNumber ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{p.invoice ? formatPeriod(p.invoice.period) : ''}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-right">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <MethodBadge method={p.paymentMethod} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(p.paymentDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-muted-foreground">
              <span>Trang {page} / {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentDetailSheet
        paymentId={selectedId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedId(null) }}
      />
    </div>
  )
}
