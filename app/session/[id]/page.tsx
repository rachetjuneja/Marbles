import Workspace from "@/components/Workspace";
import { getSession } from "@/lib/store";
import { publicModels } from "@/lib/models/registry";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: { id: string } }) {
  const session = await getSession(params.id);
  const models = publicModels();
  return (
    <Workspace
      projectId={params.id}
      customerName={session?.customerName || "Customer"}
      customerMobile={session?.customerMobile || ""}
      models={models}
    />
  );
}
