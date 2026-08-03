"use client"

import * as React from "react"
import { Radio, RadioGroup as HeadlessRadioGroup } from "@headlessui/react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <HeadlessRadioGroup
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      value={value}
      defaultValue={defaultValue}
      onChange={onValueChange}
      {...props}
    />
  )
}

// Cast rather than fight Headless UI's `as`-based polymorphic generics: at
// runtime `Radio` forwards unknown props (including `type`) straight to the
// underlying element once `as="button"` is set, which is what we rely on
// here — rendering a real `<button>` (not the default `<span role="radio">`)
// so that native `<label>`-wraps-control click association keeps working,
// same as the previous Radix-based `<button role="radio">`.
const RadioButton = Radio as unknown as React.ForwardRefExoticComponent<
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
    React.RefAttributes<HTMLButtonElement> & {
      as: "button"
      value: string
      children?: React.ReactNode | ((bag: { checked: boolean; disabled: boolean }) => React.ReactNode)
    }
>

function RadioGroupItem({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  return (
    <RadioButton
      as="button"
      type="button"
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-4.5 shrink-0 rounded-full border border-ir-border bg-ir-surface outline-none transition-colors duration-150 ease-ir-standard after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-ir-primary/50 focus-visible:border-ir-primary focus-visible:ring-2 focus-visible:ring-ir-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-ir-border data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:border-ir-border aria-invalid:border-ir-danger aria-invalid:ring-2 aria-invalid:ring-ir-danger/20 aria-invalid:aria-checked:border-ir-primary dark:aria-invalid:border-ir-danger/50 dark:aria-invalid:ring-ir-danger/40 data-checked:border-ir-primary",
        className
      )}
      {...props}
    >
      {({ checked }) => (
        <span
          data-slot="radio-group-indicator"
          className="flex size-4.5 items-center justify-center"
        >
          {checked && (
            <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ir-primary" />
          )}
        </span>
      )}
    </RadioButton>
  )
}

export { RadioGroup, RadioGroupItem }
