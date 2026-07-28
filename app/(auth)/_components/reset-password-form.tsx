"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setSubmitting(false);

    if (result.error) {
      setFormError(
        result.error.message ?? "Something went wrong. Please try again."
      );
      return;
    }

    // `revokeSessionsOnPasswordReset` already signed out every device.
    setDone(true);
    setTimeout(() => router.push("/signin"), 1500);
  }

  if (done) {
    return (
      <p className="rounded-ir-sm bg-ir-success/10 p-3 text-sm text-ir-success">
        Password updated. Redirecting you to sign in…
      </p>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block" htmlFor="password">
        <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
          New password
        </span>
        <Input
          autoComplete="new-password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          required
          type="password"
          value={password}
        />
      </label>

      <label className="block" htmlFor="confirm-password">
        <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
          Confirm new password
        </span>
        <Input
          autoComplete="new-password"
          id="confirm-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      {formError && (
        <p className="rounded-ir-sm bg-ir-danger/10 p-3 text-sm text-ir-danger">
          {formError}
        </p>
      )}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
