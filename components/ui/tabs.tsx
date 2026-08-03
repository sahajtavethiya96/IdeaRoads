"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Headless UI's Tab.Group is index-based (`selectedIndex`/`onChange(index)`)
// with TabPanels required to directly wrap TabPanel children in order, which
// doesn't fit this codebase's string-`value`-keyed API or its flat
// Tabs > TabsList + TabsContent (siblings) structure. Hand-rolled here
// instead, keeping the same value-based public API and full keyboard
// (arrow/home/end) tablist navigation per the WAI-ARIA tabs pattern.

type TabsContextValue = {
  value: string | undefined;
  setValue: (value: string) => void;
  orientation: "horizontal" | "vertical";
  idPrefix: string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const activeValue = value ?? uncontrolledValue;
  const idPrefix = React.useId();

  const setValue = React.useCallback(
    (next: string) => {
      onValueChange?.(next);
      if (value === undefined) {
        setUncontrolledValue(next);
      }
    },
    [onValueChange, value],
  );

  const contextValue = React.useMemo(
    () => ({ value: activeValue, setValue, orientation, idPrefix }),
    [activeValue, setValue, orientation, idPrefix],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        data-horizontal={orientation === "horizontal" || undefined}
        data-vertical={orientation === "vertical" || undefined}
        className={cn(
          // `tabs` (DaisyUI) marker — this root already carries an explicit
          // `flex`/`flex-col` (see daisyui-migration-technique memory: only
          // safe on containers that already specify their own display), and
          // its only other rule (flex-wrap) is inert for a two-child column
          // layout. TabsList/TabsTrigger deliberately do NOT get `tabs-box`/
          // `tab` — DaisyUI's `.tabs-box>[aria-selected=true]` is a
          // child-combinator rule reaching into the active trigger's own
          // background (the same unsafe pattern documented for `.toggle>*`),
          // and bare `.tab` paints a folder-tab notch/border on the active
          // trigger that nothing here cancels.
          "tabs group/tabs flex gap-2 data-horizontal:flex-col",
          className,
        )}
        {...props}
      />
    </TabsContext.Provider>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-ir-md p-1 text-ir-muted group-data-horizontal/tabs:h-10 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-ir-muted-surface",
        line: "gap-1 rounded-none bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof tabsListVariants>) {
  const ctx = React.useContext(TabsContext);
  return (
    <div
      role="tablist"
      aria-orientation={ctx?.orientation}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    ctx?.setValue(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    const isHorizontal = ctx?.orientation !== "vertical";
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
    if (![nextKey, prevKey, "Home", "End"].includes(event.key)) return;

    const list = event.currentTarget.closest('[role="tablist"]');
    const tabs = list
      ? Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
      : [];
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex === -1 || tabs.length === 0) return;

    let nextIndex = currentIndex;
    if (event.key === nextKey) nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === prevKey) nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;

    event.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  return (
    <button
      type="button"
      role="tab"
      id={ctx ? `${ctx.idPrefix}-trigger-${value}` : undefined}
      aria-controls={ctx ? `${ctx.idPrefix}-content-${value}` : undefined}
      aria-selected={active}
      data-slot="tabs-trigger"
      data-active={active || undefined}
      disabled={disabled}
      tabIndex={active ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-ir-sm border border-transparent px-4 py-1.5 text-xs font-semibold tracking-wider whitespace-nowrap text-ir-muted uppercase transition-all duration-150 ease-ir-standard group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:px-4 group-data-vertical/tabs:py-2 hover:text-ir-heading focus-visible:border-ir-primary focus-visible:ring-[3px] focus-visible:ring-ir-primary/30 focus-visible:outline-1 focus-visible:outline-ir-primary disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-ir-surface data-active:text-ir-heading data-active:shadow-ir-xs",
        "after:absolute after:bg-ir-primary after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-1.25 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;

  if (!active) return null;

  return (
    <div
      role="tabpanel"
      id={ctx ? `${ctx.idPrefix}-content-${value}` : undefined}
      aria-labelledby={ctx ? `${ctx.idPrefix}-trigger-${value}` : undefined}
      tabIndex={0}
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
