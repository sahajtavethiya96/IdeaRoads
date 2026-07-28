"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

interface SignupFormProps {
  requiresEmailVerification: boolean;
}

export function SignupForm({ requiresEmailVerification }: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
    const result = await authClient.signUp.email({
      callbackURL: "/post-auth",
      email,
      name: name.trim(),
      password,
    });
    setSubmitting(false);

    if (result.error) {
      setFormError(
        result.error.message ?? "Something went wrong. Please try again."
      );
      return;
    }

    if (requiresEmailVerification) {
      setSent(true);
      return;
    }

    router.push("/post-auth");
    router.refresh();
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <p className="rounded-ir-sm bg-ir-success/10 p-3 text-sm text-ir-success">
          We sent a verification link to <strong>{email}</strong>. Click it to
          finish setting up your account.
        </p>
        <p className="text-center text-xs text-ir-muted">
          Already have an account?{" "}
          <Link
            className="font-semibold text-ir-heading underline hover:no-underline"
            href="/signin"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block" htmlFor="name">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Full name
          </span>
          <Input
            autoComplete="name"
            id="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Smith"
            required
            value={name}
          />
        </label>

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

        <label className="block" htmlFor="password">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Password
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
            Confirm password
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
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-ir-muted">
        Already have an account?{" "}
        <Link
          className="font-semibold text-ir-heading underline hover:no-underline"
          href="/signin"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
