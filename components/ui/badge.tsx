import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "badge group/badge w-fit shrink-0 gap-1.5 overflow-hidden border-transparent px-2 py-0.5 text-xs font-semibold tracking-ui whitespace-nowrap uppercase transition-colors duration-150 ease-ir-standard focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0 aria-invalid:border-error aria-invalid:ring-error/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary [a]:hover:bg-primary/25",
        secondary:
          "badge-neutral bg-base-200 text-base-content [a]:hover:bg-base-300",
        destructive:
          "bg-error/10 text-error focus-visible:ring-error/20 [a]:hover:bg-error/20",
        outline:
          "badge-outline border-base-300 bg-transparent text-base-content [a]:hover:bg-base-200",
        ghost:
          "badge-ghost border-transparent bg-transparent px-0 text-base-content/60 hover:text-base-content",
        link: "border-transparent bg-transparent px-0 text-base-content underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
