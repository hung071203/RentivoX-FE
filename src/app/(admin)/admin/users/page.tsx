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
  Lock,
  Unlock,
  Trash2,
  KeyRound,
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
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useToggleActive,
  useDeleteUser,
} from "@/hooks/useAdmin";
import { useAuthStore } from "@/stores/auth.store";
import { GENDER_LABEL, USER_ROLE_LABEL } from "@/constants/enums";
import { formatDate } from "@/utils/format";
import type { Gender, User, UserRole } from "@/types/auth.types";
import type {
  GetUsersParams,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/types/admin.types";

// ─── Validation ────────────────────────────────────────────────────────────────

const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
})();

const dobField = z
  .string()
  .optional()
  .refine(
    (val) => !val || new Date(val) <= new Date(MAX_DOB),
    "Người dùng phải từ 18 tuổi trở lên",
  );

const createSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  role: z.enum(["admin", "landlord"], { message: "Vui lòng chọn role" }),
  phone: z
    .string()
    .regex(/^(0[3-9])[0-9]{8}$/, "Số điện thoại không hợp lệ (VD: 0901234567)"),
  dateOfBirth: dobField,
  gender: z.enum(["male", "female", "other"]).optional(),
});

const updateSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^(0[3-9])[0-9]{8}$/, "Số điện thoại không hợp lệ (VD: 0901234567)"),
  isResetPassword: z.boolean().optional(),
  dateOfBirth: dobField,
  gender: z.enum(["male", "female", "other"]).optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

