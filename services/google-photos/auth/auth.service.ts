/**
 * Serviço de Autenticação OAuth 2.0 para Google Photos API
 * Gerencia tokens, refresh e persistência de credenciais de forma segura
 */

import {
  GoogleAuthToken,
  GoogleAuthConfig,
  GooglePhotosApiException,
  GooglePhotosError,
} from '../types';
import { GoogleTokenService } from '../../googleTokenService';
import { supabase } from '../../supabase';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const STORAGE_KEY = 'google_photos_auth_token';
const STORAGE_KEY_REFRESH = 'google_photos_refresh_token';
const STORAGE_KEY_VERIFIER = 'google_photos_pkce_verifier';

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
    try {
      const dbTokens = await GoogleTokenService.getTokens();
      if (dbTokens) {
        console.log('[GoogleAuth] Tokens encontrados no Supabase, atualizando estado local.');
        this.currentToken = dbTokens;
        this.scheduleTokenRefresh();
        this.saveTokenToStorage();
      } else {
        console.log('[GoogleAuth] Nenhum token encontrado no Supabase.');
      }
    } catch (error) {
      console.error('[GoogleAuth] Erro ao sincronizar com Supabase:', error);
    }
  }

  /**
   * Inicia o fluxo de autenticação OAuth 2.0 (Authorization Code Flow com PKCE)
   * Retorna a URL de autorização que o usuário deve visitar
   */
  async getAuthorizationUrl(state?: string): Promise<string> {
    // 1. Gerar e salvar PKCE verifier (sessionStorage para segurança temporária)
    const verifier = generateCodeVerifier();
    sessionStorage.setItem(STORAGE_KEY_VERIFIER, verifier);

    // 2. Gerar challenge a partir do verifier
    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code', // Mudança crítica: de 'token' para 'code'
      scope: this.config.scopes.join(' '),
      state: state || this.generateRandomState(),
      access_type: 'offline', // Permite receber Refresh Token
      prompt: 'consent',     // Exigir consentimento para garantir envio do Refresh Token
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const url = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
    console.log('[GoogleAuth] Gerando URL de autorização (Code Flow + PKCE):', {
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
      url: url.split('?')[0] + '?...'
    });
    return url;
  }

  /**
   * EXTRAIT: O handleAuthCallback anterior para Implicit Flow foi depreciado.
   * Agora o AppNew.tsx deve detectar 'code' na URL e chamar exchangeCodeForToken.
   */
  async handleAuthCallback(): Promise<GoogleAuthToken> {
    console.warn('[GoogleAuth] handleAuthCallback (Implicit) foi chamado mas o app agora usa Code Flow.');
    
    // Fallback para quem ainda usa o hash (se houver)
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      if (accessToken) {
        // ... processar legado se necessário ...
        console.log('[GoogleAuth] Processando token legado via Implicit Flow.');
      }
    }
    
    throw new Error('Fluxo de autenticação mudou para Code Flow. Use exchangeCodeForToken.');
  }

  /**
   * Troca o código de autorização por um token de acesso via Supabase Function (Backend Seguro)
   */
  async exchangeCodeForToken(code: string): Promise<GoogleAuthToken> {
    console.log('[GoogleAuth] Trocando código por tokens via Backend (Edge Function)...');
    
    const verifier = sessionStorage.getItem(STORAGE_KEY_VERIFIER);
    if (!verifier) {
      console.warn('[GoogleAuth] PKCE Verifier não encontrado no sessionStorage. A troca pode falhar.');
    }

    try {
      // Delegar a troca para a Supabase Function para proteger o Client Secret
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { 
          action: 'exchange',
          code,
          code_verifier: verifier,
          redirect_uri: this.config.redirectUri
        }
      });

      if (error) {
        throw new Error(`Erro na Supabase Function: ${error.message || JSON.stringify(error)}`);
      }

      console.log('[GoogleAuth] Tokens recebidos com sucesso do Backend.');
      
      this.currentToken = this.parseTokenResponse(data);
      this.scheduleTokenRefresh();
      this.saveTokenToStorage();
      
      // Limpar segredos temporários
      sessionStorage.removeItem(STORAGE_KEY_VERIFIER);

      // Persistir no Supabase para uso futuro
      await GoogleTokenService.saveTokens(this.currentToken);

      return this.currentToken;
    } catch (error) {
      console.error('[GoogleAuth] Falha na troca de código:', error);
      throw error;
    }
  }

  /**
   * Atualiza o token de acesso usando o refresh token via Backend
   */
  async refreshAccessToken(): Promise<GoogleAuthToken> {
    if (!this.currentToken?.refresh_token) {
      console.warn('[GoogleAuth] Tentativa de renovação sem refresh token.');
      throw new Error('Nenhum refresh token disponível');
    }

    console.log('[GoogleAuth] Renovando token via Backend...');
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { 
          action: 'refresh',
          refresh_token: this.currentToken.refresh_token 
        }
      });

      if (error) {
        throw new Error(`Erro na renovação via Backend: ${error.message}`);
      }

      console.log('[GoogleAuth] Token renovado com sucesso.');
      
      const newToken = this.parseTokenResponse(data);
      // Preservar refresh token se não veio um novo
      if (!newToken.refresh_token && this.currentToken.refresh_token) {
        newToken.refresh_token = this.currentToken.refresh_token;
      }

      this.currentToken = newToken;
      this.scheduleTokenRefresh();
      this.saveTokenToStorage();
      
      await GoogleTokenService.saveTokens(this.currentToken);

      return this.currentToken;
    } catch (error) {
      console.error('[GoogleAuth] Falha ao renovar token:', error);
      throw error;
    }
  }

  /**
   * Obtém o token atual se estiver válido
   */
  getCurrentToken(): GoogleAuthToken | null {
    if (!this.currentToken || this.isTokenExpired()) {
      return null;
    }
    return this.currentToken;
  }

  /**
   * Obtém um token válido, renovando automaticamente se necessário
   */
  async getValidToken(): Promise<GoogleAuthToken> {
    const token = this.getCurrentToken();
    if (token) return token;

    if (this.currentToken?.refresh_token) {
      return this.refreshAccessToken();
    }

    throw new Error('Sessão Google expirada. Por favor, conecte novamente.');
  }

  /**
   * Revoga o acesso e limpa os tokens
   */
  async revokeToken(): Promise<void> {
    const token = this.currentToken;
    if (!token) return;

    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: token.access_token }).toString(),
      });
      this.clearToken();
    } catch (error) {
      console.error('[GoogleAuth] Erro ao revogar token:', error);
      this.clearToken(); // Limpa localmente de qualquer forma
    }
  }

  private isTokenExpired(): boolean {
    if (!this.currentToken) return true;
    const bufferMs = 5 * 60 * 1000; // 5 minutos de margem
    return Date.now() + bufferMs > this.currentToken.expires_at;
  }

  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    if (!this.currentToken) return;

    // Agenda para 5 minutos antes de expirar
    const delay = this.currentToken.expires_at - Date.now() - (5 * 60 * 1000);
    if (delay > 0) {
      this.tokenRefreshTimer = setTimeout(() => this.refreshAccessToken(), delay);
    }
  }

  private parseTokenResponse(data: any): GoogleAuthToken {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || undefined,
      expires_in: data.expires_in,
      token_type: data.token_type || 'Bearer',
      scope: data.scope || this.config.scopes.join(' '),
      expires_at: Date.now() + (data.expires_in * 1000),
    };
  }

  private saveTokenToStorage(): void {
    if (!this.currentToken) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentToken));
    if (this.currentToken.refresh_token) {
      localStorage.setItem(STORAGE_KEY_REFRESH, this.currentToken.refresh_token);
    }
  }

  private loadTokenFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.currentToken = JSON.parse(stored);
      } catch {
        this.clearToken();
      }
    }
  }

  private clearToken(): void {
    this.currentToken = null;
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
  }

  private generateRandomState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  validateState(returnedState: string, originalState: string): boolean {
    return returnedState === originalState;
  }

  isAuthenticated(): boolean {
    return !!this.currentToken;
  }

  async getUserInfo() {
    const token = await this.getValidToken();
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    return res.json();
  }
}

let authServiceInstance: GooglePhotosAuthService | null = null;

export function initializeAuthService(config: GoogleAuthConfig): GooglePhotosAuthService {
  authServiceInstance = new GooglePhotosAuthService(config);
  return authServiceInstance;
}

export function getAuthService(): GooglePhotosAuthService {
  if (!authServiceInstance) {
    throw new Error('Google Auth Service not initialized');
  }
  return authServiceInstance;
}
