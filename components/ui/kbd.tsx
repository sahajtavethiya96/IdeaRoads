import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Keyboard-shortcut hint chip. Follows the `data-slot="kbd"` styling
// contract already anticipated by InputGroupAddon (see input-group.tsx),
// which had no component rendering it yet.
export function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "rounded-ir-xs border border-ir-border bg-ir-muted-surface px-1.5 py-0.5 font-mono text-2xs text-ir-muted",
        className
      )}
      data-slot="kbd"
    >
      {children}
    </kbd>
  );
}
