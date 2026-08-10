"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  name: string
  value?: string
  onValueChange?: (value: string) => void
} | null>(null)

function RadioGroup({
  className,
  value,
  onValueChange,
  name,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}) {
  const generatedName = React.useId()
  return (
    <RadioGroupContext.Provider
      value={{ name: name ?? generatedName, value, onValueChange }}
    >
      <div
        data-slot="radio-group"
        role="radiogroup"
        className={cn("grid w-full gap-3", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

function RadioGroupItem({
  className,
  value,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "checked" | "onChange" | "name"
> & {
  value: string
}) {
  const group = React.useContext(RadioGroupContext)
  return (
    <span
      data-slot="radio-group-item"
      className={cn(
        "relative inline-flex aspect-square size-4.5 shrink-0 rounded-full border border-ir-border bg-ir-surface transition-colors duration-150 ease-ir-standard has-[:hover:not(:disabled)]:border-ir-primary/50 has-focus-visible:border-ir-primary has-focus-visible:ring-2 has-focus-visible:ring-ir-primary/30 has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:border-ir-border has-aria-invalid:border-ir-danger has-aria-invalid:ring-2 has-aria-invalid:ring-ir-danger/20 has-checked:border-ir-primary",
        className
      )}
    >
      <input
        data-slot="radio-group-input"
        type="radio"
        name={group?.name}
        value={value}
        checked={group?.value === value}
        onChange={() => group?.onValueChange?.(value)}
        className="radio peer absolute inset-0 m-0 size-full cursor-pointer appearance-none border-0 bg-transparent shadow-none before:content-none disabled:cursor-not-allowed"
        {...props}
      />
      <span className="pointer-events-none absolute top-1/2 left-1/2 hidden size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ir-primary peer-checked:block" />
    </span>
  )
}

export { RadioGroup, RadioGroupItem }
