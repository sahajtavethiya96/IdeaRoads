"use server";

import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { integrationSettings } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import { decrypt, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getIntegrationSettingsRow } from "@/lib/integration-settings";
import {
  type IntegrationSettingsStatus,
  UNCHANGED_SECRET,
} from "@/lib/integration-settings-types";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

type SecretAction =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "set"; plaintext: string };

function resolveSecretInput(input: string): SecretAction {
  if (input === UNCHANGED_SECRET) {
    return { kind: "keep" };
  }
  if (input.trim() === "") {
    return { kind: "clear" };
  }
  return { kind: "set", plaintext: input };
}

/** Encrypted column value to write, or `undefined` to leave the column untouched. */
function secretColumnPatch(action: SecretAction): string | null | undefined {
  if (action.kind === "keep") {
    return;
  }
  if (action.kind === "clear") {
    return null;
  }
  return encrypt(action.plaintext);
}

async function revalidateIntegrationsPages() {
  revalidatePath("/orbit/integrations");
  revalidatePath("/setup");
}

// ─────────────────────────────────────────────────────────────
// Status — safe to send to the client. See IntegrationSettingsStatus
// (lib/integration-settings-types.ts) for field-by-field notes.
// ─────────────────────────────────────────────────────────────

export async function getIntegrationSettingsStatusAction(): Promise<IntegrationSettingsStatus> {
  await requireAdmin();
  const row = await getIntegrationSettingsRow();

  return {
    smtp: {
      host: row?.smtpHost ?? env.SMTP_HOST ?? "",
      port: row?.smtpPort ?? env.SMTP_PORT ?? null,
      user: row?.smtpUser ?? env.SMTP_USER ?? "",
      from: row?.emailFrom ?? env.EMAIL_FROM ?? "",
      hasPass: !!(row?.smtpPassEncrypted || env.SMTP_PASS),
      passFromEnv: !row?.smtpPassEncrypted && !!env.SMTP_PASS,
    },
    google: {
      clientId: row?.googleClientId ?? env.GOOGLE_CLIENT_ID ?? "",
      hasClientSecret: !!(
        row?.googleClientSecretEncrypted || env.GOOGLE_CLIENT_SECRET
      ),
      clientSecretFromEnv:
        !row?.googleClientSecretEncrypted && !!env.GOOGLE_CLIENT_SECRET,
    },
    webhook: {
      hasSecret: !!(
        row?.emailWebhookSecretEncrypted || env.EMAIL_WEBHOOK_SECRET
      ),
      secretFromEnv:
        !row?.emailWebhookSecretEncrypted && !!env.EMAIL_WEBHOOK_SECRET,
    },
    storage: {
      region: row?.storageS3Region ?? env.STORAGE_S3_REGION ?? "",
      bucket: row?.storageS3Bucket ?? env.STORAGE_S3_BUCKET ?? "",
      accessKeyId:
        row?.storageS3AccessKeyId ?? env.STORAGE_S3_ACCESS_KEY_ID ?? "",
      endpoint: row?.storageS3Endpoint ?? env.STORAGE_S3_ENDPOINT ?? "",
      publicUrlBase:
        row?.storagePublicUrlBase ?? env.STORAGE_PUBLIC_URL_BASE ?? "",
      localDir: row?.storageLocalDir ?? env.STORAGE_LOCAL_DIR ?? "",
      hasSecretAccessKey: !!(
        row?.storageS3SecretAccessKeyEncrypted ||
        env.STORAGE_S3_SECRET_ACCESS_KEY
      ),
      secretAccessKeyFromEnv:
        !row?.storageS3SecretAccessKeyEncrypted &&
        !!env.STORAGE_S3_SECRET_ACCESS_KEY,
    },
  };
}

async function upsertIntegrationSettings(
  patch: Partial<typeof integrationSettings.$inferInsert>
) {
  await db
    .insert(integrationSettings)
    .values({ id: 1, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: integrationSettings.id,
      set: { ...patch, updatedAt: new Date() },
    });
}

// ─────────────────────────────────────────────────────────────
// SMTP
// ─────────────────────────────────────────────────────────────

