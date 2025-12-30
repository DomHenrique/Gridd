/**
 * Serviço de Autenticação OAuth 2.0 para Google Photos API
 * Gerencia tokens, refresh e persistência de credenciais
 */

import {
  GoogleAuthToken,
  GoogleAuthConfig,
  GooglePhotosScope,
  GooglePhotosApiException,
  GooglePhotosError,
} from '../types';
import { GoogleTokenService } from '../../googleTokenService';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const STORAGE_KEY = 'google_photos_auth_token';
const STORAGE_KEY_REFRESH = 'google_photos_refresh_token';

export class GooglePhotosAuthService {
  private config: GoogleAuthConfig;
  private currentToken: GoogleAuthToken | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor(config: GoogleAuthConfig) {
    this.config = config;
    this.loadTokenFromStorage();
    this.syncWithSupabase();
  }

  /**
   * Sincroniza tokens com o Supabase na inicialização
   */
  private async syncWithSupabase() {
    console.log('[GoogleAuth] Sincronizando tokens com Supabase...');
    const dbTokens = await GoogleTokenService.getTokens();
    if (dbTokens) {
      console.log('[GoogleAuth] Tokens encontrados no Supabase, atualizando estado local.');
      this.currentToken = dbTokens;
      this.scheduleTokenRefresh();
      this.saveTokenToStorage();
    } else {
      console.log('[GoogleAuth] Nenhum token encontrado no Supabase.');
    }
  }

  /**
   * Inicia o fluxo de autenticação OAuth 2.0
   * Retorna a URL de autorização que o usuário deve visitar
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'token', // Implicit flow para evitar CORS no frontend
      scope: this.config.scopes.join(' '),
      state: state || this.generateRandomState(),
      // access_type: 'offline', // Implicit flow não suporta offline access/refresh token
      prompt: 'consent',
    });

    const url = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
    console.log('[GoogleAuth] Gerando URL de autorização:', {
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
      url: url.split('?')[0] + '?...' // Log seguro
    });
    return url;
  }

  /**
   * Extrai token do fragmento da URL (hash) após redirecionamento
   */
  async handleAuthCallback(): Promise<GoogleAuthToken> {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        throw new Error('Nenhum fragmento de autenticação encontrado na URL.');
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const tokenType = params.get('token_type') as 'Bearer';
    const scope = params.get('scope');

    if (!accessToken) {
        throw new Error('access_token não encontrado na resposta do Google.');
    }

    console.log('[GoogleAuth] Token recebido via Implicit Flow.');
    
    this.currentToken = {
        access_token: accessToken,
        expires_in: parseInt(expiresIn || '3600', 10),
        token_type: tokenType || 'Bearer',
        scope: scope || '',
        expires_at: Date.now() + parseInt(expiresIn || '3600', 10) * 1000,
    };

    this.scheduleTokenRefresh();
    this.saveTokenToStorage();
    
    // Persistir no Supabase
    await GoogleTokenService.saveTokens(this.currentToken);

    return this.currentToken;
  }

  /**
   * Troca o código de autorização por um token de acesso (Authorization Code Flow)
   * Apenas mantido para compatibilidade, mas propenso a erros de CORS no frontend puro.
   */
  async exchangeCodeForToken(code: string): Promise<GoogleAuthToken> {
    console.log('[GoogleAuth] Trocando código de autorização por tokens...');
    try {
      const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
          code,
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[GoogleAuth] Erro na troca do código:', data);
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha ao trocar código por token'
        );
      }

      console.log('[GoogleAuth] Token recebido com sucesso. Expira em:', data.expires_in, 'segundos');
      this.currentToken = this.parseTokenResponse(data);
      this.scheduleTokenRefresh();
      this.saveTokenToStorage();
      
      // Persistir no Supabase
      await GoogleTokenService.saveTokens(this.currentToken);

