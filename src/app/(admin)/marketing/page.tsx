import { getMarketingItems, getMarketingStats } from "./actions";
import { getAuxItems } from "../configuracoes/actions";
import { MarketingClient } from "./marketing-client";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [itemsResult, stats, campanhasResult] = await Promise.all([
    getMarketingItems().catch(() => ({ success: false, data: [] })),
    getMarketingStats().catch(() => ({
      postsMes: 0,
      alcanceMes: 0,
      interacoesMes: 0,
    })),
    getAuxItems("config_campanhas").catch(() => ({ success: false, data: [] })),
  ]);

  const items =
    itemsResult && itemsResult.success && Array.isArray(itemsResult.data)
      ? itemsResult.data
      : [];

  return (
    <div className="p-6">
      <MarketingClient
        items={items}
        stats={stats}
        campanhasList={(campanhasResult as any)?.data || []}
      />
    </div>
  );
}
