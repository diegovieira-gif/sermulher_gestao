// Testa a configuração de e-mail das notificações, sem esperar um evento real.
//
// Faz duas coisas, nesta ordem:
//   1. `verify()` — confere host, porta, TLS e credenciais.
//   2. Envia uma mensagem de teste, se um destinatário for informado.
//
// Existe porque "configurei o SMTP" e "o e-mail chega" são coisas diferentes:
// senha de app errada, 2FA desligada ou remetente não autorizado só aparecem
// no primeiro envio de verdade — que, sem este script, seria um aviso de
// escala que a servidora nunca recebeu.
//
// Uso:
//   node scripts/testar-email.mjs                      # só verifica a conexão
//   node scripts/testar-email.mjs alguem@dominio.com   # verifica e envia
//
// Lê SMTP_* do ambiente ou do .env.local.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nodemailer from "nodemailer";

function loadEnvLocal() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* usa apenas process.env */
  }
}

loadEnvLocal();

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
const destino = process.argv[2];

const faltando = [];
if (!SMTP_HOST) faltando.push("SMTP_HOST");
if (!SMTP_FROM) faltando.push("SMTP_FROM");

if (faltando.length) {
  console.error(`❌ Faltam variáveis: ${faltando.join(", ")}`);
  console.error(
    "\nPara Google Workspace:\n" +
      "  SMTP_HOST=smtp.gmail.com\n" +
      "  SMTP_PORT=587\n" +
      "  SMTP_USER=sermulher@aracaju.se.gov.br\n" +
      "  SMTP_PASSWORD=<senha de app de 16 caracteres>\n" +
      '  SMTP_FROM="SIGMA <sermulher@aracaju.se.gov.br>"',
  );
  process.exit(1);
}

const porta = Number(SMTP_PORT || 587);

console.log(`→ servidor .... ${SMTP_HOST}:${porta}`);
console.log(`→ autenticação  ${SMTP_USER || "(nenhuma)"}`);
console.log(`→ remetente ... ${SMTP_FROM}`);

const transporte = nodemailer.createTransport({
  host: SMTP_HOST,
  port: porta,
  secure: porta === 465,
  requireTLS: porta !== 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

/** Traduz os erros mais comuns do Gmail para uma instrução acionável. */
function explicar(erro) {
  const msg = String(erro?.message || erro);
  if (/Invalid login|Username and Password not accepted|BadCredentials/i.test(msg)) {
    return (
      "credenciais recusadas.\n" +
      "   O Gmail NÃO aceita a senha normal da conta. Gere uma Senha de app em\n" +
      "   myaccount.google.com/apppasswords (exige verificação em duas etapas\n" +
      "   ativada) e use os 16 caracteres em SMTP_PASSWORD."
    );
  }
  if (/self.signed|certificate/i.test(msg)) {
    return "problema no certificado TLS do servidor.";
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
    return (
      "não foi possível alcançar o servidor.\n" +
      "   Verifique host, porta e se a saída SMTP não está bloqueada na rede."
    );
  }
  if (/from|sender|not allowed/i.test(msg)) {
    return (
      "remetente recusado.\n" +
      "   SMTP_FROM precisa ser a MESMA conta autenticada em SMTP_USER\n" +
      "   (ou um alias autorizado nela)."
    );
  }
  return msg;
}

try {
  console.log("\nverificando conexão…");
  await transporte.verify();
  console.log("✅ conexão e credenciais OK");
} catch (erro) {
  console.error(`❌ ${explicar(erro)}`);
  process.exit(2);
}

if (!destino) {
  console.log(
    "\nNenhum destinatário informado — nada foi enviado.\n" +
      "Para testar a entrega de verdade:\n" +
      "  node scripts/testar-email.mjs seu-email@aracaju.se.gov.br",
  );
  process.exit(0);
}

try {
  console.log(`\nenviando para ${destino}…`);
  const info = await transporte.sendMail({
    from: SMTP_FROM,
    to: destino,
    subject: "SIGMA — teste de envio",
    text:
      "Esta é uma mensagem de teste do SIGMA.\n\n" +
      "Se você recebeu, o canal de e-mail das notificações de escala está " +
      "funcionando. Nenhuma ação é necessária.",
  });
  console.log(`✅ aceito pelo servidor (id: ${info.messageId})`);
  console.log(
    "\nConfira a caixa de entrada. 'Aceito pelo servidor' significa que o\n" +
      "Gmail recebeu a mensagem — não que ela foi entregue.",
  );
} catch (erro) {
  console.error(`❌ ${explicar(erro)}`);
  process.exit(3);
}
