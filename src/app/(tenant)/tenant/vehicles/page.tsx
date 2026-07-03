"use client";

import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import { useTenantVehicles } from "@/hooks/useTenant";
import { VEHICLE_TYPE_LABEL } from "@/constants/enums";
import type { Vehicle } from "@/types/vehicle.types";

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function VehicleDetailSheet({
  vehicle,
  open,
  onClose,
  onZoom,
}: {
  vehicle: Vehicle | null;
  open: boolean;
  onClose: () => void;
  onZoom: (url: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="font-mono">{vehicle?.plateNumber}</SheetTitle>
          <SheetDescription>Chi tiết phương tiện</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {vehicle && (
            <>
              <button
                type="button"
                className="w-full rounded-lg overflow-hidden border aspect-[16/10] bg-muted/30 cursor-zoom-in"
                onClick={() => onZoom(vehicle.imageUrl)}
              >
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.plateNumber}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>

              <dl className="divide-y divide-border text-sm">
                <div className="flex items-start gap-3 py-3 first:pt-0">
                  <dt className="text-muted-foreground w-32 shrink-0 pt-0.5">Loại xe</dt>
                  <dd className="font-medium">
                    {VEHICLE_TYPE_LABEL[vehicle.vehicleType] ?? vehicle.vehicleType}
                  </dd>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <dt className="text-muted-foreground w-32 shrink-0 pt-0.5">Nhà trọ</dt>
                  <dd className="font-medium flex-1">{vehicle.property?.name ?? "—"}</dd>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <dt className="text-muted-foreground w-32 shrink-0 pt-0.5">Hãng/model</dt>
                  <dd className="font-medium flex-1">{vehicle.brand || "—"}</dd>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <dt className="text-muted-foreground w-32 shrink-0 pt-0.5">Màu</dt>
                  <dd className="font-medium flex-1">{vehicle.color || "—"}</dd>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <dt className="text-muted-foreground w-32 shrink-0 pt-0.5">Ghi chú</dt>
                  <dd className="font-medium flex-1">{vehicle.notes || "—"}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function TenantVehiclesPage() {
  const { data: vehicles, isLoading } = useTenantVehicles();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Phương tiện" description="Danh sách phương tiện bạn đã đăng ký" />

      <Card>
        <CardContent className="p-0">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[22%]" />
              <col className="w-[26%]" />
              <col className="w-[38%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-t">
                <TableHead className="pl-6">Ảnh</TableHead>
                <TableHead>Biển số</TableHead>
                <TableHead>Nhà trọ</TableHead>
                <TableHead>Hãng/Màu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (vehicles?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Bạn chưa đăng ký phương tiện nào
                  </TableCell>
                </TableRow>
              )}
              {vehicles?.map((v) => (
                <TableRow key={v.id} className="cursor-pointer" onClick={() => setDetailVehicle(v)}>
                  <TableCell className="pl-6">
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted/30 border shrink-0">
                      <img
                        src={v.imageUrl}
                        alt={v.plateNumber}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{v.plateNumber}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                        {VEHICLE_TYPE_LABEL[v.vehicleType] ?? v.vehicleType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {v.property?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {[v.brand, v.color].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VehicleDetailSheet
        vehicle={detailVehicle}
        open={!!detailVehicle}
        onClose={() => setDetailVehicle(null)}
        onZoom={setPreviewImageUrl}
      />

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
