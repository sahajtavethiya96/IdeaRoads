"use client";

import {
  type DragControls,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode } from "react";

interface DraggableCardProps {
  children: (dragControls: DragControls) => ReactNode;
  dragEnabled: boolean;
  isDragging: boolean;
  itemId: string;
  onDrag: (point: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onDragStart: () => void;
}

// Wraps a roadmap card in framer-motion's drag gesture. Drag can only be
// *initiated* via dragControls.start() from the card's own drag-handle icon
// (dragListener={false} here disables starting a drag from anywhere else on
// the card) — never from clicking its title/link/buttons, so there's no
// click-vs-drag ambiguity to guard against elsewhere.
//
// On release the card springs back to its own slot (dragSnapToOrigin); the
// caller's onDragEnd then relocates it via the same performMove/state-update
// path as before, and the existing enter/exit/layout animation on each
// board's outer motion.div carries it into its new position.
export function DraggableCard({
  children,
  dragEnabled,
  isDragging,
  itemId,
  onDrag,
  onDragEnd,
  onDragStart,
}: DraggableCardProps) {
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative"
      data-kanban-card={itemId}
      drag={dragEnabled}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragSnapToOrigin
      onDrag={(_, info) => onDrag({ x: info.point.x, y: info.point.y })}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      style={{ cursor: isDragging ? "grabbing" : undefined }}
      whileDrag={
        shouldReduceMotion ? { zIndex: 30 } : { scale: 1.02, zIndex: 30 }
      }
    >
      {children(dragControls)}
    </motion.div>
  );
}
