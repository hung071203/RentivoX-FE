"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface EditableComboboxProps {
  value: string
  onChange: (value: string) => void
  presets: string[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Combobox chọn 1 trong các giá trị preset, hoặc tự gõ giá trị tùy ý
 * nếu không có trong danh sách (vd: đơn vị dịch vụ).
 */
export function EditableCombobox({
  value,
  onChange,
  presets,
  placeholder = "Chọn hoặc nhập...",
  searchPlaceholder = "Tìm hoặc nhập giá trị mới...",
  className,
  disabled,
}: EditableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const trimmed = search.trim()
  const filteredPresets = presets.filter((p) =>
    p.toLowerCase().includes(trimmed.toLowerCase())
  )
  const isCustom =
    trimmed !== "" &&
    !presets.some((p) => p.toLowerCase() === trimmed.toLowerCase())

  function select(v: string) {
    onChange(v)
    setSearch("")
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-9 text-sm",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredPresets.length === 0 && !isCustom && (
              <CommandEmpty>Không tìm thấy đơn vị nào</CommandEmpty>
            )}
            {filteredPresets.length > 0 && (
              <CommandGroup>
                {filteredPresets.map((preset) => (
                  <CommandItem
                    key={preset}
                    value={preset}
                    onSelect={() => select(preset)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === preset ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {preset}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isCustom && (
              <CommandGroup>
                <CommandItem
                  value={`__custom__${trimmed}`}
                  onSelect={() => select(trimmed)}
                >
                  <Plus className="mr-2 h-4 w-4 shrink-0" />
                  Dùng &quot;{trimmed}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
