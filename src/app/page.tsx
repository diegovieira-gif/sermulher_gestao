import { ContactForm } from '@/components/landing/contact-form';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <main className="w-full max-w-xl rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-2 text-3xl font-semibold text-black dark:text-zinc-50">
          Apoie Esta Causa
        </h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Preencha os dados abaixo para receber contato da nossa equipe.
        </p>

        <ContactForm />
      </main>
    </div>
  );
}
