"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { type NameActionState, updateNameAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";

const initialState: NameActionState = {};

interface CompleteProfileFormProps {
  next: string;
}

export function CompleteProfileForm({ next }: CompleteProfileFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateNameAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push(next);
    }
  }, [state.success, next, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-ir-primary-light/20 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md rounded-ir-xl border border-ir-border bg-ir-surface px-6 py-8 shadow-ir-lg sm:px-10 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <Image
            alt={PRODUCT_NAME}
            className="h-9 w-auto"
            height={164}
            priority
            src={LOGO_PATH}
            width={500}
          />
          <h1 className="mt-6 text-xl font-bold text-ir-heading sm:text-2xl">
            Welcome to {PRODUCT_NAME}
          </h1>
          <p className="mt-1.5 text-sm text-ir-muted">
            Before joining your workspace, let's complete your profile.
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-4 text-left">
          <label className="block" htmlFor="complete-profile-name">
            <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
              Full Name
            </span>
            <Input
              autoComplete="name"
              autoFocus
              id="complete-profile-name"
              maxLength={100}
              name="name"
              placeholder="Your full name"
              required
            />
          </label>

          {state.error && (
            <p className="rounded-ir-sm bg-ir-danger/10 p-3 text-sm text-ir-danger">
              {state.error}
            </p>
          )}

          <Button className="w-full" disabled={pending} size="lg" type="submit">
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}
