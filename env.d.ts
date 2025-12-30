/// <reference types="vite/client" />

/**
 * Tipagem para variáveis de ambiente
 */

interface ImportMetaEnv {
  // Ambiente
  readonly REACT_APP_NODE_ENV?: string;
  readonly REACT_APP_APP_URL?: string;
  readonly REACT_APP_API_URL?: string;
  readonly REACT_APP_DEBUG?: string;

  // Autenticação
  readonly REACT_APP_SESSION_SECRET?: string;
  readonly REACT_APP_SESSION_TIMEOUT?: string;
  readonly REACT_APP_ENABLE_REMEMBER_ME?: string;
  readonly REACT_APP_REMEMBER_ME_DURATION?: string;

  // Google OAuth
  readonly REACT_APP_GOOGLE_CLIENT_ID?: string;
  readonly REACT_APP_GOOGLE_CLIENT_SECRET?: string;
  readonly REACT_APP_GOOGLE_REDIRECT_URI?: string;
  readonly REACT_APP_GOOGLE_PHOTOS_SCOPES?: string;
  readonly REACT_APP_ENABLE_GOOGLE_PHOTOS?: string;

  // Upload
  readonly REACT_APP_MAX_FILE_SIZE_MB?: string;
  readonly REACT_APP_MAX_TOTAL_UPLOAD_SIZE_MB?: string;

  // APIs
  readonly REACT_APP_GEMINI_API_KEY?: string;

  // Variantes VITE_
  readonly VITE_APP_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_DEBUG?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Extensão de process.env para Node.js globals
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'staging';
      REACT_APP_NODE_ENV?: string;
      REACT_APP_APP_URL?: string;
      REACT_APP_API_URL?: string;
      REACT_APP_DEBUG?: string;
      REACT_APP_SESSION_SECRET?: string;
      REACT_APP_SESSION_TIMEOUT?: string;
      REACT_APP_ENABLE_REMEMBER_ME?: string;
      REACT_APP_REMEMBER_ME_DURATION?: string;
      REACT_APP_GOOGLE_CLIENT_ID?: string;
      REACT_APP_GOOGLE_CLIENT_SECRET?: string;
      REACT_APP_GOOGLE_REDIRECT_URI?: string;
      REACT_APP_GOOGLE_PHOTOS_SCOPES?: string;
      REACT_APP_ENABLE_GOOGLE_PHOTOS?: string;
      REACT_APP_MAX_FILE_SIZE_MB?: string;
      REACT_APP_MAX_TOTAL_UPLOAD_SIZE_MB?: string;
      REACT_APP_GEMINI_API_KEY?: string;
      GEMINI_API_KEY?: string;
    }
  }
}
