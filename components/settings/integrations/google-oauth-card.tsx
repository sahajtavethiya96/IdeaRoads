"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateGoogleOAuthSettingsAction } from "@/app/actions/integration-settings";
import { SecretField } from "@/components/settings/integrations/secret-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDirtyState } from "@/hooks/use-dirty-state";
import {
  type IntegrationSettingsStatus,
  UNCHANGED_SECRET,
} from "@/lib/integration-settings-types";

interface GoogleOAuthCardProps {
  appUrl: string;
  status: IntegrationSettingsStatus["google"];
}

export function GoogleOAuthCard({ status, appUrl }: GoogleOAuthCardProps) {
  const [isSaving, startSave] = useTransition();

  const [clientId, setClientId] = useState(status.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [clientSecretCleared, setClientSecretCleared] = useState(false);

  const { isDirty, markClean } = useDirtyState({
    clientId,
    clientSecret,
    clientSecretCleared,
  });

  function handleSave() {
    startSave(async () => {
      const result = await updateGoogleOAuthSettingsAction({
        clientId,
        clientSecret: clientSecretCleared
          ? ""
          : clientSecret.trim() || UNCHANGED_SECRET,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "Google OAuth settings saved — restart the app for the change to take effect"
      );
      setClientSecret("");
      setClientSecretCleared(false);
      markClean({
        clientId,
        clientSecret: "",
        clientSecretCleared: false,
      });
    });
  }

  return (
    <section className="rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ir-heading">
            Google sign-in
          </h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            Enables "Continue with Google" on the sign-in screen. Authorized
            redirect URI:{" "}
            <code className="rounded-ir-xs bg-ir-muted-surface px-1 py-0.5 text-2xs">
              {appUrl}/api/auth/callback/google
            </code>
          </p>
        </div>
        <StatusPill configured={status.hasClientSecret && !!status.clientId} />
      </div>

      <div className="rounded-ir-sm border border-ir-warning/30 bg-ir-warning/5 p-3 text-xs text-ir-muted">
        Better Auth builds its Google client once, at app start — saving here
        requires an app restart (a redeploy, or a dev-server reload) before
        sign-in picks up the change. See docs/implementation/INTEGRATIONS.md.
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block" htmlFor="google-client-id">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Client ID
          </span>
          <Input
            id="google-client-id"
            onChange={(e) => setClientId(e.target.value)}
            placeholder="1234567890-abc.apps.googleusercontent.com"
            value={clientId}
          />
        </label>

        <SecretField
          cleared={clientSecretCleared}
          fromEnv={status.clientSecretFromEnv}
          hasValue={status.hasClientSecret}
          id="google-client-secret"
          label="Client secret"
          onChange={setClientSecret}
          onClear={() => {
            setClientSecretCleared(true);
            setClientSecret("");
          }}
          value={clientSecret}
        />
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Button
          disabled={isSaving || !isDirty}
          onClick={handleSave}
          type="button"
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}

function StatusPill({ configured }: { configured: boolean }) {
  return (
    <span
      className={
        configured
          ? "shrink-0 rounded-ir-full bg-ir-success/10 px-2 py-0.5 text-2xs font-semibold text-ir-success"
          : "shrink-0 rounded-ir-full bg-ir-muted-surface px-2 py-0.5 text-2xs font-semibold text-ir-muted"
      }
    >
      {configured ? "Configured" : "Not configured"}
    </span>
  );
}
