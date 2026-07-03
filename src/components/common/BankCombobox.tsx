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
import { VIETNAM_BANKS, type VietnamBank } from "@/constants/banks"

interface BankComboboxProps {
  value: string
  onChange: (bank: VietnamBank) => void
  placeholder?: string
  disabled?: boolean
}

export function BankCombobox({ value, onChange, placeholder = "Chọn ngân hàng", disabled }: BankComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = VIETNAM_BANKS.find((b) => b.bin === value)
  const q = search.trim().toLowerCase()
  const filtered = q
    ? VIETNAM_BANKS.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.shortName.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q),
      )
    : VIETNAM_BANKS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-9 text-sm",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="truncate text-left flex-1">
            {selected ? selected.shortName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm ngân hàng..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Không tìm thấy ngân hàng</CommandEmpty>
            <CommandGroup>
              {filtered.map((bank) => (
                <CommandItem
                  key={bank.bin}
                  value={bank.bin}
                  onSelect={() => {
                    onChange(bank)
                    setSearch("")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === bank.bin ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{bank.shortName}</p>
                    <p className="text-xs text-muted-foreground truncate">{bank.name}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
