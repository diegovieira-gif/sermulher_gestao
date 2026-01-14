'use client';

import { useState } from 'react';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-directus');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Erro ao fazer requisição',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex w-full max-w-3xl flex-col gap-8 bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-lg">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Teste de Conexão Directus
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Clique no botão abaixo para testar a conexão com o Directus
          </p>
        </div>

        <button
          onClick={testConnection}
          disabled={loading}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-white font-medium transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>

        {result && (
          <div className={`p-6 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              {result.success ? '✓ Sucesso!' : '✗ Erro'}
            </h2>
            
            {result.success && (
              <div className="space-y-4 mb-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  <p><strong>URL:</strong> {result.directusUrl}</p>
                  <p><strong>Versão:</strong> {result.serverInfo?.version || 'N/A'}</p>
                  <p><strong>Projeto:</strong> {result.serverInfo?.project}</p>
                  <p><strong>Collections:</strong> {result.collectionsCount}</p>
                </div>
                
                {result.collections && result.collections.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2 text-zinc-800 dark:text-zinc-200">Lista de Collections:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-auto">
                      {result.collections.map((col: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="p-3 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{col.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {col.name}
                              </p>
                              {col.note && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{col.note}</p>
                              )}
                              <div className="flex gap-2 mt-1">
                                {col.singleton && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                    Singleton
                                  </span>
                                )}
                                {col.hidden && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                    Hidden
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ver JSON completo
              </summary>
              <pre className="text-xs overflow-auto p-4 bg-zinc-100 dark:bg-zinc-800 rounded mt-2">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}
