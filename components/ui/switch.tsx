"use client";

import * as React from "react";
import { Switch as HeadlessSwitch } from "@headlessui/react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<typeof HeadlessSwitch>, "onChange"> & {
  size?: "sm" | "default";
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <HeadlessSwitch
      data-slot="switch"
      data-size={size}
      onChange={onCheckedChange}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-ir-full border transition-colors duration-150 ease-ir-standard outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ir-primary focus-visible:ring-2 focus-visible:ring-ir-primary/30 aria-invalid:border-ir-danger aria-invalid:ring-2 aria-invalid:ring-ir-danger/20 data-[size=default]:h-4.5 data-[size=default]:w-8.25 data-[size=sm]:h-3.5 data-[size=sm]:w-6.25 dark:aria-invalid:border-ir-danger/50 dark:aria-invalid:ring-ir-danger/40 data-checked:border-ir-primary data-checked:bg-ir-primary not-data-checked:border-ir-border not-data-checked:bg-ir-muted-surface not-data-checked:hover:bg-ir-border/60 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {({ checked }) => (
        <span
          data-slot="switch-thumb"
          data-checked={checked || undefined}
          className="pointer-events-none block rounded-ir-full bg-ir-surface shadow-ir-xs ring-0 transition-transform duration-150 ease-ir-standard group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 data-checked:translate-x-[calc(100%+2px)] dark:data-checked:bg-ir-primary-foreground not-data-checked:translate-x-px dark:not-data-checked:bg-ir-text-heading"
        />
      )}
    </HeadlessSwitch>
  );
}

export { Switch };
