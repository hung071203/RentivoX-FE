"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Upload,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { roomsApi } from "@/apis/rooms.api"
import { tenantsApi } from "@/apis/tenants.api"
import { servicesApi } from "@/apis/services.api"
import {
  useContracts,
  useContract,
  useCreateContract,
  useCreateAmendment,
  useAddOccupant,
  useRemoveOccupant,
  useTerminateContract,
} from "@/hooks/useContracts"
import { useCreateTenant } from "@/hooks/useTenants"
import { useProperties } from "@/hooks/useProperties"
import { SearchCombobox } from "@/components/common/SearchCombobox"
import type { ComboboxOption } from "@/components/common/SearchCombobox"
import { AMENDMENT_TYPE_LABEL, ROOM_STATUS_LABEL, SERVICE_TYPE_LABEL } from "@/constants/enums"
import { formatCurrency, formatDate } from "@/utils/format"
import type {
  AmendmentType,
  ContractStatus,
  CreateAmendmentPayload,
  CreateContractPayload,
  GetContractsParams,
} from "@/types/contract.types"

// ─── Quick tenant schema ─────────────────────────────────────────────────────

const quickTenantSchema = z
  .object({
    fullName: z.string().min(1, "Họ tên không được để trống"),
    phone: z.string(),
    email: z.string(),
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
      ctx.addIssue({ code: "custom", path: ["email"], message: "Email không hợp lệ" })
    }
    if (data.createAccount && !data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Cần có email để tạo tài khoản" })
    }
  })

type QuickTenantForm = z.infer<typeof quickTenantSchema>

const emptyQuickTenant: QuickTenantForm = {
  fullName: "", phone: "", email: "", dateOfBirth: "", gender: "",
  idCardNumber: "", idCardIssuedDate: "", idCardIssuedPlace: "",
  permanentAddress: "", createAccount: false,
}

// ─── Local form row types ────────────────────────────────────────────────────

type OccupantRow = { id: string; tenantId: string; isOwner: boolean; movedInDate: string }
type ServiceRow = {
  serviceId: string
  name: string
  type: string
  unit: string | null
  defaultPrice: number
  price: string
  selected: boolean
}
type AmendServiceRow = {
  contractServiceId?: string
  serviceId?: string
  name: string
  currentPrice: number | null
  newPrice: string
  changed: boolean
  isNew: boolean
}

// ─── Pagination helper ───────────────────────────────────────────────────────

type PaginationItem = { type: "page"; value: number } | { type: "ellipsis"; key: string }

function buildPagination(current: number, total: number): PaginationItem[] {
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 1
  )
  const items: PaginationItem[] = []
  pages.forEach((p, idx) => {
    if (idx > 0 && pages[idx - 1] !== p - 1) items.push({ type: "ellipsis", key: `e-${p}` })
    items.push({ type: "page", value: p })
  })
  return items
}

// ─── FormField ───────────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
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
  )
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const styles: Record<ContractStatus, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    expired: "bg-muted text-muted-foreground ring-border",
    terminated: "bg-red-50 text-red-700 ring-red-200",
  }
  const dots: Record<ContractStatus, string> = {
    active: "bg-emerald-500",
    expired: "bg-muted-foreground/40",
    terminated: "bg-red-500",
  }
  const labels: Record<ContractStatus, string> = {
    active: "Đang hiệu lực",
    expired: "Hết hạn",
    terminated: "Đã chấm dứt",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  )
}

