"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Camera,
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
import { SearchCombobox } from "@/components/common/SearchCombobox";
import type { ComboboxOption } from "@/components/common/SearchCombobox";
import { useProperties } from "@/hooks/useProperties";
import { tenantsApi } from "@/apis/tenants.api";
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/hooks/useVehicles";
import { VEHICLE_TYPE_LABEL } from "@/constants/enums";
import { VN_PLATE_REGEX, normalizePlateNumber } from "@/utils/vehicle";
import type {
  Vehicle,
  VehicleType,
  GetVehiclesParams,
  CreateVehiclePayload,
  UpdateVehiclePayload,
} from "@/types/vehicle.types";

// ─── Validation ────────────────────────────────────────────────────────────────

const HAS_OFFICIAL_PLATE: VehicleType[] = ["motorbike", "car"];

const vehicleSchema = z
  .object({
    propertyId: z.string().min(1, "Vui lòng chọn nhà trọ"),
    tenantId: z.string().min(1, "Vui lòng chọn khách thuê"),
    plateNumber: z.string().min(1, "Biển số không được để trống"),
    vehicleType: z.enum(["motorbike", "car", "bicycle", "other"] as const),
    brand: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      HAS_OFFICIAL_PLATE.includes(data.vehicleType) &&
      !VN_PLATE_REGEX.test(normalizePlateNumber(data.plateNumber))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["plateNumber"],
        message: "Biển số không đúng định dạng xe máy/ô tô Việt Nam (VD: 30A-123.45)",
      });
    }
  });

type VehicleForm = z.infer<typeof vehicleSchema>;

const EMPTY_FORM: VehicleForm = {
  propertyId: "",
  tenantId: "",
  plateNumber: "",
  vehicleType: "motorbike",
  brand: "",
  color: "",
  notes: "",
};

const VEHICLE_TYPES: VehicleType[] = ["motorbike", "car", "bicycle", "other"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
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

function VehicleTypeBadge({ type }: { type: VehicleType }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
      {VEHICLE_TYPE_LABEL[type] ?? type}
    </span>
  );
}

