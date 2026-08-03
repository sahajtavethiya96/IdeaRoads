"use client"

import * as React from "react"

/**
 * Headless UI's built-in `anchor` prop (Menu/Listbox/Popover) already
 * replicates Radix Popper's flip/shift/viewport-clamped-max-height behavior
 * via @floating-ui/react internally, but it never matches the floating
 * panel's width to its trigger's width the way Radix's
 * `--radix-*-trigger-width` CSS var did. This hook fills that one gap:
 * measure the trigger element and keep a live width in sync (including
 * trigger resizes) whenever the panel is open.
 */
export function useMatchTriggerWidth(open: boolean) {
  const [width, setWidth] = React.useState<number>()
  const triggerRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    const node = triggerRef.current
    if (!open || !node) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [open])

  return { triggerRef, width }
}
