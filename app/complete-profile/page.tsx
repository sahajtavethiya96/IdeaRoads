import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/app/complete-profile/_components/complete-profile-form";
import { requireSession } from "@/lib/authz";
import { realNameOrEmpty } from "@/lib/users/profile-name";

export const metadata: Metadata = {
  title: "Complete your profile",
};

interface Props {
  searchParams: Promise<{ next?: string }>;
}

// Mirrors auth-form.tsx's `next` handling: only relative paths are honored,
// so this can't be turned into an open redirect via a crafted query param.
function safeNext(raw: string | undefined): string {
  return raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/post-auth";
}

export default async function CompleteProfilePage({ searchParams }: Props) {
  const session = await requireSession();
  const target = safeNext((await searchParams).next);

  // Already has a real display name (set here before, or via Google OAuth,
  // or the onboarding wizard) — nothing left to complete.
  if (realNameOrEmpty(session.user.name, session.user.email)) {
    redirect(target);
  }

  return <CompleteProfileForm next={target} />;
}
