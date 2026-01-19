import { getMarketingItems, getMarketingStats } from "./actions";
import { MarketingClient } from "./marketing-client";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [itemsResult, stats] = await Promise.all([
    getMarketingItems().catch(() => ({ success: false, data: [] })),
    getMarketingStats().catch(() => ({
      postsMes: 0,
      alcanceMes: 0,
      interacoesMes: 0,
    })),
  ]);

  const items =
    itemsResult && itemsResult.success && Array.isArray(itemsResult.data)
      ? itemsResult.data
      : [];

  return (
    <div className="p-6">
      <MarketingClient items={items} stats={stats} />
    </div>
  );
}
