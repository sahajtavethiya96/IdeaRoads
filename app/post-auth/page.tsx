import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getFirstUserWorkspace } from "@/lib/workspaces/queries";

export default async function PostAuthPage() {
  const session = await requireSession();

  const workspace = await getFirstUserWorkspace(session.user.id);

  redirect(workspace ? `/${workspace.slug}` : "/onboarding");
}
