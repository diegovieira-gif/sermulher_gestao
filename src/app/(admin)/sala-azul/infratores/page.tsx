import { getInfratores } from "./actions";
import { InfratoresClient } from "./infratores-client";

export default async function InfratoresPage() {
  const result = await getInfratores();

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
      <InfratoresClient infratores={result.data || []} />
    </div>
  );
}
