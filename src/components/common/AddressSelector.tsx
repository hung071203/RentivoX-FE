"use client";
import { useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVnProvinces, useVnWards } from "@/hooks/useVietnamAddress";

export interface AddressValue {
  province: string;
  district: string; // không dùng trong v2, luôn để ""
  ward: string;
}

interface Props {
  defaultValue?: Partial<AddressValue>;
  onChange: (v: AddressValue) => void;
}

export function AddressSelector({ defaultValue, onChange }: Props) {
  const [openProvince, setOpenProvince] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [wardCode, setWardCode] = useState<number | null>(null);

  const [current, setCurrent] = useState<AddressValue>({
    province: defaultValue?.province ?? "",
    district: "",
    ward: defaultValue?.ward ?? "",
  });

  const { data: provinces, isLoading: loadingProvinces } = useVnProvinces();
  const { data: provinceData, isLoading: loadingWards } =
    useVnWards(provinceCode);

  const wards = provinceData?.wards ?? [];

  // Khôi phục code từ tên đã lưu khi dữ liệu load xong (edit mode)
  useEffect(() => {
    if (!provinces || !defaultValue?.province) return;
    const p = provinces.find((p) => p.name === defaultValue.province);
    if (p) setProvinceCode(p.code);
  }, [provinces]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wards.length || !defaultValue?.ward) return;
    const w = wards.find((w) => w.name === defaultValue.ward);
    if (w) setWardCode(w.code);
  }, [wards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectProvince(code: number) {
    const p = provinces?.find((p) => p.code === code);
    if (!p) return;
    setProvinceCode(code);
    setWardCode(null);
    setOpenProvince(false);
    const v: AddressValue = { province: p.name, district: "", ward: "" };
    setCurrent(v);
    onChange(v);
  }

  function selectWard(code: number) {
    const w = wards.find((w) => w.code === code);
    if (!w) return;
    setWardCode(code);
    setOpenWard(false);
    const v: AddressValue = { ...current, ward: w.name };
    setCurrent(v);
    onChange(v);
  }

  return (
    <div className="space-y-4">
      {/* Tỉnh / Thành phố */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Tỉnh / Thành phố</Label>
        <Popover open={openProvince} onOpenChange={setOpenProvince}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={openProvince}
              className="w-full justify-between font-normal"
              disabled={loadingProvinces}
            >
              <span className="truncate text-left">
                {current.province ||
                  (loadingProvinces
                    ? "Đang tải..."
                    : "Chọn tỉnh/thành phố...")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Tìm tỉnh/thành phố..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy</CommandEmpty>
                <CommandGroup>
                  {(provinces ?? []).map((p) => (
                    <CommandItem
                      key={p.code}
                      value={p.name}
                      onSelect={() => selectProvince(p.code)}
                      data-checked={
                        provinceCode === p.code ? "true" : undefined
                      }
                    >
                      {p.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Phường / Xã */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Phường / Xã</Label>
        <Popover open={openWard} onOpenChange={setOpenWard}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={openWard}
              className="w-full justify-between font-normal"
              disabled={!provinceCode || loadingWards}
            >
              <span className="truncate text-left">
                {current.ward ||
                  (!provinceCode
                    ? "Chọn tỉnh/thành phố trước"
                    : loadingWards
                      ? "Đang tải..."
                      : "Chọn phường/xã...")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Tìm phường/xã..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy</CommandEmpty>
                <CommandGroup>
                  {wards.map((w) => (
                    <CommandItem
                      key={w.code}
                      value={w.name}
                      onSelect={() => selectWard(w.code)}
                      data-checked={wardCode === w.code ? "true" : undefined}
                    >
                      {w.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
