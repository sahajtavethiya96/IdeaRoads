"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  indicatorClassName?: string
  value?: number
}) {
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn(
        "relative flex h-0.5 w-full items-center overflow-x-hidden rounded-none bg-base-200",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn("size-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
}

export { Progress }
