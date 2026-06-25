"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Plus, FileText, X, CreditCard } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SortableHead } from "@/components/common/SortableHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SearchCombobox,
  type ComboboxOption,
} from "@/components/common/SearchCombobox";
import {
  useInvoices,
  useInvoice,
  useCancelInvoice,
} from "@/hooks/useInvoices";
import { useRecordPayment } from "@/hooks/usePayments";
import { paymentsApi } from "@/apis/payments.api";
import { invoicesApi } from "@/apis/invoices.api";
import { useProperties } from "@/hooks/useProperties";
import { useContracts } from "@/hooks/useContracts";
import { getErrorMessage } from "@/utils/error";
import { formatCurrency, formatDate, formatPeriod } from "@/utils/format";
import { INVOICE_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/enums";
import type {
  Invoice,
  InvoiceStatus,
  GetInvoicesParams,
} from "@/types/invoice.types";
import type { PaymentMethod } from "@/types/payment.types";

// ─── Status badge ─────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const colors: Record<InvoiceStatus, string> = {
    unpaid: "bg-amber-50 text-amber-700 ring-amber-200",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-gray-50 text-gray-500 ring-gray-200",
  };
  const dots: Record<InvoiceStatus, string> = {
    unpaid: "bg-amber-500",
    paid: "bg-emerald-500",
    cancelled: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {INVOICE_STATUS_LABEL[status]}
    </span>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function InvoiceDetailSheet({
  invoiceId,
  open,
  onClose,
}: {
  invoiceId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: invoice } = useInvoice(invoiceId ?? "");
  if (!invoice) return null;

  const contract = invoice.contract;
  const room = contract?.room;
  const property = room?.property;
  const owner = contract?.owner;
  const items = invoice.items ?? [];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>{invoice.invoiceNumber ?? "Chi tiết hóa đơn"}</SheetTitle>
          <SheetDescription>
            {formatPeriod(invoice.period)} · Phòng {room?.roomNumber} ·{" "}
            {property?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Trạng thái</p>
              <div className="mt-1">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
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
                  <p className="mt-1">{owner.phone ?? "—"}</p>
                </div>
              </>
            )}
            {contract?.startDate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Thời hạn hợp đồng</p>
                <p className="mt-1">
                  {formatDate(contract.startDate)} →{" "}
                  {formatDate(contract.endDate!)}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Tiền phòng/tháng</p>
              <p className="mt-1">
                {formatCurrency(Number(contract?.rentAmount ?? 0))}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ngày tạo</p>
              <p className="mt-1">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground">Ngày thanh toán</p>
                <p className="mt-1 font-medium text-emerald-600">
                  {formatDate(invoice.paidAt)}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Chi tiết khoản mục</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Khoản mục
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p>{item.description}</p>
                        {item.contractServiceId && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SL: {Number(item.quantity)} ×{" "}
                            {formatCurrency(Number(item.unitPrice))}
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
  );
}

// ─── Create Sheet ─────────────────────────────────────────────────────────────

type ContractRowData = { id: string; contractId: string };

function CreateInvoiceSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [period, setPeriod] = useState("");
  const [contractRows, setContractRows] = useState<ContractRowData[]>([
    { id: "1", contractId: "" },
  ]);
  const [contractCaches, setContractCaches] = useState<Record<string, ComboboxOption>>({});
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw), 300);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const { data: contractsData, isFetching } = useContracts({
    status: "active",
    search: search || undefined,
    limit: 30,
  });

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonthNum = now.getMonth() + 1;
  const nowMonth = String(nowMonthNum).padStart(2, "0");
  const prevMonthNum = nowMonthNum === 1 ? 12 : nowMonthNum - 1;
  const prevYear = nowMonthNum === 1 ? nowYear - 1 : nowYear;
  const prevMonth = String(prevMonthNum).padStart(2, "0");
  const periodOptions = [
    { value: `${nowYear}-${nowMonth}`, label: `Tháng ${nowMonthNum}/${nowYear} (tháng này)` },
    { value: `${prevYear}-${prevMonth}`, label: `Tháng ${prevMonthNum}/${prevYear} (tháng trước)` },
  ];

  const usedContractIds = useMemo(
    () => new Set(contractRows.map((r) => r.contractId).filter(Boolean)),
    [contractRows],
  );

  const allContractOptions: ComboboxOption[] = useMemo(() => {
    const opts: ComboboxOption[] = (contractsData?.items ?? []).map((c) => {
      const room = c.room;
      const property = room?.property;
      const roomType = room?.roomType === "shared" ? "Phòng ghép" : "Nguyên căn";
      const dates = `${formatDate(c.startDate)} → ${formatDate(c.endDate)}`;
      return {
        value: c.id,
        label: `${c.contractNumber} · P${room?.roomNumber ?? "?"} · ${property?.name ?? "?"}`,
        sublabel: `${roomType} · ${dates}`,
      };
    });
    Object.values(contractCaches).forEach((cached) => {
      if (!opts.find((o) => o.value === cached.value)) opts.unshift(cached);
    });
    return opts;
  }, [contractsData, contractCaches]);

  function getRowOptions(rowContractId: string) {
    return allContractOptions.filter(
      (o) => o.value === rowContractId || !usedContractIds.has(o.value),
    );
  }

  function handleSelectContract(rowId: string, contractId: string) {
    const opt = allContractOptions.find((o) => o.value === contractId);
    if (opt) setContractCaches((prev) => ({ ...prev, [contractId]: opt }));
    setContractRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, contractId } : r)),
    );
  }

  function handleClose() {
    setPeriod("");
    setContractRows([{ id: "1", contractId: "" }]);
    setContractCaches({});
    setSearchRaw("");
    setSearch("");
    onClose();
  }

  async function handleSubmit() {
    if (!period) { toast.error("Vui lòng chọn kỳ hóa đơn"); return; }
    const validRows = contractRows.filter((r) => r.contractId);
    if (validRows.length === 0) { toast.error("Vui lòng chọn ít nhất 1 hợp đồng"); return; }

    setSubmitting(true);
    const results = await Promise.allSettled(
      validRows.map((row) => invoicesApi.create({ contractId: row.contractId, period })),
    );
    setSubmitting(false);
    qc.invalidateQueries({ queryKey: ["invoices"] });

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.filter((r) => r.status === "rejected");

    if (fail.length === 0) {
      toast.success(ok === 1 ? "Tạo hóa đơn thành công" : `Đã tạo ${ok} hóa đơn thành công`);
      handleClose();
    } else if (ok > 0) {
      toast.info(`Đã tạo ${ok}/${validRows.length} hóa đơn. ${fail.length} hóa đơn gặp lỗi.`);
      setContractRows(validRows.filter((_, i) => results[i]?.status === "rejected"));
    } else {
      toast.error(getErrorMessage((fail[0] as PromiseRejectedResult).reason));
    }
  }

  const validCount = contractRows.filter((r) => r.contractId).length;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>Tạo hóa đơn</SheetTitle>
          <SheetDescription>Tạo hóa đơn cho nhiều hợp đồng trong cùng kỳ</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Kỳ hóa đơn <span className="text-destructive">*</span>
            </label>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Hợp đồng <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setContractRows((r) => [...r, { id: String(Date.now()), contractId: "" }])
                }
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                Thêm hợp đồng
              </button>
            </div>
            <div className="space-y-2">
              {contractRows.map((row) => (
                <div key={row.id} className="flex gap-2">
                  <div className="flex-1">
                    <SearchCombobox
                      value={row.contractId}
                      onChange={(id) => handleSelectContract(row.id, id)}
                      options={getRowOptions(row.contractId)}
                      placeholder="Chọn hợp đồng..."
                      searchPlaceholder="Tìm theo mã HĐ, số phòng..."
                      onSearch={setSearchRaw}
                      loading={isFetching}
                      hasMore={(contractsData?.total ?? 0) > (contractsData?.items.length ?? 0)}
                    />
                  </div>
                  {contractRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setContractRows((prev) => prev.filter((r) => r.id !== row.id))
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
          <Button variant="outline" onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? "Đang tạo..."
              : validCount > 1
              ? `Tạo ${validCount} hóa đơn`
              : "Tạo hóa đơn"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: cancel, isPending } = useCancelInvoice();

  function handleConfirm() {
    if (!invoice) return;
    cancel(invoice.id, {
      onSuccess: () => {
        toast.success("Đã hủy hóa đơn");
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hủy hóa đơn</DialogTitle>
          <DialogDescription>
            Xác nhận hủy hóa đơn {invoice ? formatPeriod(invoice.period) : ""}?
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Không
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Đang hủy..." : "Hủy hóa đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quick Payment Sheet ──────────────────────────────────────────────────────

function QuickPaymentSheet({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: record, isPending } = useRecordPayment();

  const [paidAmount, setPaidAmount] = useState(0);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!invoice) return;

    paymentsApi
      .getAll({ invoiceId: invoice.id, limit: 100 })
      .then((res) => {
        const paid = res.items.reduce((sum, p) => sum + Number(p.amount), 0);
        setPaidAmount(paid);
        setAmount(String(Math.max(0, Number(invoice.totalAmount) - paid)));
      })
      .catch(() => {
        setPaidAmount(0);
        setAmount(String(invoice.totalAmount));
      });
  }, [invoice]);

  function handleClose() {
    setPaidAmount(0);
    setAmount("");
    setPaymentMethod("cash");
    setNotes("");
    onClose();
  }

  function handleSubmit() {
    if (!invoice) return;
    const amountNum = parseInt(amount, 10);
    if (!amountNum || amountNum <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    record(
      {
        invoiceId: invoice.id,
        amount: amountNum,
        paymentMethod,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Ghi nhận thanh toán thành công");
          handleClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  }

  if (!invoice) return null;

  const total = Number(invoice.totalAmount);
  const remaining = Math.max(0, total - paidAmount);
  const amountNum = parseInt(amount, 10) || 0;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>Ghi nhận thanh toán</SheetTitle>
          <SheetDescription>
            {invoice.invoiceNumber ?? formatPeriod(invoice.period)} ·{" "}
            {formatCurrency(total)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Tóm tắt hóa đơn */}
          <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng hóa đơn</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đã thanh toán</span>
                <span className="text-emerald-600 font-medium">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Còn lại</span>
              <span className="font-semibold text-primary">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Số tiền (đ) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền..."
            />
            {amountNum > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(amountNum)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Phương thức <span className="text-destructive">*</span>
            </label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["cash", "transfer", "other"] as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ghi chú</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm (không bắt buộc)..."
              maxLength={500}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Ghi nhận"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [params, setParams] = useState<GetInvoicesParams>({
    page: 1,
    limit: 20,
  });
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");

  const handleSort = (field: string, direction: "ASC" | "DESC" | undefined) => {
    setParams((p) => ({ ...p, page: 1, orderBy: direction ? field : undefined, orderDirection: direction }));
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelInvoice, setCancelInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const invoiceId = searchParams.get("invoiceId");
    if (invoiceId) setDetailId(invoiceId);
  }, [searchParams]);

  const { data, isLoading } = useInvoices(params);
  const { data: propertiesData } = useProperties({ limit: 100 });

  const invoices = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const properties = propertiesData?.items ?? [];

  const currentYear = new Date().getFullYear();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, "0");
  const years = [
    String(currentYear - 2),
    String(currentYear - 1),
    String(currentYear),
  ];
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: `Tháng ${i + 1}`,
  }));

  function handleYearFilterChange(y: string) {
    setYearFilter(y);
    setMonthFilter("");
  }

  useEffect(() => {
    let period: string | undefined;
    if (yearFilter !== "all" && monthFilter !== "") {
      period = `${yearFilter}-${monthFilter}`;
    }
    setParams((p) => ({
      ...p,
      page: 1,
      propertyId: propertyFilter !== "all" ? propertyFilter : undefined,
      status:
        statusFilter !== "all" ? (statusFilter as InvoiceStatus) : undefined,
      period,
    }));
  }, [propertyFilter, statusFilter, yearFilter, monthFilter]);

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
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Nhà trọ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà trọ</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
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
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={monthFilter}
              onValueChange={setMonthFilter}
              disabled={yearFilter === "all"}
            >
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    disabled={
                      yearFilter === String(currentYear) &&
                      m.value > currentMonthStr
                    }
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

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[16%]" />
              <col className="w-[7%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <SortableHead label="Mã HĐ / Kỳ" field="period" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead>Phòng</TableHead>
                <TableHead>Nhà trọ</TableHead>
                <SortableHead label="Tổng tiền" field="totalAmount" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead>Trạng thái</TableHead>
                <SortableHead label="Hạn thanh toán" field="dueDate" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Chưa có hóa đơn nào
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const room = inv.contract?.room;
                  const property = room?.property;
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => setDetailId(inv.id)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          {inv.invoiceNumber && (
                            <p className="font-medium text-sm leading-none">
                              {inv.invoiceNumber}
                            </p>
                          )}
                          <p
                            className={`text-xs leading-none ${inv.invoiceNumber ? "text-muted-foreground" : "font-medium"}`}
                          >
                            {formatPeriod(inv.period)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>Phòng {room?.roomNumber ?? "—"}</TableCell>
                      <TableCell className="truncate">
                        {property?.name ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(inv.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setDetailId(inv.id)}
                            >
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {inv.status === "unpaid" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setPaymentInvoice(inv)}
                                >
                                  <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                                  Ghi nhận thanh toán
                                </DropdownMenuItem>
                              </>
                            )}
                            {inv.status !== "paid" &&
                              inv.status !== "cancelled" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
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
                  );
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
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                  }
                >
                  Trước
                </Button>
                <span className="px-3 py-1">
                  {params.page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={params.page === totalPages}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
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
      <QuickPaymentSheet
        invoice={paymentInvoice}
        open={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
      />
    </div>
  );
}
