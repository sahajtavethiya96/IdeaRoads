"use client";

import { memo, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateGoogleOAuthSettingsAction } from "@/app/actions/integration-settings";
import { CodeBlock } from "@/components/settings/code-block";
import { Callout } from "@/components/settings/integrations/callout";
import { Field, FormGrid } from "@/components/settings/integrations/field";
import { SaveBar } from "@/components/settings/integrations/save-bar";
import { SecretField } from "@/components/settings/integrations/secret-field";
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

function GoogleOAuthCardImpl({ status, appUrl }: GoogleOAuthCardProps) {
  const [isSaving, startSave] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  const [clientId, setClientId] = useState(status.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [clientSecretCleared, setClientSecretCleared] = useState(false);

  const { baseline, isDirty, markClean } = useDirtyState({
    clientId,
    clientSecret,
    clientSecretCleared,
  });

  useEffect(() => {
    if (!justSaved) {
      return;
    }
    const timer = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [justSaved]);

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

      toast.info(
        "Restart required for this change to take effect (a redeploy or dev-server reload)."
      );
      setClientSecret("");
      setClientSecretCleared(false);
      markClean({
        clientId,
        clientSecret: "",
        clientSecretCleared: false,
      });
      setJustSaved(true);
    });
  }

  function handleDiscard() {
    setClientId(baseline.clientId);
    setClientSecret(baseline.clientSecret);
    setClientSecretCleared(baseline.clientSecretCleared);
  }

  const redirectUri = `${appUrl}/api/auth/callback/google`;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-ir-heading">
          Authorized redirect URI
        </p>
        <CodeBlock code={redirectUri} />
        <p className="mt-1.5 text-xs text-ir-muted">
          Add this exact URI to your OAuth client's "Authorized redirect URIs"
          in Google Cloud Console.
        </p>
      </div>

      <Callout variant="info">
        <strong className="font-semibold text-ir-heading">
          Getting credentials from Google Cloud Console
        </strong>
        <ol>
          <li>Open APIs &amp; Services → Credentials.</li>
          <li>Create an OAuth 2.0 Client ID of type "Web application".</li>
          <li>Paste the redirect URI above into Authorized redirect URIs.</li>
          <li>Copy the generated Client ID and Client secret below.</li>
        </ol>
      </Callout>

      <Callout variant="warning">
        Better Auth builds its Google client once, at app start — saving here
        requires an app restart (a redeploy, or a dev-server reload) before
        sign-in picks up the change.
      </Callout>

      <FormGrid>
        <Field htmlFor="google-client-id" label="Client ID" required>
          <Input
            id="google-client-id"
            onChange={(e) => setClientId(e.target.value)}
            placeholder="1234567890-abc.apps.googleusercontent.com"
            value={clientId}
          />
        </Field>

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
          required
          value={clientSecret}
        />
      </FormGrid>

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        justSaved={justSaved}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}

export const GoogleOAuthCard = memo(GoogleOAuthCardImpl);
