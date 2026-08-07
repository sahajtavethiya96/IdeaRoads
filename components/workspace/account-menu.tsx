"use client";

import {
  Bell,
  CaretUpDown,
  Scroll,
  Shield,
  SignOut,
  Sliders,
  UserCircle,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SquareAvatar } from "@/components/ui/square-avatar";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  collapsed?: boolean;
  email: string;
  isAdminOrOwner: boolean;
  userImage: string | null;
  workspaceSlug: string;
}

// Shared dropdown body for both the sidebar's full account bar and the
// topbar's icon-only trigger (see TopbarAccountMenu below) — same account,
// same menu, just two different places to open it from.
function AccountMenuDropdownContent({
  email,
  isAdminOrOwner,
  userImage,
  workspaceSlug,
  align = "start",
  side = "top",
}: Omit<AccountMenuProps, "collapsed"> & {
  align?: "start" | "end";
  side?: "top" | "bottom";
}) {
  const pathname = usePathname();

  const itemClass = (href: string) =>
    pathname.startsWith(href)
      ? "bg-ir-primary-light/20 text-ir-primary focus:bg-ir-primary-light/20 focus:text-ir-primary"
      : "";

  return (
    <DropdownMenuContent
      align={align}
      className="w-64 max-w-[calc(100vw-1rem)]"
      side={side}
      sideOffset={6}
    >
      <DropdownMenuLabel className="flex items-center gap-2.5 font-normal normal-case tracking-normal">
        <SquareAvatar
          alt={email}
          className="rounded-full"
          fallback={email.charAt(0).toUpperCase()}
          imageUrl={userImage}
        />
        <span
          className="flex-1 truncate text-xs font-medium text-ir-heading"
          title={email}
        >
          {email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {isAdminOrOwner && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem
              asChild
              className={itemClass(`/${workspaceSlug}/settings/general`)}
            >
              <Link href={`/${workspaceSlug}/settings/general`}>
                <Sliders />
                General
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className={itemClass(`/${workspaceSlug}/settings/moderation`)}
            >
              <Link href={`/${workspaceSlug}/settings/moderation`}>
                <Shield />
                Moderation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className={itemClass(`/${workspaceSlug}/settings/audit-log`)}
            >
              <Link href={`/${workspaceSlug}/settings/audit-log`}>
                <Scroll />
                Audit Log
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}

      <DropdownMenuGroup>
        <DropdownMenuItem
          asChild
          className={itemClass(`/${workspaceSlug}/settings/notifications`)}
        >
          <Link href={`/${workspaceSlug}/settings/notifications`}>
            <Bell />
            Notification Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className={itemClass(`/${workspaceSlug}/settings/account`)}
        >
          <Link href={`/${workspaceSlug}/settings/account`}>
            <UserCircle />
            Account
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => logoutAction()} variant="destructive">
        <SignOut />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function AccountMenu({
  email,
  isAdminOrOwner,
  userImage,
  workspaceSlug,
  collapsed = false,
}: AccountMenuProps) {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-14 w-full min-w-0 cursor-pointer items-center gap-2.5 border-t border-sidebar-border text-left transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40",
            collapsed ? "justify-center px-0" : "px-4"
          )}
          title={collapsed ? email : undefined}
          type="button"
        >
          <SquareAvatar
            alt={email}
            className="shrink-0 rounded-full"
            fallback={email.charAt(0).toUpperCase()}
            imageUrl={userImage}
          />
          {!collapsed && (
            <>
              <span
                className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground"
                title={email}
              >
                {email}
              </span>
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                className="shrink-0 text-sidebar-foreground/60"
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.15,
                  ease: "easeOut",
                }}
              >
                <CaretUpDown className="size-4" />
              </motion.span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <AccountMenuDropdownContent
        email={email}
        isAdminOrOwner={isAdminOrOwner}
        userImage={userImage}
        workspaceSlug={workspaceSlug}
      />
    </DropdownMenu>
  );
}

// Icon-only trigger for the Topbar (top-right, every workspace page) — same
// account and menu as the sidebar's AccountMenu, so signing out or jumping to
// Account settings works identically from either entry point.
export function TopbarAccountMenu({
  email,
  isAdminOrOwner,
  userImage,
  workspaceSlug,
}: Omit<AccountMenuProps, "collapsed">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-150 ease-ir-standard hover:ring-2 hover:ring-ir-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
          title={email}
          type="button"
        >
          <SquareAvatar
            alt={email}
            className="size-9 rounded-full ring-1 ring-ir-border"
            fallback={email.charAt(0).toUpperCase()}
            imageUrl={userImage}
          />
        </button>
      </DropdownMenuTrigger>

      <AccountMenuDropdownContent
        align="end"
        email={email}
        isAdminOrOwner={isAdminOrOwner}
        side="bottom"
        userImage={userImage}
        workspaceSlug={workspaceSlug}
      />
    </DropdownMenu>
  );
}
