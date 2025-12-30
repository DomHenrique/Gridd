import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente com prefixos suportados
  const env = loadEnv(mode, '.', ['REACT_APP_', 'VITE_', '']);

  // Filtra e prepara variáveis para o define
  const defines: Record<string, any> = {};
  
  Object.keys(env).forEach(key => {
    if (key.startsWith('REACT_APP_') || key.startsWith('VITE_') || ['NODE_ENV', 'GEMINI_API_KEY'].includes(key)) {
      // Define individualmente para máxima compatibilidade
      defines[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  });

  // Garante que o NODE_ENV esteja correto
  defines['process.env.NODE_ENV'] = JSON.stringify(mode);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      ...defines,
      // Fallback para quem acessa o objeto process.env diretamente
      'process.env': JSON.stringify(env),
      // Acesso direto via __ENV__ se necessário
      __ENV__: JSON.stringify(env),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
