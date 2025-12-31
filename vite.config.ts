import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente com prefixos suportados
  const env = loadEnv(mode, '.', ['REACT_APP_', 'VITE_', '']);

  // Filtra e mapeia variáveis com prefixos
  const processEnv: Record<string, string> = {};

  Object.keys(env).forEach(key => {
    // Copia variáveis com prefixo REACT_APP_
    if (key.startsWith('REACT_APP_')) {
      processEnv[key] = JSON.stringify(env[key]);
    }
    // Copia variáveis com prefixo VITE_
    if (key.startsWith('VITE_')) {
      processEnv[key] = JSON.stringify(env[key]);
    }
    // Variáveis especiais sem prefixo
    if (['NODE_ENV', 'GEMINI_API_KEY'].includes(key)) {
      processEnv[key] = JSON.stringify(env[key]);
    }
  });

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Define um objeto process global compatível
      // Em produção, garantir que process é um objeto completo
      'global': 'globalThis',
      'process.env': JSON.stringify(processEnv),
      'process.versions': JSON.stringify({ node: undefined }),
      'process.version': JSON.stringify('v18.0.0'),
      'process.platform': JSON.stringify('web'),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001/api'),
      'process.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || 'http://localhost:3000'),
      // Acesso direto via import.meta.env
      '__ENV__': env,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Otimizar bundle - usar esbuild em vez de terser
      minify: 'esbuild',
      sourcemap: mode === 'production' ? false : true,
      rollupOptions: {
        external: ['/env-config.js'],
      }
    }
  };
});
