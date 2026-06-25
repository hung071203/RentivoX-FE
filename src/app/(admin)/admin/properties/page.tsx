'use client'

import { useState, useRef } from 'react'
import { Search, Building2, MapPin, User2, LayoutGrid } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SortableHead } from '@/components/common/SortableHead'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminProperties, useAdminLandlords } from '@/hooks/useAdmin'
import { SearchCombobox, type ComboboxOption } from '@/components/common/SearchCombobox'
import { formatDate } from '@/utils/format'
import type { AdminProperty } from '@/types/admin.types'

// ─── Room occupancy bar ────────────────────────────────────────────────────────

function OccupancyBar({ rooms }: { rooms: AdminProperty['rooms'] }) {
  const pct = rooms.total > 0 ? Math.round((rooms.occupied / rooms.total) * 100) : 0
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {rooms.occupied}/{rooms.total}
      </span>
    </div>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

const ROOM_STATUS_ROWS = [
  { key: 'total' as const, label: 'Tổng số phòng', color: 'bg-slate-400' },
  { key: 'occupied' as const, label: 'Đang cho thuê', color: 'bg-indigo-500' },
  { key: 'available' as const, label: 'Còn trống', color: 'bg-emerald-500' },
  { key: 'maintenance' as const, label: 'Bảo trì', color: 'bg-amber-500' },
  { key: 'reserved' as const, label: 'Đã giữ chỗ', color: 'bg-sky-500' },
]

function PropertyDetailSheet({
  property,
  open,
  onClose,
}: {
  property: AdminProperty | null
  open: boolean
  onClose: () => void
}) {
  if (!property) return null

  const fullAddress = [property.address, property.ward, property.district, property.province]
    .filter(Boolean)
    .join(', ')

  const occupancyPct =
    property.rooms.total > 0
      ? Math.round((property.rooms.occupied / property.rooms.total) * 100)
      : 0

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="truncate">{property.name}</SheetTitle>
          {property.province && (
            <SheetDescription>{property.province}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Địa chỉ */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Địa chỉ
            </h3>
            <p className="text-sm">{fullAddress || '—'}</p>
          </section>

          {/* Chủ trọ */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5" />
              Chủ trọ
            </h3>
            {property.landlord ? (
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{property.landlord.fullName}</p>
                <p className="text-xs text-muted-foreground">{property.landlord.email}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </section>

          {/* Phòng */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Tổng quan phòng
            </h3>

            {/* Progress bar + tỷ lệ */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
              <span className="text-sm font-medium text-indigo-600 whitespace-nowrap">
                {occupancyPct}% lấp đầy
              </span>
            </div>

            {/* Breakdown */}
            <div className="rounded-md border divide-y">
              {ROOM_STATUS_ROWS.map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-sm font-medium">{property.rooms[key]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Meta */}
          <p className="text-xs text-muted-foreground">
            Ngày tạo: {formatDate(property.createdAt)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const [landlordId, setLandlordId] = useState('')
  const [landlordSearch, setLandlordSearch] = useState('')
  const [landlordCache, setLandlordCache] = useState<ComboboxOption | null>(null)

  const [searchRaw, setSearchRaw] = useState('')
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined)
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<AdminProperty | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Landlord combobox data
  const { data: landlordData, isFetching: landlordLoading } = useAdminLandlords({
    search: landlordSearch || undefined,
    limit: 20,
  })
  const landlordBaseOptions: ComboboxOption[] = (landlordData?.items ?? []).map(u => ({
    value: u.id,
    label: u.fullName,
    sublabel: u.email,
  }))
  // Keep selected label visible while user types in combobox
  const landlordOptions =
    landlordId && !landlordBaseOptions.find(o => o.value === landlordId) && landlordCache
      ? [landlordCache, ...landlordBaseOptions]
      : landlordBaseOptions

  // Properties data — only fetch when landlord is selected
  const { data, isLoading } = useAdminProperties(
    { landlordId: landlordId || undefined, search: search || undefined, orderBy, orderDirection, page, limit: 20 },
    { enabled: !!landlordId },
  )

  const handleSort = (field: string, direction: 'ASC' | 'DESC' | undefined) => {
    setOrderBy(direction ? field : undefined)
    setOrderDirection(direction ?? 'DESC')
    setPage(1)
  }

  const handleLandlordChange = (id: string) => {
    const opt = landlordBaseOptions.find(o => o.value === id)
    if (opt) setLandlordCache(opt)
    setLandlordId(id)
    setPage(1)
    setSearch('')
    setSearchRaw('')
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchRaw(e.target.value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(e.target.value)
      setPage(1)
    }, 300)
  }

  const handleRowClick = (p: AdminProperty) => {
    setSelected(p)
    setDetailOpen(true)
  }

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhà trọ"
        description="Danh sách tất cả nhà trọ trong hệ thống"
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {/* Landlord filter — required first */}
            <div className="w-[260px]">
              <SearchCombobox
                value={landlordId}
                onChange={handleLandlordChange}
                options={landlordOptions}
                placeholder="Chọn chủ trọ..."
                searchPlaceholder="Tìm tên, email..."
                onSearch={setLandlordSearch}
                loading={landlordLoading}
                hasMore={(landlordData?.total ?? 0) > landlordBaseOptions.length}
              />
            </div>

            {/* Search — disabled until landlord selected */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, địa chỉ..."
                value={searchRaw}
                onChange={handleSearch}
                disabled={!landlordId}
                className="pl-9 h-9"
              />
            </div>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[22%]" />
              <col className="w-[20%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <SortableHead label="Nhà trọ" field="name" orderBy={orderBy} orderDirection={orderDirection} onSort={handleSort} className="px-6" />
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Chủ trọ</TableHead>
                <TableHead>Phòng</TableHead>
                <SortableHead label="Ngày tạo" field="createdAt" orderBy={orderBy} orderDirection={orderDirection} onSort={handleSort} className="px-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!landlordId ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-14 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 opacity-30" />
                      <span className="text-sm">Chọn chủ trọ để xem danh sách nhà trọ</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : !data?.items.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 opacity-30" />
                      <span>Không có nhà trọ nào</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(p)}
                  >
                    <TableCell className="px-6 py-3">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.province && (
                        <p className="text-xs text-muted-foreground truncate">{p.province}</p>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="text-sm truncate text-muted-foreground">{p.address}</p>
                    </TableCell>
                    <TableCell className="py-3">
                      {p.landlord ? (
                        <>
                          <p className="text-sm font-medium truncate">{p.landlord.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.landlord.email}</p>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <OccupancyBar rooms={p.rooms} />
                      {p.rooms.maintenance > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.rooms.maintenance} bảo trì
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-sm text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {(data?.total ?? 0) > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-muted-foreground">
              <span>Tổng {data!.total} nhà trọ</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PropertyDetailSheet
        property={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}
