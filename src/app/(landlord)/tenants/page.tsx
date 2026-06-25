"use client";
import { useRef, useState } from "react";
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
  User,
  Camera,
  Lock,
  Unlock,
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
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useUploadTenantIdCard,
  useToggleTenantActive,
} from "@/hooks/useTenants";
import { GENDER_LABEL } from "@/constants/enums";
import type {
  Tenant,
  Gender,
  GetTenantsParams,
  CreateTenantPayload,
  UpdateTenantPayload,
} from "@/types/tenant.types";
import { SortableHead } from "@/components/common/SortableHead";

// ─── Helpers ────────────────────────────────────────────────────────────────

const opt = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);
const toDateInput = (v: string | null | undefined) =>
  v ? v.split("T")[0] : "";

// ─── Schema ─────────────────────────────────────────────────────────────────

const tenantSchema = z
  .object({
    fullName: z.string().min(1, "Họ tên không được để trống"),
    email: z.string(),
    phone: z.string(),
    dateOfBirth: z.string(),
    gender: z.enum(["male", "female", "other", ""]),
    idCardNumber: z.string().min(1, "Số CCCD/CMND không được để trống"),
    idCardIssuedDate: z.string(),
    idCardIssuedPlace: z.string(),
    permanentAddress: z.string(),
    createAccount: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Email không hợp lệ" });
    }
    if (data.createAccount && !data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Cần có email để tạo tài khoản" });
    }
    if (data.dateOfBirth) {
      const min16 = new Date();
      min16.setFullYear(min16.getFullYear() - 16);
      if (new Date(data.dateOfBirth) > min16) {
        ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Khách thuê phải từ 16 tuổi trở lên" });
      }
    }
  });

type TenantForm = z.infer<typeof tenantSchema>;

// ─── Pagination ──────────────────────────────────────────────────────────────

type PaginationItem =
  | { type: "page"; value: number }
  | { type: "ellipsis"; key: string };

function buildPagination(current: number, total: number): PaginationItem[] {
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 1
  );
  const items: PaginationItem[] = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && pages[idx - 1] !== p - 1)
      items.push({ type: "ellipsis", key: `e-${p}` });
    items.push({ type: "page", value: p });
  });
  return items;
}

// ─── FormField ───────────────────────────────────────────────────────────────

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

// ─── Badges ──────────────────────────────────────────────────────────────────

function AccountBadge({ hasAccount, isActive }: { hasAccount: boolean; isActive?: boolean | null }) {
  if (!hasAccount) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        Chưa có
      </span>
    );
  }
  if (isActive === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Đã khóa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Có tài khoản
    </span>
  );
}

// ─── IdCardUpload ────────────────────────────────────────────────────────────

