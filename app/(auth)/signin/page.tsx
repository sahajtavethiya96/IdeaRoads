import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { env } from "@/lib/env";
import { isFeatureEnabled } from "@/lib/orbit/feature-flags";
import { redirectToSetupIfNeeded } from "@/lib/setup";
import { isSmtpConfigured } from "@/lib/smtp/client";

export const metadata = {
  title: "Get started",
};

export default async function LoginPage() {
  // A brand-new self-hosted instance has no users yet — send visitors to the
  // first-run setup wizard instead of a sign-in form nobody can use yet.
  await redirectToSetupIfNeeded();

  // Google sign-in requires both OAuth credentials AND the platform-wide
  // `google_auth` feature flag (an Orbit Admin can disable it without a deploy).
  // It works on both the Workspace and Portal hosts — Better Auth resolves the
  // OAuth origin per-request (see baseURL in lib/auth.ts) so the callback always
  // returns to the host the user started from — so it is offered wherever it is
  // configured, on either host.
  const googleConfigured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const googleEnabled =
    googleConfigured && (await isFeatureEnabled("google_auth"));

  // Self-serve email + password is off by default — an Orbit Admin opts in at
  // /orbit/feature-flags. "Forgot password?" only makes sense when SMTP can
  // actually deliver the reset email.
  const passwordEnabled = await isFeatureEnabled("password_auth");
  const passwordResetEnabled = passwordEnabled && isSmtpConfigured();

  return (
    <AuthForm
      googleEnabled={googleEnabled}
      passwordEnabled={passwordEnabled}
      passwordResetEnabled={passwordResetEnabled}
    />
  );
}
