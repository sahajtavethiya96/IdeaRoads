"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createFirstAdminAction } from "@/app/actions/setup";
import { createWorkspaceAction } from "@/app/actions/workspace";
import { StepWorkspace } from "@/app/onboarding/_components/steps/step-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_NAME } from "@/config/platform";
import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

interface SetupWizardProps {
  appHost: string;
}

export function SetupWizard({ appHost }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "workspace">("account");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setAccountError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirmPassword) {
      setAccountError("Passwords do not match.");
      return;
    }

    setCreatingAccount(true);
    const result = await createFirstAdminAction({ email, name, password });
    if (!result.success) {
      setCreatingAccount(false);
      setAccountError(result.error);
      return;
    }

    // Sign-IN with a password always works, regardless of the password_auth
    // feature flag (that flag only gates self-serve REGISTRATION) — see
    // lib/auth.ts. This establishes the session the next step needs.
    const signIn = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
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
      return;
    }

    router.push(`/${result.data.slug}`);
  }

  if (step === "workspace") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-ir-primary-light/20 px-4 py-10">
        <StepWorkspace
          appHost={appHost}
          error={workspaceError}
          onSubmit={handleWorkspaceSubmit}
          submitting={creatingWorkspace}
          workspaceName={
            name.trim() ? `${name.trim()}'s Workspace` : "My Workspace"
          }
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ir-primary-light/20 px-4 py-10">
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block" htmlFor="setup-password">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Password
            </span>
            <Input
              autoComplete="new-password"
              disabled={creatingAccount}
              id="setup-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              required
              type="password"
              value={password}
            />
          </label>

          <label className="block" htmlFor="setup-confirm">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Confirm password
            </span>
            <Input
              autoComplete="new-password"
              disabled={creatingAccount}
              id="setup-confirm"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              required
              type="password"
              value={confirmPassword}
            />
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
