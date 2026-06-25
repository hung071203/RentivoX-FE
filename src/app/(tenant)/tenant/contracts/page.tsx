"use client";

import { useState } from "react";
import {
  Bath,
  Wind,
  ChefHat,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Wrench,
  Eye,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SortableHead } from "@/components/common/SortableHead";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useTenantContracts,
  useTenantContract,
  useTenantRoom,
} from "@/hooks/useTenant";
import { formatCurrency, formatDate, formatPeriod } from "@/utils/format";
import {
  CONTRACT_STATUS_LABEL,
  AMENDMENT_TYPE_LABEL,
  SERVICE_TYPE_LABEL,
  ROOM_TYPE_LABEL,
} from "@/constants/enums";
import { cn } from "@/lib/utils";
import type {
  Contract,
  ContractStatus,
  RoomOccupant,
  ContractAmendment,
} from "@/types/contract.types";
import type { TenantRoomDetail } from "@/types/tenant-dashboard.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const colors: Record<ContractStatus, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    expired: "bg-gray-50 text-gray-500 ring-gray-200",
    terminated: "bg-red-50 text-red-600 ring-red-200",
  };
  const dots: Record<ContractStatus, string> = {
    active: "bg-emerald-500",
    expired: "bg-gray-400",
    terminated: "bg-red-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${colors[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {CONTRACT_STATUS_LABEL[status]}
    </span>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex border-b">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            active === t.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Contract tab ─────────────────────────────────────────────────────────────

function ContractTab({ contract }: { contract: Contract }) {
  const activeOccupants = (contract.occupants ?? []).filter(
    (o) => !o.movedOutDate,
  );
  const pastOccupants = (contract.occupants ?? []).filter(
    (o) => !!o.movedOutDate,
  );

  return (
    <div className="space-y-6">
      {/* Contract info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Thông tin hợp đồng
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">
              Tiền phòng / tháng
            </p>
            <p className="font-semibold">
              {formatCurrency(contract.rentAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Tiền cọc</p>
            <p className="font-medium">
              {formatCurrency(contract.depositAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Ngày bắt đầu</p>
            <p className="font-medium">{formatDate(contract.startDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">
              Ngày kết thúc
            </p>
            <p className="font-medium">{formatDate(contract.endDate)}</p>
          </div>
          {contract.terminatedDate && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">
                Ngày chấm dứt
              </p>
              <p className="font-medium">
                {formatDate(contract.terminatedDate)}
              </p>
            </div>
          )}
          {contract.terminatedReason && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">
                Lý do chấm dứt
              </p>
              <p className="font-medium text-muted-foreground">
                {contract.terminatedReason}
              </p>
            </div>
          )}
          {contract.notes && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">Ghi chú</p>
              <p className="text-muted-foreground">{contract.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Occupants */}
      {(contract.occupants?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Người ở
          </h3>
          {activeOccupants.length > 0 && (
            <div className="space-y-2 mb-3">
              {activeOccupants.map((o) => (
                <OccupantRow key={o.id} occupant={o} />
              ))}
            </div>
          )}
          {pastOccupants.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">Đã rời đi</p>
              <div className="space-y-2 opacity-60">
                {pastOccupants.map((o) => (
                  <OccupantRow key={o.id} occupant={o} showMoveOut />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Services */}
      {(contract.services?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Dịch vụ
          </h3>
          <div className="space-y-1.5">
            {contract.services!.map((cs) => (
              <div
                key={cs.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">
                    {cs.service?.name ?? "—"}
                  </span>
                  {cs.service?.type && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({SERVICE_TYPE_LABEL[cs.service.type]}
                      {cs.service.unit ? ` · ${cs.service.unit}` : ""})
                    </span>
                  )}
                </div>
                <span className="font-medium shrink-0 ml-3">
                  {formatCurrency(cs.unitPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {(contract.documents?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Tài liệu
          </h3>
          <div className="space-y-1.5">
            {contract.documents!.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed hover:bg-muted/40 transition-colors text-sm group"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 text-foreground group-hover:text-primary">
                  {doc.fileName}
                </span>
                <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OccupantRow({
  occupant,
  showMoveOut,
}: {
  occupant: RoomOccupant;
  showMoveOut?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-sm">
      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <User className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate">
          {occupant.tenant?.fullName ?? "—"}
          {occupant.isOwner && (
            <span className="ml-1.5 text-xs text-primary font-normal">
              (Đại diện)
            </span>
          )}
        </span>
        {occupant.tenant?.phone && (
          <p className="text-xs text-muted-foreground">
            {occupant.tenant.phone}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          Vào: {formatDate(occupant.movedInDate)}
        </p>
        {showMoveOut && occupant.movedOutDate && (
          <p className="text-xs text-muted-foreground">
            Ra: {formatDate(occupant.movedOutDate)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Room tab ─────────────────────────────────────────────────────────────────

function RoomTab({
  isActive,
  contractRoom,
}: {
  isActive: boolean;
  contractRoom?: Contract["room"];
}) {
  const { data: room, isLoading } = useTenantRoom(isActive);

  if (!isActive) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Hợp đồng đã kết thúc. Thông tin phòng không còn hiển thị chi tiết.
        </div>
        {contractRoom && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Số phòng</p>
              <p className="font-medium">Phòng {contractRoom.roomNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Loại phòng</p>
              <p className="font-medium">
                {contractRoom.roomType
                  ? ROOM_TYPE_LABEL[contractRoom.roomType]
                  : "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">Nhà trọ</p>
              <p className="font-medium">
                {contractRoom.property?.name ?? "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Đang tải thông tin phòng...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Không tìm thấy thông tin phòng
      </div>
    );
  }

  return <RoomDetail room={room} />;
}

function RoomDetail({ room }: { room: TenantRoomDetail }) {
  const amenities = [
    { flag: room.hasPrivateWc, icon: Bath, label: "WC riêng" },
    { flag: room.hasAc, icon: Wind, label: "Điều hòa" },
    { flag: room.hasKitchen, icon: ChefHat, label: "Bếp" },
  ];

  return (
    <div className="space-y-6">
      {/* Room info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Thông tin phòng
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Số phòng</p>
            <p className="font-semibold">Phòng {room.roomNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Loại phòng</p>
            <p className="font-medium">{ROOM_TYPE_LABEL[room.roomType]}</p>
          </div>
          {room.floor != null && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Tầng</p>
              <p className="font-medium">{room.floor}</p>
            </div>
          )}
          {room.areaM2 != null && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Diện tích</p>
              <p className="font-medium">{room.areaM2} m²</p>
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Tiện nghi
        </h3>
        <div className="flex flex-wrap gap-2">
          {amenities.map(({ flag, icon: Icon, label }) => (
            <span
              key={label}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                flag
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Property */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Nhà trọ
        </h3>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{room.property.name}</p>
          <p className="text-muted-foreground text-xs">
            {[
              room.property.address,
              room.property.ward,
              room.property.district,
              room.property.province,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>

      {/* Occupants */}
      {room.occupants.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Người đang ở ({room.occupants.length})
          </h3>
          <div className="space-y-1.5">
            {room.occupants.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-sm"
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">
                    {o.tenant.fullName}
                    {o.isOwner && (
                      <span className="ml-1.5 text-xs text-primary">
                        (Đại diện)
                      </span>
                    )}
                  </span>
                  {o.tenant.phone && (
                    <p className="text-xs text-muted-foreground">
                      {o.tenant.phone}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  Từ {formatDate(o.movedInDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {room.services.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Dịch vụ phòng
          </h3>
          <div className="space-y-1.5">
            {room.services.map((rs) => (
              <div
                key={rs.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">
                    {rs.service.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({SERVICE_TYPE_LABEL[rs.service.type]}
                    {rs.service.unit ? ` · ${rs.service.unit}` : ""})
                  </span>
                </div>
                <span className="font-medium shrink-0 ml-3">
                  {formatCurrency(rs.unitPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {room.notes && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Ghi chú
          </h3>
          <p className="text-sm text-muted-foreground">{room.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Amendment tab ────────────────────────────────────────────────────────────

function AmendmentTab({ amendments }: { amendments?: ContractAmendment[] }) {
  const [selected, setSelected] = useState<ContractAmendment | null>(null);

  if (!amendments?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Hợp đồng chưa có phụ lục nào
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {amendments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            className="w-full text-left p-4 rounded-lg border hover:bg-muted/40 transition-colors space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ngày hiệu lực: {formatDate(a.effectiveDate)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  {AMENDMENT_TYPE_LABEL[a.amendmentType]}
                </span>
                {a.isApplied ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã áp dụng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                    <Clock className="h-3 w-3" />
                    Chờ áp dụng
                  </span>
                )}
              </div>
            </div>

            {(a.newRentAmount || a.newEndDate) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {a.newRentAmount && (
                  <span>
                    Tiền phòng mới:{" "}
                    <strong className="text-foreground">
                      {formatCurrency(a.newRentAmount)}
                    </strong>
                  </span>
                )}
                {a.newEndDate && (
                  <span>
                    Gia hạn đến:{" "}
                    <strong className="text-foreground">
                      {formatDate(a.newEndDate)}
                    </strong>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              {(a.amendmentServices?.length ?? 0) > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {a.amendmentServices!.length} thay đổi dịch vụ
                </p>
              ) : (
                <span />
              )}
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      {/* ── Amendment Detail Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription asChild>
              <span className="inline-flex items-center gap-2 mt-1">
                {selected && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                    {AMENDMENT_TYPE_LABEL[selected.amendmentType]}
                  </span>
                )}
                {selected?.isApplied ? (
                  <span className="text-emerald-600 text-xs font-medium">
                    Đã áp dụng
                  </span>
                ) : (
                  <span className="text-amber-600 text-xs font-medium">
                    Chờ áp dụng
                  </span>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              {/* Thông tin chính */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Ngày hiệu lực
                  </p>
                  <p className="font-medium">
                    {formatDate(selected.effectiveDate)}
                  </p>
                </div>
                {selected.newRentAmount !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Tiền phòng mới
                    </p>
                    <p className="font-medium">
                      {formatCurrency(selected.newRentAmount)}
                    </p>
                  </div>
                )}
                {selected.newEndDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Ngày kết thúc mới
                    </p>
                    <p className="font-medium">
                      {formatDate(selected.newEndDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Thay đổi dịch vụ */}
              {(selected.amendmentServices?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Thay đổi dịch vụ
                  </p>
                  <div className="space-y-1.5">
                    {selected.amendmentServices!.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30"
                      >
                        <span className="text-sm">
                          {s.contractService?.service?.name ?? "—"}
                        </span>
                        <span className="font-medium text-sm">
                          {formatCurrency(s.newUnitPrice)}
                          {s.contractService?.service?.unit
                            ? `/${s.contractService.service.unit}`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              {selected.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ghi chú
                  </p>
                  <p className="text-muted-foreground">{selected.notes}</p>
                </div>
              )}

              {/* File phụ lục */}
              {selected.document && (
                <div className="pt-2 border-t">
                  <a
                    href={selected.document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {selected.document.fileName}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function ContractDetailSheet({
  contractId,
  open,
  onClose,
}: {
  contractId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: contract, isLoading } = useTenantContract(contractId ?? "");
  const [tab, setTab] = useState("contract");

  const tabs = [
    { value: "contract", label: "Hợp đồng" },
    { value: "room", label: "Thông tin phòng" },
    {
      value: "amendment",
      label: `Phụ lục${contract?.amendments?.length ? ` (${contract.amendments.length})` : ""}`,
    },
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3 flex-wrap">
            <SheetTitle className="font-mono text-base">
              {contract?.contractNumber ?? "Hợp đồng"}
            </SheetTitle>
            {contract?.status && (
              <ContractStatusBadge status={contract.status} />
            )}
          </div>
          <SheetDescription>
            {contract?.room
              ? `Phòng ${contract.room.roomNumber} · ${contract.room.property?.name ?? ""}`
              : "Chi tiết hợp đồng thuê phòng"}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 border-b bg-background shrink-0">
          <TabBar tabs={tabs} active={tab} onChange={setTab} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : !contract ? null : (
            <>
              {tab === "contract" && <ContractTab contract={contract} />}
              {tab === "room" && (
                <RoomTab
                  isActive={contract.status === "active"}
                  contractRoom={contract.room}
                />
              )}
              {tab === "amendment" && (
                <AmendmentTab amendments={contract.amendments} />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantContractsPage() {
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">(
    "active",
  );
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("DESC");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSort = (field: string, direction: "ASC" | "DESC" | undefined) => {
    setOrderBy(direction ? field : undefined);
    setOrderDirection(direction ?? "DESC");
    setPage(1);
  };

  const params = {
    page,
    limit: 20,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(orderBy ? { orderBy, orderDirection } : {}),
  };

  const { data, isLoading } = useTenantContracts(params);
  const contracts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  function openDetail(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function handleStatusChange(v: string) {
    setStatusFilter(v as ContractStatus | "all");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Hợp đồng" description="Hợp đồng thuê phòng của bạn" />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hiệu lực</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
                <SelectItem value="terminated">Đã chấm dứt</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[140px]" />
              <col className="w-[200px]" />
              <col className="w-[120px]" />
              <col className="w-[56px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Mã HĐ / Phòng</TableHead>
                <TableHead>Nhà trọ</TableHead>
                <TableHead>Tiền phòng</TableHead>
                <SortableHead label="Thời hạn" field="startDate" orderBy={orderBy} orderDirection={orderDirection} onSort={handleSort} />
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    {statusFilter === "active"
                      ? "Bạn chưa có hợp đồng đang hiệu lực"
                      : "Không có hợp đồng nào"}
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openDetail(c.id)}
                  >
                    <TableCell className="pl-6 py-3">
                      {c.contractNumber ? (
                        <p className="font-mono text-xs font-semibold truncate">
                          {c.contractNumber}
                        </p>
                      ) : null}
                      <p
                        className={cn(
                          "text-sm truncate",
                          c.contractNumber
                            ? "text-muted-foreground text-xs"
                            : "font-medium",
                        )}
                      >
                        Phòng {c.room?.roomNumber ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate">
                      {c.room?.property?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatCurrency(c.rentAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-muted-foreground">
              <span>
                Trang {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ContractDetailSheet
        contractId={selectedId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedId(null);
        }}
      />
    </div>
  );
}
