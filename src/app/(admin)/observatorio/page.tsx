
import { Suspense } from "react";
import { ObservatorioClient } from "./observatorio-client";
import { getCollectionData, getRelationData } from "./actions";
import { COLLECTIONS_CONFIG } from "./types";

export const dynamic = "force-dynamic";

export default async function ObservatorioPage() {
  // Fetch initial data for the first collection (Períodos)
  const firstCollection = COLLECTIONS_CONFIG[0].name;
  
  const [initialDataResult, periodosResult] = await Promise.all([
    getCollectionData(firstCollection),
    getRelationData('obser_periodos')
  ]);

  const initialData = initialDataResult.success ? initialDataResult.data : [];
  const initialError = initialDataResult.success ? null : { 
    message: initialDataResult.error || "Erro desconhecido", 
    status: initialDataResult.status 
  };
  
  const periodos = periodosResult.success ? periodosResult.data : [];

  return (
    <div className="p-4 md:p-8">
      <Suspense fallback={<div>Carregando...</div>}>
        <ObservatorioClient 
          initialData={initialData as any[]} 
          initialError={initialError}
          periodos={periodos as any[]}
        />
      </Suspense>
    </div>
  );
}
