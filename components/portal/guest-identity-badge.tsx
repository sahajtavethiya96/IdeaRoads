"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface GuestIdentityBadgeProps {
  email: string;
}

/**
 * Shows the email an accountless visitor has verified, with a way to forget it.
 * Stands in for the account menu on the Public Portal: there is no account to
 * open, but people still need to see who they are posting as and to correct a
 * wrong address on a shared machine.
 */
export function GuestIdentityBadge({ email }: GuestIdentityBadgeProps) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  async function handleClear() {
    setClearing(true);
    try {
      await fetch("/api/portal/otp", { method: "DELETE" });
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-[16rem] truncate text-sm text-ir-muted sm:inline"
        title={email}
      >
        {email}
      </span>
      <button
        className="cursor-pointer rounded-ir-sm px-2.5 py-1.5 text-sm font-medium text-ir-muted transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={clearing}
        onClick={handleClear}
        type="button"
      >
        {clearing ? "Signing out…" : "Not you?"}
      </button>
    </div>
  );
}
