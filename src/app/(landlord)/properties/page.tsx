"use client";
import { useState } from "react";
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
import {
  AddressSelector,
  type AddressValue,
} from "@/components/common/AddressSelector";
import { formatDate } from "@/utils/format";
import type {
  CreatePropertyPayload,
  GetPropertiesParams,
  Property,
  UpdatePropertyPayload,
} from "@/types/property.types";

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

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const [params, setParams] = useState<GetPropertiesParams>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
                <TableHead className="pl-6">Tên nhà trọ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Ngày tạo</TableHead>
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
                <TableRow key={property.id}>
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
                  <TableCell className="pr-4 text-right">
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