export async function updateSmtpSettingsAction(input: {
  host: string;
  port: number | null;
  user: string;
  from: string;
  pass: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  const passAction = resolveSecretInput(input.pass);

  try {
    await upsertIntegrationSettings({
      smtpHost: input.host.trim() || null,
      smtpPort: input.port,
      smtpUser: input.user.trim() || null,
      emailFrom: input.from.trim() || null,
      smtpPassEncrypted: secretColumnPatch(passAction),
    });

    await audit({
      action: "integration_settings.smtp_updated",
      actorId: session.user.id,
      actorEmail: session.user.email,
      description: "SMTP integration settings updated",
      entityId: "smtp",
      entityType: "platform",
      workspaceId: null,
    });

    await revalidateIntegrationsPages();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[integration-settings] failed to update SMTP", error);
    return { success: false, error: "Failed to save SMTP settings." };
  }
}

export async function testSmtpConnectionAction(input: {
  host: string;
  port: number | null;
  user: string;
  from: string;
  pass: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const passAction = resolveSecretInput(input.pass);
  let pass: string | undefined;
  if (passAction.kind === "set") {
    pass = passAction.plaintext;
  } else if (passAction.kind === "keep") {
    const row = await getIntegrationSettingsRow();
    pass = row?.smtpPassEncrypted
      ? safeDecryptOrUndefined(row.smtpPassEncrypted)
      : env.SMTP_PASS;
  }

  if (!(input.host && input.user && pass)) {
    return { success: false, error: "Host, user, and password are required." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: input.host,
      port: input.port ?? 587,
      auth: { user: input.user, pass },
    });
    await transporter.verify();
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed.";
    return { success: false, error: message };
  }
}

function safeDecryptOrUndefined(ciphertext: string): string | undefined {
  try {
    return decrypt(ciphertext);
  } catch {
    return;
  }
}

// ─────────────────────────────────────────────────────────────
// Google OAuth
// ─────────────────────────────────────────────────────────────

export async function updateGoogleOAuthSettingsAction(input: {
  clientId: string;
  clientSecret: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  const secretAction = resolveSecretInput(input.clientSecret);

  try {
    await upsertIntegrationSettings({
      googleClientId: input.clientId.trim() || null,
      googleClientSecretEncrypted: secretColumnPatch(secretAction),
    });

    await audit({
      action: "integration_settings.google_oauth_updated",
      actorId: session.user.id,
      actorEmail: session.user.email,
      description: "Google OAuth integration settings updated",
      entityId: "google_oauth",
      entityType: "platform",
      workspaceId: null,
    });

    await revalidateIntegrationsPages();
    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error(
      "[integration-settings] failed to update Google OAuth",
      error
    );
    return { success: false, error: "Failed to save Google OAuth settings." };
  }
}

// ─────────────────────────────────────────────────────────────
// Email webhook
// ─────────────────────────────────────────────────────────────

export async function updateEmailWebhookSecretAction(input: {
  secret: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  const secretAction = resolveSecretInput(input.secret);

  try {
    await upsertIntegrationSettings({
      emailWebhookSecretEncrypted: secretColumnPatch(secretAction),
    });

    await audit({
      action: "integration_settings.email_webhook_updated",
      actorId: session.user.id,
      actorEmail: session.user.email,
      description: "Email webhook secret updated",
      entityId: "email_webhook",
      entityType: "platform",
      workspaceId: null,
    });

    await revalidateIntegrationsPages();
    return { success: true, data: undefined };
  } catch (error) {
    console.error(
      "[integration-settings] failed to update webhook secret",
      error
    );
    return { success: false, error: "Failed to save the webhook secret." };
  }
}

// ─────────────────────────────────────────────────────────────
// Storage (S3/R2)
// ─────────────────────────────────────────────────────────────

export async function updateStorageSettingsAction(input: {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  publicUrlBase: string;
  localDir: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  const secretAction = resolveSecretInput(input.secretAccessKey);
  const localDir = input.localDir.trim();

  // A filesystem path, not a URL — easy to mix up with "Public URL base"
  // above it. Saving one here silently breaks every upload: files get
  // written under a garbled relative path derived from the URL, while the
  // served URL points at public/uploads where nothing was ever written.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(localDir)) {
    return {
      success: false,
      error:
        "Local storage directory must be a filesystem path (e.g. public/uploads), not a URL.",
    };
  }

  try {
    await upsertIntegrationSettings({
      storageS3Region: input.region.trim() || null,
      storageS3Bucket: input.bucket.trim() || null,
      storageS3AccessKeyId: input.accessKeyId.trim() || null,
      storageS3Endpoint: input.endpoint.trim() || null,
      storagePublicUrlBase: input.publicUrlBase.trim() || null,
      storageLocalDir: localDir || null,
      storageS3SecretAccessKeyEncrypted: secretColumnPatch(secretAction),
    });

    await audit({
      action: "integration_settings.storage_updated",
      actorId: session.user.id,
      actorEmail: session.user.email,
      description: "Storage integration settings updated",
      entityId: "storage",
      entityType: "platform",
      workspaceId: null,
    });

    await revalidateIntegrationsPages();
    return { success: true, data: undefined };
  } catch (error) {
    console.error(
      "[integration-settings] failed to update storage settings",
      error
    );
    return { success: false, error: "Failed to save storage settings." };
  }
}

export async function testStorageConnectionAction(input: {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const secretAction = resolveSecretInput(input.secretAccessKey);
  let secretAccessKey: string | undefined;
  if (secretAction.kind === "set") {
    secretAccessKey = secretAction.plaintext;
  } else if (secretAction.kind === "keep") {
    const row = await getIntegrationSettingsRow();
    secretAccessKey = row?.storageS3SecretAccessKeyEncrypted
      ? safeDecryptOrUndefined(row.storageS3SecretAccessKeyEncrypted)
      : env.STORAGE_S3_SECRET_ACCESS_KEY;
  }

  if (!(input.region && input.bucket && input.accessKeyId && secretAccessKey)) {
    return {
      success: false,
      error: "Region, bucket, access key ID, and secret key are required.",
    };
  }

  try {
    const client = new S3Client({
      region: input.region,
      endpoint: input.endpoint || undefined,
      forcePathStyle: Boolean(input.endpoint),
      credentials: { accessKeyId: input.accessKeyId, secretAccessKey },
    });
    await client.send(new HeadBucketCommand({ Bucket: input.bucket }));
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed.";
    return { success: false, error: message };
  }
}
