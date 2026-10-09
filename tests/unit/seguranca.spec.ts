import { test, expect } from "@playwright/test";
import { htmlParaTexto } from "../../src/lib/texto-seguro";
import { cabecalhosDeArquivo, IMAGENS_ACEITAS } from "../../src/lib/arquivo-seguro";

/**
 * Defesas contra XSS armazenado. O relato técnico e os anexos são escritos por
 * usuárias e abertos por outras — inclusive administradoras. Um script que
 * passe por aqui roda com a sessão de quem abrir.
 */

test.describe("htmlParaTexto (relato técnico)", () => {
  test("remove marcação e eventos, mantendo o texto", () => {
    const t = htmlParaTexto('Relato<img src=x onerror="alert(1)"> final<script>roubar()</script>');
    expect(t).toBe("Relato final");
    expect(t).not.toContain("<");
  });

  test("quebras do editor antigo viram quebra de linha", () => {
    expect(htmlParaTexto("<p>Primeira</p><p>Segunda<br>linha</p>")).toBe("Primeira\nSegunda\nlinha");
    expect(htmlParaTexto("<ul><li>a</li><li>b</li></ul>")).toBe("• a\n• b");
  });

  test("entidades viram caractere, sem reabrir marcação perigosa no DOM", () => {
    // o texto final pode conter "<", mas o React o exibe escapado
    expect(htmlParaTexto("5 &lt; 7 &amp; 8 &gt; 2&nbsp;ok &#233;")).toBe("5 < 7 & 8 > 2 ok é");
  });

  test("texto puro passa igual; vazio vira vazio", () => {
    expect(htmlParaTexto("Atendida em 08/10.\nEncaminhada ao CRAS.")).toBe("Atendida em 08/10.\nEncaminhada ao CRAS.");
    expect(htmlParaTexto(null)).toBe("");
  });
});

test.describe("cabecalhosDeArquivo (proxy de anexos)", () => {
  test("SVG e HTML nunca vão inline", () => {
    for (const tipo of ["image/svg+xml", "text/html", "application/xhtml+xml", null]) {
      const h = cabecalhosDeArquivo(tipo, 'inline; filename="x.svg"');
      expect(h.get("Content-Type")).toBe("application/octet-stream");
      expect(h.get("Content-Disposition")).toMatch(/^attachment/);
      expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    }
  });

  test("imagem raster e PDF continuam abrindo no navegador", () => {
    const img = cabecalhosDeArquivo("image/png", null);
    expect(img.get("Content-Type")).toBe("image/png");
    expect(img.get("Content-Security-Policy")).toContain("sandbox");
    const pdf = cabecalhosDeArquivo("application/pdf; charset=binary", 'inline; filename="a.pdf"');
    expect(pdf.get("Content-Type")).toBe("application/pdf");
    expect(pdf.get("Content-Disposition")).toBe('inline; filename="a.pdf"');
  });

  test("upload de campanha não aceita SVG", () => {
    expect(IMAGENS_ACEITAS).not.toContain("image/svg+xml");
    expect(IMAGENS_ACEITAS).toContain("image/jpeg");
  });
});
