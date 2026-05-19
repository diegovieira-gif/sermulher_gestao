"use server";

export type CapturaLeadPayload = {
  nome: string;
  whatsapp: string;
  bairro: string;
  origem?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type CapturaLeadResultado = {
  sucesso: boolean;
  mensagem: string;
};

export async function capturarLead({
  nome,
  whatsapp,
  bairro,
  origem,
  utmSource,
  utmMedium,
  utmCampaign,
}: CapturaLeadPayload): Promise<CapturaLeadResultado> {
  const limpar = (valor?: string) => (valor || "").trim();

  const payload = {
    nome: limpar(nome),
    whatsapp: limpar(whatsapp),
    bairro: limpar(bairro),
    origem: limpar(origem),
    utm_source: limpar(utmSource),
    utm_medium: limpar(utmMedium),
    utm_campaign: limpar(utmCampaign),
  };

  if (!payload.nome || !payload.whatsapp || !payload.bairro) {
    return {
      sucesso: false,
      mensagem: "Preencha nome, WhatsApp e bairro para continuar.",
    };
  }

  const whatsappNumerico = payload.whatsapp.replace(/\D/g, "");
  if (whatsappNumerico.length < 10) {
    return {
      sucesso: false,
      mensagem: "Informe um WhatsApp válido com DDD.",
    };
  }

  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      sucesso: false,
      mensagem: "Webhook de captação não configurado.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const erroDetalhado = await response.text();

      return {
        sucesso: false,
        mensagem:
          erroDetalhado ||
          "Não foi possível enviar seus dados no momento. Tente novamente.",
      };
    }

    return {
      sucesso: true,
      mensagem: "Lead enviado com sucesso.",
    };
  } catch {
    return {
      sucesso: false,
      mensagem: "Falha de conexão ao enviar o formulário.",
    };
  }
}