// ─── Badges ─────────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { pill: string; dot: string }> = {
    super_admin: {
      pill: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
      dot: "bg-orange-500",
    },
    admin: {
      pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
      dot: "bg-violet-500",
    },
    landlord: {
      pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
      dot: "bg-blue-500",
    },
    tenant: {
      pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      dot: "bg-emerald-500",
    },
  };
  const { pill, dot } = config[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {USER_ROLE_LABEL[role]}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
        isActive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-red-50 text-red-600 ring-red-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {isActive ? "Hoạt động" : "Đã khóa"}
    </span>
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

// ─── Form Field ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

function canManage(
  currentUserRole: string | undefined,
  targetRole: string,
): boolean {
  if (targetRole === "tenant") return false;
  if (
    currentUserRole === "admin" &&
    (targetRole === "admin" || targetRole === "super_admin")
  )
    return false;
  return true;
}

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [params, setParams] = useState<GetUsersParams>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminUsers(params);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleActive = useToggleActive();
  const deleteUser = useDeleteUser();

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    setValue: setCreateValue,
    watch: watchCreate,
    formState: { errors: createErrors },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm<UpdateForm>({ resolver: zodResolver(updateSchema) });

  function handleSearch(value: string) {
    setSearch(value);
    setParams((p) => ({ ...p, page: 1, search: value || undefined }));
  }

  function handleRoleFilter(value: string) {
    setRoleFilter(value);
    setParams((p) => ({
      ...p,
      page: 1,
      role: value === "all" ? undefined : (value as UserRole),
    }));
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setParams((p) => ({
      ...p,
      page: 1,
      isActive: value === "all" ? undefined : value === "true",
    }));
  }

  function openEdit(user: User) {
    setEditUser(user);
    resetEdit({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      isResetPassword: false,
      dateOfBirth: user.dateOfBirth ?? "",
      gender: user.gender ?? undefined,
    });
  }

  function closeCreate() {
    setCreateOpen(false);
    resetCreate();
  }

  function closeEdit() {
    setEditUser(null);
    resetEdit();
  }

  function onCreateSubmit(form: CreateForm) {
    const payload: CreateUserPayload = {
      email: form.email,
      fullName: form.fullName,
      role: form.role,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender,
    };
    createUser.mutate(payload, { onSuccess: closeCreate });
  }

  function onEditSubmit(form: UpdateForm) {
    if (!editUser) return;
    const payload: UpdateUserPayload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      isResetPassword: form.isResetPassword,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender,
    };
    updateUser.mutate({ id: editUser.id, payload }, { onSuccess: closeEdit });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteUser.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  const totalCount = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const limit = data?.limit ?? 20;

  const isResetPassword = watchEdit("isResetPassword");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tài khoản</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý toàn bộ tài khoản trong hệ thống
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo tài khoản
        </Button>
      </div>

      {/* Table card */}
      <Card>
        {/* Toolbar */}
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm theo tên, email..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả role</SelectItem>
                <SelectItem value="super_admin">
                  Quản trị viên cấp cao
                </SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="landlord">Chủ trọ</SelectItem>
                <SelectItem value="tenant">Người thuê</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[27%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="pr-4 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Không tìm thấy tài khoản nào
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-6 font-medium truncate">
                    {user.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canManage(currentUser?.role, user.role) && (
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
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive.mutate(user.id)}
                            disabled={toggleActive.isPending}
                          >
                            {user.isActive ? (
                              <>
                                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                                Khóa tài khoản
                              </>
                            ) : (
                              <>
                                <Unlock className="h-4 w-4 mr-2 text-emerald-600" />
                                Mở khóa
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(user.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa tài khoản
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                {(currentPage - 1) * limit + 1}–
                {Math.min(currentPage * limit, totalCount)} / {totalCount} tài
                khoản
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
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Tạo tài khoản</SheetTitle>
            <SheetDescription>
              Mật khẩu sẽ được tạo tự động và gửi cho người dùng qua email.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleCreateSubmit(onCreateSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField label="Họ tên" error={createErrors.fullName?.message}>
                <Input
                  {...registerCreate("fullName")}
                  placeholder="Nguyễn Văn A"
                />
              </FormField>

              <FormField label="Email" error={createErrors.email?.message}>
                <Input
                  type="email"
                  {...registerCreate("email")}
                  placeholder="email@example.com"
                />
              </FormField>

              <FormField
                label="Số điện thoại"
                error={createErrors.phone?.message}
              >
                <Input {...registerCreate("phone")} placeholder="0901234567" />
              </FormField>

              <FormField label="Role" error={createErrors.role?.message}>
                <Select
                  onValueChange={(v) =>
                    setCreateValue("role", v as CreateForm["role"], {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="admin">Quản trị viên</SelectItem>
                    )}
                    <SelectItem value="landlord">Chủ trọ</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Ngày sinh"
                error={createErrors.dateOfBirth?.message}
              >
                <Input
                  type="date"
                  max={MAX_DOB}
                  {...registerCreate("dateOfBirth")}
                />
              </FormField>

              <FormField label="Giới tính" error={createErrors.gender?.message}>
                <Select
                  value={watchCreate("gender") ?? ""}
                  onValueChange={(v) =>
                    setCreateValue("gender", v as Gender, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GENDER_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeCreate}>
                Hủy
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Chỉnh sửa tài khoản</SheetTitle>
            <SheetDescription className="truncate">
              {editUser?.email}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleEditSubmit(onEditSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField label="Họ tên" error={editErrors.fullName?.message}>
                <Input {...registerEdit("fullName")} />
              </FormField>

              <FormField label="Email" error={editErrors.email?.message}>
                <Input type="email" {...registerEdit("email")} />
              </FormField>

              <FormField
                label="Số điện thoại"
                error={editErrors.phone?.message}
              >
                <Input {...registerEdit("phone")} />
              </FormField>

              <FormField
                label="Ngày sinh"
                error={editErrors.dateOfBirth?.message}
              >
                <Input
                  type="date"
                  max={MAX_DOB}
                  {...registerEdit("dateOfBirth")}
                />
              </FormField>

              <FormField label="Giới tính" error={editErrors.gender?.message}>
                <Select
                  value={watchEdit("gender") ?? ""}
                  onValueChange={(v) =>
                    setEditValue("gender", v as Gender, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GENDER_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Reset password toggle */}
              <div
                className={`rounded-lg border p-4 transition-colors ${
                  isResetPassword
                    ? "border-primary/40 bg-primary/5"
                    : "border-border"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...registerEdit("isResetPassword")}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                      Cấp lại mật khẩu mới
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hệ thống sẽ tự sinh mật khẩu ngẫu nhiên cho tài khoản này.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeEdit}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa tài khoản</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Tài khoản sẽ bị xóa vĩnh viễn
              khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Đang xóa..." : "Xóa tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
