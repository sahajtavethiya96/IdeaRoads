"use client";

import {
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  LockSimpleIcon,
  SparkleIcon,
  ThumbsUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { useIsEmbedded } from "@/components/embed/use-is-embedded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { signIn, useSession } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const URL_ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:
    "This sign-in link has expired or has already been used. Please request a new one.",
  EXPIRED_TOKEN: "This sign-in link has expired. Please request a new one.",
  access_denied: "Sign-in was cancelled.",
  OAuthAccountNotLinked:
    "An account with this email already exists. Please sign in using your original method.",
};

interface AuthFormProps {
  googleEnabled: boolean;
  /** Email + password sign-in — gated by the `password_auth` feature flag. */
  passwordEnabled?: boolean;
  /** Whether "Forgot password?" can actually deliver a reset email (SMTP). */
  passwordResetEnabled?: boolean;
}

export function AuthForm({
  googleEnabled,
  passwordEnabled = false,
  passwordResetEnabled = false,
}: AuthFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner
        googleEnabled={googleEnabled}
        passwordEnabled={passwordEnabled}
        passwordResetEnabled={passwordResetEnabled}
      />
    </Suspense>
  );
}

function AuthFormInner({
  googleEnabled,
  passwordEnabled,
  passwordResetEnabled,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = useIsEmbedded();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const urlErrorCode = searchParams.get("error");
  const urlError = urlErrorCode
    ? (URL_ERROR_MESSAGES[urlErrorCode] ??
      "Something went wrong. Please try again.")
    : null;

  const rawNext = searchParams.get("next") ?? "/post-auth";
  // Prevent open redirect: only allow relative paths (not protocol-relative // or absolute URLs)
  const callbackURL =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/post-auth";

  useEffect(() => {
    if (session) {
      router.replace(callbackURL);
    }
  }, [router, session, callbackURL]);

  if (isPending || session) {
    return null;
  }

  async function sendMagicLink() {
    setFormError(null);
    setMagicLoading(true);
    const result = await signIn.magicLink({ callbackURL, email });
    setMagicLoading(false);

    if (result.error) {
      setFormError(
        result.error.message ?? "Something went wrong. Please try again."
      );
      return;
    }
    setSent(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Password auth disabled → the form's only job is to request a magic link.
    if (!passwordEnabled) {
      await sendMagicLink();
      return;
    }

    setSubmitting(true);
    const result = await signIn.email({ callbackURL, email, password });
    setSubmitting(false);

    if (result.error) {
      setFormError(
        result.error.message ?? "Something went wrong. Please try again."
      );
      return;
    }
    router.replace(callbackURL);
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const result = await signIn.social({ provider: "google", callbackURL });
      if (result?.error) {
        setFormError(
          result.error.message ?? "Google sign-in failed. Please try again."
        );
        setGoogleLoading(false);
      }
    } catch {
      setFormError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  const busy = submitting || googleLoading || magicLoading;

  return (
    <main className="animate-ir-fade-in grid min-h-screen place-items-center overflow-y-auto bg-ir-background px-4 py-6 sm:py-8">
      <div className="card grid w-full max-w-[1100px] animate-ir-slide-up overflow-hidden border border-ir-border bg-ir-surface shadow-ir-lg lg:grid-cols-[45fr_55fr]">
        {/* Left — sign-in form */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          {/* Inside the embed widget's iframe, this logo would otherwise
              navigate the whole panel to the marketing homepage — render it
              as plain branding, not a link, when embedded. */}
          {isEmbedded ? (
            <div className="mb-6 flex justify-center lg:justify-start">
              <Image
                alt={PRODUCT_NAME}
                className="h-9 w-auto"
                height={164}
                priority
                src={LOGO_PATH}
                width={500}
              />
            </div>
          ) : (
            <Link
              className="mb-6 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 lg:justify-start"
              href="/"
            >
              <Image
                alt={PRODUCT_NAME}
                className="h-9 w-auto"
                height={164}
                priority
                src={LOGO_PATH}
                width={500}
              />
            </Link>
          )}

          <h1 className="text-xl font-bold text-ir-heading sm:text-2xl">
            {sent ? "Check your email" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-ir-muted">
            {sent
              ? "Your sign-in link is on its way. Click it to continue."
              : passwordEnabled
                ? "Sign in with your email and password."
                : "Sign in or create a free account — no password needed."}
          </p>

          <div className="mt-6">
            {sent ? (
              <div className="space-y-3">
                <div className="alert alert-success items-start text-sm">
                  <CheckCircleIcon className="mt-0.5 shrink-0" size={18} />
                  <span>
                    Sign-in link sent to <strong>{email}</strong>. Check your
                    inbox and spam folder.
                  </span>
                </div>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => setSent(false)}
                  type="button"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {urlError && (
                  <div className="alert alert-error items-start text-sm">
                    <WarningCircleIcon className="mt-0.5 shrink-0" size={18} />
                    <span>{urlError}</span>
                  </div>
                )}

                {googleEnabled && (
                  <>
                    <button
                      className="btn btn-outline btn-block gap-2 transition-transform hover:-translate-y-0.5"
                      disabled={busy}
                      onClick={handleGoogleSignIn}
                      type="button"
                    >
                      {googleLoading ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <GoogleIcon className="size-4" />
                      )}
                      {googleLoading ? "Redirecting…" : "Continue with Google"}
                    </button>

                    <div className="divider text-xs font-semibold tracking-ui text-ir-muted uppercase">
                      or continue with email
                    </div>
                  </>
                )}

                <form className="space-y-3" onSubmit={onSubmit}>
                  <div>
                    <label
                      className="mb-1.5 block text-sm font-semibold text-ir-heading"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <label className="input w-full">
                      <EnvelopeSimpleIcon className="text-ir-muted" size={18} />
                      <input
                        autoComplete="email"
                        id="email"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={email}
                      />
                    </label>
                  </div>

                  {passwordEnabled && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label
                          className="text-sm font-semibold text-ir-heading"
                          htmlFor="password"
                        >
                          Password
                        </label>
                        {passwordResetEnabled && (
                          <Link
                            className="text-xs text-ir-muted underline hover:text-ir-heading hover:no-underline"
                            href="/forgot-password"
                          >
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <PasswordInput
                        autoComplete="current-password"
                        id="password"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        required
                        value={password}
                      />
                    </label>
                  )}

                  {formError && (
                    <div className="alert alert-error items-start text-sm">
                      <WarningCircleIcon
                        className="mt-0.5 shrink-0"
                        size={18}
                      />
                      <span>{formError}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <button
                      className="btn btn-primary btn-block gap-2"
                      disabled={busy}
                      type="submit"
                    >
                      {submitting && (
                        <span className="loading loading-spinner loading-sm" />
                      )}
                      {passwordEnabled
                        ? submitting
                          ? "Signing in…"
                          : "Sign in"
                        : submitting
                          ? "Sending…"
                          : "Continue with email"}
                    </button>
                    {passwordEnabled ? (
                      <button
                        className="btn btn-ghost btn-block gap-2"
                        disabled={busy}
                        onClick={sendMagicLink}
                        type="button"
                      >
                        {magicLoading ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          <SparkleIcon size={16} />
                        )}
                        {magicLoading
                          ? "Sending…"
                          : "Email me a magic link instead"}
                      </button>
                    ) : null}
                  </div>
                </form>

                {/* There is no self-serve sign-up on this instance: accounts
                    come from the /setup wizard or an invitation. Say so
                    plainly, rather than leaving people hunting for a
                    registration link that does not exist. */}
                <p className="text-center text-xs text-ir-muted">
                  Accounts are created by invitation. Ask an admin to invite you
                  if you don't have one yet.
                </p>
              </div>
            )}
          </div>

          {!sent && (
            <p className="mt-6 text-center text-xs text-ir-muted lg:text-left">
              By continuing you agree to our{" "}
              <Link
                className="text-ir-body underline hover:no-underline"
                href="/terms"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                className="text-ir-body underline hover:no-underline"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>

        {/* Right — brand panel, hidden below the split-screen breakpoint */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-ir-primary to-ir-primary-hover lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-6 lg:px-10 lg:py-10">
          {/* Soft blurred shapes — decorative, kept subtle and non-interactive */}
          <div
            aria-hidden="true"
            className="-top-16 -right-16 pointer-events-none absolute size-64 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="-bottom-20 -left-10 pointer-events-none absolute size-72 rounded-full bg-black/10 blur-3xl"
          />

          <span className="badge badge-outline relative border-white/30 text-white">
            <ThumbsUpIcon size={14} />
            Trusted by product teams
          </span>

          <h2 className="relative max-w-sm text-center text-xl font-bold text-white sm:text-2xl">
            Ship what your users actually want.
          </h2>
          <p className="relative max-w-xs text-center text-sm text-white/80">
            Collect feedback, prioritize by votes, and keep everyone posted with
            a public roadmap and changelog.
          </p>

          <div className="relative w-full max-w-md animate-ir-float">
            <Image
              alt="A feature roadmap with upvoted ideas, trending feedback, and a voting box — capturing how IdeaRoads turns user feedback into a shared product roadmap"
              className="h-auto w-full drop-shadow-2xl"
              height={1123}
              priority
              src="/auth-illustration.png"
              width={1401}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
