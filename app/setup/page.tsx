import { redirect } from "next/navigation";
import { SetupWizard } from "@/app/setup/setup-wizard";
import { hasAnyUser } from "@/lib/setup";
import { portalBaseUrl } from "@/lib/urls";

export const metadata = {
  title: "Set up your instance",
};

export default async function SetupPage() {
  // Runs once — once any user exists, this first-run wizard disappears.
  if (await hasAnyUser()) {
    redirect("/signin");
  }

  // The slug preview shows the brand's shareable public address, which lives
  // on the Public Portal host — same computation as onboarding's page.
  const portalUrl = new URL(portalBaseUrl());
  const appHost =
    portalUrl.hostname + (portalUrl.port ? `:${portalUrl.port}` : "");

  return <SetupWizard appHost={appHost} />;
}
