'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, FileText } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useInvoices, useInvoice, useCreateInvoice, useCancelInvoice } from '@/hooks/useInvoices'
import { useProperties } from '@/hooks/useProperties'
import { useContracts } from '@/hooks/useContracts'
import { getErrorMessage } from '@/utils/error'
import { formatCurrency, formatDate, formatPeriod } from '@/utils/format'
import { INVOICE_STATUS_LABEL } from '@/constants/enums'
import type { Invoice, InvoiceStatus, GetInvoicesParams } from '@/types/invoice.types'

// ─── Status badge ─────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
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
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {INVOICE_STATUS_LABEL[status]}
    </span>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function InvoiceDetailSheet({
  invoiceId,
  open,
  onClose,
}: {
  invoiceId: string | null
  open: boolean
  onClose: () => void
}) {
  const { data: invoice } = useInvoice(invoiceId ?? '')
  if (!invoice) return null

  const room = invoice.contract?.room
  const property = room?.property
  const items = invoice.items ?? []

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>Chi tiết hóa đơn</SheetTitle>
          <SheetDescription>
            {formatPeriod(invoice.period)} · Phòng {room?.roomNumber} · {property?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Trạng thái</p>
              <div className="mt-1"><InvoiceStatusBadge status={invoice.status} /></div>
            </div>
            <div>
              <p className="text-muted-foreground">Hạn thanh toán</p>
              <p className="mt-1 font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ngày tạo</p>
              <p className="mt-1">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground">Ngày thanh toán</p>
                <p className="mt-1">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Chi tiết khoản mục</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Khoản mục</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p>{item.description}</p>
                        {item.contractServiceId && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SL: {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice))}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(Number(item.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/20">
                  <tr>
                    <td className="px-4 py-3 font-semibold">Tổng cộng</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatCurrency(Number(invoice.totalAmount))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-sm font-medium mb-1">Ghi chú</p>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

function CreateInvoiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [contractId, setContractId] = useState('none')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [notes, setNotes] = useState('')

  const { data: contractsData } = useContracts({ status: 'active', limit: 100 })
  const contracts = contractsData?.items ?? []

  const { mutate: create, isPending } = useCreateInvoice()

  const currentYear = new Date().getFullYear()
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0')
  const years = [String(currentYear - 1), String(currentYear)]
  const maxMonth = year === String(currentYear) ? currentMonthStr : '12'
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `Tháng ${i + 1}`,
  }))

  function handleYearChange(y: string) {
    setYear(y)
    if (y === String(currentYear) && month > currentMonthStr) {
      setMonth(currentMonthStr)
    }
  }

  function handleSubmit() {
    if (!contractId || contractId === 'none') {
      toast.error('Vui lòng chọn hợp đồng')
      return
    }
    create(
      { contractId, period: `${year}-${month}`, notes: notes || undefined },
      {
        onSuccess: () => {
          toast.success('Tạo hóa đơn thành công')
          onClose()
          setContractId('none')
          setNotes('')
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn</DialogTitle>
          <DialogDescription>Tạo hóa đơn thủ công cho một hợp đồng đang hoạt động</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hợp đồng *</label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn hợp đồng..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Chọn hợp đồng...</SelectItem>
                {contracts.map((c) => {
                  const room = (c as any).room
                  const property = room?.property
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      Phòng {room?.roomNumber ?? '?'} — {property?.name ?? '?'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Kỳ hóa đơn *</label>
            <div className="flex gap-2">
              <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months
                    .filter((m) => m.value <= maxMonth)
                    .map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ghi chú</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              placeholder="Tuỳ chọn"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
}) {
  const { mutate: cancel, isPending } = useCancelInvoice()

  function handleConfirm() {
    if (!invoice) return
    cancel(invoice.id, {
      onSuccess: () => {
        toast.success('Đã hủy hóa đơn')
        onClose()
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hủy hóa đơn</DialogTitle>
          <DialogDescription>
            Xác nhận hủy hóa đơn {invoice ? formatPeriod(invoice.period) : ''}? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Không</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Đang hủy...' : 'Hủy hóa đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [params, setParams] = useState<GetInvoicesParams>({ page: 1, limit: 20 })
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [cancelInvoice, setCancelInvoice] = useState<Invoice | null>(null)

  const { data, isLoading } = useInvoices(params)
  const { data: propertiesData } = useProperties({ limit: 100 })

  const invoices = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const properties = propertiesData?.items ?? []

  const currentYear = new Date().getFullYear()
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0')
  const years = [String(currentYear - 1), String(currentYear)]
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `Tháng ${i + 1}`,
  }))
  const maxMonthFilter = yearFilter === String(currentYear) ? currentMonthStr : '12'

  function handleYearFilterChange(y: string) {
    setYearFilter(y)
    if (y === String(currentYear) && monthFilter !== 'all' && monthFilter > currentMonthStr) {
      setMonthFilter('all')
    }
  }

  useEffect(() => {
    let period: string | undefined
    if (yearFilter !== 'all' && monthFilter !== 'all') {
      period = `${yearFilter}-${monthFilter}`
    }
    setParams((p) => ({
      ...p,
      page: 1,
      propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
      status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
      period,
    }))
  }, [propertyFilter, statusFilter, yearFilter, monthFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn"
        description="Quản lý hóa đơn hàng tháng"
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo hóa đơn
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-2">
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Nhà trọ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà trọ</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={handleYearFilterChange}>
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tháng</SelectItem>
                {months
                  .filter((m) => m.value <= maxMonthFilter)
                  .map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[80px]" />
              <col className="w-[160px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[110px]" />
              <col className="w-[56px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Kỳ</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Nhà trọ</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hạn thanh toán</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Chưa có hóa đơn nào
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const room = inv.contract?.room
                  const property = room?.property
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => setDetailId(inv.id)}
                    >
                      <TableCell className="font-medium">{formatPeriod(inv.period)}</TableCell>
                      <TableCell>Phòng {room?.roomNumber ?? '—'}</TableCell>
                      <TableCell className="truncate">{property?.name ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(inv.totalAmount))}
                      </TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                      <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setDetailId(inv.id)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setCancelInvoice(inv)}
                                >
                                  Hủy hóa đơn
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
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>{total} hóa đơn</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={params.page === 1}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                >
                  Trước
                </Button>
                <span className="px-3 py-1">{params.page}/{totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={params.page === totalPages}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <InvoiceDetailSheet
        invoiceId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
      <CancelDialog
        invoice={cancelInvoice}
        open={!!cancelInvoice}
        onClose={() => setCancelInvoice(null)}
      />
    </div>
  )
}
