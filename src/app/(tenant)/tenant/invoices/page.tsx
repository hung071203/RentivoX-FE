'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ExternalLink, Camera, CheckCircle2, MoreHorizontal, Eye } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { SortableHead } from '@/components/common/SortableHead'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useTenantInvoices, useTenantInvoice, useSubmitPaymentProof } from '@/hooks/useTenant'
import { formatCurrency, formatDate, formatPeriod } from '@/utils/format'
import { INVOICE_STATUS_LABEL } from '@/constants/enums'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import type { InvoiceStatus } from '@/types/invoice.types'

// ─── Status badge ─────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status, overdue }: { status: InvoiceStatus; overdue?: boolean }) {
  if (overdue && status === 'unpaid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 bg-red-50 text-red-700 ring-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Quá hạn
      </span>
    )
  }
  const colors: Record<InvoiceStatus, string> = {
    unpaid: 'bg-amber-50 text-amber-700 ring-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    cancelled: 'bg-gray-50 text-gray-500 ring-gray-200',
  }
  const dots: Record<InvoiceStatus, string> = {
    unpaid: 'bg-amber-500',
    paid: 'bg-emerald-500',
    cancelled: 'bg-gray-400',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {INVOICE_STATUS_LABEL[status]}
    </span>
  )
}

// ─── Payment proof dialog — xác nhận đã chuyển khoản kèm ảnh ───────────────────

