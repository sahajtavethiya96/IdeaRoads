"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  type SearchablePage,
  type SearchCategory,
  SEARCHABLE_PAGES,
} from "@/lib/search/searchable-pages";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: SearchCategory[] = [
  "Navigation",
  "Settings",
  "Quick Actions",
];

interface GlobalSearchProps {
  collapsed?: boolean;
  isAdminOrOwner: boolean;
  workspaceSlug: string;
}

// Sidebar-mounted search trigger + Ctrl/Cmd+K command palette. Local index
// only (see lib/search/searchable-pages.ts) — no server round trip, so
// results are instant. Built entirely on the already-themed, previously
// unused components/ui/command.tsx (cmdk + the project's own Dialog), which
// already handles focus trap, Escape-to-close, focus restore, arrow-key
// navigation, and fuzzy filtering.
export function GlobalSearch({
  workspaceSlug,
  isAdminOrOwner,
  collapsed = false,
}: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Mac gets the "⌘" hint; everyone else gets "Ctrl". Defaults to "Ctrl" for
  // the initial/SSR render (navigator isn't available server-side) and
  // corrects after mount — avoids a hydration mismatch.
  const [shortcutKey, setShortcutKey] = useState("Ctrl");

  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent;
    if (/Mac|iPod|iPhone|iPad/.test(platform)) {
      setShortcutKey("⌘");
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groupedPages = useMemo(() => {
    const map: Record<SearchCategory, SearchablePage[]> = {
      Navigation: [],
      Settings: [],
      "Quick Actions": [],
    };
    for (const page of SEARCHABLE_PAGES) {
      if (page.adminOnly && !isAdminOrOwner) {
        continue;
      }
      map[page.category].push(page);
    }
    return map;
  }, [isAdminOrOwner]);

  function handleSelect(page: SearchablePage) {
    setOpen(false);
    router.push(page.href(workspaceSlug));
  }

  return (
    <>
      <button
        className={cn(
          "flex w-full cursor-pointer items-center gap-2.5 rounded-ir-md text-sm text-sidebar-foreground/85 transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40",
          collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
        )}
        onClick={() => setOpen(true)}
        title={collapsed ? "Search" : undefined}
        type="button"
      >
        <MagnifyingGlassIcon className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">Search</span>
            <Kbd>{shortcutKey} K</Kbd>
          </>
        )}
      </button>

      <CommandDialog
        description="Jump to any page in your workspace."
        onOpenChange={setOpen}
        open={open}
        title="Search"
      >
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No matching pages found.</CommandEmpty>
          {CATEGORY_ORDER.map((category) => {
            const pages = groupedPages[category];
            if (pages.length === 0) {
              return null;
            }
            return (
              <CommandGroup heading={category} key={category}>
                {pages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <CommandItem
                      key={page.id}
                      keywords={page.keywords}
                      onSelect={() => handleSelect(page)}
                      value={page.label}
                    >
                      <Icon className="size-4 shrink-0 text-ir-muted" />
                      <span>{page.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
