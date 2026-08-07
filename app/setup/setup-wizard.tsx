"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { getIntegrationSettingsStatusAction } from "@/app/actions/integration-settings";
import { createFirstAdminAction } from "@/app/actions/setup";
import { createWorkspaceAction } from "@/app/actions/workspace";
import { StepWorkspace } from "@/app/onboarding/_components/steps/step-workspace";
import { IntegrationsPanel } from "@/components/settings/integrations/integrations-panel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { authClient } from "@/lib/auth-client";
import { suggestEmailDomainFix } from "@/lib/email-typo";
import type { IntegrationSettingsStatus } from "@/lib/integration-settings-types";

const MIN_PASSWORD_LENGTH = 8;

interface SetupWizardProps {
  adminUrl: string;
  appHost: string;
}

export function SetupWizard({ appHost, adminUrl }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "workspace" | "integrations">(
    "account"
  );
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [integrationsStatus, setIntegrationsStatus] =
    useState<IntegrationSettingsStatus | null>(null);
  const [integrationsDirty, setIntegrationsDirty] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [emailSuggestionDismissed, setEmailSuggestionDismissed] =
    useState(false);

  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceErrorField, setWorkspaceErrorField] = useState<
    string | undefined
  >(undefined);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountError(null);

    // Browser autofill can populate these inputs without firing a React
    // onChange, leaving state out of sync with what's on screen. Reading
    // FormData reflects the real DOM values, so a re-render (e.g. from the
    // error below) never wipes autofilled text back to stale empty state.
    const formData = new FormData(event.currentTarget);
    const formName = String(formData.get("name") ?? "").trim();
    const formEmail = String(formData.get("email") ?? "");
    const formPassword = String(formData.get("password") ?? "");
    const formConfirmPassword = String(formData.get("confirmPassword") ?? "");
    setName(formName);
    setEmail(formEmail);
    setPassword(formPassword);
    setConfirmPassword(formConfirmPassword);

    // Recompute rather than trust state — autofill can populate the field
    // without ever firing onChange, so a pending suggestion might not have
    // been raised yet. This is the one-time, irreversible admin email, so
    // an unacknowledged typo suggestion blocks submission until the user
    // either accepts the fix or explicitly dismisses it.
    const domainFix = suggestEmailDomainFix(formEmail);
    if (domainFix && !emailSuggestionDismissed) {
      setEmailSuggestion(domainFix);
      return;
    }

    if (formPassword.length < MIN_PASSWORD_LENGTH) {
      setAccountError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setAccountError("Passwords do not match.");
      return;
    }

    setCreatingAccount(true);
    const result = await createFirstAdminAction({
      email: formEmail,
      name: formName,
      password: formPassword,
    });
    if (!result.success) {
      setCreatingAccount(false);
      setAccountError(result.error);
      return;
    }

    // Sign-IN with a password always works, regardless of the password_auth
    // feature flag (that flag only gates self-serve REGISTRATION) — see
    // lib/auth.ts. This establishes the session the next step needs.
    const signIn = await authClient.signIn.email({
      email: formEmail.trim().toLowerCase(),
      password: formPassword,
    });
    setCreatingAccount(false);

    if (signIn.error) {
      router.push("/signin");
      return;
    }

    setStep("workspace");
  }

  async function handleWorkspaceSubmit(input: {
    description: string;
    slug: string;
  }) {
    setWorkspaceError(null);
    setWorkspaceErrorField(undefined);
    setCreatingWorkspace(true);

    const trimmedName = name.trim();
    const result = await createWorkspaceAction({
      description: input.description,
      name: trimmedName ? `${trimmedName}'s Workspace` : "My Workspace",
      slug: input.slug,
    });

    setCreatingWorkspace(false);

    if (!result.success) {
      setWorkspaceError(result.error);
      setWorkspaceErrorField(result.field);
      return;
    }

    setWorkspaceSlug(result.data.slug);
    setStep("integrations");
    // Fetch in the background — the step renders its own loading state
    // rather than blocking the transition on this request.
    getIntegrationSettingsStatusAction().then(setIntegrationsStatus);
  }

  function acceptEmailSuggestion() {
    if (!emailSuggestion) {
      return;
    }
    setEmail(emailSuggestion);
    setEmailSuggestion(null);
  }

  function dismissEmailSuggestion() {
    setEmailSuggestionDismissed(true);
    setEmailSuggestion(null);
  }

  function finishSetup() {
    router.push(`/${workspaceSlug}`);
  }

  function handleLeaveIntegrationsStep() {
    if (integrationsDirty) {
      setShowUnsavedChangesDialog(true);
      return;
    }
    finishSetup();
  }

  if (step === "workspace") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-ir-primary-light/20 px-4 py-10">
        <Image
          alt={PRODUCT_NAME}
          className="mb-8 h-auto w-[140px] sm:w-[160px] md:w-[180px]"
          height={164}
          priority
          src={LOGO_PATH}
          width={500}
        />
        <div className="w-full max-w-md rounded-ir-xl border border-ir-border bg-ir-surface p-8 shadow-ir-lg">
          <StepWorkspace
            appHost={appHost}
            error={workspaceError}
            errorField={workspaceErrorField}
            onSubmit={handleWorkspaceSubmit}
            submitting={creatingWorkspace}
            workspaceName={
              name.trim() ? `${name.trim()}'s Workspace` : "My Workspace"
            }
          />
        </div>
      </main>
    );
  }

  if (step === "integrations") {
    return (
      <main className="flex min-h-screen flex-col items-center bg-ir-primary-light/20 px-4 py-10">
        <Image
          alt={PRODUCT_NAME}
          className="mb-8 h-auto w-[140px] sm:w-[160px] md:w-[180px]"
          height={164}
          priority
          src={LOGO_PATH}
          width={500}
        />
        <div className="w-full max-w-4xl rounded-ir-xl border border-ir-border bg-ir-surface p-8 shadow-ir-lg">
          <div className="text-center">
            <h1 className="text-xl font-bold text-ir-heading">
              Connect your integrations
            </h1>
            <p className="mt-1.5 text-sm text-ir-muted">
              Optional — configure now or skip and set these up any time from
              Admin → Integrations.
            </p>
          </div>

          <div className="mt-6">
            {integrationsStatus ? (
              <IntegrationsPanel
                appUrl={adminUrl}
                onDirtyChange={setIntegrationsDirty}
                status={integrationsStatus}
              />
            ) : (
              <p className="py-8 text-center text-sm text-ir-muted">Loading…</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-ir-border pt-6">
            <Button
              onClick={handleLeaveIntegrationsStep}
              type="button"
              variant="ghost"
            >
              Skip for now
            </Button>
            <Button onClick={handleLeaveIntegrationsStep} type="button">
              Finish setup
            </Button>
          </div>
        </div>

        <ConfirmDialog
          cancelLabel="Go back"
          confirmLabel="Continue without saving"
          description="You've entered integration details that haven't been saved. If you continue, those changes will be lost."
          onConfirm={() => {
            setShowUnsavedChangesDialog(false);
            finishSetup();
          }}
          onOpenChange={setShowUnsavedChangesDialog}
          open={showUnsavedChangesDialog}
          title="Unsaved changes"
          variant="destructive"
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ir-primary-light/20 px-4 py-10">
      <Image
        alt={PRODUCT_NAME}
        className="mb-8 h-auto w-[140px] sm:w-[160px] md:w-[180px]"
        height={164}
        priority
        src={LOGO_PATH}
        width={500}
      />
      <div className="w-full max-w-md rounded-ir-xl border border-ir-border bg-ir-surface p-8 shadow-ir-lg">
        <div className="text-center">
          <h1 className="text-xl font-bold text-ir-heading">
            Welcome to {PRODUCT_NAME}
          </h1>
          <p className="mt-1.5 text-sm text-ir-muted">
            Let's create the administrator account for this instance.
          </p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={handleAccountSubmit}>
          <label className="block" htmlFor="setup-name">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Full name
            </span>
            <Input
              autoComplete="name"
              disabled={creatingAccount}
              id="setup-name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Smith"
              required
              value={name}
            />
          </label>

          <label className="block" htmlFor="setup-email">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Email address
            </span>
            <Input
              autoComplete="username"
              disabled={creatingAccount}
              id="setup-email"
              name="email"
              onChange={(event) => {
                const value = event.target.value;
                setEmail(value);
                setEmailSuggestion(suggestEmailDomainFix(value));
                setEmailSuggestionDismissed(false);
              }}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
            {emailSuggestion && (
              <div className="mt-1.5 flex items-center justify-between gap-3 rounded-ir-sm border border-ir-warning/30 bg-ir-warning/10 px-3 py-2">
                <p className="text-xs text-ir-warning">
                  Did you mean <strong>{emailSuggestion}</strong>?
                </p>
                <div className="flex shrink-0 gap-3">
                  <button
                    className="text-xs font-semibold text-ir-warning underline hover:no-underline"
                    onClick={acceptEmailSuggestion}
                    type="button"
                  >
                    Use this
                  </button>
                  <button
                    className="text-xs text-ir-muted underline hover:no-underline"
                    onClick={dismissEmailSuggestion}
                    type="button"
                  >
                    Keep as typed
                  </button>
                </div>
              </div>
            )}
          </label>

          <label className="block" htmlFor="setup-password">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Password
            </span>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className="pr-10"
                disabled={creatingAccount}
                id="setup-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ir-muted transition-colors hover:text-ir-heading focus-visible:text-ir-heading focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                disabled={creatingAccount}
                onClick={() => setShowPassword((value) => !value)}
                tabIndex={-1}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </label>

          <label className="block" htmlFor="setup-confirm">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Confirm password
            </span>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className="pr-10"
                disabled={creatingAccount}
                id="setup-confirm"
                name="confirmPassword"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                required
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
              />
              <button
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ir-muted transition-colors hover:text-ir-heading focus-visible:text-ir-heading focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                disabled={creatingAccount}
                onClick={() => setShowConfirmPassword((value) => !value)}
                tabIndex={-1}
                type="button"
              >
                {showConfirmPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </label>

          {accountError && (
            <p className="rounded-ir-sm bg-ir-danger/10 p-3 text-sm text-ir-danger">
              {accountError}
            </p>
          )}

          <Button className="w-full" disabled={creatingAccount} type="submit">
            {creatingAccount ? "Creating account…" : "Continue"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ir-muted">
          Runs once — this page disappears after your first admin is created.
        </p>
      </div>
    </main>
  );
}
