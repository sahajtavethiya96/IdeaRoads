"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SquareAvatarProps {
  alt?: string;
  className?: string;
  fallback: ReactNode;
  imageUrl?: string | null;
}

export function SquareAvatar({
  alt,
  className,
  fallback,
  imageUrl,
}: SquareAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!imageUrl && !failed;

  return (
    <div
      className={cn(
        // `avatar` (DaisyUI) is layered in as the base marker class, same
        // technique as Button — it only contributes display/positioning
        // rules here (no forced border-radius), so this stays square; our
        // later-generated size/overflow/bg utilities below are unaffected
        // (see button-variants.ts for the full explanation).
        "avatar flex size-7 shrink-0 items-center justify-center overflow-hidden bg-ir-muted-surface text-xs font-semibold text-ir-muted",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt ?? ""}
          className="size-full object-cover"
          onError={() => setFailed(true)}
          src={imageUrl}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