function AmendmentTypeBadge({ type }: { type: AmendmentType }) {
  const styles: Record<AmendmentType, string> = {
    renewal: "bg-blue-50 text-blue-700 ring-blue-200",
    price_adjustment: "bg-violet-50 text-violet-700 ring-violet-200",
    general: "bg-muted text-muted-foreground ring-border",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ${styles[type]}`}>
      {AMENDMENT_TYPE_LABEL[type] ?? type}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const today = new Date().toISOString().split("T")[0]

  // ── List params ──────────────────────────────────────────────────────────
  const [params, setParams] = useState<GetContractsParams>({ page: 1, limit: 20 })
  const [search, setSearch] = useState("")
  const { data, isLoading } = useContracts(params)

  // ── Panel state ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [prevDetailId, setPrevDetailId] = useState<string | null>(null)
  const [amendContractId, setAmendContractId] = useState<string | null>(null)
  const [terminateId, setTerminateId] = useState<string | null>(null)

  const activeId = detailId ?? amendContractId
  const { data: activeContract, isLoading: detailLoading } = useContract(activeId ?? "")

  // ── Reference data ───────────────────────────────────────────────────────
  const { data: propertiesData } = useProperties({ limit: 100 })

  // ── Room search (debounced, server-side) ─────────────────────────────────
  const [cProperty, setCProperty] = useState("")
  const [roomSearchRaw, setRoomSearchRaw] = useState("")
  const [roomSearch, setRoomSearch] = useState("")
  const [selectedRoomOption, setSelectedRoomOption] = useState<ComboboxOption | null>(null)
  const [selectedRoomPropertyId, setSelectedRoomPropertyId] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setRoomSearch(roomSearchRaw), 300)
    return () => clearTimeout(t)
  }, [roomSearchRaw])

  const { data: roomsData, isFetching: roomsFetching } = useQuery({
    queryKey: ["rooms-search", roomSearch, cProperty],
    queryFn: () =>
      roomsApi.getAll({
        search: roomSearch || undefined,
        propertyId: cProperty || undefined,
        limit: 20,
        orderDirection: "ASC",
      }),
    enabled: !!cProperty,
  })

  const roomOptions: ComboboxOption[] = [
    ...(selectedRoomOption && !roomsData?.items.find((r) => r.id === selectedRoomOption.value)
      ? [selectedRoomOption]
      : []),
    ...(roomsData?.items.map((r) => ({
      value: r.id,
      label: `Phòng ${r.roomNumber}`,
      sublabel: `${r.property?.name ?? ""} — ${ROOM_STATUS_LABEL[r.status] ?? r.status}`,
    })) ?? []),
  ]

  function handleRoomSelect(roomId: string) {
    setCRoom(roomId)
    const room = roomsData?.items.find((r) => r.id === roomId)
    if (room) {
      const opt: ComboboxOption = {
        value: room.id,
        label: `Phòng ${room.roomNumber}`,
        sublabel: `${room.property?.name ?? ""} — ${ROOM_STATUS_LABEL[room.status] ?? room.status}`,
      }
      setSelectedRoomOption(opt)
      setSelectedRoomPropertyId(room.propertyId)
      setSelectedRoomType(room.roomType)
      if (room.roomType === "shared") {
        setCOccupants((p) => [{ ...(p[0] ?? { id: "0", tenantId: "", movedInDate: today }), isOwner: true }])
      }
    }
    setCErrors((e) => ({ ...e, room: "" }))
  }

  // ── Tenant search (debounced, server-side, shared across all comboboxes) ──
  const [tenantSearchRaw, setTenantSearchRaw] = useState("")
  const [tenantSearch, setTenantSearch] = useState("")
  // Cache label cho từng occupant đã chọn (key = occupantRow.id)
  const [selectedTenantOptions, setSelectedTenantOptions] = useState<Record<string, ComboboxOption>>({})

  useEffect(() => {
    const t = setTimeout(() => setTenantSearch(tenantSearchRaw), 300)
    return () => clearTimeout(t)
  }, [tenantSearchRaw])

  const { data: tenantsData, isFetching: tenantsFetching } = useQuery({
    queryKey: ["tenants-search", tenantSearch],
    queryFn: () => tenantsApi.getAll({ search: tenantSearch || undefined, limit: 20 }),
  })

  function getTenantOptions(occupantId: string): ComboboxOption[] {
    const cached = selectedTenantOptions[occupantId]
    const items = tenantsData?.items.map((t) => ({ value: t.id, label: t.fullName })) ?? []
    if (cached && !items.find((i) => i.value === cached.value)) return [cached, ...items]
    return items
  }

  function handleTenantSelect(occupantId: string, tenantId: string) {
    const tenant = tenantsData?.items.find((t) => t.id === tenantId)
    if (tenant) {
      setSelectedTenantOptions((prev) => ({
        ...prev,
        [occupantId]: { value: tenant.id, label: tenant.fullName },
      }))
    }
    setCOccupants((p) => p.map((o) => (o.id === occupantId ? { ...o, tenantId } : o)))
  }

  function handleAmendTenantSelect(occupantId: string, tenantId: string) {
    const tenant = tenantsData?.items.find((t) => t.id === tenantId)
    if (tenant) {
      setSelectedTenantOptions((prev) => ({
        ...prev,
        [occupantId]: { value: tenant.id, label: tenant.fullName },
      }))
    }
    setAAddOccupants((p) => p.map((o) => (o.id === occupantId ? { ...o, tenantId } : o)))
  }

  // ── Quick tenant form ────────────────────────────────────────────────────
  const {
    register: regQt,
    handleSubmit: submitQt,
    control: controlQt,
    watch: watchQt,
    reset: resetQt,
    formState: { errors: errQt },
  } = useForm<QuickTenantForm>({
    resolver: zodResolver(quickTenantSchema),
    defaultValues: emptyQuickTenant,
  })
  const qtEmail = watchQt("email")

  // ── Mutations ────────────────────────────────────────────────────────────
  const createContract = useCreateContract()
  const createTenant = useCreateTenant()
  const createAmendment = useCreateAmendment()
  const addOccupantMut = useAddOccupant()
  const removeOccupantMut = useRemoveOccupant()
  const terminateContract = useTerminateContract()

  // ── Remove occupant confirm ──────────────────────────────────────────────
  const [removeOccupantTarget, setRemoveOccupantTarget] = useState<{ id: string; name: string } | null>(null)

  // ── Add occupant inline form (detail sheet) ──────────────────────────────
  const [addOccupantOpen, setAddOccupantOpen] = useState(false)
  const [addOccupantTenantId, setAddOccupantTenantId] = useState("")
  const [addOccupantMovedIn, setAddOccupantMovedIn] = useState(today)
  const [addOccupantErrors, setAddOccupantErrors] = useState<Record<string, string>>({})

  function resetAddOccupant() {
    setAddOccupantOpen(false)
    setAddOccupantTenantId("")
    setAddOccupantMovedIn(today)
    setAddOccupantErrors({})
  }

  function submitAddOccupant() {
    const errors: Record<string, string> = {}
    if (!addOccupantTenantId) errors.tenant = "Vui lòng chọn khách thuê"
    if (!addOccupantMovedIn) errors.movedIn = "Vui lòng chọn ngày chuyển vào"
    setAddOccupantErrors(errors)
    if (Object.keys(errors).length > 0 || !detailId) return
    addOccupantMut.mutate(
      { id: detailId, data: { tenantId: addOccupantTenantId, movedInDate: addOccupantMovedIn } },
      { onSuccess: resetAddOccupant },
    )
  }

  // ── Quick tenant creation dialog ─────────────────────────────────────────
  const [quickTenantOpen, setQuickTenantOpen] = useState(false)
  const [quickTenantForId, setQuickTenantForId] = useState<string | null>(null)

  // ── Create form state ────────────────────────────────────────────────────
  const [cRoom, setCRoom] = useState("")
  const [cRent, setCRent] = useState("")
  const [cDeposit, setCDeposit] = useState("")
  const [cStart, setCStart] = useState(today)
  const [cEnd, setCEnd] = useState("")
  const [cNotes, setCNotes] = useState("")
  const [cFile, setCFile] = useState<File | null>(null)
  const [cOccupants, setCOccupants] = useState<OccupantRow[]>([
    { id: "0", tenantId: "", isOwner: true, movedInDate: today },
  ])
  const [cServiceRows, setCServiceRows] = useState<ServiceRow[]>([])
  const [selectedRoomType, setSelectedRoomType] = useState<string>("")
  const [cErrors, setCErrors] = useState<Record<string, string>>({})

  const { data: propServicesData } = useQuery({
    queryKey: ["services", { propertyId: selectedRoomPropertyId, isActive: true, limit: 100 }],
    queryFn: () => servicesApi.getAll({ propertyId: selectedRoomPropertyId, isActive: true, limit: 100 }),
    enabled: !!selectedRoomPropertyId,
  })

  const prevRoomId = useRef("")
  useEffect(() => {
    if (cRoom !== prevRoomId.current) {
      prevRoomId.current = cRoom
      setCServiceRows([])
    }
  }, [cRoom])

  useEffect(() => {
    if (!propServicesData?.items || !cRoom) return
    setCServiceRows(
      propServicesData.items.map((s) => ({
        serviceId: s.id,
        name: s.name,
        type: s.type,
        unit: s.unit,
        defaultPrice: s.unitPrice,
        price: String(s.unitPrice),
        selected: false,
      }))
    )
  }, [propServicesData, cRoom])

  const amendPropertyId = activeContract?.room?.property?.id
  const { data: amendServicesData } = useQuery({
    queryKey: ["services", { propertyId: amendPropertyId, isActive: true, limit: 100 }],
    queryFn: () => servicesApi.getAll({ propertyId: amendPropertyId!, isActive: true, limit: 100 }),
    enabled: !!amendPropertyId && !!amendContractId,
  })

  // ── Amendment form state ─────────────────────────────────────────────────
  const [aType, setAType] = useState<AmendmentType | "">("")
  const [aEffDate, setAEffDate] = useState(today)
  const [aNewRent, setANewRent] = useState("")
  const [aNewEnd, setANewEnd] = useState("")
  const [aNotes, setANotes] = useState("")
  const [aFile, setAFile] = useState<File | null>(null)
  const [aServiceChanges, setAServiceChanges] = useState<AmendServiceRow[]>([])
  const [aAddOccupants, setAAddOccupants] = useState<OccupantRow[]>([])
  const [aErrors, setAErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!amendContractId || !activeContract) {
      setAServiceChanges([])
      return
    }
    const inContractIds = new Set((activeContract.services ?? []).map((cs) => cs.serviceId))
    const existing: AmendServiceRow[] = (activeContract.services ?? []).map((cs) => ({
      contractServiceId: cs.id,
      serviceId: cs.serviceId,
      name: cs.service?.name ?? "(dịch vụ)",
      currentPrice: cs.unitPrice,
      newPrice: String(cs.unitPrice),
      changed: false,
      isNew: false,
    }))
    const newServices: AmendServiceRow[] = (amendServicesData?.items ?? [])
      .filter((s) => !inContractIds.has(s.id))
      .map((s) => ({
        contractServiceId: undefined,
        serviceId: s.id,
        name: s.name,
        currentPrice: null,
        newPrice: String(s.unitPrice),
        changed: false,
        isNew: true,
      }))
    setAServiceChanges([...existing, ...newServices])
  }, [activeContract, amendContractId, amendServicesData])

  // ── Terminate form state ─────────────────────────────────────────────────
  const [tDate, setTDate] = useState(today)
  const [tReason, setTReason] = useState("")

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSearch(value: string) {
    setSearch(value)
    setParams((p) => ({ ...p, page: 1, search: value || undefined }))
  }

  function handlePropertyChange(propId: string) {
    setCProperty(propId)
    setCRoom("")
    setSelectedRoomOption(null)
    setSelectedRoomPropertyId("")
    setSelectedRoomType("")
    setCServiceRows([])
    prevRoomId.current = ""
    setRoomSearchRaw("")
    setRoomSearch("")
  }

  // Create
  function openCreate() {
    setCProperty("")
    setCRoom("")
    setCRent("")
    setCDeposit("")
    setCStart(today)
    setCEnd("")
    setCNotes("")
    setCFile(null)
    setCOccupants([{ id: "0", tenantId: "", isOwner: true, movedInDate: today }])
    setCServiceRows([])
    setSelectedRoomType("")
    setCErrors({})
    prevRoomId.current = ""
    setRoomSearchRaw("")
    setRoomSearch("")
    setSelectedRoomOption(null)
    setSelectedRoomPropertyId("")
    setTenantSearchRaw("")
    setTenantSearch("")
    setSelectedTenantOptions({})
    setCreateOpen(true)
  }

  function addOccupant() {
    setCOccupants((p) => [...p, { id: Date.now().toString(), tenantId: "", isOwner: false, movedInDate: today }])
  }

  function removeOccupant(id: string) {
    setCOccupants((p) => p.filter((o) => o.id !== id))
  }

  function setOccupantOwner(id: string) {
    setCOccupants((p) => p.map((o) => ({ ...o, isOwner: o.id === id })))
  }

  function openQuickTenant(occupantId: string) {
    setQuickTenantForId(occupantId)
    resetQt(emptyQuickTenant)
    setQuickTenantOpen(true)
  }

  function onQuickTenantSubmit(form: QuickTenantForm) {
    const opt = (v: string) => v.trim() || undefined
    createTenant.mutate(
      {
        fullName: form.fullName.trim(),
        phone: opt(form.phone),
        email: opt(form.email),
        dateOfBirth: opt(form.dateOfBirth),
        gender: (form.gender || undefined) as import("@/types/tenant.types").Gender | undefined,
        idCardNumber: opt(form.idCardNumber),
        idCardIssuedDate: opt(form.idCardIssuedDate),
        idCardIssuedPlace: opt(form.idCardIssuedPlace),
        permanentAddress: opt(form.permanentAddress),
        createAccount: form.createAccount || undefined,
      },
      {
        onSuccess: (newTenant) => {
          setQuickTenantOpen(false)
          if (!quickTenantForId) return
          if (quickTenantForId === "add-occ") {
            setSelectedTenantOptions((prev) => ({
              ...prev,
              "add-occ": { value: newTenant.id, label: newTenant.fullName },
            }))
            setAddOccupantTenantId(newTenant.id)
          } else {
            setSelectedTenantOptions((prev) => ({
              ...prev,
              [quickTenantForId]: { value: newTenant.id, label: newTenant.fullName },
            }))
            setCOccupants((p) => p.map((o) => (o.id === quickTenantForId ? { ...o, tenantId: newTenant.id } : o)))
          }
        },
      }
    )
  }

  function validateCreate(): boolean {
    const errors: Record<string, string> = {}
    if (!cRoom) errors.room = "Vui lòng chọn phòng"
    if (cRent === "" || Number(cRent) < 0) errors.rent = "Vui lòng nhập tiền phòng hợp lệ"
    if (cDeposit === "" || Number(cDeposit) < 0) errors.deposit = "Vui lòng nhập tiền cọc hợp lệ"
    if (!cStart) errors.startDate = "Vui lòng chọn ngày bắt đầu"
    if (!cEnd) errors.endDate = "Vui lòng chọn ngày kết thúc"
    if (cStart && cEnd && cEnd <= cStart) errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu"
    if (!cFile) errors.file = "Vui lòng đính kèm file hợp đồng"
    if (cOccupants.length === 0) errors.occupants = "Cần ít nhất 1 người ở"
    else if (!cOccupants.some((o) => o.isOwner)) errors.occupants = "Cần chọn 1 người là đại diện ký hợp đồng"
    else if (cOccupants.some((o) => !o.tenantId)) errors.occupants = "Vui lòng chọn khách thuê cho tất cả người ở"
    else if (cOccupants.some((o) => !o.movedInDate)) errors.occupants = "Vui lòng nhập ngày chuyển vào"
    else if (cStart && cOccupants.some((o) => o.movedInDate < cStart)) errors.occupants = "Ngày chuyển vào không được trước ngày bắt đầu hợp đồng"
    else {
      const ids = cOccupants.map((o) => o.tenantId)
      if (new Set(ids).size !== ids.length) errors.occupants = "Không được chọn trùng khách thuê"
    }
    setCErrors(errors)
    return Object.keys(errors).length === 0
  }

  function submitCreate() {
    if (!validateCreate()) return
    const payload: CreateContractPayload = {
      roomId: cRoom,
      rentAmount: Number(cRent),
      depositAmount: Number(cDeposit),
      startDate: cStart,
      endDate: cEnd,
      notes: cNotes || undefined,
      occupants: cOccupants.map((o) => ({
        tenantId: o.tenantId,
        isOwner: o.isOwner,
        movedInDate: o.movedInDate,
      })),
      services: cServiceRows
        .filter((s) => s.selected)
        .map((s) => ({ serviceId: s.serviceId, unitPrice: Number(s.price) })),
      file: cFile!,
    }
    createContract.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  // Detail
  function openDetail(id: string) {
    setDetailId(id)
  }

  function closeDetail() {
    setDetailId(null)
    resetAddOccupant()
  }

  // Amendment
  function openAmend(contractId: string) {
    if (detailId === contractId) {
      setPrevDetailId(detailId)
      setDetailId(null)
    }
    setAmendContractId(contractId)
    setAType("")
    setAEffDate(today)
    setANewRent("")
    setANewEnd("")
    setANotes("")
    setAFile(null)
    setAAddOccupants([])
    setAErrors({})
  }

  function closeAmend() {
    if (prevDetailId) {
      setDetailId(prevDetailId)
      setPrevDetailId(null)
    }
    setAmendContractId(null)
  }

  function validateAmend(): boolean {
    const errors: Record<string, string> = {}
    if (!aType) errors.type = "Vui lòng chọn loại phụ lục"
    if (!aFile) errors.file = "Vui lòng đính kèm file phụ lục"

    if (aType === "renewal") {
      if (!aNewEnd) errors.newEnd = "Vui lòng nhập ngày kết thúc mới"
      else if (activeContract?.endDate && aNewEnd <= activeContract.endDate)
        errors.newEnd = "Ngày kết thúc mới phải sau ngày kết thúc hiện tại"
    } else if (aType === "price_adjustment") {
      if (!aEffDate) errors.effDate = "Vui lòng chọn ngày hiệu lực"
      else if (aEffDate < today) errors.effDate = "Ngày hiệu lực không được trước hôm nay"
      else if (activeContract?.endDate && aEffDate > activeContract.endDate)
        errors.effDate = "Ngày hiệu lực không được sau ngày kết thúc hợp đồng"
    } else if (aType === "general") {
      if (!aEffDate) errors.effDate = "Vui lòng chọn ngày hiệu lực"
    }

    setAErrors(errors)
    return Object.keys(errors).length === 0
  }

  function submitAmend() {
    if (!validateAmend() || !amendContractId || !aFile) return
    const isRenewal = aType === "renewal"
    const isPriceAdj = aType === "price_adjustment"
    const isGeneral = aType === "general"
    const payload: CreateAmendmentPayload = {
      amendmentType: aType as AmendmentType,
      effectiveDate: isRenewal ? today : aEffDate,
      newRentAmount: (isPriceAdj || isGeneral) && aNewRent ? Number(aNewRent) : undefined,
      newEndDate: (isRenewal || isGeneral) ? (aNewEnd || undefined) : undefined,
      notes: aNotes || undefined,
      serviceChanges: (isPriceAdj || isGeneral)
        ? aServiceChanges.filter((s) => s.changed).map((s) => ({
            contractServiceId: s.contractServiceId,
            serviceId: s.isNew ? s.serviceId : undefined,
            newUnitPrice: Number(s.newPrice),
          }))
        : undefined,
      file: aFile,
    }
    createAmendment.mutate({ id: amendContractId, data: payload }, { onSuccess: closeAmend })
  }

  // Terminate
  function openTerminate(id: string) {
    setTerminateId(id)
    setTDate(today)
    setTReason("")
  }

  function submitTerminate() {
    if (!terminateId) return
    terminateContract.mutate(
      { id: terminateId, data: { terminatedDate: tDate, terminatedReason: tReason || undefined } },
      {
        onSuccess: () => {
          setTerminateId(null)
          closeDetail()
        },
      }
    )
  }

  const totalCount = data?.total ?? 0
  const currentPage = data?.page ?? 1
  const totalPages = data?.totalPages ?? 1
  const limit = data?.limit ?? 20

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hợp đồng</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý hợp đồng thuê phòng</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo hợp đồng
        </Button>
      </div>

      {/* ── Table card ───────────────────────────────────────────────────────── */}
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
                <SelectValue placeholder="Nhà trọ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà trọ</SelectItem>
                {propertiesData?.items.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.status ?? "all"}
              onValueChange={(v) =>
                setParams((p) => ({
                  ...p,
                  page: 1,
                  status: v === "all" ? undefined : (v as ContractStatus),
                }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hiệu lực</SelectItem>
                <SelectItem value="terminated">Đã chấm dứt</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Phòng</TableHead>
                <TableHead>Tiền phòng</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
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
                    {search || params.status || params.propertyId
                      ? "Không tìm thấy hợp đồng nào phù hợp"
                      : "Chưa có hợp đồng nào. Hãy tạo hợp đồng đầu tiên!"}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((contract) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(contract.id)}
                >
                  <TableCell className="pl-6">
                    <p className="font-medium">Phòng {contract.room?.roomNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {contract.room?.property?.name}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(contract.rentAmount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contract.createdAt)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetail(contract.id)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        {contract.status === "active" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openAmend(contract.id)
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              Thêm phụ lục
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openTerminate(contract.id)
                              }}
                              className="text-amber-600 focus:text-amber-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Chấm dứt
                            </DropdownMenuItem>
                          </>
                        )}
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
                {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalCount)} / {totalCount} hợp đồng
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
                  )
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
      <Sheet open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false) }}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Tạo hợp đồng</SheetTitle>
            <SheetDescription>Ký hợp đồng thuê phòng mới</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* Section 1: Thông tin hợp đồng */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Thông tin hợp đồng
              </p>

              <FormField label="Dãy trọ" required>
                <Select value={cProperty} onValueChange={handlePropertyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dãy trọ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesData?.items.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Phòng" error={cErrors.room} required>
                <SearchCombobox
                  value={cRoom}
                  onChange={handleRoomSelect}
                  options={roomOptions}
                  placeholder={cProperty ? "Chọn phòng..." : "Chọn dãy trọ trước"}
                  searchPlaceholder="Tìm số phòng..."
                  onSearch={setRoomSearchRaw}
                  loading={roomsFetching}
                  hasMore={(roomsData?.total ?? 0) > (roomsData?.items.length ?? 0)}
                  disabled={!cProperty}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tiền phòng (VNĐ)" error={cErrors.rent} required>
                  <Input
                    type="number"
                    min={0}
                    value={cRent}
                    onChange={(e) => setCRent(e.target.value)}
                    placeholder="3000000"
                  />
                </FormField>
                <FormField label="Tiền cọc (VNĐ)" error={cErrors.deposit} required>
                  <Input
                    type="number"
                    min={0}
                    value={cDeposit}
                    onChange={(e) => setCDeposit(e.target.value)}
                    placeholder="3000000"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ngày bắt đầu" error={cErrors.startDate} required>
                  <Input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)} />
                </FormField>
                <FormField label="Ngày kết thúc" error={cErrors.endDate} required>
                  <Input type="date" value={cEnd} min={cStart} onChange={(e) => setCEnd(e.target.value)} />
                </FormField>
              </div>

              <FormField label="Ghi chú">
                <textarea
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  rows={2}
                  placeholder="Điều khoản bổ sung..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </FormField>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  File hợp đồng <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-1.5" />
                        {cFile ? "Đổi file" : "Chọn file"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setCFile(file)
                        e.target.value = ""
                      }}
                    />
                  </label>
                  {cFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Paperclip className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[200px]">{cFile.name}</span>
                      <button type="button" onClick={() => setCFile(null)} className="hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {cErrors.file && (
                  <p className="text-xs text-destructive">{cErrors.file}</p>
                )}
              </div>
            </div>

            {/* Section 2: Người ở */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Người ở
                  {selectedRoomType === "shared" && (
                    <span className="ml-2 normal-case font-normal text-muted-foreground/70">
                      — phòng ghép: 1 người/hợp đồng
                    </span>
                  )}
                </p>
                {selectedRoomType !== "shared" && (
                  <Button type="button" variant="outline" size="sm" onClick={addOccupant}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm người
                  </Button>
                )}
              </div>

              {cErrors.occupants && (
                <p className="text-xs text-destructive">{cErrors.occupants}</p>
              )}

              <div className="space-y-3">
                {cOccupants.map((occ, idx) => (
                  <div key={occ.id} className="p-3 border rounded-lg space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Người ở #{idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                          <input
                            type="radio"
                            name="cOwner"
                            checked={occ.isOwner}
                            onChange={() => setOccupantOwner(occ.id)}
                            className="accent-primary"
                          />
                          Đại diện ký
                        </label>
                        {cOccupants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOccupant(occ.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Khách thuê *</Label>
                          <button
                            type="button"
                            onClick={() => openQuickTenant(occ.id)}
                            className="text-xs text-primary hover:underline leading-none"
                          >
                            + Tạo mới
                          </button>
                        </div>
                        <SearchCombobox
                          value={occ.tenantId}
                          onChange={(v) => handleTenantSelect(occ.id, v)}
                          options={getTenantOptions(occ.id)}
                          placeholder="Chọn khách thuê..."
                          searchPlaceholder="Tìm tên, SĐT..."
                          onSearch={setTenantSearchRaw}
                          loading={tenantsFetching}
                          hasMore={(tenantsData?.total ?? 0) > (tenantsData?.items.length ?? 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ngày chuyển vào *</Label>
                        <Input
                          type="date"
                          className="h-9 text-sm"
                          value={occ.movedInDate}
                          min={cStart || undefined}
                          onChange={(e) =>
                            setCOccupants((p) =>
                              p.map((o) => (o.id === occ.id ? { ...o, movedInDate: e.target.value } : o))
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Dịch vụ (chỉ hiện khi chọn phòng có propertyId) */}
            {selectedRoomPropertyId && (
              <div className="space-y-4 border-t pt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Dịch vụ
                </p>
                {cServiceRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nhà trọ này chưa có dịch vụ nào đang hoạt động.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cServiceRows.map((svc, idx) => (
                      <div key={svc.serviceId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          checked={svc.selected}
                          onChange={(e) =>
                            setCServiceRows((p) =>
                              p.map((s, i) => (i === idx ? { ...s, selected: e.target.checked } : s))
                            )
                          }
                          className="h-4 w-4 rounded border-input accent-primary shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{svc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {SERVICE_TYPE_LABEL[svc.type]}{svc.unit ? ` — ${svc.unit}` : ""}
                          </p>
                        </div>
                        {svc.selected ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Đơn giá
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 w-28 text-sm"
                              value={svc.price}
                              onChange={(e) =>
                                setCServiceRows((p) =>
                                  p.map((s, i) => (i === idx ? { ...s, price: e.target.value } : s))
                                )
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatCurrency(svc.defaultPrice)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={submitCreate} disabled={createContract.isPending}>
              {createContract.isPending ? "Đang tạo..." : "Tạo hợp đồng"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Detail Sheet ─────────────────────────────────────────────────────── */}
      <Sheet open={!!detailId} onOpenChange={(o) => { if (!o) closeDetail() }}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>
              {detailLoading
                ? "Đang tải..."
                : `Hợp đồng — Phòng ${activeContract?.room?.roomNumber}`}
            </SheetTitle>
            <SheetDescription>{activeContract?.room?.property?.name}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {detailLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Đang tải...</p>
            ) : activeContract ? (
              <>
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Trạng thái</p>
                    <ContractStatusBadge status={activeContract.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tiền phòng</p>
                    <p className="font-semibold">{formatCurrency(activeContract.rentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tiền cọc</p>
                    <p className="font-medium">{formatCurrency(activeContract.depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Thời hạn</p>
                    <p>
                      {formatDate(activeContract.startDate)} → {formatDate(activeContract.endDate)}
                    </p>
                  </div>
                  {activeContract.terminatedDate && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Ngày chấm dứt</p>
                      <p>{formatDate(activeContract.terminatedDate)}</p>
                      {activeContract.terminatedReason && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activeContract.terminatedReason}
                        </p>
                      )}
                    </div>
                  )}
                  {activeContract.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Ghi chú</p>
                      <p className="text-muted-foreground">{activeContract.notes}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {(() => {
                  const contractDocs = activeContract.documents?.filter((d) => d.type === "contract") ?? []
                  return contractDocs.length > 0 ? (
                    <div className="border-t pt-5 space-y-2">
                      <h4 className="text-sm font-semibold">Tài liệu hợp đồng</h4>
                      {contractDocs.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Paperclip className="h-4 w-4 shrink-0" />
                          {doc.fileName}
                        </a>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Occupants */}
                <div className="border-t pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      Người ở ({(activeContract.occupants ?? []).filter((o) => !o.movedOutDate).length})
                    </h4>
                    {/* Thêm người ở — chỉ private + active */}
                    {activeContract.status === "active" && activeContract.room?.roomType === "private" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setAddOccupantOpen((v) => !v); setAddOccupantErrors({}) }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Thêm người ở
                      </Button>
                    )}
                  </div>

                  {/* Ghi chú phòng ghép */}
                  {activeContract.status === "active" && activeContract.room?.roomType === "shared" && (
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                      Phòng ghép: mỗi người ở cần hợp đồng riêng. Tạo hợp đồng mới để thêm người ở.
                    </p>
                  )}

                  {/* Inline form thêm người ở */}
                  {addOccupantOpen && activeContract.room?.roomType === "private" && (
                    <div className="p-3 border rounded-lg space-y-3 bg-muted/20">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Khách thuê <span className="text-destructive">*</span></span>
                            <button
                              type="button"
                              onClick={() => openQuickTenant("add-occ")}
                              className="text-xs text-primary hover:underline leading-none"
                            >
                              + Tạo mới
                            </button>
                          </div>
                          <SearchCombobox
                            value={addOccupantTenantId}
                            onChange={(v) => {
                              setAddOccupantTenantId(v)
                              const tenant = tenantsData?.items.find((t) => t.id === v)
                              if (tenant) setSelectedTenantOptions((p) => ({ ...p, "add-occ": { value: tenant.id, label: tenant.fullName } }))
                              setAddOccupantErrors((e) => ({ ...e, tenant: "" }))
                            }}
                            options={getTenantOptions("add-occ")}
                            placeholder="Chọn khách thuê..."
                            searchPlaceholder="Tìm tên, SĐT..."
                            onSearch={setTenantSearchRaw}
                            loading={tenantsFetching}
                            hasMore={(tenantsData?.total ?? 0) > (tenantsData?.items.length ?? 0)}
                          />
                          {addOccupantErrors.tenant && (
                            <p className="text-xs text-destructive">{addOccupantErrors.tenant}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Ngày chuyển vào <span className="text-destructive">*</span></span>
                          <Input
                            type="date"
                            className="h-9 text-sm"
                            value={addOccupantMovedIn}
                            onChange={(e) => setAddOccupantMovedIn(e.target.value)}
                          />
                          {addOccupantErrors.movedIn && (
                            <p className="text-xs text-destructive">{addOccupantErrors.movedIn}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={resetAddOccupant}>Hủy</Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={submitAddOccupant}
                          disabled={addOccupantMut.isPending}
                        >
                          {addOccupantMut.isPending ? "Đang lưu..." : "Thêm"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const current = (activeContract.occupants ?? []).filter((o) => !o.movedOutDate)
                    const past = (activeContract.occupants ?? []).filter((o) => !!o.movedOutDate)
                    const canRemove = activeContract.status === "active" && activeContract.room?.roomType === "private"
                    const renderOcc = (occ: typeof current[0]) => (
                      <div key={occ.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {occ.tenant?.fullName ?? occ.tenantId}
                            </p>
                            {occ.isOwner && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200 shrink-0">
                                Đại diện
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Chuyển vào: {formatDate(occ.movedInDate)}
                          </p>
                        </div>
                        {canRemove && !occ.isOwner && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => setRemoveOccupantTarget({ id: occ.id, name: occ.tenant?.fullName ?? occ.tenantId })}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )
                    return (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Hiện tại ({current.length})
                          </p>
                          {current.length === 0
                            ? <p className="text-sm text-muted-foreground">Chưa có người ở</p>
                            : current.map(renderOcc)
                          }
                        </div>
                        {past.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Đã rời đi ({past.length})
                            </p>
                            {past.map((occ) => (
                              <div key={occ.id} className="flex items-center gap-3 p-2.5 border rounded-lg opacity-60">
                                <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                                  <User className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate line-through">
                                    {occ.tenant?.fullName ?? occ.tenantId}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(occ.movedInDate)} → {formatDate(occ.movedOutDate!)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Services */}
                <div className="border-t pt-5 space-y-3">
                  <h4 className="text-sm font-semibold">
                    Dịch vụ ({activeContract.services?.length ?? 0})
                  </h4>
                  {(activeContract.services?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có dịch vụ kèm theo</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeContract.services?.map((svc) => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between p-2.5 border rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">{svc.service?.name ?? svc.serviceId}</p>
                            <p className="text-xs text-muted-foreground">
                              {svc.service?.type ? SERVICE_TYPE_LABEL[svc.service.type] : ""}
                              {svc.service?.unit ? ` — ${svc.service.unit}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">{formatCurrency(svc.unitPrice)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amendments */}
                <div className="border-t pt-5 space-y-3">
                  <h4 className="text-sm font-semibold">
                    Phụ lục ({activeContract.amendments?.length ?? 0})
                  </h4>
                  {(activeContract.amendments?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có phụ lục nào</p>
                  ) : (
                    <div className="space-y-2">
                      {activeContract.amendments?.map((am) => (
                        <div key={am.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <AmendmentTypeBadge type={am.amendmentType} />
                              <p className="text-xs text-muted-foreground">
                                Hiệu lực: {formatDate(am.effectiveDate)}
                              </p>
                            </div>
                            {am.isApplied ? (
                              <span className="text-xs text-emerald-600 font-medium shrink-0">
                                Đã áp dụng
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 font-medium shrink-0">
                                Chờ áp dụng
                              </span>
                            )}
                          </div>
                          {(am.newRentAmount !== null || am.newEndDate) && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {am.newRentAmount !== null && (
                                <p>Tiền phòng mới: {formatCurrency(am.newRentAmount)}</p>
                              )}
                              {am.newEndDate && (
                                <p>Ngày kết thúc mới: {formatDate(am.newEndDate)}</p>
                              )}
                            </div>
                          )}
                          {am.notes && (
                            <p className="text-xs text-muted-foreground">{am.notes}</p>
                          )}
                          {am.document && (
                            <a
                              href={am.document.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              {am.document.fileName}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Footer actions */}
          {activeContract?.status === "active" && (
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => openAmend(detailId!)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Thêm phụ lục
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                onClick={() => {
                  openTerminate(detailId!)
                  closeDetail()
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                Chấm dứt
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Amendment Sheet ───────────────────────────────────────────────────── */}
      <Sheet open={!!amendContractId} onOpenChange={(o) => { if (!o) closeAmend() }}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>Thêm phụ lục hợp đồng</SheetTitle>
            <SheetDescription>
              Phòng {activeContract?.room?.roomNumber} — {activeContract?.room?.property?.name}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {detailLoading && amendContractId ? (
              <p className="text-sm text-muted-foreground text-center py-8">Đang tải dữ liệu...</p>
            ) : (
              <>
                {/* Loại phụ lục */}
                <FormField label="Loại phụ lục" error={aErrors.type} required>
                  <Select
                    value={aType}
                    onValueChange={(v) => {
                      setAType(v as AmendmentType)
                      setAErrors({})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renewal">Gia hạn</SelectItem>
                      <SelectItem value="price_adjustment">Điều chỉnh giá</SelectItem>
                      <SelectItem value="general">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {aType && (
                  <>
                    {/* Ngày hiệu lực — fixed hôm nay cho renewal, selectable cho loại khác */}
                    {aType === "renewal" ? (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Ngày hiệu lực</Label>
                        <p className="text-sm px-3 py-2 border rounded-md bg-muted/40">{today}</p>
                        <p className="text-xs text-muted-foreground">Gia hạn có hiệu lực từ hôm nay</p>
                      </div>
                    ) : (
                      <FormField label="Ngày hiệu lực" error={aErrors.effDate} required>
                        <Input
                          type="date"
                          value={aEffDate}
                          min={today}
                          max={aType === "price_adjustment" ? (activeContract?.endDate ?? undefined) : undefined}
                          onChange={(e) => {
                            setAEffDate(e.target.value)
                            setAErrors((err) => ({ ...err, effDate: "" }))
                          }}
                        />
                      </FormField>
                    )}

                    {/* Ngày kết thúc mới — chỉ renewal và general */}
                    {(aType === "renewal" || aType === "general") && (
                      <FormField
                        label="Ngày kết thúc mới"
                        error={aErrors.newEnd}
                        required={aType === "renewal"}
                      >
                        <Input
                          type="date"
                          value={aNewEnd}
                          min={activeContract?.endDate ? (() => {
                            const d = new Date(activeContract.endDate)
                            d.setDate(d.getDate() + 1)
                            return d.toISOString().split("T")[0]
                          })() : undefined}
                          onChange={(e) => {
                            setANewEnd(e.target.value)
                            setAErrors((err) => ({ ...err, newEnd: "" }))
                          }}
                        />
                      </FormField>
                    )}

                    {/* Tiền phòng mới — ẩn với renewal */}
                    {(aType === "price_adjustment" || aType === "general") && (
                      <FormField label="Tiền phòng mới (VNĐ)">
                        <Input
                          type="number"
                          min={0}
                          value={aNewRent}
                          onChange={(e) => setANewRent(e.target.value)}
                          placeholder="Để trống nếu không đổi"
                        />
                      </FormField>
                    )}

                    {/* Dịch vụ — price_adjustment luôn hiện, general hiện nếu có dịch vụ */}
                    {(aType === "price_adjustment" || (aType === "general" && aServiceChanges.length > 0)) && (
                      <div className="border-t pt-5 space-y-3">
                        <p className="text-sm font-medium">Dịch vụ</p>
                        {aServiceChanges.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nhà trọ chưa có dịch vụ nào</p>
                        ) : (
                          <div className="space-y-2">
                            {aServiceChanges.map((sc, idx) => (
                              <div
                                key={sc.contractServiceId ?? sc.serviceId}
                                className="flex items-center gap-3 p-2.5 border rounded-lg"
                              >
                                <input
                                  type="checkbox"
                                  checked={sc.changed}
                                  onChange={(e) =>
                                    setAServiceChanges((p) =>
                                      p.map((s, i) => (i === idx ? { ...s, changed: e.target.checked } : s))
                                    )
                                  }
                                  className="h-4 w-4 rounded border-input accent-primary shrink-0"
                                />
                                <span className="flex-1 text-sm">{sc.name}</span>
                                {sc.isNew ? (
                                  <span className="text-xs font-medium text-emerald-600 shrink-0">+ Thêm mới</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {formatCurrency(sc.currentPrice!)} →
                                  </span>
                                )}
                                {sc.changed && (
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-8 w-28 text-sm shrink-0"
                                    value={sc.newPrice}
                                    onChange={(e) =>
                                      setAServiceChanges((p) =>
                                        p.map((s, i) =>
                                          i === idx ? { ...s, newPrice: e.target.value } : s
                                        )
                                      )
                                    }
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <FormField label="Ghi chú">
                      <textarea
                        value={aNotes}
                        onChange={(e) => setANotes(e.target.value)}
                        rows={2}
                        placeholder="Nội dung phụ lục..."
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      />
                    </FormField>

                {/* File upload */}
                <div className="border-t pt-5 space-y-2">
                  <Label className="text-sm font-medium">
                    File phụ lục <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label>
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-1.5" />
                          {aFile ? "Đổi file" : "Chọn file"}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setAFile(file)
                            setAErrors((err) => ({ ...err, file: "" }))
                          }
                          e.target.value = ""
                        }}
                      />
                    </label>
                    {aFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-[200px]">{aFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setAFile(null)}
                          className="hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {aErrors.file && (
                    <p className="text-xs text-destructive">{aErrors.file}</p>
                  )}
                </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30">
            <Button variant="outline" onClick={closeAmend}>
              Hủy
            </Button>
            <Button onClick={submitAmend} disabled={createAmendment.isPending}>
              {createAmendment.isPending ? "Đang lưu..." : "Lưu phụ lục"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Remove Occupant Confirm Dialog ───────────────────────────────────── */}
      <Dialog open={!!removeOccupantTarget} onOpenChange={(o) => { if (!o) setRemoveOccupantTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa người ở</DialogTitle>
            <DialogDescription>
              Xác nhận ghi nhận <strong>{removeOccupantTarget?.name}</strong> đã rời đi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOccupantTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={removeOccupantMut.isPending}
              onClick={() => {
                if (!removeOccupantTarget || !detailId) return
                removeOccupantMut.mutate(
                  { contractId: detailId, occupantId: removeOccupantTarget.id },
                  { onSuccess: () => setRemoveOccupantTarget(null) },
                )
              }}
            >
              {removeOccupantMut.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Terminate Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!terminateId} onOpenChange={(o) => { if (!o) setTerminateId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Chấm dứt hợp đồng</DialogTitle>
            <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Ngày chấm dứt" required>
              <Input
                type="date"
                value={tDate}
                max={today}
                onChange={(e) => setTDate(e.target.value)}
              />
            </FormField>
            <FormField label="Lý do">
              <textarea
                value={tReason}
                onChange={(e) => setTReason(e.target.value)}
                rows={3}
                placeholder="Lý do chấm dứt hợp đồng..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={submitTerminate}
              disabled={terminateContract.isPending || !tDate}
            >
              {terminateContract.isPending ? "Đang xử lý..." : "Xác nhận chấm dứt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quick Tenant Creation Dialog ──────────────────────────────────────── */}
      <Dialog open={quickTenantOpen} onOpenChange={(o) => { if (!o) setQuickTenantOpen(false) }}>
        <DialogContent className="max-w-xl p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 py-5 border-b shrink-0">
            <DialogTitle>Tạo khách thuê mới</DialogTitle>
            <DialogDescription>Điền thông tin để tạo hồ sơ khách thuê.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={submitQt(onQuickTenantSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField label="Họ và tên" error={errQt.fullName?.message} required>
                <Input {...regQt("fullName")} placeholder="Nguyễn Văn A" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Số điện thoại" error={errQt.phone?.message}>
                  <Input {...regQt("phone")} placeholder="0901234567" />
                </FormField>
                <FormField label="Email" error={errQt.email?.message}>
                  <Input {...regQt("email")} type="email" placeholder="email@gmail.com" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ngày sinh" error={errQt.dateOfBirth?.message}>
                  <Input {...regQt("dateOfBirth")} type="date" max={today} />
                </FormField>
                <FormField label="Giới tính" error={errQt.gender?.message}>
                  <Controller
                    name="gender"
                    control={controlQt}
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
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

              <div className="border-t pt-5 space-y-4">
                <p className="text-sm font-medium">Giấy tờ tùy thân</p>
                <FormField label="Số CCCD/CMND" error={errQt.idCardNumber?.message} required>
                  <Input {...regQt("idCardNumber")} placeholder="012345678901" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ngày cấp" error={errQt.idCardIssuedDate?.message}>
                    <Input {...regQt("idCardIssuedDate")} type="date" max={today} />
                  </FormField>
                  <FormField label="Nơi cấp" error={errQt.idCardIssuedPlace?.message}>
                    <Input {...regQt("idCardIssuedPlace")} placeholder="Cục CSQLHC..." />
                  </FormField>
                </div>
                <FormField label="Địa chỉ thường trú" error={errQt.permanentAddress?.message}>
                  <textarea
                    {...regQt("permanentAddress")}
                    rows={2}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </FormField>
              </div>

              {!!qtEmail && (
                <div className="border-t pt-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...regQt("createAccount")}
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

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/30 shrink-0">
              <Button type="button" variant="outline" onClick={() => setQuickTenantOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createTenant.isPending}>
                {createTenant.isPending ? "Đang tạo..." : "Tạo khách thuê"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
