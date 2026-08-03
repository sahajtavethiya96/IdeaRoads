import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // `skeleton` (DaisyUI) is layered in as the base marker class, same
        // technique as Button — `bg-none` cancels its shimmer gradient
        // (background-image) so only our own flat bg-ir-muted-surface shows,
        // and our `animate-pulse` overrides its shimmer keyframes, keeping
        // the existing pulse animation unchanged (see button-variants.ts for
        // the full explanation of the override technique).
        "skeleton bg-none animate-pulse rounded-ir-sm bg-ir-muted-surface motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
