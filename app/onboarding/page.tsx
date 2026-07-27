import { redirect } from "next/navigation";
import { OnboardingForm } from "@/app/onboarding/_components/onboarding-form";
import { OnboardingWizard } from "@/app/onboarding/_components/onboarding-wizard";
import { requireSession } from "@/lib/authz";
import { portalBaseUrl } from "@/lib/urls";
import { getFirstUserWorkspace } from "@/lib/workspaces/queries";

export const metadata = {
  title: "Create your workspace",
};

interface OnboardingPageProps {
  searchParams: Promise<{ new?: string }>;
}

// Better Auth has no name-collection step for magic-link sign-in (the
// dominant sign-up path — see auth-form.tsx), so it defaults a brand-new
// user's name to something derived from their email. Google sign-ins DO get
// a real name from the OAuth profile. Treat anything that collapses back to
// the email itself (or its local part) as "not a real name yet" so Step 1
// asks for one instead of pre-filling a login-looking string.
function realNameOrEmpty(name: string, email: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.includes("@")) {
    return "";
  }
  const localPart = email.split("@")[0]?.toLowerCase();
  if (
    trimmed.toLowerCase() === email.toLowerCase() ||
    trimmed.toLowerCase() === localPart
  ) {
    return "";
  }
  return trimmed;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const session = await requireSession();
  const { new: isNew } = await searchParams;

  // Redirect if the user already has a workspace — unless they explicitly asked
  // to create another one (via the workspace switcher's "Create workspace").
  if (!isNew) {
    const existing = await getFirstUserWorkspace(session.user.id);
    if (existing) {
      redirect(`/${existing.slug}`);
    }
  }

  // The slug preview shows the brand's shareable public address, which lives on
  // the Public Portal host.
  const portalUrl = new URL(portalBaseUrl());
  const appHost =
    portalUrl.hostname + (portalUrl.port ? `:${portalUrl.port}` : "");

  // The multi-step welcome wizard is only for a genuinely first-time signup.
  // Someone already using the product who's adding an extra workspace (the
  // workspace switcher's "Create workspace", ?new=1) gets the plain
  // single-step form unchanged — a second "Welcome!"/"How would you like to
  // use IdeaRoads?" would make no sense for them.
  if (isNew) {
    return <OnboardingForm appHost={appHost} isAdditional />;
  }

  return (
    <OnboardingWizard
      appHost={appHost}
      initialName={realNameOrEmpty(session.user.name, session.user.email)}
    />
  );
}
