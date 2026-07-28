"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setSubmitting(false);
    // Always report success — Better Auth does the same regardless of whether
    // the address exists, so this never leaks account existence.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <p className="rounded-ir-sm bg-ir-success/10 p-3 text-sm text-ir-success">
          If an account exists for <strong>{email}</strong>, we sent it a link
          to reset the password. Check your inbox and spam folder.
        </p>
        <p className="text-center text-xs text-ir-muted">
          <Link className="underline hover:no-underline" href="/signin">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block" htmlFor="email">
        <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
          Email
        </span>
        <Input
          autoComplete="email"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-ir-muted">
        <Link
          className="font-semibold text-ir-heading underline hover:no-underline"
          href="/signin"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
