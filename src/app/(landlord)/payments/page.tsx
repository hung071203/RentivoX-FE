"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus, CreditCard, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { usePayments, useRecordPayment } from "@/hooks/usePayments";
import { paymentsApi } from "@/apis/payments.api";
import { invoicesApi } from "@/apis/invoices.api";
import { useProperties } from "@/hooks/useProperties";
import { useInvoices } from "@/hooks/useInvoices";
import { getErrorMessage } from "@/utils/error";
import { formatCurrency, formatDate, formatPeriod } from "@/utils/format";
import { PAYMENT_METHOD_LABEL } from "@/constants/enums";
import type {
  Payment,
  GetPaymentsParams,
  PaymentMethod,
  PaymentSource,
} from "@/types/payment.types";

// ─── Badges ───────────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: PaymentMethod }) {
  const colors: Record<PaymentMethod, string> = {
    cash: "bg-sky-50 text-sky-700 ring-sky-200",
    transfer: "bg-violet-50 text-violet-700 ring-violet-200",
    other: "bg-gray-50 text-gray-500 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[method]}`}
    >
      <CreditCard className="h-3 w-3" />
      {PAYMENT_METHOD_LABEL[method]}
    </span>
  );
}

function SourceLabel({ source }: { source: PaymentSource }) {
  const colors: Record<PaymentSource, string> = {
    manual: "bg-amber-50 text-amber-700 ring-amber-200",
    automatic: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[source]}`}
    >
      {source === "manual" ? "Thủ công" : "Tự động"}
    </span>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function PaymentDetailSheet({
  payment,
  open,
  onClose,
}: {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!payment) return null;

  const inv = payment.invoice;
  const contract = inv?.contract;
  const room = contract?.room;
  const property = room?.property;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="font-mono text-base">
            {payment.referenceCode ?? "Chi tiết thanh toán"}
          </SheetTitle>
          <SheetDescription>
            {formatDate(payment.paymentDate)} ·{" "}
            {PAYMENT_METHOD_LABEL[payment.paymentMethod]}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Số tiền nổi bật */}
          <div className="rounded-lg border bg-primary/5 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Số tiền thanh toán
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(Number(payment.amount))}
            </p>
          </div>

          {/* Thông tin thanh toán */}
          <div className="space-y-4 text-sm">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Thông tin thanh toán
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-muted-foreground">Mã thanh toán</p>
                <p className="mt-0.5 font-mono font-medium text-xs break-all">
                  {payment.referenceCode ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày thanh toán</p>
                <p className="mt-0.5 font-medium">
                  {formatDate(payment.paymentDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phương thức</p>
                <div className="mt-0.5">
                  <MethodBadge method={payment.paymentMethod} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Nguồn ghi nhận</p>
                <p className="mt-0.5">
                  <SourceLabel source={payment.source} />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Người ghi nhận</p>
                <p className="mt-0.5 font-medium">
                  {payment.recordedBy?.fullName ?? "—"}
                </p>
              </div>
              {payment.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Ghi chú</p>
                  <p className="mt-0.5">{payment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin hóa đơn */}
          <div className="space-y-4 text-sm">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Hóa đơn liên quan
            </p>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium font-mono text-xs">
                    {inv?.invoiceNumber ?? "—"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {inv?.period ? formatPeriod(inv.period) : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 shrink-0 ${
                    inv?.status === "paid"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : inv?.status === "cancelled"
                        ? "bg-gray-50 text-gray-500 ring-gray-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                  }`}
                >
                  {inv?.status === "paid"
                    ? "Đã thanh toán"
                    : inv?.status === "cancelled"
                      ? "Đã hủy"
                      : "Chưa thanh toán"}
                </span>
              </div>
              <div className="border-t pt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tổng hóa đơn</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(Number(inv?.totalAmount ?? 0))}
                  </span>
                </div>
                {contract?.contractNumber && (
                  <div className="flex justify-between">
                    <span>Hợp đồng</span>
                    <span className="font-mono">{contract.contractNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phòng</span>
                  <span>
                    {room ? `Phòng ${room.roomNumber}` : "—"}
                    {property ? ` · ${property.name}` : ""}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => router.push(`/invoices?invoiceId=${inv?.id}`)}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Xem hóa đơn
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Record Payment Sheet ─────────────────────────────────────────────────────

function RecordPaymentSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { mutate: record, isPending } = useRecordPayment();

  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceCache, setInvoiceCache] = useState<ComboboxOption | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    totalAmount: number;
  } | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");

  const { data: invoicesData, isFetching: invoicesFetching } = useInvoices({
    status: "unpaid",
    limit: 100,
  });

  const invoiceOptions: ComboboxOption[] = useMemo(() => {
    const opts: ComboboxOption[] = (invoicesData?.items ?? []).map((inv) => {
      const room = inv.contract?.room;
      const property = room?.property;
      return {
        value: inv.id,
        label: inv.invoiceNumber
          ? `${inv.invoiceNumber} · ${formatPeriod(inv.period)}`
          : `${formatPeriod(inv.period)} · P${room?.roomNumber ?? "?"}`,
        sublabel: `P${room?.roomNumber ?? "?"} · ${property?.name ?? "?"} · ${formatCurrency(Number(inv.totalAmount))}`,
      };
    });
    if (invoiceCache && !opts.find((o) => o.value === invoiceCache.value)) {
      opts.unshift(invoiceCache);
    }
    return opts;
  }, [invoicesData, invoiceCache]);

  async function handleSelectInvoice(id: string) {
    setInvoiceId(id);
    const opt = invoiceOptions.find((o) => o.value === id);
    if (opt) setInvoiceCache(opt);

    if (!id) {
      setSelectedInvoice(null);
      setPaidAmount(0);
      setAmount("");
      return;
    }

    try {
      const [inv, existingPayments] = await Promise.all([
        invoicesApi.getById(id),
        paymentsApi.getAll({ invoiceId: id, limit: 100 }),
      ]);
      const paid = existingPayments.items.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remaining = Number(inv.totalAmount) - paid;
      setSelectedInvoice({ totalAmount: Number(inv.totalAmount) });
      setPaidAmount(paid);
      setAmount(String(remaining));
    } catch {
      toast.error("Không thể tải thông tin hóa đơn");
    }
  }

  function handleClose() {
    setInvoiceId("");
    setInvoiceCache(null);
    setSelectedInvoice(null);
    setPaidAmount(0);
    setAmount("");
    setPaymentMethod("cash");
    setNotes("");
    onClose();
  }

  function handleSubmit() {
    if (!invoiceId) {
      toast.error("Vui lòng chọn hóa đơn");
      return;
    }
    const amountNum = parseInt(amount, 10);
    if (!amountNum || amountNum <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    record(
      {
        invoiceId,
        amount: amountNum,
        paymentMethod,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Ghi nhận thanh toán thành công");
          qc.invalidateQueries({ queryKey: ["invoices"] });
          handleClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  }

  const remaining =
    selectedInvoice !== null ? selectedInvoice.totalAmount - paidAmount : null;
  const amountNum = parseInt(amount, 10) || 0;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>Ghi nhận thanh toán</SheetTitle>
          <SheetDescription>
            Ghi nhận thanh toán cho hóa đơn chưa đóng
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Hóa đơn <span className="text-destructive">*</span>
            </label>
            <SearchCombobox
              value={invoiceId}
              onChange={handleSelectInvoice}
              options={invoiceOptions}
              placeholder="Chọn hóa đơn chưa thanh toán..."
              searchPlaceholder="Tìm mã HĐ, phòng, nhà trọ..."
              loading={invoicesFetching}
            />
          </div>

          {selectedInvoice && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng hóa đơn</span>
                <span className="font-medium">
                  {formatCurrency(selectedInvoice.totalAmount)}
                </span>
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
                  {formatCurrency(remaining ?? 0)}
                </span>
              </div>
            </div>
          )}

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
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
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

export default function PaymentsPage() {
  const [params, setParams] = useState<GetPaymentsParams>({
    page: 1,
    limit: 20,
  });
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [refCodeRaw, setRefCodeRaw] = useState("");
  const [refCode, setRefCode] = useState("");
  const handleSort = (field: string, direction: "ASC" | "DESC" | undefined) => {
    setParams((p) => ({ ...p, page: 1, orderBy: direction ? field : undefined, orderDirection: direction }));
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRefCode(refCodeRaw), 400);
    return () => clearTimeout(t);
  }, [refCodeRaw]);

  const { data, isLoading } = usePayments(params);
  const { data: propertiesData } = useProperties({ limit: 100 });

  const payments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const properties = propertiesData?.items ?? [];

  useEffect(() => {
    setParams((p) => ({
      ...p,
      page: 1,
      propertyId: propertyFilter !== "all" ? propertyFilter : undefined,
      paymentMethod:
        methodFilter !== "all" ? (methodFilter as PaymentMethod) : undefined,
      source:
        sourceFilter !== "all" ? (sourceFilter as PaymentSource) : undefined,
      referenceCode: refCode || undefined,
    }));
  }, [propertyFilter, methodFilter, sourceFilter, refCode]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thanh toán"
        description="Lịch sử ghi nhận thanh toán hóa đơn"
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Ghi nhận thanh toán
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
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phương thức</SelectItem>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Nguồn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nguồn</SelectItem>
                <SelectItem value="manual">Thủ công</SelectItem>
                <SelectItem value="automatic">Tự động</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="h-9 w-[200px]"
              placeholder="Tìm mã giao dịch..."
              value={refCodeRaw}
              onChange={(e) => setRefCodeRaw(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[190px]" />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[110px]" />
              <col className="w-[120px]" />
              <col className="w-[80px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Mã TT / Hóa đơn</TableHead>
                <TableHead>Phòng · Nhà trọ</TableHead>
                <SortableHead label="Số tiền" field="amount" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead>Phương thức</TableHead>
                <TableHead>Nguồn</TableHead>
                <SortableHead label="Ngày thanh toán" field="paymentDate" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
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
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Chưa có thanh toán nào
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => {
                  const inv = p.invoice;
                  const room = inv?.contract?.room;
                  const property = room?.property;
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => setDetailPayment(p)}
                    >
                      <TableCell className="pl-6 py-3">
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs font-medium leading-none truncate">
                            {p.referenceCode ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground leading-none truncate">
                            {inv?.invoiceNumber ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm leading-none">
                            Phòng {room?.roomNumber ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground leading-none truncate">
                            {property?.name ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(p.amount))}
                      </TableCell>
                      <TableCell>
                        <MethodBadge method={p.paymentMethod} />
                      </TableCell>
                      <TableCell>
                        <SourceLabel source={p.source} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(p.paymentDate)}
                      </TableCell>
                      <TableCell
                        className="pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                              onClick={() => setDetailPayment(p)}
                            >
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `/invoices?invoiceId=${inv?.id}`,
                                  "_self",
                                )
                              }
                            >
                              <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                              Xem hóa đơn
                            </DropdownMenuItem>
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
              <span>{total} giao dịch</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={(params.page ?? 1) === 1}
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
                  disabled={(params.page ?? 1) === totalPages}
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

      <RecordPaymentSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <PaymentDetailSheet
        payment={detailPayment}
        open={!!detailPayment}
        onClose={() => setDetailPayment(null)}
      />
    </div>
  );
}
