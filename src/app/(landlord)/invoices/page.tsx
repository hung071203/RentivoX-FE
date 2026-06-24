'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { SearchCombobox, type ComboboxOption } from '@/components/common/SearchCombobox'
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

  const contract = invoice.contract
  const room = contract?.room
  const property = room?.property
  const owner = contract?.owner
  const items = invoice.items ?? []

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>
            {invoice.invoiceNumber ?? 'Chi tiết hóa đơn'}
          </SheetTitle>
          <SheetDescription>
            {formatPeriod(invoice.period)} · Phòng {room?.roomNumber} · {property?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Trạng thái</p>
              <div className="mt-1"><InvoiceStatusBadge status={invoice.status} /></div>
            </div>
            <div>
              <p className="text-muted-foreground">Hạn thanh toán</p>
              <p className="mt-1 font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            {owner && (
              <>
                <div>
                  <p className="text-muted-foreground">Người đại diện</p>
                  <p className="mt-1 font-medium">{owner.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Số điện thoại</p>
                  <p className="mt-1">{owner.phone ?? '—'}</p>
                </div>
              </>
            )}
            {contract?.startDate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Thời hạn hợp đồng</p>
                <p className="mt-1">{formatDate(contract.startDate)} → {formatDate(contract.endDate!)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Tiền phòng/tháng</p>
              <p className="mt-1">{formatCurrency(Number(contract?.rentAmount ?? 0))}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ngày tạo</p>
              <p className="mt-1">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground">Ngày thanh toán</p>
                <p className="mt-1 font-medium text-emerald-600">{formatDate(invoice.paidAt)}</p>
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

// ─── Create Sheet ─────────────────────────────────────────────────────────────

function CreateInvoiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [contractId, setContractId] = useState('')
  const [period, setPeriod] = useState('')
  const [notes, setNotes] = useState('')
  const [searchRaw, setSearchRaw] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCache, setSelectedCache] = useState<ComboboxOption | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw), 300)
    return () => clearTimeout(t)
  }, [searchRaw])

  const { data: contractsData, isFetching } = useContracts({
    status: 'active',
    search: search || undefined,
    limit: 30,
  })

  const { mutate: create, isPending } = useCreateInvoice()

  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonthNum = now.getMonth() + 1
  const nowMonth = String(nowMonthNum).padStart(2, '0')
  const prevMonthNum = nowMonthNum === 1 ? 12 : nowMonthNum - 1
  const prevYear = nowMonthNum === 1 ? nowYear - 1 : nowYear
  const prevMonth = String(prevMonthNum).padStart(2, '0')
  const periodOptions = [
    { value: `${nowYear}-${nowMonth}`, label: `Tháng ${nowMonthNum}/${nowYear} (tháng này)` },
    { value: `${prevYear}-${prevMonth}`, label: `Tháng ${prevMonthNum}/${prevYear} (tháng trước)` },
  ]

  const contractOptions: ComboboxOption[] = useMemo(() => {
    const opts: ComboboxOption[] = (contractsData?.items ?? []).map((c) => {
      const room = c.room
      const property = room?.property
      const roomType = room?.roomType === 'shared' ? 'Phòng ghép' : 'Nguyên căn'
      const dates = `${formatDate(c.startDate)} → ${formatDate(c.endDate)}`
      return {
        value: c.id,
        label: `Phòng ${room?.roomNumber ?? '?'} — ${property?.name ?? '?'}`,
        sublabel: `${roomType} · ${dates} · ${formatCurrency(Number(c.rentAmount))}/tháng`,
      }
    })
    if (selectedCache && !opts.find((o) => o.value === selectedCache.value)) {
      opts.unshift(selectedCache)
    }
    return opts
  }, [contractsData, selectedCache])

  function handleSelectContract(id: string) {
    const opt = contractOptions.find((o) => o.value === id)
    if (opt) setSelectedCache(opt)
    setContractId(id)
  }

  function handleClose() {
    setContractId('')
    setPeriod('')
    setNotes('')
    setSearchRaw('')
    setSearch('')
    setSelectedCache(null)
    onClose()
  }

  function handleSubmit() {
    if (!contractId) {
      toast.error('Vui lòng chọn hợp đồng')
      return
    }
    if (!period) {
      toast.error('Vui lòng chọn kỳ hóa đơn')
      return
    }
    create(
      { contractId, period, notes: notes || undefined },
      {
        onSuccess: () => {
          toast.success('Tạo hóa đơn thành công')
          handleClose()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>Tạo hóa đơn</SheetTitle>
          <SheetDescription>Tạo hóa đơn thủ công cho một hợp đồng đang hoạt động</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hợp đồng <span className="text-destructive">*</span></label>
            <SearchCombobox
              value={contractId}
              onChange={handleSelectContract}
              options={contractOptions}
              placeholder="Chọn hợp đồng..."
              searchPlaceholder="Tìm theo số phòng"
              onSearch={setSearchRaw}
              loading={isFetching}
              hasMore={(contractsData?.total ?? 0) > (contractsData?.items.length ?? 0)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Kỳ hóa đơn <span className="text-destructive">*</span></label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn kỳ..." />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ghi chú</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={3}
              placeholder="Tuỳ chọn"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
  const [monthFilter, setMonthFilter] = useState('')

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
  const years = [String(currentYear - 2), String(currentYear - 1), String(currentYear)]
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `Tháng ${i + 1}`,
  }))

  function handleYearFilterChange(y: string) {
    setYearFilter(y)
    setMonthFilter('')
  }

  useEffect(() => {
    let period: string | undefined
    if (yearFilter !== 'all' && monthFilter !== '') {
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

            <Select
              value={monthFilter}
              onValueChange={setMonthFilter}
              disabled={yearFilter === 'all'}
            >
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    disabled={yearFilter === String(currentYear) && m.value > currentMonthStr}
                  >
                    {m.label}
                  </SelectItem>
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
              <col className="w-[150px]" />
              <col className="w-[80px]" />
              <col className="w-[150px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-[110px]" />
              <col className="w-[56px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ / Kỳ</TableHead>
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
                      <TableCell>
                        <div className="space-y-1">
                          {inv.invoiceNumber && (
                            <p className="font-medium text-sm leading-none">{inv.invoiceNumber}</p>
                          )}
                          <p className={`text-xs leading-none ${inv.invoiceNumber ? 'text-muted-foreground' : 'font-medium'}`}>
                            {formatPeriod(inv.period)}
                          </p>
                        </div>
                      </TableCell>
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

      <CreateInvoiceSheet open={createOpen} onClose={() => setCreateOpen(false)} />
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
