"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEmailWebhookSecretAction } from "@/app/actions/integration-settings";
import { SecretField } from "@/components/settings/integrations/secret-field";
import { Button } from "@/components/ui/button";
import { useDirtyState } from "@/hooks/use-dirty-state";
import {
  type IntegrationSettingsStatus,
  UNCHANGED_SECRET,
} from "@/lib/integration-settings-types";

interface WebhookCardProps {
  status: IntegrationSettingsStatus["webhook"];
}

export function WebhookCard({ status }: WebhookCardProps) {
  const [isSaving, startSave] = useTransition();

  const [secret, setSecret] = useState("");
  const [cleared, setCleared] = useState(false);

  const { isDirty, markClean } = useDirtyState({ secret, cleared });

  function handleSave() {
    startSave(async () => {
      const result = await updateEmailWebhookSecretAction({
        secret: cleared ? "" : secret.trim() || UNCHANGED_SECRET,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Webhook secret saved");
      setSecret("");
      setCleared(false);
      markClean({ secret: "", cleared: false });
    });
  }

  return (
    <section className="rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ir-heading">
            Inbound email webhook
          </h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            Validates delivery-status webhooks posted to{" "}
            <code className="rounded-ir-xs bg-ir-muted-surface px-1 py-0.5 text-2xs">
              /api/webhooks/email
            </code>
            . Optional — only needed if your email provider sends delivery
            events.
          </p>
        </div>
        <StatusPill configured={status.hasSecret} />
      </div>

      <div className="max-w-md">
        <SecretField
          cleared={cleared}
          fromEnv={status.secretFromEnv}
          hasValue={status.hasSecret}
          id="email-webhook-secret"
          label="Webhook secret"
          onChange={setSecret}
          onClear={() => {
            setCleared(true);
            setSecret("");
          }}
          value={secret}
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
