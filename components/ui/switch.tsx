"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  checked,
  onCheckedChange,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "type" | "size" | "checked" | "onChange"
> & {
  size?: "sm" | "default";
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <span
      data-slot="switch"
      data-size={size}
      className={cn(
        "group/switch relative inline-flex shrink-0 items-center rounded-ir-full border border-ir-border bg-ir-muted-surface transition-colors duration-150 ease-ir-standard has-focus-visible:border-ir-primary has-focus-visible:ring-2 has-focus-visible:ring-ir-primary/30 has-aria-invalid:border-ir-danger has-aria-invalid:ring-2 has-aria-invalid:ring-ir-danger/20 dark:has-aria-invalid:border-ir-danger/50 dark:has-aria-invalid:ring-ir-danger/40 data-[size=default]:h-4.5 data-[size=default]:w-8.25 data-[size=sm]:h-3.5 data-[size=sm]:w-6.25 has-checked:border-ir-primary has-checked:bg-ir-primary has-[:not(:checked):hover]:bg-ir-border/60 has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
    >
      <input
        data-slot="switch-input"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        className="toggle peer absolute inset-0 m-0 size-full cursor-pointer appearance-none border-0 bg-transparent shadow-none before:content-none disabled:cursor-not-allowed"
        {...props}
      />
      <span
        data-slot="switch-thumb"
        className="pointer-events-none block translate-x-px rounded-ir-full bg-ir-surface shadow-ir-xs ring-0 transition-transform duration-150 ease-ir-standard group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 peer-checked:translate-x-[calc(100%+2px)] dark:bg-ir-text-heading dark:peer-checked:bg-ir-primary-foreground"
      />
    </span>
  );
}

export { Switch };
