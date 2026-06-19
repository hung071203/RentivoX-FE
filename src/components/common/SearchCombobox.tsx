"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchComboboxProps {
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  /** Called when user types — use to drive a server-side search query */
  onSearch?: (query: string) => void
  loading?: boolean
  /** Show hint when results may be truncated */
  hasMore?: boolean
  className?: string
  disabled?: boolean
}

export function SearchCombobox({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  onSearch,
  loading,
  hasMore,
  className,
  disabled,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-9 text-sm",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        {/* shouldFilter=false → Command không filter nội bộ, để server filter */}
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Đang tải...
              </div>
            ) : (
              <>
                <CommandEmpty>Không tìm thấy kết quả nào</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={onSearch ? opt.label : opt.value}
                      onSelect={() => {
                        onChange(opt.value)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === opt.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {hasMore && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                    Gõ để tìm thêm kết quả...
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
