"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import "./certificado.css";

interface CertificadoClientProps {
  matricula: any;
  beneficiaria: any;
  turma: any;
  curso: any;
}

export default function CertificadoClient({
  matricula,
  beneficiaria,
  turma,
  curso,
}: CertificadoClientProps) {
  const handlePrint = () => {
    window.print();
  };

  // Formata a data
  const dataAtual = new Date();
  const dia = dataAtual.getDate();
  const mes = dataAtual.toLocaleDateString("pt-BR", { month: "long" });
  const ano = dataAtual.getFullYear();

  return (
    <div className="w-full bg-background min-h-screen p-4 md:p-8">
      {/* Botão de Impressão - Visível apenas na tela */}
      <div className="hidden-print flex gap-3 mb-6">
        <Button
          onClick={handlePrint}
          size="lg"
          className="gap-2"
        >
          <Printer className="h-5 w-5" />
          Imprimir Certificado
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.close()}>
          Fechar
        </Button>
      </div>

      {/* Certificado - Otimizado para Impressão */}
      <div className="certificado-container">
        <div className="certificado-content">
          {/* Borda Ornamental */}
          <div className="certificado-border">
            {/* Header */}
            <div className="certificado-header">
              <h1 className="certificado-title">Certificado</h1>
            </div>

            {/* Corpo do Certificado */}
            <div className="certificado-body">
              <p className="certificado-text certificado-intro">
                Certificamos que
              </p>

              <p className="certificado-name">
                {beneficiaria.nome_completo.toUpperCase()}
              </p>

              <p className="certificado-text">
                concluiu com êxito o curso de
              </p>

              <p className="certificado-course">
                {curso.nome.toUpperCase()}
              </p>

              <p className="certificado-text">
                com carga horária de <strong>{curso.carga_horaria} horas</strong>
              </p>

              {turma.data_fim && (
                <p className="certificado-text">
                  realizado no período de{" "}
                  <strong>{new Date(turma.data_inicio).toLocaleDateString("pt-BR")}</strong> a{" "}
                  <strong>{new Date(turma.data_fim).toLocaleDateString("pt-BR")}</strong>
                </p>
              )}
            </div>

            {/* Assinatura e Data */}
            <div className="certificado-footer">
              <div className="certificado-signature">
                <div className="signature-line"></div>
                <p className="signature-text">Assinatura da Coordenadora</p>
              </div>

              <div className="certificado-date">
                <p className="date-text">
                  São Paulo, {dia} de {mes} de {ano}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
