"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  DoorOpen,
  Bath,
  Wind,
  ChefHat,
  FileText,
  Users,
  Wrench,
  X,
  Check,
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
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from "@/hooks/useRooms";
import { useProperties } from "@/hooks/useProperties";
import { useServices } from "@/hooks/useServices";
import { useRoomServices, useCreateRoomService, useUpdateRoomService, useDeleteRoomService } from "@/hooks/useRoomServices";
import { formatCurrency } from "@/utils/format";
import { ROOM_TYPE_LABEL, ROOM_STATUS_LABEL, SERVICE_TYPE_LABEL } from "@/constants/enums";
import type {
  Room,
  RoomStatus,
  RoomType,
  GetRoomsParams,
  CreateRoomPayload,
  UpdateRoomPayload,
} from "@/types/room.types";
import { SortableHead } from "@/components/common/SortableHead";

// ─── Helpers ────────────────────────────────────────────────────────────────

const toOptionalNum = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  propertyId: z.string().min(1, "Vui lòng chọn nhà trọ"),
  roomNumber: z.string().min(1, "Số phòng không được để trống"),
  roomType: z.enum(["shared", "private"] as const),
  floor: z.preprocess(toOptionalNum, z.number().int().optional()),
  areaM2: z.preprocess(toOptionalNum, z.number().min(0).optional()),
  basePrice: z.coerce.number({ invalid_type_error: "Giá thuê phải là số" }).int().min(0, "Giá thuê phải >= 0"),
  maxOccupants: z.preprocess(toOptionalNum, z.number({ invalid_type_error: "Sức chứa phải là số" }).int().min(1, "Sức chứa phải >= 1")),
  hasPrivateWc: z.boolean().default(false),
  hasKitchen: z.boolean().default(false),
  hasAc: z.boolean().default(false),
  notes: z.string().optional(),
});

