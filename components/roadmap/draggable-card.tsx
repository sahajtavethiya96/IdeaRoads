"use client";

import {
  type DragControls,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { type ReactNode, useRef } from "react";

interface DraggableCardProps {
  // Second arg lets the card tell a real drag apart from a plain click — see
  // wasDragged below.
  children: (dragControls: DragControls, wasDragged: () => boolean) => ReactNode;
  dragEnabled: boolean;
  isDragging: boolean;
  itemId: string;
  onDrag: (point: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onDragStart: () => void;
}

// Wraps a roadmap card in framer-motion's drag gesture. Drag is *initiated*
// via dragControls.start() (dragListener={false} disables framer's own
// anywhere-on-the-element listener so the card decides where a drag can
// start from — see ManualRoadmapCard, which wires it to a pointerdown on the
// whole card). A plain click never reaches the threshold that fires
// onDragStart below, so it resolves as a normal click on whatever was
// pressed; only a real, moved drag needs guarding against — that's what
// wasDragged() is for.
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
  // Set the instant a real drag starts (past framer's movement threshold),
  // cleared a frame after it ends — late enough that the browser's own click
  // event (fired right after pointerup, before the next frame) can still see
  // it and skip opening the card's detail view.
  const draggedRef = useRef(false);

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
      onDragEnd={() => {
        onDragEnd();
        requestAnimationFrame(() => {
          draggedRef.current = false;
        });
      }}
      onDragStart={() => {
        draggedRef.current = true;
        onDragStart();
      }}
      style={{ cursor: isDragging ? "grabbing" : undefined }}
      whileDrag={
        shouldReduceMotion ? { zIndex: 30 } : { scale: 1.02, zIndex: 30 }
      }
    >
      {children(dragControls, () => draggedRef.current)}
    </motion.div>
  );
}
