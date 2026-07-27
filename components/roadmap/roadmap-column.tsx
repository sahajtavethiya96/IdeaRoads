"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { RoadmapPost } from "@/lib/roadmap/queries";
import { DraggableCard } from "./draggable-card";
import { RoadmapEmptyState } from "./roadmap-empty-state";
import { RoadmapPostCard } from "./roadmap-post-card";
import { RoadmapStatusHeader } from "./roadmap-status-header";

const PAGE_SIZE = 10;

interface RoadmapColumnProps {
  // Drag-and-drop is an opt-in enhancement, only wired up by the admin-shelled
  // board (see RoadmapBoard) — the public roadmap page never passes these.
  canManage?: boolean;
  color: string;
  // Registers this column's drop-zone element for RoadmapBoard's pointer
  // hit-testing (see useKanbanDrag). Absent on the public (read-only) board.
  columnRef?: (el: HTMLDivElement | null) => void;
  draggingId?: string | null;
  embedQuery?: string;
  isDropTarget?: boolean;
  isFiltering?: boolean;
  isSignedIn: boolean;
  name: string;
  onDrag?: (point: { x: number; y: number }) => void;
  onDragEndPost?: () => void;
  onDragStartPost?: (post: RoadmapPost) => void;
  posts: RoadmapPost[];
  useWorkspaceLinks?: boolean;
  workspaceSlug: string;
}

export function RoadmapColumn({
  name,
  color,
  posts,
  workspaceSlug,
  isSignedIn,
  useWorkspaceLinks,
  embedQuery,
  canManage = false,
  columnRef,
  draggingId = null,
  isDropTarget = false,
  isFiltering = false,
  onDrag,
  onDragEndPost,
  onDragStartPost,
}: RoadmapColumnProps) {
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <RoadmapStatusHeader color={color} count={posts.length} name={name} />

      {/* Drop zone. flex-1 (not just min-h-*) so it fills the column's full
          stretched height — the grid row stretches every column to match its
          tallest sibling (CSS grid's default align-items: stretch), so
          without flex-1 a short column's actual drop-zone element only wraps
          its own cards, leaving empty space below that looks part of the
          column but sits outside the div useKanbanDrag hit-tests against
          (getBoundingClientRect on this exact ref). That's what made only the
          top of a column register drops. Keyboard/non-pointer users change
          status via the post's own status control elsewhere (e.g. All
          Feedback) — drag here is a pointer-only enhancement, matching the
          manual roadmap board (see DraggableCard — it can only be started
          from each card's drag handle). */}
      <div
        className={`flex min-h-16 flex-1 flex-col gap-2 rounded-ir-md p-1 transition-colors duration-150 ease-ir-standard ${
          isDropTarget && canManage
            ? "bg-ir-primary-light/10 ring-1 ring-inset ring-ir-primary/30"
            : ""
        }`}
        ref={columnRef}
      >
        {visible.length === 0 ? (
          <div className="flex-1 rounded-ir-card border border-dashed border-ir-border">
            <RoadmapEmptyState
              label={isFiltering ? "No matches" : `Nothing in ${name} yet.`}
            />
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {visible.map((post) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  key={post.id}
                  layout={!shouldReduceMotion}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <DraggableCard
                    dragEnabled={canManage}
                    isDragging={canManage && draggingId === post.id}
                    itemId={post.id}
                    onDrag={(point) => onDrag?.(point)}
                    onDragEnd={() => onDragEndPost?.()}
                    onDragStart={() => onDragStartPost?.(post)}
                  >
                    {(dragControls) => (
                      <RoadmapPostCard
                        canManage={canManage}
                        dragControls={dragControls}
                        embedQuery={embedQuery}
                        isDragging={canManage && draggingId === post.id}
                        isSignedIn={isSignedIn}
                        post={post}
                        useWorkspaceLinks={useWorkspaceLinks}
                        workspaceSlug={workspaceSlug}
                      />
                    )}
                  </DraggableCard>
                </motion.div>
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                className="w-full cursor-pointer rounded-ir-sm border border-dashed border-ir-border py-2 text-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/30 hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                type="button"
              >
                Show {Math.min(PAGE_SIZE, posts.length - visibleCount)} more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
