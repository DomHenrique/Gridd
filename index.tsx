import React from 'react';
import ReactDOM from 'react-dom/client';
import AppNew from './AppNew';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, ToastContainer } from './components/ToastNotification';
import logger from './utils/logger';
import errorHandler from './utils/errorHandler';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// ============================================================================
// Inicialização de Variáveis de Ambiente - DEVE SER ANTES DE QUALQUER OUTRO CÓDIGO
// ============================================================================
import { initializeEnvironment, setupErrorHandlers } from './services/initialization';
import { initializeConfig } from './config/initialize';

// Inicializar variáveis de ambiente
initializeEnvironment();

// Inicializar e validar configurações
try {
  logger.info('Iniciando aplicação...', undefined, 'App');
  initializeConfig();
  logger.info('Configurações carregadas com sucesso', undefined, 'App');
  setupErrorHandlers();
} catch (error) {
  logger.critical('Erro na inicialização de configurações', error, undefined, 'App');
  // Mostrar erro ao usuário
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #ff6b26; margin-bottom: 20px;">⚠️ Erro de Inicialização</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          ${
            process.env.REACT_APP_DEBUG
              ? `<pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">${String(error)}</pre>`
              : 'A aplicação não pôde ser inicializada. Verifique as variáveis de ambiente.'
          }
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Consulte a documentação de configuração para mais informações.
        </p>
      </div>
    </div>
  `;
  process.exit(1);
}

// ============================================================================
// Setup de Handlers Globais
// ============================================================================

// Registrar listeners de erro para toast notifications
errorHandler.onError((error) => {
  logger.warn(`Erro capturado pelo handler: ${error.userMessage}`, undefined, 'ErrorHandler');
});

// ============================================================================
// Renderização da Aplicação
// ============================================================================

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AppNew />
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
