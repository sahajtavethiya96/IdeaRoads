import { GoogleOAuthCard } from "@/components/settings/integrations/google-oauth-card";
import { SmtpCard } from "@/components/settings/integrations/smtp-card";
import { StorageCard } from "@/components/settings/integrations/storage-card";
import { WebhookCard } from "@/components/settings/integrations/webhook-card";
import type { IntegrationSettingsStatus } from "@/lib/integration-settings-types";

interface IntegrationsPanelProps {
  appUrl: string;
  status: IntegrationSettingsStatus;
}

/**
 * One card per integration group. Rendered from Admin → Integrations
 * (app/(orbit)/orbit/integrations) and from the setup wizard's Integrations
 * step — both fetch `status` via getIntegrationSettingsStatusAction and save
 * through the same server actions, so either surface leaves the database in
 * an identical state.
 */
export function IntegrationsPanel({ status, appUrl }: IntegrationsPanelProps) {
  return (
    <div className="space-y-4">
      <SmtpCard status={status.smtp} />
      <GoogleOAuthCard appUrl={appUrl} status={status.google} />
      <StorageCard status={status.storage} />
      <WebhookCard status={status.webhook} />
    </div>
  );
}
