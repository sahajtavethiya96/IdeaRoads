import { redirect } from "next/navigation";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { SignupForm } from "@/app/(auth)/_components/signup-form";
import { isFeatureEnabled } from "@/lib/orbit/feature-flags";
import { redirectToSetupIfNeeded } from "@/lib/setup";
import { isSmtpConfigured } from "@/lib/smtp/client";

export const metadata = {
  title: "Sign up",
};

// Self-serve email + password registration is off by default (Feature 01 /
// PLATFORM.md — magic link + Google only). When an Orbit Admin enables the
// `password_auth` feature flag, this page renders a real signup form; while
// it's off, /signup keeps its original behavior of forwarding to /signin.
export default async function SignupPage() {
  await redirectToSetupIfNeeded();

  const passwordEnabled = await isFeatureEnabled("password_auth");
  if (!passwordEnabled) {
    redirect("/signin");
  }

  return (
    <AuthShell
      subtitle="Create your account with an email and password."
      title="Create your account"
    >
      <SignupForm requiresEmailVerification={isSmtpConfigured()} />
    </AuthShell>
  );
}
