import { Suspense } from "react";
import { IndicadoresClient } from "./indicadores-client"; // Adjust path if needed
import { getIndicadoresCRAM } from "./actions";
import { mesAtualEmBrasilia } from "@/lib/datas";

export default async function IndicadoresPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const params = await searchParams; // Next.js 15+ needs await for searchParams

    // Mês corrente no calendário de Brasília: em UTC, das 21h do último dia
    // em diante a página já abria no mês seguinte (vazio).
    const atual = mesAtualEmBrasilia();
    const mes = params?.mes ? Number(params.mes) : atual.mes;
    const ano = params?.ano ? Number(params.ano) : atual.ano;

    const { success, data } = await getIndicadoresCRAM(mes, ano);

    if (!success || !data) {
        return (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
                <h2 className="text-xl font-bold">Erro ao carregar indicadores</h2>
                <p>Não foi possível processar os dados para o período selecionado.</p>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="p-8 text-center">Carregando indicadores...</div>}>
            <IndicadoresClient dados={data} mesInicial={mes} anoInicial={ano} />
        </Suspense>
    );
}
