"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react"

// Headless UI has no multi-item Accordion (only a single independent
// `Disclosure` panel, with no controlled `open` prop to coordinate several
// of them), so the "only one section open at a time" behavior Radix gave us
// for free is hand-rolled here via context instead.

type AccordionContextValue = {
  openValue: string | undefined
  setOpenValue: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

type AccordionItemContextValue = {
  open: boolean
  toggle: () => void
  triggerId: string
  contentId: string
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

function Accordion({
  className,
  defaultValue,
  value,
  onValueChange,
  type: _type,
  collapsible: _collapsible,
  ...props
}: React.ComponentProps<"div"> & {
  type?: "single"
  collapsible?: boolean
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const openValue = value ?? uncontrolledValue

  const setOpenValue = React.useCallback(
    (next: string) => {
      const nextValue = next === openValue ? undefined : next
      onValueChange?.(nextValue ?? "")
      if (value === undefined) {
        setUncontrolledValue(nextValue)
      }
    },
    [onValueChange, openValue, value]
  )

  const contextValue = React.useMemo(
    () => ({ openValue, setOpenValue }),
    [openValue, setOpenValue]
  )

  return (
    <AccordionContext.Provider value={contextValue}>
      <div data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props} />
    </AccordionContext.Provider>
  )
}

function AccordionItem({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const accordionCtx = React.useContext(AccordionContext)
  const generatedId = React.useId()
  const open = accordionCtx?.openValue === value

  const itemContextValue = React.useMemo<AccordionItemContextValue>(
    () => ({
      open,
      toggle: () => accordionCtx?.setOpenValue(value),
      triggerId: `${generatedId}-trigger`,
      contentId: `${generatedId}-content`,
    }),
    [accordionCtx, generatedId, open, value]
  )

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <div
        data-slot="accordion-item"
        className={cn("not-last:border-b not-last:border-ir-border", className)}
        {...props}
      />
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const itemCtx = React.useContext(AccordionItemContext)
  const open = itemCtx?.open ?? false

  return (
    <h3 className="flex">
      <button
        type="button"
        id={itemCtx?.triggerId}
        aria-controls={itemCtx?.contentId}
        aria-expanded={open}
        data-slot="accordion-trigger"
        onClick={() => itemCtx?.toggle()}
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 rounded-ir-xs border border-transparent py-4 text-left text-sm font-semibold text-ir-heading transition-colors duration-150 ease-ir-standard outline-none hover:text-ir-primary hover:underline focus-visible:border-ir-primary focus-visible:ring-2 focus-visible:ring-ir-primary/30 disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-3.5 **:data-[slot=accordion-trigger-icon]:text-ir-muted",
          className
        )}
        {...props}
      >
        {children}
        <CaretDownIcon data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden" />
        <CaretUpIcon data-slot="accordion-trigger-icon" className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline" />
      </button>
    </h3>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const itemCtx = React.useContext(AccordionItemContext)
  const open = itemCtx?.open ?? false

  return (
    <div
      data-slot="accordion-content"
      id={itemCtx?.contentId}
      role="region"
      aria-labelledby={itemCtx?.triggerId}
      inert={!open}
      className={cn(
        "grid overflow-hidden text-sm transition-[grid-template-rows] duration-200 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
      {...props}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "pt-0 pb-4 text-ir-body [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-ir-primary [&_p:not(:last-child)]:mb-4",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
