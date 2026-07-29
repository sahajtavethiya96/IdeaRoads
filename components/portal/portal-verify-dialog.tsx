"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PortalVerifyPanel } from "./portal-verify-panel";

interface PortalVerifyDialogProps {
  // What the visitor was trying to do, so the prompt explains itself rather
  // than interrupting with a generic "sign in".
  action?: "vote" | "comment" | "post";
  onOpenChange: (open: boolean) => void;
  onVerified: (identity: { email: string; name: string | null }) => void;
  open: boolean;
}

const ACTION_COPY: Record<
  NonNullable<PortalVerifyDialogProps["action"]>,
  string
> = {
  comment: "Confirm your email to join the conversation.",
  post: "Confirm your email so the team can follow up on your feedback.",
  vote: "Confirm your email to add your vote.",
};

// Modal wrapper around PortalVerifyPanel for actions triggered mid-page on the
// Public Portal (vote, comment, submit feedback) — the visitor never leaves the
// board, and no account is created.
export function PortalVerifyDialog({
  action = "post",
  open,
  onOpenChange,
  onVerified,
}: PortalVerifyDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>{ACTION_COPY[action]}</DialogDescription>
        </DialogHeader>
        <PortalVerifyPanel
          onVerified={(identity) => {
            onOpenChange(false);
            onVerified(identity);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
