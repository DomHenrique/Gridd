/**
 * Configuração da API Google Photos
 * Gerenciação de variáveis de ambiente e inicialização
 */

import { GoogleAuthConfig, GooglePhotosScope } from '../types';
import { initializeAuthService } from '../auth/auth.service';
import { getEnvVar } from '../../../config/env';

/**
 * Configuração padrão do Google Photos
 */
export const GOOGLE_PHOTOS_CONFIG: GoogleAuthConfig = {
  // ⚠️ IMPORTANTE: Configure estas variáveis de ambiente
  // Suporta tanto prefixos VITE_ quanto VITE_ para compatibilidade
  clientId: getEnvVar('GOOGLE_CLIENT_ID'),
  redirectUri: getEnvVar('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/callback'),

  scopes: (getEnvVar('GOOGLE_PHOTOS_SCOPES') 
    ? getEnvVar('GOOGLE_PHOTOS_SCOPES').split(',').map(s => s.trim())
    : [
        GooglePhotosScope.PHOTOS_LIBRARY_READONLY,
        GooglePhotosScope.PHOTOS_LIBRARY_EDIT_APPSOURCE,
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ]) as GooglePhotosScope[],
};

/**
 * Estrutura de categorias padrão para organizar álbuns
 */
export const DEFAULT_ALBUM_STRUCTURE = [
  {
    name: 'Campanhas',
    subcategories: ['Redes Sociais', 'Email Marketing', 'Conteúdo Web'],
  },
  {
    name: 'Eventos',
    subcategories: ['Lançamentos', 'Conferências', 'Workshops'],
  },
  {
    name: 'Branding',
    subcategories: ['Logo', 'Identidade Visual', 'Guidelines'],
  },
  {
    name: 'Produção',
    subcategories: ['Behind the Scenes', 'Estúdio', 'Locações'],
  },
];

/**
 * Limites e configurações de upload
 */
export const UPLOAD_CONFIG = {
  // Tamanho máximo por arquivo (em bytes) - 100 MB
  MAX_FILE_SIZE: 100 * 1024 * 1024,

  // Tamanho máximo de upload simultâneos (em bytes) - 1 GB
  MAX_TOTAL_SIZE: 1024 * 1024 * 1024,

  // Timeout para requisição de upload (em ms) - 30 minutos
  UPLOAD_TIMEOUT: 30 * 60 * 1000,

  // Quantidade máxima de retentativas
  MAX_RETRIES: 3,

  // Tipos de arquivo aceitos
  ACCEPTED_TYPES: [
    // Imagens
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff',
    // Vídeos
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv',
  ],
};

/**
 * Configurações de cache
 */
export const CACHE_CONFIG = {
  // Duração do cache de álbuns (em ms) - 5 minutos
  ALBUMS_CACHE_DURATION: 5 * 60 * 1000,

  // Duração do cache de itens de mídia (em ms) - 10 minutos
  MEDIA_ITEMS_CACHE_DURATION: 10 * 60 * 1000,

  // Duração do cache de permissões (em ms) - 15 minutos
  PERMISSIONS_CACHE_DURATION: 15 * 60 * 1000,

  // Tamanho máximo do cache em memória (quantidade de itens)
  MAX_CACHE_SIZE: 1000,
};

/**
 * Configurações de sincronização
 */
export const SYNC_CONFIG = {
  // Intervalo de sincronização automática (em ms) - 5 minutos
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000,

  // Quantidade máxima de operações pendentes antes de sincronizar
  MAX_PENDING_OPS: 100,

  // Timeout para operação de sincronização (em ms) - 2 minutos
  SYNC_TIMEOUT: 2 * 60 * 1000,

  // Máximo de itens para sincronizar por lote
  BATCH_SIZE: 50,
};

/**
 * Configurações de segurança e auditoria
 */
export const SECURITY_CONFIG = {
  // Habilitar logs de auditoria
  ENABLE_AUDIT_LOGS: true,

  // Máximo de logs de auditoria a manter
  MAX_AUDIT_LOGS: 5000,

  // Exigir confirmação para ações sensíveis
  REQUIRE_CONFIRMATION_FOR_DELETE: true,

  // Habilitar criptografia de dados sensíveis no localStorage
  ENCRYPT_SENSITIVE_DATA: false, // TODO: implementar com TweetNaCl.js ou libsodium

  // Tempo de sessão (em ms) - 1 hora
  SESSION_TIMEOUT: 60 * 60 * 1000,

  // Habilitar CORS
  ENABLE_CORS: true,
};

/**
 * Configurações de permissões padrão
 */
export const DEFAULT_PERMISSIONS = {
  // Novo usuário tem qual permissão padrão
  DEFAULT_PERMISSION_LEVEL: 'viewer',

  // Pode criar subpastas por padrão
  DEFAULT_CAN_CREATE_SUBFOLDERS: false,

  // Pode deletar conteúdo por padrão
  DEFAULT_CAN_DELETE_CONTENT: false,

  // Pode compartilhar pasta por padrão
  DEFAULT_CAN_SHARE_FOLDER: false,
};

/**
 * Inicializa o serviço Google Photos com a configuração
 */
export function initializeGooglePhotos(customConfig?: Partial<GoogleAuthConfig>): void {
  const config = {
    ...GOOGLE_PHOTOS_CONFIG,
    ...customConfig,
  };

  console.log('[GoogleConfig] Inicializando integração Google Photos...');

  // Validar configuração
  let hasMissing = false;
  if (!config.clientId) {
    console.warn('[GoogleConfig] AVISO: Google Client ID não configurado (VITE_GOOGLE_CLIENT_ID).');
    hasMissing = true;
  }


  if (hasMissing) {
    console.info('[GoogleConfig] A integração será inicializada com credenciais parciais. O login pode falhar.');
  }

  // Inicializar serviço de autenticação
  initializeAuthService(config);

  console.log('[GoogleConfig] Google Photos API inicializado com sucesso.');
}

/**
 * Obtém o status detalhado da configuração para a UI
 */
export function getConfigurationStatus() {
  const config = GOOGLE_PHOTOS_CONFIG;
  return {
    hasClientId: !!config.clientId,
    hasRedirectUri: !!config.redirectUri,
    isConfigured: !!config.clientId,
  };
}

/**
 * Obtém configuração atual
 */
export function getConfig(): GoogleAuthConfig {
  return { ...GOOGLE_PHOTOS_CONFIG };
}

/**
 * Atualiza configuração
 */
export function updateConfig(updates: Partial<GoogleAuthConfig>): void {
  console.log('[GoogleConfig] Atualizando configuração em tempo de execução:', Object.keys(updates));
  Object.assign(GOOGLE_PHOTOS_CONFIG, updates);
}