function ImageCapture({
  preview,
  onFile,
  required,
}: {
  preview: string | null;
  onFile: (file: File) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        Ảnh phương tiện
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div
        className="relative border-2 border-dashed rounded-lg overflow-hidden bg-muted/30"
        style={{ aspectRatio: "16/10" }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Ảnh phương tiện"
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setPreviewOpen(true)}
            />
            <button
              type="button"
              className="absolute bottom-1.5 right-1.5 bg-background/80 hover:bg-background rounded-md px-2 py-1 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors border border-border/50"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-3 w-3" />
              Đổi ảnh
            </button>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full gap-1.5 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Nhấn để chọn ảnh</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-2 gap-0" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Ảnh phương tiện</DialogTitle>
          </DialogHeader>
          <img src={preview ?? ""} alt="Ảnh phương tiện" className="w-full h-auto rounded-md" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────────

type PaginationItem =
  | { type: "page"; value: number }
  | { type: "ellipsis"; key: string };

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

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;
  const initialTenantId = searchParams.get("tenantId") ?? undefined;

  const [params, setParams] = useState<GetVehiclesParams>({
    page: 1,
    limit: 20,
    propertyId: initialPropertyId,
    tenantId: initialTenantId,
  });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const { data, isLoading } = useVehicles(params);
  const { data: propertiesData } = useProperties({ limit: 100 });
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const properties = propertiesData?.items ?? [];

  // ── Tenant search (debounced, server-side, shared giữa create/edit) ────────
  const [tenantSearchRaw, setTenantSearchRaw] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTenantOption, setSelectedTenantOption] = useState<ComboboxOption | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTenantSearch(tenantSearchRaw), 300);
    return () => clearTimeout(t);
  }, [tenantSearchRaw]);

  const { data: tenantsData, isFetching: tenantsFetching } = useQuery({
    queryKey: ["tenants-search", tenantSearch],
    queryFn: () => tenantsApi.getAll({ search: tenantSearch || undefined, limit: 20 }),
  });

  function tenantToOption(t: { id: string; fullName: string; phone?: string | null }): ComboboxOption {
    return { value: t.id, label: t.fullName, sublabel: t.phone ?? undefined };
  }

  const tenantOptions: ComboboxOption[] = [
    ...(selectedTenantOption && !tenantsData?.items.find((t) => t.id === selectedTenantOption.value)
      ? [selectedTenantOption]
      : []),
    ...(tenantsData?.items.map(tenantToOption) ?? []),
  ];

  // ── Image state (tách khỏi react-hook-form vì là File) ────────────────────
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [createImageError, setCreateImageError] = useState("");

  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  function handleCreateImage(file: File) {
    if (createImagePreview) URL.revokeObjectURL(createImagePreview);
    setCreateImageFile(file);
    setCreateImagePreview(URL.createObjectURL(file));
    setCreateImageError("");
  }

  function handleEditImage(file: File) {
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }

  // ── Forms ───────────────────────────────────────────────────────────────
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    control: controlCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: EMPTY_FORM,
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    control: controlEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: EMPTY_FORM,
  });

  function handleSearch(value: string) {
    setSearch(value);
    setParams((p) => ({ ...p, page: 1, search: value || undefined }));
  }

  function openCreate() {
    resetCreate(EMPTY_FORM);
    setSelectedTenantOption(null);
    setTenantSearchRaw("");
    setCreateImageFile(null);
    setCreateImagePreview(null);
    setCreateImageError("");
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    resetCreate(EMPTY_FORM);
    if (createImagePreview) URL.revokeObjectURL(createImagePreview);
    setCreateImageFile(null);
    setCreateImagePreview(null);
  }

  function openEdit(vehicle: Vehicle) {
    setEditVehicle(vehicle);
    resetEdit({
      propertyId: vehicle.propertyId,
      tenantId: vehicle.tenantId,
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand ?? "",
      color: vehicle.color ?? "",
      notes: vehicle.notes ?? "",
    });
    if (vehicle.tenant) {
      setSelectedTenantOption(tenantToOption(vehicle.tenant));
    }
    setTenantSearchRaw("");
    setEditImageFile(null);
    setEditImagePreview(null);
  }

  function closeEdit() {
    setEditVehicle(null);
    resetEdit(EMPTY_FORM);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImageFile(null);
    setEditImagePreview(null);
  }

  function onCreateSubmit(form: VehicleForm) {
    if (!createImageFile) {
      setCreateImageError("Ảnh phương tiện là bắt buộc");
      return;
    }
    const payload: CreateVehiclePayload = {
      ...form,
      plateNumber: form.plateNumber.trim(),
    };
    createVehicle.mutate(
      { data: payload, image: createImageFile },
      { onSuccess: closeCreate },
    );
  }

  function onEditSubmit(form: VehicleForm) {
    if (!editVehicle) return;
    const payload: UpdateVehiclePayload = {
      ...form,
      plateNumber: form.plateNumber.trim(),
    };
    updateVehicle.mutate(
      { id: editVehicle.id, data: payload, image: editImageFile ?? undefined },
      { onSuccess: closeEdit },
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteVehicle.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  const totalCount = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const limit = data?.limit ?? 20;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phương tiện</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý biển số xe của khách thuê
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm phương tiện
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm theo biển số..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Ảnh</TableHead>
                <TableHead>Biển số</TableHead>
                <TableHead>Nhà trọ</TableHead>
                <TableHead>Khách thuê</TableHead>
                <TableHead>Hãng/Màu</TableHead>
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {search || params.propertyId
                      ? "Không tìm thấy phương tiện nào"
                      : "Chưa có phương tiện nào. Hãy thêm phương tiện đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((vehicle) => (
                <TableRow key={vehicle.id} className="cursor-pointer" onClick={() => openEdit(vehicle)}>
                  <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="h-10 w-10 rounded-md overflow-hidden bg-muted/30 border shrink-0 block cursor-zoom-in"
                      onClick={() => setPreviewImageUrl(vehicle.imageUrl)}
                    >
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.plateNumber}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{vehicle.plateNumber}</span>
                      <VehicleTypeBadge type={vehicle.vehicleType} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {vehicle.property?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm truncate">
                    {vehicle.tenant?.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {[vehicle.brand, vehicle.color].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEdit(vehicle)}>
                          <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(vehicle.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
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
                {(currentPage - 1) * limit + 1}–
                {Math.min(currentPage * limit, totalCount)} / {totalCount} phương tiện
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

      {/* ── Create Sheet ───────────────────────────────────────────────────────── */}
      <Sheet open={createOpen} onOpenChange={(o) => { if (!o) closeCreate(); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Thêm phương tiện</SheetTitle>
            <SheetDescription>Đăng ký biển số xe cho khách thuê</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <ImageCapture preview={createImagePreview} onFile={handleCreateImage} required />
              {createImageError && <p className="text-xs text-destructive -mt-3">{createImageError}</p>}

              <FormField label="Nhà trọ" error={createErrors.propertyId?.message} required>
                <Controller
                  name="propertyId"
                  control={controlCreate}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={createErrors.propertyId ? "border-destructive" : ""}>
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

              <FormField label="Khách thuê" error={createErrors.tenantId?.message} required>
                <Controller
                  name="tenantId"
                  control={controlCreate}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const t = tenantsData?.items.find((x) => x.id === v);
                        if (t) setSelectedTenantOption(tenantToOption(t));
                      }}
                      options={tenantOptions}
                      onSearch={setTenantSearchRaw}
                      loading={tenantsFetching}
                      placeholder="Chọn khách thuê"
                      searchPlaceholder="Tìm theo tên, SĐT..."
                    />
                  )}
                />
              </FormField>

              <FormField label="Biển số" error={createErrors.plateNumber?.message} required>
                <Input
                  {...registerCreate("plateNumber")}
                  placeholder="VD: 59-X1 123.45"
                  className="uppercase"
                />
              </FormField>

              <FormField label="Loại phương tiện" error={createErrors.vehicleType?.message} required>
                <Controller
                  name="vehicleType"
                  control={controlCreate}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{VEHICLE_TYPE_LABEL[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Hãng/model">
                  <Input {...registerCreate("brand")} placeholder="VD: Honda Wave" />
                </FormField>
                <FormField label="Màu">
                  <Input {...registerCreate("color")} placeholder="VD: Đen" />
                </FormField>
              </div>

              <FormField label="Ghi chú">
                <textarea
                  {...registerCreate("notes")}
                  rows={2}
                  placeholder="Ghi chú thêm (nếu có)"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </FormField>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeCreate}>Hủy</Button>
              <Button type="submit" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? "Đang lưu..." : "Thêm phương tiện"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet open={!!editVehicle} onOpenChange={(o) => { if (!o) closeEdit(); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle className="font-mono">{editVehicle?.plateNumber}</SheetTitle>
            <SheetDescription>Chỉnh sửa thông tin phương tiện</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <ImageCapture preview={editImagePreview ?? editVehicle?.imageUrl ?? null} onFile={handleEditImage} />

              <FormField label="Nhà trọ" error={editErrors.propertyId?.message} required>
                <Controller
                  name="propertyId"
                  control={controlEdit}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={editErrors.propertyId ? "border-destructive" : ""}>
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

              <FormField label="Khách thuê" error={editErrors.tenantId?.message} required>
                <Controller
                  name="tenantId"
                  control={controlEdit}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const t = tenantsData?.items.find((x) => x.id === v);
                        if (t) setSelectedTenantOption(tenantToOption(t));
                      }}
                      options={tenantOptions}
                      onSearch={setTenantSearchRaw}
                      loading={tenantsFetching}
                      placeholder="Chọn khách thuê"
                      searchPlaceholder="Tìm theo tên, SĐT..."
                    />
                  )}
                />
              </FormField>

              <FormField label="Biển số" error={editErrors.plateNumber?.message} required>
                <Input
                  {...registerEdit("plateNumber")}
                  className="uppercase"
                />
              </FormField>

              <FormField label="Loại phương tiện" error={editErrors.vehicleType?.message} required>
                <Controller
                  name="vehicleType"
                  control={controlEdit}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{VEHICLE_TYPE_LABEL[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Hãng/model">
                  <Input {...registerEdit("brand")} placeholder="VD: Honda Wave" />
                </FormField>
                <FormField label="Màu">
                  <Input {...registerEdit("color")} placeholder="VD: Đen" />
                </FormField>
              </div>

              <FormField label="Ghi chú">
                <textarea
                  {...registerEdit("notes")}
                  rows={2}
                  placeholder="Ghi chú thêm (nếu có)"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </FormField>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-muted/30">
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => { const id = editVehicle?.id; closeEdit(); if (id) setDeleteId(id); }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={closeEdit}>Hủy</Button>
                <Button type="submit" disabled={updateVehicle.isPending}>
                  {updateVehicle.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa phương tiện</DialogTitle>
            <DialogDescription>
              Phương tiện sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVehicle.isPending}>
              {deleteVehicle.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Preview Dialog (từ table) ────────────────────────────────────── */}
      <Dialog open={!!previewImageUrl} onOpenChange={(o) => { if (!o) setPreviewImageUrl(null); }}>
        <DialogContent className="max-w-3xl p-2 gap-0" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Ảnh phương tiện</DialogTitle>
          </DialogHeader>
          <img src={previewImageUrl ?? ""} alt="Ảnh phương tiện" className="w-full h-auto rounded-md" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
