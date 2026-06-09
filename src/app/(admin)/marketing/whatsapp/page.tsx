import { WhatsappClient } from "./whatsapp-client";

export const dynamic = "force-dynamic";

export default async function WhatsappCampaignsPage() {
  return (
    <div className="p-6">
      <WhatsappClient />
    </div>
  );
}
