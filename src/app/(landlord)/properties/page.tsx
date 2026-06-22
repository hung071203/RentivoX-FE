"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  MapPin,
  DoorOpen,
  Wrench,
  FileText,
  Check,
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
  useProperties,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
} from "@/hooks/useProperties";
import { useServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServices";
import {
  AddressSelector,
  type AddressValue,
} from "@/components/common/AddressSelector";
import { SortableHead } from "@/components/common/SortableHead";
import { formatCurrency, formatDate } from "@/utils/format";
import { SERVICE_TYPE_LABEL } from "@/constants/enums";
import type {
  CreatePropertyPayload,
  GetPropertiesParams,
  Property,
  UpdatePropertyPayload,
} from "@/types/property.types";
import type {
  Service,
  ServiceType,
  CreateServicePayload,
  UpdateServicePayload,
} from "@/types/service.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Validation ────────────────────────────────────────────────────────────────

const propertySchema = z.object({
  name: z.string().min(2, "Tên nhà trọ tối thiểu 2 ký tự"),
  address: z.string().min(5, "Địa chỉ tối thiểu 5 ký tự"),
});

type PropertyForm = z.infer<typeof propertySchema>;

const EMPTY_ADDRESS: AddressValue = { province: "", district: "", ward: "" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFullAddress(p: Property): string {
  return [p.address, p.ward, p.district, p.province]
    .filter(Boolean)
    .join(", ");
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

// ─── Form Field ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Service Badges ───────────────────────────────────────────────────────────

const TYPE_STYLE: Record<ServiceType, { bg: string; text: string; ring: string }> = {
  metered: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  fixed: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
};

function TypeBadge({ type }: { type: ServiceType }) {
  const s = TYPE_STYLE[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      {SERVICE_TYPE_LABEL[type]}
    </span>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? null : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200">
      Ngừng dùng
    </span>
  );
}

// ─── Property Services Sheet ──────────────────────────────────────────────────

function PropertyServicesSheet({ property, open, onClose }: { property: Property | null; open: boolean; onClose: () => void }) {
  const propertyId = property?.id ?? null;
  const { data, isLoading } = useServices({ propertyId: propertyId ?? undefined, limit: 100 });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<ServiceType>("fixed");
  const [addUnit, setAddUnit] = useState("");
  const [addUnitPrice, setAddUnitPrice] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editActive, setEditActive] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const services = data?.items ?? [];

  function handleAdd() {
    if (!propertyId || !addName.trim() || addUnitPrice === "") return;
    const payload: CreateServicePayload = {
      propertyId,
      name: addName.trim(),
      type: addType,
      unitPrice: Number(addUnitPrice),
      ...(addType === "metered" && addUnit.trim() ? { unit: addUnit.trim() } : {}),
    };
    createService.mutate(payload, {
      onSuccess: () => {
        setAddName("");
        setAddType("fixed");
        setAddUnit("");
        setAddUnitPrice("");
      },
    });
  }

  function handleEditStart(service: Service) {
    setEditId(service.id);
    setEditPrice(String(Number(service.unitPrice)));
    setEditActive(service.isActive);
  }

  function handleSaveEdit() {
    if (!editId) return;
    const payload: UpdateServicePayload = { unitPrice: Number(editPrice), isActive: editActive };
    updateService.mutate({ id: editId, payload }, { onSuccess: () => setEditId(null) });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteService.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(o) => {
          if (!o) { setEditId(null); onClose(); }
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Dịch vụ — {property?.name}</SheetTitle>
            <SheetDescription>Quản lý dịch vụ cho dãy nhà trọ này</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Danh sách dịch vụ hiện có */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dịch vụ hiện có {services.length > 0 ? `(${services.length})` : ""}
              </p>
              {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
              {!isLoading && services.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có dịch vụ nào. Hãy thêm dịch vụ bên dưới.</p>
              )}
              {services.map((service) => (
                <div key={service.id} className="rounded-lg border bg-card">
                  {/* Info row — luôn hiển thị */}
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{service.name}</p>
                        <TypeBadge type={service.type} />
                        <ActiveBadge isActive={service.isActive} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(Number(service.unitPrice))}
                        {service.unit ? `/${service.unit}` : "/tháng"}
                      </p>
                    </div>
                    {editId !== service.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditStart(service)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(service.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Edit controls — chỉ hiện khi đang sửa */}
                  {editId === service.id && (
                    <div className="flex items-center gap-2 px-3 pb-3 pt-2 border-t">
                      <input
                        type="number"
                        min={0}
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Đơn giá"
                        className="flex-1 min-w-0 h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <Select value={editActive ? "true" : "false"} onValueChange={(v) => setEditActive(v === "true")}>
                        <SelectTrigger className="h-8 w-[90px] text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Đang dùng</SelectItem>
                          <SelectItem value="false">Ngừng dùng</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleSaveEdit} disabled={updateService.isPending}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => setEditId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Thêm dịch vụ mới */}
            <div className="border-t pt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thêm dịch vụ</p>
              <input
                type="text"
                placeholder="Tên dịch vụ (VD: Điện, Nước, Gửi xe...)"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Select value={addType} onValueChange={(v) => setAddType(v as ServiceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Cố định (hàng tháng)</SelectItem>
                  <SelectItem value="metered">Đo đếm (theo chỉ số)</SelectItem>
                </SelectContent>
              </Select>
              {addType === "metered" && (
                <input
                  type="text"
                  placeholder="Đơn vị đo (VD: kWh, m³)"
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              )}
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Đơn giá (VND)"
                  value={addUnitPrice}
                  onChange={(e) => setAddUnitPrice(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  onClick={handleAdd}
                  disabled={!addName.trim() || addUnitPrice === "" || createService.isPending}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Thêm
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" className="w-full" onClick={onClose}>Đóng</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
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
            <Button variant="destructive" onClick={handleDelete} disabled={deleteService.isPending}>
              {deleteService.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const router = useRouter();
  const [params, setParams] = useState<GetPropertiesParams>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [servicesProperty, setServicesProperty] = useState<Property | null>(null);

  // Address state (province/district/ward) managed outside react-hook-form
  const [createAddress, setCreateAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [editAddress, setEditAddress] = useState<AddressValue>(EMPTY_ADDRESS);

  const { data, isLoading } = useProperties(params);
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<PropertyForm>({ resolver: zodResolver(propertySchema) });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<PropertyForm>({ resolver: zodResolver(propertySchema) });

  function handleSearch(value: string) {
    setSearch(value);
    setParams((p) => ({ ...p, page: 1, search: value || undefined }));
  }

  function handleSort(field: string, direction: "ASC" | "DESC" | undefined) {
    setParams((p) => ({ ...p, page: 1, orderBy: direction ? field : undefined, orderDirection: direction }));
  }

  function openEdit(property: Property) {
    setEditProperty(property);
    setEditAddress({
      province: property.province ?? "",
      district: property.district ?? "",
      ward: property.ward ?? "",
    });
    resetEdit({ name: property.name, address: property.address });
  }

  function closeCreate() {
    setCreateOpen(false);
    resetCreate();
    setCreateAddress(EMPTY_ADDRESS);
  }

  function closeEdit() {
    setEditProperty(null);
    resetEdit();
    setEditAddress(EMPTY_ADDRESS);
  }

  function onCreateSubmit(form: PropertyForm) {
    const payload: CreatePropertyPayload = {
      name: form.name,
      address: form.address,
      province: createAddress.province || undefined,
      district: createAddress.district || undefined,
      ward: createAddress.ward || undefined,
    };
    createProperty.mutate(payload, { onSuccess: closeCreate });
  }

  function onEditSubmit(form: PropertyForm) {
    if (!editProperty) return;
    const payload: UpdatePropertyPayload = {
      name: form.name,
      address: form.address,
      province: editAddress.province || undefined,
      district: editAddress.district || undefined,
      ward: editAddress.ward || undefined,
    };
    updateProperty.mutate(
      { id: editProperty.id, data: payload },
      { onSuccess: closeEdit },
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteProperty.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
          <h1 className="text-2xl font-semibold tracking-tight">Nhà trọ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý toàn bộ dãy nhà trọ của bạn
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhà trọ
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm theo tên, địa chỉ..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[45%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <SortableHead label="Tên nhà trọ" field="name" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} className="pl-6" />
                <TableHead>Địa chỉ</TableHead>
                <SortableHead label="Ngày tạo" field="createdAt" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {search
                      ? "Không tìm thấy nhà trọ nào"
                      : "Chưa có nhà trọ nào. Hãy thêm nhà trọ đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((property) => (
                <TableRow
                  key={property.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/rooms?propertyId=${property.id}`)}
                >
                  <TableCell className="pl-6 font-medium truncate">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{property.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate">
                    {formatFullAddress(property)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(property.createdAt)}
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
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => router.push(`/rooms?propertyId=${property.id}`)}
                        >
                          <DoorOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                          Xem phòng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setServicesProperty(property)}
                        >
                          <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                          Quản lý dịch vụ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/contracts?propertyId=${property.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          Xem hợp đồng
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEdit(property)}>
                          <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(property.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa nhà trọ
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
                {Math.min(currentPage * limit, totalCount)} / {totalCount} nhà
                trọ
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {buildPagination(currentPage, totalPages).map((item) =>
                  item.type === "ellipsis" ? (
                    <span
                      key={item.key}
                      className="px-2 text-sm text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item.value}
                      variant={
                        item.value === currentPage ? "default" : "outline"
                      }
                      size="sm"
                      className="w-9"
                      onClick={() =>
                        setParams((p) => ({ ...p, page: item.value }))
                      }
                    >
                      {item.value}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Sheet ───────────────────────────────────────────────────────── */}
      <Sheet
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) closeCreate();
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Thêm nhà trọ</SheetTitle>
            <SheetDescription>
              Điền thông tin để tạo dãy nhà trọ mới.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleCreateSubmit(onCreateSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField
                label="Tên nhà trọ *"
                error={createErrors.name?.message}
              >
                <Input
                  {...registerCreate("name")}
                  placeholder="VD: Nhà trọ Bình Dương"
                />
              </FormField>

              <FormField
                label="Số nhà, tên đường *"
                error={createErrors.address?.message}
              >
                <Input
                  {...registerCreate("address")}
                  placeholder="VD: 123 Nguyễn Văn A"
                />
              </FormField>

              <div className="border-t pt-5">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  Khu vực hành chính
                </p>
                {/* key="create" — không cần remount vì chỉ có 1 create form */}
                <AddressSelector
                  key="create"
                  defaultValue={EMPTY_ADDRESS}
                  onChange={setCreateAddress}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeCreate}>
                Hủy
              </Button>
              <Button type="submit" disabled={createProperty.isPending}>
                {createProperty.isPending ? "Đang tạo..." : "Tạo nhà trọ"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        open={!!editProperty}
        onOpenChange={(o) => {
          if (!o) closeEdit();
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Chỉnh sửa nhà trọ</SheetTitle>
            <SheetDescription className="truncate">
              {editProperty?.name}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleEditSubmit(onEditSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField
                label="Tên nhà trọ *"
                error={editErrors.name?.message}
              >
                <Input {...registerEdit("name")} />
              </FormField>

              <FormField
                label="Số nhà, tên đường *"
                error={editErrors.address?.message}
              >
                <Input {...registerEdit("address")} />
              </FormField>

              <div className="border-t pt-5">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  Khu vực hành chính
                </p>
                {/* key=id — remount khi mở edit cho property khác, giữ state khi cùng property */}
                <AddressSelector
                  key={editProperty?.id}
                  defaultValue={editAddress}
                  onChange={setEditAddress}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeEdit}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateProperty.isPending}>
                {updateProperty.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Property Services Sheet ───────────────────────────────────────────── */}
      <PropertyServicesSheet
        property={servicesProperty}
        open={!!servicesProperty}
        onClose={() => setServicesProperty(null)}
      />

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa nhà trọ</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ phòng và dữ liệu liên
              quan sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProperty.isPending}
            >
              {deleteProperty.isPending ? "Đang xóa..." : "Xóa nhà trọ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
