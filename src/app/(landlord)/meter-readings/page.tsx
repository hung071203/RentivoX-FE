"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Gauge,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import { SearchCombobox, type ComboboxOption } from "@/components/common/SearchCombobox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMeterReadings, useCreateMeterReading, useUpdateMeterReading, useDeleteMeterReading } from "@/hooks/useMeterReadings";
import { useRooms, useRoom } from "@/hooks/useRooms";
import { useServices } from "@/hooks/useServices";
import { useProperties } from "@/hooks/useProperties";
import { meterReadingsApi } from "@/apis/meter-readings.api";
import { formatCurrency, formatPeriod } from "@/utils/format";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { MeterReading, GetMeterReadingsParams } from "@/types/meter-reading.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceRowData = {
  id: string;
  serviceId: string;
  valueStart: string;
  valueEnd: string;
  err?: string;
};

const editSchema = z
  .object({
    valueStart: z.number().min(0, "Chỉ số không được âm"),
    valueEnd: z.number().min(0, "Chỉ số không được âm"),
  })
  .refine((d) => d.valueEnd >= d.valueStart, {
    message: "Chỉ số cuối không được nhỏ hơn chỉ số đầu",
    path: ["valueEnd"],
  });

type EditForm = z.infer<typeof editSchema>;

// ─── Pagination ───────────────────────────────────────────────────────────────

type PaginationItem = { type: "page"; value: number } | { type: "ellipsis"; key: string };
function buildPagination(current: number, total: number): PaginationItem[] {
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 1,
  );
  const items: PaginationItem[] = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && pages[idx - 1] !== p - 1)
      items.push({ type: "ellipsis", key: `e-${p}` });
    items.push({ type: "page", value: p });
  });
  return items;
}

// ─── Period options (tháng hiện tại + tháng trước) ───────────────────────────

const NOW_YEAR = new Date().getFullYear();
const NOW_MONTH_NUM = new Date().getMonth() + 1;
const PREV_MONTH_NUM = NOW_MONTH_NUM === 1 ? 12 : NOW_MONTH_NUM - 1;
const PREV_YEAR = NOW_MONTH_NUM === 1 ? NOW_YEAR - 1 : NOW_YEAR;
const NOW_MONTH = String(NOW_MONTH_NUM).padStart(2, "0");
const PREV_MONTH = String(PREV_MONTH_NUM).padStart(2, "0");

const PERIOD_OPTIONS = [
  { value: `${NOW_YEAR}-${NOW_MONTH}`, label: `Tháng ${NOW_MONTH_NUM}/${NOW_YEAR} (tháng này)` },
  { value: `${PREV_YEAR}-${PREV_MONTH}`, label: `Tháng ${PREV_MONTH_NUM}/${PREV_YEAR} (tháng trước)` },
];

// ─── Filter months (dùng cho bộ lọc danh sách) ───────────────────────────────

const MONTHS = [
  { value: "01", label: "Tháng 1" },
  { value: "02", label: "Tháng 2" },
  { value: "03", label: "Tháng 3" },
  { value: "04", label: "Tháng 4" },
  { value: "05", label: "Tháng 5" },
  { value: "06", label: "Tháng 6" },
  { value: "07", label: "Tháng 7" },
  { value: "08", label: "Tháng 8" },
  { value: "09", label: "Tháng 9" },
  { value: "10", label: "Tháng 10" },
  { value: "11", label: "Tháng 11" },
  { value: "12", label: "Tháng 12" },
];
const YEARS = [NOW_YEAR - 2, NOW_YEAR - 1, NOW_YEAR].map(String);

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── ServiceRow ───────────────────────────────────────────────────────────────