      return this.currentToken;
    } catch (error) {
      console.error('[GoogleAuth] Falha crítica na autenticação:', error);
      if (error instanceof GooglePhotosApiException) {
        throw error;
      }
      throw new Error(`Erro na autenticação: ${error}`);
    }
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   */
  async refreshAccessToken(): Promise<GoogleAuthToken> {
    if (!this.currentToken?.refresh_token) {
      console.warn('[GoogleAuth] Refresh token não disponível para renovação.');
      throw new Error('Nenhum refresh token disponível');
    }

    console.log('[GoogleAuth] Renovando token de acesso...');
    try {
      const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.currentToken.refresh_token,
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[GoogleAuth] Erro ao renovar token:', data);
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha ao renovar token'
        );
      }

      console.log('[GoogleAuth] Token renovado com sucesso.');
      // Mantém o refresh token original se não foi retornado um novo
      const newToken = this.parseTokenResponse(data);
      if (!newToken.refresh_token && this.currentToken.refresh_token) {
        newToken.refresh_token = this.currentToken.refresh_token;
      }

      this.currentToken = newToken;
      this.scheduleTokenRefresh();
      this.saveTokenToStorage();
      
      // Atualizar Supabase
      await GoogleTokenService.saveTokens(this.currentToken);

      return this.currentToken;
    } catch (error) {
      console.error('[GoogleAuth] Falha ao renovar token:', error);
      if (error instanceof GooglePhotosApiException) {
        throw error;
      }
      throw new Error(`Erro ao renovar token: ${error}`);
    }
  }

  /**
   * Obtém o token atual
   */
  getCurrentToken(): GoogleAuthToken | null {
    if (!this.currentToken) {
      return null;
    }

    // Verifica se o token expirou
    if (this.isTokenExpired()) {
      return null;
    }

    return this.currentToken;
  }

  /**
   * Obtém um token válido, renovando se necessário
   */
  async getValidToken(): Promise<GoogleAuthToken> {
    const token = this.getCurrentToken();

    if (token) {
      return token;
    }

    // Se não há token válido, tenta renovar
    if (this.currentToken?.refresh_token) {
      return this.refreshAccessToken();
    }

    throw new Error(
      'Nenhum token válido disponível. Execute a autenticação novamente.'
    );
  }

  /**
   * Revoga o token de acesso
   */
  async revokeToken(): Promise<void> {
    const token = this.getCurrentToken();

    if (!token) {
      throw new Error('Nenhum token ativo para revogar');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: token.access_token,
        }).toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha ao revogar token'
        );
      }

      this.clearToken();
    } catch (error) {
      if (error instanceof GooglePhotosApiException) {
        throw error;
      }
      throw new Error(`Erro ao revogar token: ${error}`);
    }
  }

  /**
   * Verifica se o token está expirado
   */
  private isTokenExpired(): boolean {
    if (!this.currentToken) {
      return true;
    }

    // Considera token expirado se faltam menos de 60 segundos
    const bufferMs = 60 * 1000;
    return Date.now() + bufferMs > this.currentToken.expires_at;
  }

  /**
   * Agenda a renovação automática do token
   */
  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    if (!this.currentToken) {
      return;
    }

    // Renova 5 minutos antes da expiração
    const timeUntilRefresh = this.currentToken.expires_at - Date.now() - 5 * 60 * 1000;

    if (timeUntilRefresh > 0) {
      this.tokenRefreshTimer = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Erro ao renovar token automaticamente:', error);
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Parseia a resposta de token do Google
   */
  private parseTokenResponse(data: any): GoogleAuthToken {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || undefined,
      expires_in: data.expires_in,
      token_type: data.token_type || 'Bearer',
      scope: data.scope || this.config.scopes.join(' '),
      expires_at: Date.now() + data.expires_in * 1000,
    };
  }

  /**
   * Salva o token no localStorage
   */
  private saveTokenToStorage(): void {
    if (!this.currentToken) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentToken));
      if (this.currentToken.refresh_token) {
        localStorage.setItem(STORAGE_KEY_REFRESH, this.currentToken.refresh_token);
      }
    } catch (error) {
      console.warn('Não foi possível salvar token no localStorage:', error);
    }
  }

  /**
   * Carrega o token do localStorage
   */
  private loadTokenFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.currentToken = JSON.parse(stored);
        // Verifica se o token ainda é válido
        if (this.isTokenExpired() && this.currentToken?.refresh_token) {
          // Token expirou, será renovado quando necessário
          console.log('Token armazenado expirou');
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar token do localStorage:', error);
    }
  }

  /**
   * Limpa o token
   */
  private clearToken(): void {
    this.currentToken = null;
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
    } catch (error) {
      console.warn('Erro ao limpar tokens do localStorage:', error);
    }
  }

  /**
   * Gera um estado aleatório para OAuth
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Valida o estado OAuth
   */
  validateState(returnedState: string, originalState: string): boolean {
    return returnedState === originalState;
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    return this.getCurrentToken() !== null;
  }

  /**
   * Obtém informações do usuário autenticado (requer scope adicional)
   */
  async getUserInfo(): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }> {
    const token = await this.getValidToken();

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao obter informações do usuário');
      }

      return response.json();
    } catch (error) {
      throw new Error(`Erro ao buscar informações do usuário: ${error}`);
    }
  }
}

// Singleton para gerenciar autenticação globalmente
let authServiceInstance: GooglePhotosAuthService | null = null;

export function initializeAuthService(config: GoogleAuthConfig): GooglePhotosAuthService {
  authServiceInstance = new GooglePhotosAuthService(config);
  return authServiceInstance;
}

export function getAuthService(): GooglePhotosAuthService {
  if (!authServiceInstance) {
    throw new Error(
      'Serviço de autenticação não inicializado. Chame initializeAuthService() primeiro.'
    );
  }
  return authServiceInstance;
}
