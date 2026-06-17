import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface SortableHeadProps {
  label: string
  field: string
  orderBy?: string
  orderDirection?: "ASC" | "DESC"
  onSort: (field: string, direction: "ASC" | "DESC" | undefined) => void
  className?: string
}

export function SortableHead({
  label,
  field,
  orderBy,
  orderDirection,
  onSort,
  className,
}: SortableHeadProps) {
  const isActive = orderBy === field

  function handleClick() {
    if (!isActive) onSort(field, "ASC")
    else if (orderDirection === "ASC") onSort(field, "DESC")
    else onSort(field, undefined)
  }

  return (
    <TableHead
      className={cn("cursor-pointer select-none", className)}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {isActive ? (
          orderDirection === "ASC" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40 shrink-0" />
        )}
      </div>
    </TableHead>
  )
}