function ServiceRow({
  roomId,
  period,
  services,
  usedServiceIds,
  row,
  onChange,
  onRemove,
  canRemove,
}: {
  roomId: string;
  period: string;
  services: { id: string; name: string; unit?: string | null }[];
  usedServiceIds: Set<string>;
  row: ServiceRowData;
  onChange: (updates: Partial<ServiceRowData>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const prevPeriod = useMemo(() => {
    if (!period) return null;
    const [y, m] = period.split("-").map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    return `${py}-${String(pm).padStart(2, "0")}-01`;
  }, [period]);

  const { data: prevData } = useQuery({
    queryKey: ["mr-prev", roomId, row.serviceId, prevPeriod],
    queryFn: () =>
      meterReadingsApi.getAll({ roomId, serviceId: row.serviceId, period: prevPeriod!, limit: 1 }),
    enabled: !!roomId && !!row.serviceId && !!prevPeriod,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (prevData === undefined) return;
    const prev = prevData.items[0];
    onChangeRef.current({ valueStart: prev ? String(Number(prev.valueEnd)) : "0" });
  }, [prevData]);

  const available = services.filter((s) => s.id === row.serviceId || !usedServiceIds.has(s.id));

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-background">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <Select
            value={row.serviceId}
            onValueChange={(v) => onChange({ serviceId: v, valueStart: "0", valueEnd: "0", err: undefined })}
          >
            <SelectTrigger className={row.err && !row.serviceId ? "border-destructive" : ""}>
              <SelectValue
                placeholder={available.length === 0 ? "Đã chọn hết dịch vụ" : "Chọn dịch vụ"}
              />
            </SelectTrigger>
            <SelectContent>
              {available.map((svc) => (
                <SelectItem key={svc.id} value={svc.id}>
                  {svc.name}{svc.unit ? ` (${svc.unit})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Chỉ số đầu kỳ</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={row.valueStart}
            onChange={(e) => onChange({ valueStart: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Chỉ số cuối kỳ</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={row.valueEnd}
            onChange={(e) => onChange({ valueEnd: e.target.value, err: undefined })}
            className={row.err && row.serviceId ? "border-destructive" : ""}
          />
        </div>
      </div>
      {row.err && <p className="text-xs text-destructive">{row.err}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeterReadingsPage() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;

  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [params, setParams] = useState<GetMeterReadingsParams>({
    page: 1,
    limit: 20,
    propertyId: initialPropertyId,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editReading, setEditReading] = useState<MeterReading | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Room search state for create form
  const [roomSearchRaw, setRoomSearchRaw] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedRoomCache, setSelectedRoomCache] = useState<ComboboxOption | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRoomSearch(roomSearchRaw), 300);
    return () => clearTimeout(t);
  }, [roomSearchRaw]);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = useMeterReadings(params);
  const { data: propertiesData } = useProperties({ limit: 100 });
  const { data: roomsData, isFetching: roomsFetching } = useRooms({
    search: roomSearch || undefined,
    status: "occupied",
    limit: 20,
  });

  const updateMR = useUpdateMeterReading();
  const deleteMR = useDeleteMeterReading();

  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;
  const limit = params.limit ?? 20;
  const properties = propertiesData?.items ?? [];

  // ── Create form state ────────────────────────────────────────────────────
  const qc = useQueryClient();
  const [cRoomId, setCRoomId] = useState("");
  const [cPeriod, setCPeriod] = useState("");
  const [cRows, setCRows] = useState<ServiceRowData[]>([
    { id: "1", serviceId: "", valueStart: "0", valueEnd: "0" },
  ]);
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cRoomErr, setCRoomErr] = useState("");
  const [cPeriodErr, setCPeriodErr] = useState("");

  const { data: selectedRoomData } = useRoom(cRoomId);

  const { data: meteredServicesData, isFetching: meteredServicesFetching } = useServices({
    roomId: cRoomId || undefined,
    type: "metered",
    isActive: true,
    limit: 100,
  });
  const meteredServices = cRoomId ? (meteredServicesData?.items ?? []) : [];

  const usedServiceIds = useMemo(
    () => new Set(cRows.map((r) => r.serviceId).filter(Boolean)),
    [cRows],
  );

  // ── Edit form ─────────────────────────────────────────────────────────────
  const {
    register: regE,
    handleSubmit: submitE,
    reset: resetE,
    formState: { errors: errE },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { valueStart: 0, valueEnd: 0 },
  });

  // ── Room options ──────────────────────────────────────────────────────────
  const roomOptions: ComboboxOption[] = useMemo(() => {
    const opts: ComboboxOption[] = (roomsData?.items ?? []).map((r) => ({
      value: r.id,
      label: `Phòng ${r.roomNumber}`,
      sublabel: `${r.property?.name ?? ""} · ${r.roomType === "shared" ? "Phòng ghép" : "Nguyên căn"}`,
    }));
    if (selectedRoomCache && !opts.find((o) => o.value === selectedRoomCache.value)) {
      opts.unshift(selectedRoomCache);
    }
    return opts;
  }, [roomsData, selectedRoomCache]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleFilterYearChange(y: string) {
    setFilterYear(y);
    setFilterMonth("");
    setParams((p) => ({ ...p, page: 1, period: undefined }));
  }

  function handleFilterMonthChange(m: string) {
    setFilterMonth(m);
    if (filterYear !== "all" && m !== "") {
      setParams((p) => ({ ...p, page: 1, period: `${filterYear}-${m}-01` }));
    } else {
      setParams((p) => ({ ...p, page: 1, period: undefined }));
    }
  }

  function handleRoomSelect(roomId: string) {
    const option = roomOptions.find((o) => o.value === roomId);
    if (option) setSelectedRoomCache(option);
    setCRoomId(roomId);
    setCRoomErr("");
    setCRows([{ id: "1", serviceId: "", valueStart: "0", valueEnd: "0" }]);
  }

  function openEdit(reading: MeterReading) {
    setEditReading(reading);
    resetE({ valueStart: reading.valueStart, valueEnd: reading.valueEnd });
  }

  function openCreate() {
    setCRoomId("");
    setCPeriod("");
    setCRows([{ id: "1", serviceId: "", valueStart: "0", valueEnd: "0" }]);
    setCRoomErr("");
    setCPeriodErr("");
    setSelectedRoomCache(null);
    setRoomSearchRaw("");
    setRoomSearch("");
    setCreateOpen(true);
  }

  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!cRoomId) { setCRoomErr("Vui lòng chọn phòng"); valid = false; }
    if (!cPeriod) { setCPeriodErr("Vui lòng chọn kỳ"); valid = false; }

    const validated = cRows.map((row) => {
      if (!row.serviceId) return { ...row, err: "Vui lòng chọn dịch vụ" };
      if (Number(row.valueEnd) < Number(row.valueStart))
        return { ...row, err: "Chỉ số cuối không được nhỏ hơn đầu kỳ" };
      return { ...row, err: undefined };
    });
    setCRows(validated);
    if (!valid || validated.some((r) => r.err)) return;

    setCSubmitting(true);
    const results = await Promise.allSettled(
      cRows.map((row) =>
        meterReadingsApi.create({
          roomId: cRoomId,
          serviceId: row.serviceId,
          period: `${cPeriod}-01`,
          valueStart: Number(row.valueStart),
          valueEnd: Number(row.valueEnd),
        }),
      ),
    );
    setCSubmitting(false);
    qc.invalidateQueries({ queryKey: ["meter-readings"] });

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.filter((r) => r.status === "rejected");

    if (fail.length === 0) {
      toast.success(ok === 1 ? "Ghi chỉ số thành công" : `Đã ghi ${ok} chỉ số thành công`);
      setCreateOpen(false);
    } else if (ok > 0) {
      toast.info(`Đã ghi ${ok}/${cRows.length} chỉ số. ${fail.length} chỉ số gặp lỗi.`);
      setCRows((prev) => prev.filter((_, i) => results[i]?.status === "rejected"));
    } else {
      toast.error(getErrorMessage((fail[0] as PromiseRejectedResult).reason));
    }
  }

  function onEditSubmit(formData: EditForm) {
    if (!editReading) return;
    updateMR.mutate(
      { id: editReading.id, payload: { valueStart: formData.valueStart, valueEnd: formData.valueEnd } },
      { onSuccess: () => setEditReading(null) },
    );
  }

  function onDelete() {
    if (!deleteId) return;
    deleteMR.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Chỉ số dịch vụ" description="Ghi chỉ số dịch vụ đo đếm hàng tháng" />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ghi chỉ số
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={params.propertyId ?? "all"}
              onValueChange={(v) =>
                setParams((p) => ({ ...p, page: 1, propertyId: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Tất cả nhà trọ" />
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

            <div className="flex items-center gap-2">
              <Select value={filterYear} onValueChange={handleFilterYearChange}>
                <SelectTrigger className="h-9 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterMonth}
                onValueChange={handleFilterMonthChange}
                disabled={filterYear === "all"}
              >
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem
                      key={m.value}
                      value={m.value}
                      disabled={filterYear === String(NOW_YEAR) && m.value > NOW_MONTH}
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Phòng</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Chỉ số đầu</TableHead>
                <TableHead>Chỉ số cuối</TableHead>
                <TableHead>Tiêu thụ</TableHead>
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    {params.propertyId || params.period
                      ? "Không tìm thấy bản ghi nào phù hợp"
                      : "Chưa có bản ghi chỉ số nào. Hãy ghi chỉ số đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((mr) => {
                const unit = mr.service?.unit ?? "đơn vị";
                const isShared = mr.room?.roomType === "shared";
                return (
                  <TableRow key={mr.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">
                              Phòng {mr.room?.roomNumber ?? "?"}
                            </p>
                            {isShared && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200 shrink-0">
                                Ghép
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {mr.room?.property?.name ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium truncate">
                      {mr.service?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatPeriod(mr.period)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {Number(mr.valueStart).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {Number(mr.valueEnd).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums font-medium">
                      {mr.consumption.toLocaleString("vi-VN")} {unit}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(mr)}>
                            <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(mr.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalCount)} /{" "}
                {totalCount} bản ghi
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {buildPagination(currentPage, totalPages).map((item) =>
                  item.type === "ellipsis" ? (
                    <span key={item.key} className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item.value}
                      variant={item.value === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setParams((p) => ({ ...p, page: item.value }))}
                    >
                      {item.value}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Sheet ─────────────────────────────────────────────────────── */}
      <Sheet open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-x-hidden">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Ghi chỉ số</SheetTitle>
            <SheetDescription>Nhập chỉ số dịch vụ đo đếm theo phòng và kỳ</SheetDescription>
          </SheetHeader>
          <form onSubmit={onCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

              <div className="space-y-4">
                <FormField label="Phòng" error={cRoomErr} required>
                  <SearchCombobox
                    value={cRoomId}
                    onChange={handleRoomSelect}
                    options={roomOptions}
                    placeholder="Chọn phòng..."
                    searchPlaceholder="Tìm theo số phòng..."
                    onSearch={setRoomSearchRaw}
                    loading={roomsFetching}
                    hasMore={(roomsData?.total ?? 0) > (roomsData?.items.length ?? 0)}
                  />
                  {selectedRoomData?.roomType === "shared" && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md mt-1.5">
                      Phòng ghép — chỉ số chia đều
                    </p>
                  )}
                </FormField>

                <FormField label="Kỳ" error={cPeriodErr} required>
                  <Select value={cPeriod} onValueChange={(v) => { setCPeriod(v); setCPeriodErr(""); }}>
                    <SelectTrigger className={cPeriodErr ? "border-destructive" : ""}>
                      <SelectValue placeholder="Chọn tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Dịch vụ <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() =>
                      setCRows((r) => [
                        ...r,
                        { id: String(Date.now()), serviceId: "", valueStart: "0", valueEnd: "0" },
                      ])
                    }
                    disabled={!cRoomId || !cPeriod || cRows.length >= meteredServices.length}
                  >
                    <Plus className="h-3 w-3" />
                    Thêm dịch vụ
                  </Button>
                </div>

                {!cRoomId || !cPeriod ? (
                  <p className="text-sm text-muted-foreground py-2">Chọn phòng và kỳ để ghi chỉ số</p>
                ) : meteredServicesFetching ? (
                  <p className="text-sm text-muted-foreground py-2">Đang tải dịch vụ...</p>
                ) : meteredServices.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                    Phòng này chưa có dịch vụ đo đếm nào
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cRows.map((row) => (
                      <ServiceRow
                        key={row.id}
                        roomId={cRoomId}
                        period={cPeriod}
                        services={meteredServices}
                        usedServiceIds={usedServiceIds}
                        row={row}
                        onChange={(updates) =>
                          setCRows((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, ...updates } : r)),
                          )
                        }
                        onRemove={() => setCRows((prev) => prev.filter((r) => r.id !== row.id))}
                        canRemove={cRows.length > 1}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={cSubmitting}>
                {cSubmitting ? "Đang lưu..." : cRows.length > 1 ? `Lưu ${cRows.length} chỉ số` : "Lưu"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ───────────────────────────────────────────────────────── */}
      <Sheet open={!!editReading} onOpenChange={(o) => { if (!o) setEditReading(null); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Chỉnh sửa chỉ số</SheetTitle>
            {editReading && (
              <SheetDescription>
                {editReading.service?.name} — Phòng {editReading.room?.roomNumber} — {formatPeriod(editReading.period)}
              </SheetDescription>
            )}
          </SheetHeader>
          <form onSubmit={submitE(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Nhà trọ: </span>
                  {editReading?.room?.property?.name ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Kỳ: </span>
                  {editReading ? formatPeriod(editReading.period) : "—"}
                </p>
                <p className="text-xs text-amber-600">
                  Chỉ có thể chỉnh sửa khi hóa đơn tháng này chưa thanh toán.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Chỉ số đầu kỳ" error={errE.valueStart?.message} required>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    {...regE("valueStart", { valueAsNumber: true })}
                    className={errE.valueStart ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="Chỉ số cuối kỳ" error={errE.valueEnd?.message} required>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    {...regE("valueEnd", { valueAsNumber: true })}
                    className={errE.valueEnd ? "border-destructive" : ""}
                  />
                </FormField>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setEditReading(null)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateMR.isPending}>
                {updateMR.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa bản ghi chỉ số</DialogTitle>
            <DialogDescription>
              Bản ghi sẽ bị xóa vĩnh viễn. Chỉ xóa được khi hóa đơn tháng này chưa được tạo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleteMR.isPending}>
              {deleteMR.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
