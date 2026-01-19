import { getMarketingItems, getMarketingStats } from "./actions";
import { getAuxItems } from "@/app/(admin)/configuracoes/actions"; // Importe das configs
import { MarketingClient } from "./marketing-client";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [itemsResult, stats, campanhasRes] = await Promise.all([
    getMarketingItems().catch(() => ({ success: false, data: [] })),
    getMarketingStats().catch(() => ({
      postsMes: 0,
      alcanceMes: 0,
      interacoesMes: 0,
      taxaEngajamento: "0",
      campanhasAtivas: 0,
      topPlataforma: "-",
    })),
    // Busca a lista de campanhas cadastradas nas configurações
    getAuxItems("config_campanhas").catch(() => ({ success: false, data: [] })),
  ]);

  const items =
    itemsResult && itemsResult.success && Array.isArray(itemsResult.data)
      ? itemsResult.data
      : [];

  const campanhasList =
    campanhasRes && campanhasRes.success && Array.isArray(campanhasRes.data)
      ? campanhasRes.data
      : [];

  return (
    <div className="p-6">
      <MarketingClient
        items={items}
        stats={stats}
        campanhasList={campanhasList}
      />
    </div>
  );
}
