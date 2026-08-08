"use client"

import * as React from "react"
import { CheckIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "checked" | "onChange"> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <span
      data-slot="checkbox"
      className={cn(
        "relative inline-grid size-4.5 shrink-0 place-items-center rounded-ir-xs border border-ir-border bg-ir-surface transition-colors duration-150 ease-ir-standard group-has-disabled/field:opacity-50 has-[:hover:not(:disabled)]:border-ir-primary/50 has-focus-visible:border-ir-primary has-focus-visible:ring-2 has-focus-visible:ring-ir-primary/30 has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:border-ir-border has-aria-invalid:border-ir-danger has-aria-invalid:ring-2 has-aria-invalid:ring-ir-danger/20 has-checked:border-ir-primary has-checked:bg-ir-primary has-checked:text-ir-primary-foreground dark:has-checked:bg-ir-primary",
        className
      )}
    >
      <input
        data-slot="checkbox-input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none disabled:cursor-not-allowed"
        {...props}
      />
      <CheckIcon
        data-slot="checkbox-indicator"
        className="pointer-events-none col-start-1 row-start-1 hidden size-3.5 text-current peer-checked:block"
      />
    </span>
  )
}

export { Checkbox }
