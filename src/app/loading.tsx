export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        <p className="text-slate-600 dark:text-slate-300 text-sm">Carregando...</p>
      </div>
    </div>
  );
}