const editSchema = createSchema.omit({ propertyId: true }).extend({
  status: z.enum(["available", "occupied", "maintenance", "reserved"] as const),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ─── Status & Type Badge ────────────────────────────────────────────────────

const STATUS_STYLE: Record<RoomStatus, { bg: string; text: string; ring: string; dot: string }> = {
  available: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  occupied: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", dot: "bg-blue-500" },
  maintenance: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "bg-amber-500" },
  reserved: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", dot: "bg-violet-500" },
};

const TYPE_STYLE: Record<RoomType, { bg: string; text: string; ring: string }> = {
  shared: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  private: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
};

function StatusBadge({ status }: { status: RoomStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {ROOM_STATUS_LABEL[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: RoomType }) {
  const s = TYPE_STYLE[type];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      {ROOM_TYPE_LABEL[type]}
    </span>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

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

// ─── Form Field ─────────────────────────────────────────────────────────────

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

// ─── Amenity Checkbox ────────────────────────────────────────────────────────

function AmenityCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

// ─── Room Services Sheet ─────────────────────────────────────────────────────

function RoomServicesSheet({ room, open, onClose }: { room: Room | null; open: boolean; onClose: () => void }) {
  const roomId = room?.id ?? null;
  const { data: roomServices, isLoading } = useRoomServices(roomId);
  const { data: servicesData } = useServices({ propertyId: room?.propertyId, limit: 100, isActive: true });
  const createRs = useCreateRoomService(roomId ?? "");
  const updateRs = useUpdateRoomService(roomId ?? "");
  const deleteRs = useDeleteRoomService(roomId ?? "");

  const [addServiceId, setAddServiceId] = useState("");
  const [addUnitPrice, setAddUnitPrice] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const allServices = servicesData?.items ?? [];
  const addedIds = new Set((roomServices ?? []).map((rs) => rs.serviceId));
  const available = allServices.filter((s) => !addedIds.has(s.id));

  function handleAdd() {
    if (!addServiceId || addUnitPrice === "") return;
    createRs.mutate(
      { serviceId: addServiceId, unitPrice: Number(addUnitPrice) },
      { onSuccess: () => { setAddServiceId(""); setAddUnitPrice(""); } },
    );
  }

  function handleEditStart(id: string, price: number) {
    setEditId(id);
    setEditPrice(String(price));
  }

  function handleSaveEdit() {
    if (!editId) return;
    updateRs.mutate({ id: editId, data: { unitPrice: Number(editPrice) } }, { onSuccess: () => setEditId(null) });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setEditId(null); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>Dịch vụ — Phòng {room?.roomNumber}</SheetTitle>
          <SheetDescription className="truncate">{room?.property?.name}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Danh sách dịch vụ hiện có */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dịch vụ đã gắn</p>
            {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
            {!isLoading && (roomServices ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có dịch vụ nào</p>
            )}
            {(roomServices ?? []).map((rs) => (
              <div key={rs.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rs.service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {SERVICE_TYPE_LABEL[rs.service.type]}
                    {rs.service.unit ? ` · ${rs.service.unit}` : ""}
                  </p>
                </div>
                {editId === rs.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-28 h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <Button size="sm" className="h-8 w-8 p-0" onClick={handleSaveEdit} disabled={updateRs.isPending}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">{formatCurrency(Number(rs.unitPrice))}</span>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditStart(rs.id, Number(rs.unitPrice))}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteRs.mutate(rs.id)}
                      disabled={deleteRs.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Thêm dịch vụ */}
          <div className="border-t pt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thêm dịch vụ</p>
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {allServices.length === 0
                  ? "Nhà trọ chưa có dịch vụ nào. Vào trang Dịch vụ để thêm."
                  : "Tất cả dịch vụ đã được gắn vào phòng này."}
              </p>
            ) : (
              <div className="space-y-3">
                <Select value={addServiceId} onValueChange={setAddServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dịch vụ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {SERVICE_TYPE_LABEL[s.type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Đơn giá (VND)"
                      value={addUnitPrice}
                      onChange={(e) => setAddUnitPrice(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAdd}
                    disabled={!addServiceId || addUnitPrice === "" || createRs.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Thêm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" className="w-full" onClick={onClose}>Đóng</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;

  const [params, setParams] = useState<GetRoomsParams>({
    page: 1,
    limit: 20,
    propertyId: initialPropertyId,
  });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [servicesRoom, setServicesRoom] = useState<Room | null>(null);

  const { data, isLoading } = useRooms(params);
  const { data: propertiesData } = useProperties({ limit: 100 });
  const properties = propertiesData?.items ?? [];

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  // ── Create form ────────────────────────────────────────────────────────────
  const {
    register: regC,
    handleSubmit: submitC,
    control: controlC,
    reset: resetC,
    formState: { errors: errC },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { hasPrivateWc: false, hasKitchen: false, hasAc: false, roomType: "private" },
  });

  // ── Edit form ──────────────────────────────────────────────────────────────
  const {
    register: regE,
    handleSubmit: submitE,
    control: controlE,
    reset: resetE,
    setError: setErrE,
    formState: { errors: errE },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { hasPrivateWc: false, hasKitchen: false, hasAc: false },
  });

  function handleSearch(value: string) {
    setSearch(value);
    setParams((p) => ({ ...p, page: 1, search: value || undefined }));
  }

  function handleSort(field: string, direction: "ASC" | "DESC" | undefined) {
    setParams((p) => ({ ...p, page: 1, orderBy: direction ? field : undefined, orderDirection: direction }));
  }

  function openEdit(room: Room) {
    setEditRoom(room);
    resetE({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: room.floor ?? undefined,
      areaM2: room.areaM2 ?? undefined,
      basePrice: Number(room.basePrice),
      maxOccupants: room.maxOccupants ?? undefined,
      hasPrivateWc: room.hasPrivateWc,
      hasKitchen: room.hasKitchen,
      hasAc: room.hasAc,
      notes: room.notes ?? "",
      status: room.status,
    });
  }

  function openCreate() {
    resetC({
      hasPrivateWc: false,
      hasKitchen: false,
      hasAc: false,
      roomType: "private",
      propertyId: params.propertyId ?? "",
    });
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    resetC({ hasPrivateWc: false, hasKitchen: false, hasAc: false, roomType: "private" });
  }

  function closeEdit() {
    setEditRoom(null);
    resetE({ hasPrivateWc: false, hasKitchen: false, hasAc: false });
  }

  function onCreateSubmit(form: CreateForm) {
    const payload: CreateRoomPayload = {
      propertyId: form.propertyId,
      roomNumber: form.roomNumber,
      roomType: form.roomType,
      basePrice: form.basePrice,
      floor: form.floor ?? undefined,
      areaM2: form.areaM2 ?? undefined,
      maxOccupants: form.maxOccupants!,
      hasPrivateWc: form.hasPrivateWc,
      hasKitchen: form.hasKitchen,
      hasAc: form.hasAc,
      notes: form.notes || undefined,
    };
    createRoom.mutate(payload, { onSuccess: closeCreate });
  }

  function onEditSubmit(form: EditForm) {
    if (!editRoom) return;
    const currentOccupants = editRoom.occupantCount ?? 0;
    if (form.maxOccupants !== undefined && form.maxOccupants < currentOccupants) {
      setErrE("maxOccupants", {
        message: `Không được nhỏ hơn số người đang ở hiện tại (${currentOccupants})`,
      });
      return;
    }
    const payload: UpdateRoomPayload = {
      roomNumber: form.roomNumber,
      roomType: form.roomType,
      basePrice: form.basePrice,
      status: form.status,
      floor: form.floor ?? undefined,
      areaM2: form.areaM2 ?? undefined,
      maxOccupants: form.maxOccupants ?? undefined,
      hasPrivateWc: form.hasPrivateWc,
      hasKitchen: form.hasKitchen,
      hasAc: form.hasAc,
      notes: form.notes || undefined,
    };
    updateRoom.mutate({ id: editRoom.id, data: payload }, { onSuccess: closeEdit });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteRoom.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
          <h1 className="text-2xl font-semibold tracking-tight">Phòng trọ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tất cả phòng trong các dãy nhà trọ
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm phòng
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm số phòng..."
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
              <SelectTrigger className="h-9 w-[180px]">
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
              value={params.status ?? "all"}
              onValueChange={(v) =>
                setParams((p) => ({ ...p, page: 1, status: v === "all" ? undefined : (v as RoomStatus) }))
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="available">Còn trống</SelectItem>
                <SelectItem value="occupied">Đang thuê</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
                <SelectItem value="reserved">Đã đặt</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={params.roomType ?? "all"}
              onValueChange={(v) =>
                setParams((p) => ({ ...p, page: 1, roomType: v === "all" ? undefined : (v as RoomType) }))
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Loại phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="private">Nguyên căn</SelectItem>
                <SelectItem value="shared">Phòng ghép</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[19%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <SortableHead label="Phòng số" field="roomNumber" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} className="pl-6" />
                <TableHead>Nhà trọ</TableHead>
                <TableHead>Loại phòng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <SortableHead label="Giá thuê" field="basePrice" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <SortableHead label="Diện tích" field="areaM2" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} />
                <TableHead>Tiện ích</TableHead>
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
                    {search || params.propertyId || params.status || params.roomType
                      ? "Không tìm thấy phòng nào phù hợp"
                      : "Chưa có phòng nào. Hãy thêm phòng đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((room) => (
                <TableRow key={room.id} className="cursor-pointer" onClick={() => setDetailRoom(room)}>
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{room.roomNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {room.property?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={room.roomType} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={room.status} />
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(Number(room.basePrice))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {room.areaM2 ? `${room.areaM2} m²` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {room.hasPrivateWc && (
                        <span title="WC riêng" className="text-muted-foreground hover:text-foreground transition-colors">
                          <Bath className="h-4 w-4" />
                        </span>
                      )}
                      {room.hasAc && (
                        <span title="Điều hòa" className="text-muted-foreground hover:text-foreground transition-colors">
                          <Wind className="h-4 w-4" />
                        </span>
                      )}
                      {room.hasKitchen && (
                        <span title="Bếp riêng" className="text-muted-foreground hover:text-foreground transition-colors">
                          <ChefHat className="h-4 w-4" />
                        </span>
                      )}
                      {!room.hasPrivateWc && !room.hasAc && !room.hasKitchen && (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/contracts?roomId=${room.id}`)}>
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          Xem hợp đồng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setServicesRoom(room)}>
                          <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                          Dịch vụ phòng
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEdit(room)}>
                          <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(room.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa phòng
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
                {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalCount)} / {totalCount} phòng
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

      {/* ── Create Sheet ────────────────────────────────────────────────────────── */}
      <Sheet open={createOpen} onOpenChange={(o) => { if (!o) closeCreate(); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Thêm phòng</SheetTitle>
            <SheetDescription>Điền thông tin để tạo phòng mới.</SheetDescription>
          </SheetHeader>

          <form onSubmit={submitC(onCreateSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Nhà trọ */}
              <FormField label="Nhà trọ" error={errC.propertyId?.message} required>
                <Controller
                  name="propertyId"
                  control={controlC}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhà trọ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.length === 0 && (
                          <SelectItem value="" disabled>Chưa có nhà trọ nào</SelectItem>
                        )}
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                {/* Số phòng */}
                <FormField label="Số phòng" error={errC.roomNumber?.message} required>
                  <Input {...regC("roomNumber")} placeholder="101, A2, ..." />
                </FormField>

                {/* Loại phòng */}
                <FormField label="Loại phòng" error={errC.roomType?.message} required>
                  <Controller
                    name="roomType"
                    control={controlC}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Nguyên căn</SelectItem>
                          <SelectItem value="shared">Phòng ghép</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Giá thuê */}
                <FormField label="Giá thuê (VND)" error={errC.basePrice?.message} required>
                  <Input {...regC("basePrice")} type="number" min={0} placeholder="3000000" />
                </FormField>

                {/* Tầng */}
                <FormField label="Tầng" error={errC.floor?.message}>
                  <Input {...regC("floor")} type="number" min={0} placeholder="1" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Diện tích */}
                <FormField label="Diện tích (m²)" error={errC.areaM2?.message}>
                  <Input {...regC("areaM2")} type="number" min={0} step="0.1" placeholder="20" />
                </FormField>

                {/* Sức chứa */}
                <FormField label="Sức chứa tối đa" error={errC.maxOccupants?.message} required>
                  <Input {...regC("maxOccupants")} type="number" min={1} placeholder="2" />
                </FormField>
              </div>

              {/* Tiện nghi */}
              <div className="border-t pt-5">
                <p className="text-sm font-medium mb-3">Tiện nghi</p>
                <div className="flex flex-wrap gap-5">
                  <Controller
                    name="hasPrivateWc"
                    control={controlC}
                    render={({ field }) => (
                      <AmenityCheckbox label="WC riêng" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  <Controller
                    name="hasKitchen"
                    control={controlC}
                    render={({ field }) => (
                      <AmenityCheckbox label="Bếp riêng" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  <Controller
                    name="hasAc"
                    control={controlC}
                    render={({ field }) => (
                      <AmenityCheckbox label="Điều hòa" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <FormField label="Ghi chú">
                <textarea
                  {...regC("notes")}
                  rows={3}
                  placeholder="Thông tin bổ sung về phòng..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </FormField>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeCreate}>Hủy</Button>
              <Button type="submit" disabled={createRoom.isPending}>
                {createRoom.isPending ? "Đang tạo..." : "Tạo phòng"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ────────────────────────────────────────────────────────── */}
      <Sheet open={!!editRoom} onOpenChange={(o) => { if (!o) closeEdit(); }}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Chỉnh sửa phòng</SheetTitle>
            <SheetDescription className="truncate">
              {editRoom?.property?.name} — Phòng {editRoom?.roomNumber}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={submitE(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Số phòng */}
                <FormField label="Số phòng" error={errE.roomNumber?.message} required>
                  <Input {...regE("roomNumber")} />
                </FormField>

                {/* Loại phòng */}
                <FormField label="Loại phòng" error={errE.roomType?.message} required>
                  <Controller
                    name="roomType"
                    control={controlE}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Nguyên căn</SelectItem>
                          <SelectItem value="shared">Phòng ghép</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              {/* Trạng thái */}
              <FormField label="Trạng thái" error={errE.status?.message} required>
                <Controller
                  name="status"
                  control={controlE}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Còn trống</SelectItem>
                        <SelectItem value="occupied">Đang thuê</SelectItem>
                        <SelectItem value="maintenance">Bảo trì</SelectItem>
                        <SelectItem value="reserved">Đã đặt</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                {/* Giá thuê */}
                <FormField label="Giá thuê (VND)" error={errE.basePrice?.message} required>
                  <Input {...regE("basePrice")} type="number" min={0} />
                </FormField>

                {/* Tầng */}
                <FormField label="Tầng" error={errE.floor?.message}>
                  <Input {...regE("floor")} type="number" min={0} />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Diện tích */}
                <FormField label="Diện tích (m²)" error={errE.areaM2?.message}>
                  <Input {...regE("areaM2")} type="number" min={0} step="0.1" />
                </FormField>

                {/* Sức chứa */}
                <FormField label="Sức chứa tối đa" error={errE.maxOccupants?.message}>
                  <Input
                    {...regE("maxOccupants")}
                    type="number"
                    min={editRoom?.occupantCount ?? 1}
                    className={errE.maxOccupants ? "border-destructive" : ""}
                  />
                  {(editRoom?.occupantCount ?? 0) > 0 && !errE.maxOccupants && (
                    <p className="text-xs text-muted-foreground">Hiện có {editRoom!.occupantCount} người đang ở</p>
                  )}
                </FormField>
              </div>

              {/* Tiện nghi */}
              <div className="border-t pt-5">
                <p className="text-sm font-medium mb-3">Tiện nghi</p>
                <div className="flex flex-wrap gap-5">
                  <Controller
                    name="hasPrivateWc"
                    control={controlE}
                    render={({ field }) => (
                      <AmenityCheckbox label="WC riêng" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  <Controller
                    name="hasKitchen"
                    control={controlE}
                    render={({ field }) => (
                      <AmenityCheckbox label="Bếp riêng" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  <Controller
                    name="hasAc"
                    control={controlE}
                    render={({ field }) => (
                      <AmenityCheckbox label="Điều hòa" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <FormField label="Ghi chú">
                <textarea
                  {...regE("notes")}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </FormField>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeEdit}>Hủy</Button>
              <Button type="submit" disabled={updateRoom.isPending}>
                {updateRoom.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Detail Sheet ────────────────────────────────────────────────────── */}
      <Sheet open={!!detailRoom} onOpenChange={(o) => { if (!o) setDetailRoom(null); }}>
        <SheetContent className="w-full sm:max-w-sm flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>
              Phòng {detailRoom?.roomNumber}
            </SheetTitle>
            <SheetDescription className="truncate">{detailRoom?.property?.name}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {detailRoom && <StatusBadge status={detailRoom.status} />}
              {detailRoom && <TypeBadge type={detailRoom.roomType} />}
            </div>

            {/* Thông tin chính */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông tin</p>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                {detailRoom?.floor != null && (
                  <>
                    <span className="text-muted-foreground">Tầng</span>
                    <span className="font-medium">{detailRoom.floor}</span>
                  </>
                )}
                {detailRoom?.areaM2 != null && (
                  <>
                    <span className="text-muted-foreground">Diện tích</span>
                    <span className="font-medium">{detailRoom.areaM2} m²</span>
                  </>
                )}
                <span className="text-muted-foreground">Giá thuê</span>
                <span className="font-medium">{detailRoom ? formatCurrency(Number(detailRoom.basePrice)) : "—"}</span>
                <span className="text-muted-foreground">Người ở</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailRoom?.occupantCount ?? 0}
                  {detailRoom?.maxOccupants != null && (
                    <span className="text-muted-foreground font-normal">/ {detailRoom.maxOccupants}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Tiện nghi */}
            {detailRoom && (detailRoom.hasPrivateWc || detailRoom.hasKitchen || detailRoom.hasAc) && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiện nghi</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {detailRoom.hasPrivateWc && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Bath className="h-4 w-4" /> WC riêng
                    </span>
                  )}
                  {detailRoom.hasKitchen && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ChefHat className="h-4 w-4" /> Bếp riêng
                    </span>
                  )}
                  {detailRoom.hasAc && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Wind className="h-4 w-4" /> Điều hòa
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Ghi chú */}
            {detailRoom?.notes && (
              <div className="space-y-1.5 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ghi chú</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailRoom.notes}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex flex-col gap-2 bg-muted/30">
            <Button
              className="w-full"
              onClick={() => {
                setDetailRoom(null);
                router.push(`/contracts?roomId=${detailRoom?.id}`);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Xem hợp đồng phòng này
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { const r = detailRoom; setDetailRoom(null); setServicesRoom(r); }}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Dịch vụ phòng
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setDetailRoom(null); if (detailRoom) openEdit(detailRoom); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Room Services Sheet ─────────────────────────────────────────────── */}
      <RoomServicesSheet
        room={servicesRoom}
        open={!!servicesRoom}
        onClose={() => setServicesRoom(null)}
      />

      {/* ── Delete Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa phòng</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Phòng sẽ bị xóa vĩnh viễn nếu không còn hợp đồng hiệu lực.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRoom.isPending}
            >
              {deleteRoom.isPending ? "Đang xóa..." : "Xóa phòng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