function PaymentProofDialog({
  invoiceId,
  open,
  onClose,
}: {
  invoiceId: string
  open: boolean
  onClose: () => void
}) {
  const submitProof = useSubmitPaymentProof()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState('')

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setNote('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(f: File) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleSubmit() {
    if (!file) return
    submitProof.mutate(
      { id: invoiceId, image: file, note: note.trim() || undefined },
      { onSuccess: handleClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận đã chuyển khoản</DialogTitle>
          <DialogDescription>
            Gửi ảnh chụp màn hình chuyển khoản để chủ trọ đối chiếu. Đây chỉ là thông báo — chủ trọ vẫn cần tự ghi nhận thanh toán.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label
            className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg overflow-hidden bg-muted/30 cursor-pointer hover:border-primary/40 transition-colors"
            style={{ aspectRatio: '16/10' }}
          >
            {preview ? (
              <img src={preview} alt="Ảnh chuyển khoản" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                <Camera className="h-6 w-6" />
                <span className="text-xs">Nhấn để chọn ảnh</span>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ghi chú thêm (tùy chọn)"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!file || submitProof.isPending}>
            {submitProof.isPending ? 'Đang gửi...' : 'Gửi xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function InvoiceDetailSheet({
  invoiceId,
  open,
  onClose,
  onOpenProof,
}: {
  invoiceId: string | null
  open: boolean
  onClose: () => void
  onOpenProof: (invoiceId: string) => void
}) {
  const { data: invoice } = useTenantInvoice(invoiceId ?? '')
  if (!invoice) return null

  const isOverdue = invoice.status === 'unpaid' && dayjs(invoice.dueDate).isBefore(dayjs(), 'day')
  const items = invoice.items ?? []
  const rentItem = items.find((i) => !i.contractServiceId)
  const serviceItems = items.filter((i) => !!i.contractServiceId)

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3 flex-wrap">
            <SheetTitle className="font-mono text-base">
              {invoice.invoiceNumber ?? '—'}
            </SheetTitle>
            <InvoiceStatusBadge status={invoice.status} overdue={isOverdue} />
          </div>
          <SheetDescription>
            {formatPeriod(invoice.period)} · {invoice.contract?.room?.property?.name ?? ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Kỳ thanh toán</p>
              <p className="font-semibold">{formatPeriod(invoice.period)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Hạn thanh toán</p>
              <p className={cn('font-medium', isOverdue && 'text-red-600')}>
                {formatDate(invoice.dueDate)}
                {isOverdue && <AlertCircle className="inline ml-1 h-3.5 w-3.5" />}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Phòng</p>
              <p className="font-medium">
                Phòng {invoice.contract?.room?.roomNumber ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Nhà trọ</p>
              <p className="font-medium truncate">{invoice.contract?.room?.property?.name ?? '—'}</p>
            </div>
            {invoice.paidAt && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-0.5">Ngày thanh toán</p>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Chi tiết hóa đơn
              </h3>
              <div className="space-y-1.5">
                {rentItem && (
                  <div className="flex items-start justify-between py-2 px-3 rounded-lg bg-muted/40 text-sm">
                    <span className="text-muted-foreground">{rentItem.description}</span>
                    <span className="font-medium ml-4 shrink-0">{formatCurrency(rentItem.amount)}</span>
                  </div>
                )}
                {serviceItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between py-2 px-3 rounded-lg bg-muted/40 text-sm">
                    <div className="min-w-0">
                      <p className="text-muted-foreground">{item.description}</p>
                      {item.quantity !== 1 && (
                        <p className="text-xs text-muted-foreground/70">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      )}
                    </div>
                    <span className="font-medium ml-4 shrink-0">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="font-semibold">Tổng cộng</span>
            <span className="text-lg font-bold">{formatCurrency(invoice.totalAmount)}</span>
          </div>

          {invoice.qrCodeUrl && invoice.status === 'unpaid' && (
            <div className="rounded-lg border p-4 flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-medium">Quét mã để chuyển khoản</p>
              <img
                src={invoice.qrCodeUrl}
                alt="QR chuyển khoản"
                className="h-48 w-48 rounded-md border bg-white"
              />
              <p className="text-xs text-muted-foreground">
                Số tiền và nội dung chuyển khoản đã được điền sẵn trong mã QR
              </p>
            </div>
          )}

          {invoice.status === 'unpaid' && (
            <Button variant="outline" className="w-full" onClick={() => onOpenProof(invoice.id)}>
              <Camera className="h-4 w-4 mr-2" />
              Xác nhận đã chuyển khoản
            </Button>
          )}

          {(invoice.paymentProofs?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Đã gửi xác nhận
              </h3>
              <div className="space-y-2">
                {invoice.paymentProofs!.map((p) => (
                  <a
                    key={p.id}
                    href={p.proofImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/40 transition-colors"
                  >
                    <img
                      src={p.proofImageUrl}
                      alt="Ảnh chuyển khoản"
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-md border object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {formatDate(p.createdAt)}
                      </p>
                      {p.note && <p className="text-sm truncate">{p.note}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Ghi chú
              </h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - i)

export default function TenantInvoicesPage() {
  const searchParams = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined)
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [proofInvoiceId, setProofInvoiceId] = useState<string | null>(null)

  const handleSort = (field: string, direction: 'ASC' | 'DESC' | undefined) => {
    setOrderBy(direction ? field : undefined)
    setOrderDirection(direction ?? 'DESC')
    setPage(1)
  }

  // Auto-open from URL param ?invoiceId=xxx
  useEffect(() => {
    const id = searchParams.get('invoiceId')
    if (id) {
      setSelectedId(id)
      setDetailOpen(true)
    }
  }, [searchParams])

  const period = yearFilter && monthFilter
    ? `${yearFilter}-${monthFilter.padStart(2, '0')}`
    : undefined

  const params = {
    page,
    limit: 20,
    ...(statusFilter !== 'all' ? { status: statusFilter as InvoiceStatus } : {}),
    ...(period ? { period } : {}),
    ...(orderBy ? { orderBy, orderDirection } : {}),
  }

  const { data, isLoading } = useTenantInvoices(params)
  const invoices = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  function openDetail(id: string) {
    setSelectedId(id)
    setDetailOpen(true)
  }

  function clearFilters() {
    setStatusFilter('all')
    setYearFilter('')
    setMonthFilter('')
    setPage(1)
  }

  const hasFilter = statusFilter !== 'all' || !!yearFilter

  return (
    <div className="space-y-5">
      <PageHeader title="Hóa đơn" description="Danh sách hóa đơn hàng tháng" />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as InvoiceStatus | 'all'); setPage(1) }}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="cancelled">Đã huỷ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setMonthFilter(''); setPage(1) }}>
              <SelectTrigger className="h-9 w-[110px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={monthFilter}
              onValueChange={(v) => { setMonthFilter(v); setPage(1) }}
              disabled={!yearFilter}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const isDisabled =
                    yearFilter === String(CURRENT_YEAR) && m > new Date().getMonth() + 1
                  return (
                    <SelectItem key={m} value={String(m)} disabled={isDisabled}>
                      Tháng {m}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {hasFilter && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[200px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
              <col className="w-[56px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <SortableHead label="Mã HĐ / Kỳ" field="period" orderBy={orderBy} orderDirection={orderDirection} onSort={handleSort} className="pl-6" />
                <TableHead>Phòng</TableHead>
                <SortableHead label="Tổng tiền" field="totalAmount" orderBy={orderBy} orderDirection={orderDirection} onSort={handleSort} />
                <TableHead>Trạng thái</TableHead>
                <SortableHead label="Hạn TT" field="dueDate" orderBy={orderBy} orderDirection={orderDirection} onSort={handleSort} />
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                    Không có hóa đơn nào
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const isOverdue = inv.status === 'unpaid' && dayjs(inv.dueDate).isBefore(dayjs(), 'day')
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => openDetail(inv.id)}
                    >
                      <TableCell className="pl-6 py-3">
                        <p className="font-mono text-xs font-semibold truncate">{inv.invoiceNumber ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{formatPeriod(inv.period)}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.contract?.room ? `Phòng ${inv.contract.room.roomNumber}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(inv.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} overdue={isOverdue} />
                      </TableCell>
                      <TableCell className={cn('text-sm', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openDetail(inv.id)}>
                              <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {inv.status === 'unpaid' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setProofInvoiceId(inv.id)}>
                                  <Camera className="h-4 w-4 mr-2 text-muted-foreground" />
                                  Xác nhận đã chuyển khoản
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
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

      <InvoiceDetailSheet
        invoiceId={selectedId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedId(null) }}
        onOpenProof={setProofInvoiceId}
      />

      <PaymentProofDialog
        invoiceId={proofInvoiceId ?? ''}
        open={!!proofInvoiceId}
        onClose={() => setProofInvoiceId(null)}
      />
    </div>
  )
}
