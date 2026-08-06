"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  testSmtpConnectionAction,
  updateSmtpSettingsAction,
} from "@/app/actions/integration-settings";
import { SecretField } from "@/components/settings/integrations/secret-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDirtyState } from "@/hooks/use-dirty-state";
import {
  type IntegrationSettingsStatus,
  UNCHANGED_SECRET,
} from "@/lib/integration-settings-types";

interface SmtpCardProps {
  status: IntegrationSettingsStatus["smtp"];
}

export function SmtpCard({ status }: SmtpCardProps) {
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  const [host, setHost] = useState(status.host);
  const [port, setPort] = useState(status.port ? String(status.port) : "");
  const [user, setUser] = useState(status.user);
  const [from, setFrom] = useState(status.from);
  const [pass, setPass] = useState("");
  const [passCleared, setPassCleared] = useState(false);

  const { isDirty, markClean } = useDirtyState({
    host,
    port,
    user,
    from,
    pass,
    passCleared,
  });

  function passValue() {
    return passCleared ? "" : pass.trim() || UNCHANGED_SECRET;
  }

  function handleSave() {
    startSave(async () => {
      const result = await updateSmtpSettingsAction({
        host,
        port: port.trim() ? Number(port) : null,
        user,
        from,
        pass: passValue(),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("SMTP settings saved");
      setPass("");
      setPassCleared(false);
      markClean({ host, port, user, from, pass: "", passCleared: false });
    });
  }

  function handleTest() {
    startTest(async () => {
      const result = await testSmtpConnectionAction({
        host,
        port: port.trim() ? Number(port) : null,
        user,
        from,
        pass: passValue(),
      });

      if (!result.success) {
        toast.error(`Connection failed: ${result.error}`);
        return;
      }
      toast.success("SMTP connection verified");
    });
  }

  return (
    <section className="rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ir-heading">
            Email (SMTP)
          </h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            Required to deliver magic-link sign-in emails, password resets, and
            notifications. Without it, links are logged to the server console
            instead of sent.
          </p>
        </div>
        <StatusPill configured={status.hasPass && !!status.host} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block" htmlFor="smtp-host">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Host
          </span>
          <Input
            id="smtp-host"
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.example.com"
            value={host}
          />
        </label>

        <label className="block" htmlFor="smtp-port">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Port
          </span>
          <Input
            id="smtp-port"
            inputMode="numeric"
            onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))}
            placeholder="587"
            value={port}
          />
        </label>

        <label className="block" htmlFor="smtp-user">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            Username
          </span>
          <Input
            id="smtp-user"
            onChange={(e) => setUser(e.target.value)}
            placeholder="user@example.com"
            value={user}
          />
        </label>

        <SecretField
          cleared={passCleared}
          fromEnv={status.passFromEnv}
          hasValue={status.hasPass}
          id="smtp-pass"
          label="Password"
          onChange={setPass}
          onClear={() => {
            setPassCleared(true);
            setPass("");
          }}
          value={pass}
        />

        <label className="block sm:col-span-2" htmlFor="smtp-from">
          <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
            "From" address
          </span>
          <Input
            id="smtp-from"
            onChange={(e) => setFrom(e.target.value)}
            placeholder={'"IdeaRoads" <noreply@example.com>'}
            value={from}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          disabled={isTesting || !(host && user)}
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