function IdCardUpload({
  label,
  url,
  onUpload,
  isPending,
}: {
  label: string;
  url: string | null;
  onUpload: (file: File) => void;
  isPending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className="relative border-2 border-dashed rounded-lg overflow-hidden bg-muted/30"
        style={{ aspectRatio: "16/10" }}
      >
        {url ? (
          <>
            <img
              src={url}
              alt={label}
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
            <span className="text-xs">Nhấn để tải ảnh</span>
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Đang tải...</span>
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
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-2 gap-0" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <img src={url ?? ""} alt={label} className="w-full h-auto rounded-md" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const today = new Date().toISOString().split("T")[0];
  const maxDob16 = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 16); return d.toISOString().split("T")[0]; })();

  const [params, setParams] = useState<GetTenantsParams>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useTenants(params);
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();
  const uploadIdCard = useUploadTenantIdCard();
  const toggleActive = useToggleTenantActive();

  // ── Create form ──────────────────────────────────────────────────────────
  const {
    register: regC,
    handleSubmit: submitC,
    control: controlC,
    watch: watchC,
    reset: resetC,
    formState: { errors: errC },
  } = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { fullName: "", email: "", phone: "", dateOfBirth: "", gender: "", idCardNumber: "", idCardIssuedDate: "", idCardIssuedPlace: "", permanentAddress: "", createAccount: false },
  });

  // ── Edit form ────────────────────────────────────────────────────────────
  const {
    register: regE,
    handleSubmit: submitE,
    control: controlE,
    watch: watchE,
    reset: resetE,
    formState: { errors: errE },
  } = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { fullName: "", email: "", phone: "", dateOfBirth: "", gender: "", idCardNumber: "", idCardIssuedDate: "", idCardIssuedPlace: "", permanentAddress: "", createAccount: false },
  });

  const emailC = watchC("email");
  const emailE = watchE("email");

  function handleSearch(value: string) {
    setSearch(value);
    setParams((p) => ({ ...p, page: 1, search: value || undefined }));
  }

  function handleSort(field: string, direction: "ASC" | "DESC" | undefined) {
    setParams((p) => ({ ...p, page: 1, orderBy: direction ? field : undefined, orderDirection: direction }));
  }

  const emptyForm: TenantForm = { fullName: "", email: "", phone: "", dateOfBirth: "", gender: "", idCardNumber: "", idCardIssuedDate: "", idCardIssuedPlace: "", permanentAddress: "", createAccount: false };

  function openCreate() {
    resetC(emptyForm);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    resetC(emptyForm);
  }

  function openEdit(tenant: Tenant) {
    setEditTenant(tenant);
    resetE({
      fullName: tenant.fullName,
      email: tenant.email ?? "",
      phone: tenant.phone ?? "",
      dateOfBirth: toDateInput(tenant.dateOfBirth),
      gender: tenant.gender ?? "",
      idCardNumber: tenant.idCardNumber ?? "",
      idCardIssuedDate: toDateInput(tenant.idCardIssuedDate),
      idCardIssuedPlace: tenant.idCardIssuedPlace ?? "",
      permanentAddress: tenant.permanentAddress ?? "",
      createAccount: false,
    });
  }

  function closeEdit() {
    setEditTenant(null);
    resetE(emptyForm);
  }

  function formToPayload(form: TenantForm): Omit<CreateTenantPayload, 'createAccount'> & { createAccount?: boolean } {
    return {
      fullName: form.fullName,
      email: opt(form.email),
      phone: opt(form.phone),
      dateOfBirth: opt(form.dateOfBirth),
      gender: (form.gender || undefined) as Gender | undefined,
      idCardNumber: opt(form.idCardNumber),
      idCardIssuedDate: opt(form.idCardIssuedDate),
      idCardIssuedPlace: opt(form.idCardIssuedPlace),
      permanentAddress: opt(form.permanentAddress),
      createAccount: form.createAccount || undefined,
    };
  }

  function onCreateSubmit(form: TenantForm) {
    createTenant.mutate(formToPayload(form), { onSuccess: closeCreate });
  }

  function onEditSubmit(form: TenantForm) {
    if (!editTenant) return;
    updateTenant.mutate(
      { id: editTenant.id, data: formToPayload(form) },
      { onSuccess: closeEdit }
    );
  }

  function handleUpload(side: "front" | "back", file: File) {
    if (!editTenant) return;
    uploadIdCard.mutate(
      { id: editTenant.id, side, file },
      {
        onSuccess: (updated) => setEditTenant(updated),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteTenant.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  const totalCount = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const limit = data?.limit ?? 20;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Khách thuê</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin khách thuê
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm khách thuê
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm tên, SĐT, CCCD..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <Select
              value={
                params.hasAccount === undefined
                  ? "all"
                  : params.hasAccount
                  ? "yes"
                  : "no"
              }
              onValueChange={(v) =>
                setParams((p) => ({
                  ...p,
                  page: 1,
                  hasAccount:
                    v === "all" ? undefined : v === "yes" ? true : false,
                }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Tài khoản" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="yes">Có tài khoản</SelectItem>
                <SelectItem value="no">Chưa có tài khoản</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <SortableHead label="Họ tên" field="fullName" orderBy={params.orderBy} orderDirection={params.orderDirection} onSort={handleSort} className="pl-6" />
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số CCCD</TableHead>
                <TableHead>Giới tính</TableHead>
                <TableHead>Tài khoản</TableHead>
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
                    {search || params.hasAccount !== undefined
                      ? "Không tìm thấy khách thuê nào phù hợp"
                      : "Chưa có khách thuê nào. Hãy thêm khách thuê đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium truncate">
                        {tenant.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tenant.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {tenant.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {tenant.idCardNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tenant.gender ? GENDER_LABEL[tenant.gender] : "—"}
                  </TableCell>
                  <TableCell>
                    <AccountBadge hasAccount={!!tenant.userId} isActive={tenant.user?.isActive} />
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
                        <DropdownMenuItem onClick={() => openEdit(tenant)}>
                          <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {tenant.userId && (
                          <DropdownMenuItem
                            onClick={() => toggleActive.mutate(tenant.id)}
                            disabled={toggleActive.isPending}
                            className={
                              tenant.user?.isActive === false
                                ? "text-emerald-600 focus:text-emerald-600"
                                : "text-amber-600 focus:text-amber-600"
                            }
                          >
                            {tenant.user?.isActive === false ? (
                              <>
                                <Unlock className="h-4 w-4 mr-2" />
                                Mở khóa
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Khóa tài khoản
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(tenant.id)}
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
                {Math.min(currentPage * limit, totalCount)} / {totalCount} khách
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
                  )
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

      {/* ── Create Sheet ──────────────────────────────────────────────────────── */}
      <Sheet open={createOpen} onOpenChange={(o) => { if (!o) closeCreate(); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Thêm khách thuê</SheetTitle>
            <SheetDescription>Điền thông tin để tạo hồ sơ khách thuê.</SheetDescription>
          </SheetHeader>

          <form onSubmit={submitC(onCreateSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Thông tin cơ bản */}
              <FormField label="Họ và tên" error={errC.fullName?.message} required>
                <Input {...regC("fullName")} placeholder="Nguyễn Văn A" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Số điện thoại" error={errC.phone?.message}>
                  <Input {...regC("phone")} placeholder="0901234567" />
                </FormField>
                <FormField label="Email" error={errC.email?.message}>
                  <Input {...regC("email")} type="email" placeholder="email@gmail.com" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ngày sinh" error={errC.dateOfBirth?.message}>
                  <Input {...regC("dateOfBirth")} type="date" max={maxDob16} />
                </FormField>
                <FormField label="Giới tính" error={errC.gender?.message}>
                  <Controller
                    name="gender"
                    control={controlC}
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              {/* CCCD */}
              <div className="border-t pt-5 space-y-4">
                <p className="text-sm font-medium">Giấy tờ tùy thân</p>
                <FormField label="Số CCCD/CMND" error={errC.idCardNumber?.message} required>
                  <Input {...regC("idCardNumber")} placeholder="012345678901" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ngày cấp" error={errC.idCardIssuedDate?.message}>
                    <Input {...regC("idCardIssuedDate")} type="date" max={today} />
                  </FormField>
                  <FormField label="Nơi cấp" error={errC.idCardIssuedPlace?.message}>
                    <Input {...regC("idCardIssuedPlace")} placeholder="Cục CSQLHC..." />
                  </FormField>
                </div>
                <FormField label="Địa chỉ thường trú" error={errC.permanentAddress?.message}>
                  <textarea
                    {...regC("permanentAddress")}
                    rows={2}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </FormField>
              </div>

              {/* Tài khoản */}
              {!!emailC && (
                <div className="border-t pt-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...regC("createAccount")}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">Tạo tài khoản đăng nhập</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Khách thuê sẽ nhận email chứa mật khẩu để đăng nhập hệ thống
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeCreate}>Hủy</Button>
              <Button type="submit" disabled={createTenant.isPending}>
                {createTenant.isPending ? "Đang tạo..." : "Tạo khách thuê"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ────────────────────────────────────────────────────────── */}
      <Sheet open={!!editTenant} onOpenChange={(o) => { if (!o) closeEdit(); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Chỉnh sửa khách thuê</SheetTitle>
            <SheetDescription className="truncate">
              {editTenant?.fullName}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={submitE(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Thông tin cơ bản */}
              <FormField label="Họ và tên" error={errE.fullName?.message} required>
                <Input {...regE("fullName")} />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Số điện thoại" error={errE.phone?.message}>
                  <Input {...regE("phone")} />
                </FormField>
                <FormField label="Email" error={errE.email?.message}>
                  <Input {...regE("email")} type="email" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ngày sinh" error={errE.dateOfBirth?.message}>
                  <Input {...regE("dateOfBirth")} type="date" max={maxDob16} />
                </FormField>
                <FormField label="Giới tính" error={errE.gender?.message}>
                  <Controller
                    name="gender"
                    control={controlE}
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              {/* CCCD */}
              <div className="border-t pt-5 space-y-4">
                <p className="text-sm font-medium">Giấy tờ tùy thân</p>
                <FormField label="Số CCCD/CMND" error={errE.idCardNumber?.message} required>
                  <Input {...regE("idCardNumber")} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ngày cấp" error={errE.idCardIssuedDate?.message}>
                    <Input {...regE("idCardIssuedDate")} type="date" max={today} />
                  </FormField>
                  <FormField label="Nơi cấp" error={errE.idCardIssuedPlace?.message}>
                    <Input {...regE("idCardIssuedPlace")} />
                  </FormField>
                </div>
                <FormField label="Địa chỉ thường trú" error={errE.permanentAddress?.message}>
                  <textarea
                    {...regE("permanentAddress")}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </FormField>
              </div>

              {/* Ảnh CCCD */}
              <div className="border-t pt-5 space-y-3">
                <p className="text-sm font-medium">Ảnh CCCD/CMND</p>
                <div className="grid grid-cols-2 gap-4">
                  <IdCardUpload
                    label="Mặt trước"
                    url={editTenant?.idCardFrontUrl ?? null}
                    onUpload={(file) => handleUpload("front", file)}
                    isPending={
                      uploadIdCard.isPending &&
                      uploadIdCard.variables?.side === "front"
                    }
                  />
                  <IdCardUpload
                    label="Mặt sau"
                    url={editTenant?.idCardBackUrl ?? null}
                    onUpload={(file) => handleUpload("back", file)}
                    isPending={
                      uploadIdCard.isPending &&
                      uploadIdCard.variables?.side === "back"
                    }
                  />
                </div>
              </div>

              {/* Tài khoản — chỉ hiện nếu chưa có */}
              {editTenant?.userId === null && !!emailE && (
                <div className="border-t pt-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...regE("createAccount")}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">Tạo tài khoản đăng nhập</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Khách thuê sẽ nhận email chứa mật khẩu để đăng nhập
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
              <Button type="button" variant="outline" onClick={closeEdit}>Hủy</Button>
              <Button type="submit" disabled={updateTenant.isPending}>
                {updateTenant.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa khách thuê</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Khách thuê sẽ bị xóa vĩnh viễn nếu chưa có lịch sử hợp đồng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTenant.isPending}
            >
              {deleteTenant.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
