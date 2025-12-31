/**
 * Inicializador de Variáveis de Ambiente
 * Deve ser importado no início do index.tsx
 */

import { getEnvConfig, isProd, isDev, debugLog } from '../config/env';

/**
 * Inicializa as variáveis de ambiente
 * Carrega e valida todas as configurações necessárias
 */
export function initializeEnvironment(): void {
  // Carrega configuração
  const config = getEnvConfig();

  // Log inicial
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🚀 Inicializando Aplicação Gridd360');
  console.log('════════════════════════════════════════════════════════════════');

  // Versão do Node (apenas em desenvolvimento, onde Node.js existe)
  const nodeVersion = typeof process !== 'undefined' && process.versions?.node 
    ? process.versions.node 
    : 'N/A (Browser)';
  
  console.log(`📦 Versão do Node: ${nodeVersion}`);
  console.log(`🌍 Ambiente: ${config.nodeEnv.toUpperCase()}`);
  console.log(`🔐 Autenticação: ${config.googleClientId ? '✅ Google OAuth Configurado' : '⚠️  Google OAuth não configurado'}`);
  console.log(`📡 API URL: ${config.apiUrl}`);
  console.log(`🖥️  App URL: ${config.appUrl}`);

  if (isProd()) {
    console.log('🔒 Modo Produção Ativado - Erros podem ser limitados');
  }

  if (isDev()) {
    console.log('🔧 Modo Desenvolvimento - Debug completo habilitado');
    debugLog('Configuração completa carregada', config);
  }

  console.log('════════════════════════════════════════════════════════════════');
}

/**
 * Verifica conexão com a API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const config = getEnvConfig();
    const response = await fetch(`${config.apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      console.log('✅ API Backend está acessível');
      return true;
    } else {
      console.warn('⚠️  API Backend retornou status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️  Não foi possível conectar à API:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Configura listeners de erro global
 */
export function setupErrorHandlers(): void {
  // Handler para erros não capturados
  window.addEventListener('error', (event) => {
    console.error('❌ Erro não capturado:', event.error);
    if (isProd()) {
      // Em produção, enviar para serviço de logging
      // sendErrorToBackend(event.error);
    }
  });

  // Handler para promessas rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não capturada:', event.reason);
    if (isProd()) {
      // Em produção, enviar para serviço de logging
      // sendErrorToBackend(event.reason);
    }
  });

  console.log('✅ Error handlers configurados');
}
