import { getBeneficiarias } from "./actions";
import { BeneficiariasClient } from "./beneficiarias-client";

export default async function BeneficiariasPage() {
  const result = await getBeneficiarias();

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <BeneficiariasClient beneficiarias={result.data || []} />
    </div>
  );
}
