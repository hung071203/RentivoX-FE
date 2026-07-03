"use client";

import { useState } from "react";
import { Car } from "lucide-react";
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
import { useTenantVehicles } from "@/hooks/useTenant";
import { VEHICLE_TYPE_LABEL } from "@/constants/enums";

export default function TenantVehiclesPage() {
  const { data: vehicles, isLoading } = useTenantVehicles();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
                <TableHead>Hãng/Màu · Ghi chú</TableHead>
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
                <TableRow key={v.id}>
                  <TableCell className="pl-6">
                    <button
                      type="button"
                      className="h-10 w-10 rounded-md overflow-hidden bg-muted/30 border shrink-0 block cursor-zoom-in"
                      onClick={() => setPreviewImageUrl(v.imageUrl)}
                    >
                      <img
                        src={v.imageUrl}
                        alt={v.plateNumber}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{v.plateNumber}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                        <Car className="h-3 w-3" />
                        {VEHICLE_TYPE_LABEL[v.vehicleType] ?? v.vehicleType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {v.property?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate">
                    {[v.brand, v.color].filter(Boolean).join(" · ")}
                    {v.notes ? ` — ${v.notes}` : ""}
                    {!v.brand && !v.color && !v.notes ? "—" : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
