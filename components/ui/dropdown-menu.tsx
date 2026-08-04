"use client"

import * as React from "react"
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  MenuSection,
} from "@headlessui/react"
import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

// Headless UI's Menu manages open state internally and doesn't accept a
// controlled `open` prop — the incoming `open` is accepted for API
// compatibility but only used one-directionally: `onOpenChange` mirrors
// Menu's real internal state out to the caller (e.g. to rotate a chevron),
// matching every current call site's usage. None force the menu open from
// outside.
function DropdownMenu({
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <Menu data-slot="dropdown-menu">
      {({ open }) => (
        <MenuOpenReporter onOpenChange={onOpenChange} open={open}>
          {children}
        </MenuOpenReporter>
      )}
    </Menu>
  )
}

function MenuOpenReporter({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  React.useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])
  return <>{children}</>
}

// `as={Fragment}` is Headless UI's asChild equivalent — it forwards a11y
// props (aria-expanded, onClick, ref) straight onto the single child instead
// of wrapping it in its own <button>.
function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  if (asChild) {
    return (
      <MenuButton as={React.Fragment} {...props}>
        {children}
      </MenuButton>
    )
  }
  return (
    <MenuButton data-slot="dropdown-menu-trigger" {...props}>
      {children}
    </MenuButton>
  )
}

const ANCHOR_MAP = {
  top: { start: "top start", end: "top end", center: "top" },
  bottom: { start: "bottom start", end: "bottom end", center: "bottom" },
  left: { start: "left start", end: "left end", center: "left" },
  right: { start: "right start", end: "right end", center: "right" },
} as const

function DropdownMenuContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  children,
}: {
  className?: string
  align?: "start" | "end" | "center"
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  children?: React.ReactNode
}) {
  const anchor = ANCHOR_MAP[side][align]

  return (
    <MenuItems
      anchor={{ to: anchor, gap: sideOffset }}
      data-slot="dropdown-menu-content"
      modal={false}
      transition
      className={cn(
        "z-50 max-h-(--anchor-max-height) w-(--anchor-width) min-w-48 overflow-x-hidden overflow-y-auto rounded-ir-md border border-base-300 bg-base-100 p-1.5 text-base-content shadow-ir-lg duration-100 [--anchor-gap:--spacing(1)] data-closed:scale-95 data-closed:opacity-0",
        className
      )}
    >
      {children}
    </MenuItems>
  )
}

function DropdownMenuGroup({ children }: { children?: React.ReactNode }) {
  return <MenuSection data-slot="dropdown-menu-group">{children}</MenuSection>
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  disabled,
  asChild,
  onClick,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean
  variant?: "default" | "destructive"
  disabled?: boolean
  asChild?: boolean
}) {
  const itemClassName = cn(
    "group/dropdown-menu-item relative flex cursor-pointer items-center gap-2.5 rounded-ir-sm px-3 py-2 text-xs font-medium tracking-wider uppercase outline-hidden transition-colors duration-100 select-none not-data-[variant=destructive]:data-focus:bg-base-200 data-inset:pl-9.5 data-[variant=destructive]:text-error data-[variant=destructive]:data-focus:bg-error/10 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 data-[variant=destructive]:*:[svg]:text-error not-last:mb-1",
    className
  )

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>
    return (
      <MenuItem disabled={disabled}>
        {React.cloneElement(child, {
          className: cn(itemClassName, child.props.className),
          "data-inset": inset,
          "data-slot": "dropdown-menu-item",
          "data-variant": variant,
        } as Record<string, unknown>)}
      </MenuItem>
    )
  }

  return (
    <MenuItem disabled={disabled}>
      <div
        data-inset={inset}
        data-slot="dropdown-menu-item"
        data-variant={variant}
        className={itemClassName}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    </MenuItem>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  onCheckedChange,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <MenuItem>
      <div
        data-inset={inset}
        data-slot="dropdown-menu-checkbox-item"
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "relative flex cursor-pointer items-center gap-2.5 rounded-ir-sm py-2 pr-8 pl-3 text-xs font-medium tracking-wider uppercase outline-hidden transition-colors duration-100 select-none not-data-[state=checked]:data-focus:bg-base-200 data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary data-inset:pl-9.5 not-last:mb-1",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        {checked && (
          <span
            className="pointer-events-none absolute right-2 flex items-center justify-center"
            data-slot="dropdown-menu-checkbox-item-indicator"
          >
            <CheckIcon />
          </span>
        )}
        {children}
      </div>
    </MenuItem>
  )
}

function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}) {
  return (
    <div data-slot="dropdown-menu-radio-group">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<{ checked?: boolean; onSelect?: () => void; value?: string }>(child)) {
          return child
        }
        return React.cloneElement(child, {
          checked: child.props.value === value,
          onSelect: () => child.props.value && onValueChange?.(child.props.value),
        })
      })}
    </div>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  checked,
  onSelect,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean
  checked?: boolean
  onSelect?: () => void
  value?: string
}) {
  return (
    <MenuItem>
      <div
        data-inset={inset}
        data-slot="dropdown-menu-radio-item"
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "relative flex cursor-pointer items-center gap-2.5 rounded-ir-sm py-2 pr-8 pl-3 text-xs font-medium tracking-wider uppercase outline-hidden transition-colors duration-100 select-none not-data-[state=checked]:data-focus:bg-base-200 data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary data-inset:pl-9.5 not-last:mb-1",
          className
        )}
        onClick={onSelect}
        {...props}
      >
        {checked && (
          <span
            className="pointer-events-none absolute right-2 flex items-center justify-center"
            data-slot="dropdown-menu-radio-item-indicator"
          >
            <CheckIcon />
          </span>
        )}
        {children}
      </div>
    </MenuItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-inset={inset}
      data-slot="dropdown-menu-label"
      className={cn(
        "px-3 py-2 text-xs font-semibold tracking-wider text-base-content/60 uppercase data-inset:pl-9.5",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-base-300", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-base-content/60 group-data-focus/dropdown-menu-item:text-primary",
        className
      )}
      {...props}
    />
  )
}

// Headless UI's Menu has no native nested-submenu primitive (unused in this
// app today) — approximated with a second independent Menu anchored to the
// trigger item, opened on hover/focus of the parent item.
function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-ir-sm px-3 py-2 text-xs font-medium tracking-wider uppercase outline-hidden transition-colors duration-100 select-none hover:bg-primary/15 hover:text-primary data-inset:pl-9.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 not-last:mb-1",
        className
      )}
      {...props}
    >
      {children}
      <CaretRightIcon className="ml-auto" />
    </div>
  )
}

function DropdownMenuSubContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "z-50 min-w-36 overflow-hidden rounded-ir-md border border-base-300 bg-base-100 p-1.5 text-base-content shadow-ir-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
