"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wrench,
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
import { SortableHead } from "@/components/common/SortableHead";
import { useServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServices";
import { useProperties } from "@/hooks/useProperties";
import { formatCurrency } from "@/utils/format";
import { SERVICE_TYPE_LABEL } from "@/constants/enums";
import type {
  Service,
  ServiceType,
  GetServicesParams,
  CreateServicePayload,
  UpdateServicePayload,
} from "@/types/service.types";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  propertyId: z.string().min(1, "Vui lòng chọn nhà trọ"),
  name: z.string().min(1, "Tên dịch vụ không được để trống"),
  type: z.enum(["metered", "fixed"] as const),
  unit: z.string().optional(),
  unitPrice: z.coerce.number({ invalid_type_error: "Đơn giá phải là số" }).int().min(0, "Đơn giá phải >= 0"),
});

const editSchema = z.object({
  unitPrice: z.coerce.number({ invalid_type_error: "Đơn giá phải là số" }).int().min(0, "Đơn giá phải >= 0"),
  isActive: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ─── Badges ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<ServiceType, { bg: string; text: string; ring: string }> = {
  metered: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  fixed: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
};

const PROPERTY_COLORS = [
  { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200" },
  { bg: "bg-lime-50", text: "text-lime-700", ring: "ring-lime-200" },
];

function usePropertyColorMap(properties: { id: string }[]) {
  const map = new Map<string, (typeof PROPERTY_COLORS)[number]>();
  properties.forEach((p, i) => {
    map.set(p.id, PROPERTY_COLORS[i % PROPERTY_COLORS.length]);
  });
  return map;
}

function PropertyBadge({ name, colorStyle }: { name: string; colorStyle: (typeof PROPERTY_COLORS)[number] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 max-w-full truncate ${colorStyle.bg} ${colorStyle.text} ${colorStyle.ring}`}>
      {name}
    </span>
  );
}

function TypeBadge({ type }: { type: ServiceType }) {
  const s = TYPE_STYLE[type];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      {SERVICE_TYPE_LABEL[type]}
    </span>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Đang dùng
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Ngừng dùng
    </span>
  );
}

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

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;

  const [params, setParams] = useState<GetServicesParams>({ page: 1, limit: 20, propertyId: initialPropertyId });
  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useServices(params);
  const { data: propertiesData } = useProperties({ limit: 100 });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;
  const limit = params.limit ?? 20;

  // ── Create form ──────────────────────────────────────────────────────────
  const {
    register: regC,
    handleSubmit: submitC,
    control: controlC,
    watch: watchC,
    reset: resetC,
    formState: { errors: errC },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { propertyId: initialPropertyId ?? "", name: "", type: "fixed", unit: "", unitPrice: 0 },
  });

  // ── Edit form ────────────────────────────────────────────────────────────
  const {
    register: regE,
    handleSubmit: submitE,
    control: controlE,
    reset: resetE,
    formState: { errors: errE },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { unitPrice: 0, isActive: true },
  });

  const typeC = watchC("type");

  function handleSort(field: string, direction: "ASC" | "DESC" | undefined) {
    setParams((p) => ({ ...p, page: 1, orderBy: direction ? field : undefined, orderDirection: direction }));
  }

  function openEdit(service: Service) {
    setEditService(service);
    resetE({
      unitPrice: Number(service.unitPrice),
      isActive: service.isActive,
    });
  }

  function onCreateSubmit(data: CreateForm) {
    const payload: CreateServicePayload = {
      propertyId: data.propertyId,
      name: data.name,
      type: data.type,
      unitPrice: data.unitPrice,
      ...(data.type === "metered" && data.unit ? { unit: data.unit } : {}),
    };
    createService.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false);
        resetC({ propertyId: initialPropertyId ?? "", name: "", type: "fixed", unit: "", unitPrice: 0 });
      },
    });
  }

  function onEditSubmit(data: EditForm) {
    if (!editService) return;
    const payload: UpdateServicePayload = {
      unitPrice: data.unitPrice,
      isActive: data.isActive,
    };
    updateService.mutate({ id: editService.id, payload }, {
      onSuccess: () => setEditService(null),
    });
  }

  function onDelete() {
    if (!deleteId) return;
    deleteService.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  }

  const properties = propertiesData?.items ?? [];
  const propertyColorMap = usePropertyColorMap(properties);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Dịch vụ" description="Quản lý dịch vụ theo từng dãy nhà trọ" />
        <Button onClick={() => { resetC({ propertyId: initialPropertyId ?? "", name: "", type: "fixed", unit: "", unitPrice: 0 }); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm dịch vụ
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={params.propertyId ?? "all"}
              onValueChange={(v) => setParams((p) => ({ ...p, page: 1, propertyId: v === "all" ? undefined : v }))}
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Tất cả nhà trọ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà trọ</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.type ?? "all"}
              onValueChange={(v) => setParams((p) => ({ ...p, page: 1, type: v === "all" ? undefined : (v as ServiceType) }))}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="metered">Đo đếm</SelectItem>
                <SelectItem value="fixed">Cố định</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={params.isActive === undefined ? "all" : params.isActive ? "active" : "inactive"}
              onValueChange={(v) => setParams((p) => ({
                ...p,
                page: 1,
                isActive: v === "all" ? undefined : v === "active",
              }))}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang dùng</SelectItem>
                <SelectItem value="inactive">Ngừng dùng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <SortableHead label="Tên dịch vụ" field="name" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} className="pl-6" />
                <TableHead>Nhà trọ</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Đơn vị</TableHead>
                <SortableHead label="Đơn giá" field="unitPrice" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead>Trạng thái</TableHead>
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {params.propertyId || params.type || params.isActive !== undefined
                      ? "Không tìm thấy dịch vụ nào phù hợp"
                      : "Chưa có dịch vụ nào. Hãy thêm dịch vụ đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.property
                      ? <PropertyBadge
                          name={service.property.name}
                          colorStyle={propertyColorMap.get(service.property.id) ?? PROPERTY_COLORS[0]}
                        />
                      : <span className="text-sm text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={service.type} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {service.unit ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(Number(service.unitPrice))}
                    {service.unit ? `/${service.unit}` : "/tháng"}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={service.isActive} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEdit(service)}>
                          <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(service.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa dịch vụ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalCount)} / {totalCount} dịch vụ
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
                    <span key={item.key} className="px-2 text-sm text-muted-foreground">...</span>
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
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Thêm dịch vụ</SheetTitle>
            <SheetDescription>Tạo dịch vụ mới cho một nhà trọ</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitC(onCreateSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField label="Nhà trọ" error={errC.propertyId?.message} required>
                <Controller
                  name="propertyId"
                  control={controlC}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errC.propertyId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Chọn nhà trọ" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Tên dịch vụ" error={errC.name?.message} required>
                <Input placeholder="VD: Điện, Nước, Gửi xe..." {...regC("name")} className={errC.name ? "border-destructive" : ""} />
              </FormField>

              <FormField label="Loại dịch vụ" error={errC.type?.message} required>
                <Controller
                  name="type"
                  control={controlC}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Cố định (phí hàng tháng)</SelectItem>
                        <SelectItem value="metered">Đo đếm (theo chỉ số)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              {typeC === "metered" && (
                <FormField label="Đơn vị đo" error={errC.unit?.message}>
                  <Input placeholder="VD: kWh, m³" {...regC("unit")} />
                </FormField>
              )}

              <FormField label={typeC === "metered" ? "Đơn giá (VND / đơn vị)" : "Đơn giá (VND / tháng)"} error={errC.unitPrice?.message} required>
                <Input type="number" min={0} step={1000} placeholder="0" {...regC("unitPrice")} className={errC.unitPrice ? "border-destructive" : ""} />
              </FormField>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ───────────────────────────────────────────────────────── */}
      <Sheet open={!!editService} onOpenChange={(o) => { if (!o) setEditService(null); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Chỉnh sửa dịch vụ</SheetTitle>
            <SheetDescription>{editService?.name}</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitE(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Read-only info */}
              <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nhà trọ</span>
                  <span className="font-medium">{editService?.property?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tên dịch vụ</span>
                  <span className="font-medium">{editService?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại</span>
                  <span className="font-medium">
                    {editService ? (editService.type === "metered" ? "Đo đếm" : "Cố định") : "—"}
                    {editService?.unit ? ` (${editService.unit})` : ""}
                  </span>
                </div>
              </div>

              <FormField
                label={editService?.type === "metered" ? "Đơn giá (VND / đơn vị)" : "Đơn giá (VND / tháng)"}
                error={errE.unitPrice?.message}
                required
              >
                <Input type="number" min={0} step={1000} {...regE("unitPrice")} className={errE.unitPrice ? "border-destructive" : ""} />
              </FormField>

              <FormField label="Trạng thái" error={errE.isActive?.message}>
                <Controller
                  name="isActive"
                  control={controlE}
                  render={({ field }) => (
                    <Select value={field.value ? "true" : "false"} onValueChange={(v) => field.onChange(v === "true")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Đang dùng</SelectItem>
                        <SelectItem value="false">Ngừng dùng</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setEditService(null)}>Hủy</Button>
              <Button type="submit" disabled={updateService.isPending}>
                {updateService.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa dịch vụ</DialogTitle>
            <DialogDescription>
              Dịch vụ sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleteService.isPending}>
              {deleteService.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
