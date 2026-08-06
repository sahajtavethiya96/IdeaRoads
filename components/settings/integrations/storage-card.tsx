"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  testStorageConnectionAction,
  updateStorageSettingsAction,
} from "@/app/actions/integration-settings";
import { SecretField } from "@/components/settings/integrations/secret-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDirtyState } from "@/hooks/use-dirty-state";
import {
  type IntegrationSettingsStatus,
  UNCHANGED_SECRET,
} from "@/lib/integration-settings-types";

interface StorageCardProps {
  status: IntegrationSettingsStatus["storage"];
}

export function StorageCard({ status }: StorageCardProps) {
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  const [region, setRegion] = useState(status.region);
  const [bucket, setBucket] = useState(status.bucket);
  const [accessKeyId, setAccessKeyId] = useState(status.accessKeyId);
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [secretCleared, setSecretCleared] = useState(false);
  const [endpoint, setEndpoint] = useState(status.endpoint);
  const [publicUrlBase, setPublicUrlBase] = useState(status.publicUrlBase);
  const [localDir, setLocalDir] = useState(status.localDir);

  const { isDirty, markClean } = useDirtyState({
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    secretCleared,
    endpoint,
    publicUrlBase,
    localDir,
  });

  function secretValue() {
    return secretCleared ? "" : secretAccessKey.trim() || UNCHANGED_SECRET;
  }

  function handleSave() {
    startSave(async () => {
      const result = await updateStorageSettingsAction({
        region,
        bucket,
        accessKeyId,
        secretAccessKey: secretValue(),
        endpoint,
        publicUrlBase,
        localDir,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Storage settings saved");
      setSecretAccessKey("");
      setSecretCleared(false);
      markClean({
        region,
        bucket,
        accessKeyId,
        secretAccessKey: "",
        secretCleared: false,
        endpoint,
        publicUrlBase,
        localDir,
      });
    });
  }

  function handleTest() {
    startTest(async () => {
      const result = await testStorageConnectionAction({
        region,
        bucket,
        accessKeyId,
        secretAccessKey: secretValue(),
        endpoint,
      });

      if (!result.success) {
        toast.error(`Connection failed: ${result.error}`);
        return;
      }
      toast.success("Bucket reachable");
    });
  }

  const s3Configured = !!(
    region &&
    bucket &&
    accessKeyId &&
    status.hasSecretAccessKey
  );

  return (
    <section className="rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ir-heading">
            File storage
          </h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            Where uploaded images (avatars, post/changelog attachments) are
            stored. Leave S3/R2 blank to use local disk — no setup required for
            a single-server deployment.
          </p>
        </div>
        <StatusPill
          label={s3Configured ? "S3/R2" : "Local disk"}
          variant={s3Configured ? "success" : "neutral"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block" htmlFor="storage-region">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Region
          </span>
          <Input
            id="storage-region"
            onChange={(e) => setRegion(e.target.value)}
            placeholder="us-east-1 (or auto for R2)"
            value={region}
          />
        </label>

        <label className="block" htmlFor="storage-bucket">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Bucket
          </span>
          <Input
            id="storage-bucket"
            onChange={(e) => setBucket(e.target.value)}
            placeholder="idearoads-uploads"
            value={bucket}
          />
        </label>

        <label className="block" htmlFor="storage-access-key-id">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Access key ID
          </span>
          <Input
            id="storage-access-key-id"
            onChange={(e) => setAccessKeyId(e.target.value)}
            placeholder="AKIA…"
            value={accessKeyId}
          />
        </label>

        <SecretField
          cleared={secretCleared}
          fromEnv={status.secretAccessKeyFromEnv}
          hasValue={status.hasSecretAccessKey}
          id="storage-secret-access-key"
          label="Secret access key"
          onChange={setSecretAccessKey}
          onClear={() => {
            setSecretCleared(true);
            setSecretAccessKey("");
          }}
          value={secretAccessKey}
        />

        <label className="block" htmlFor="storage-endpoint">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Endpoint
          </span>
          <Input
            id="storage-endpoint"
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="Leave blank for AWS S3"
            value={endpoint}
          />
        </label>

        <label className="block" htmlFor="storage-public-url-base">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Public URL base
          </span>
          <Input
            id="storage-public-url-base"
            onChange={(e) => setPublicUrlBase(e.target.value)}
            placeholder="https://idearoads-uploads.s3.us-east-1.amazonaws.com"
            value={publicUrlBase}
          />
        </label>

        <label className="block sm:col-span-2" htmlFor="storage-local-dir">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Local storage directory
          </span>
          <Input
            id="storage-local-dir"
            onChange={(e) => setLocalDir(e.target.value)}
            placeholder="public/uploads (default)"
            value={localDir}
          />
          <span className="mt-1 block text-xs text-ir-muted">
            Only used while S3/R2 above is unconfigured.
          </span>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          disabled={isTesting || !(region && bucket && accessKeyId)}
          onClick={handleTest}
          type="button"
          variant="outline"
        >
          {isTesting ? "Testing…" : "Test connection"}
        </Button>
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

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "neutral";
}) {
  return (
    <span
      className={
        variant === "success"
          ? "shrink-0 rounded-ir-full bg-ir-success/10 px-2 py-0.5 text-2xs font-semibold text-ir-success"
          : "shrink-0 rounded-ir-full bg-ir-muted-surface px-2 py-0.5 text-2xs font-semibold text-ir-muted"
      }
    >
      {label}
    </span>
  );
}
