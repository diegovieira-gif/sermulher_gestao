"use client";

import { Button } from "@/components/ui/button";

// Os avisos da página são de servidor: o clique precisa morar num componente cliente.
export function FecharJanelaButton() {
  return (
    <Button variant="outline" onClick={() => window.close()}>
      Fechar Janela
    </Button>
  );
}
