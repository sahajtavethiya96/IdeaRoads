import { SetPageHeader } from "@/components/workspace/topbar";

interface Props {
  children: React.ReactNode;
}

export default async function MembersSettingsLayout({ children }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SetPageHeader
        description="Manage workspace membership and invitations."
        title="Team Members"
      />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
