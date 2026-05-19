'use client';

import { useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { capturarLead } from '@/app/actions/capturar-lead';

function formatarWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function ContactForm() {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bairro, setBairro] = useState('');
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const resultado = await capturarLead({
        nome,
        whatsapp,
        bairro,
        origem: pathname,
        utmSource: searchParams.get('utm_source') || '',
        utmMedium: searchParams.get('utm_medium') || '',
        utmCampaign: searchParams.get('utm_campaign') || '',
      });

      if (resultado.sucesso) {
        setNome('');
        setWhatsapp('');
        setBairro('');
        toast.success('Obrigado pelo seu apoio! Entraremos em contato em breve.');
        return;
      }

      toast.error(resultado.mensagem || 'Não foi possível enviar seus dados.');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          required
          disabled={isPending}
          className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-blue-600 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          value={whatsapp}
          onChange={(event) => setWhatsapp(formatarWhatsapp(event.target.value))}
          required
          disabled={isPending}
          placeholder="(79) 99999-9999"
          className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-blue-600 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label htmlFor="bairro" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Bairro
        </label>
        <input
          id="bairro"
          name="bairro"
          type="text"
          value={bairro}
          onChange={(event) => setBairro(event.target.value)}
          required
          disabled={isPending}
          className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-blue-600 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Enviando...' : 'Quero Apoiar'}
      </button>
    </form>
  );
}
