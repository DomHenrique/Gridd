/**
 * Serviço de Autenticação com Gmail e Sistema Local
 * Gerencia login, registro, tokens e sessões
 */

import {
  User,
  AuthToken,
  AuthSession,
  LoginResponse,
  RegisterResponse,
  GoogleProfile,
  RegisterData,
  AuthProvider,
  UserRole,
  GoogleAuthConfig,
} from './auth.types';
import { logger } from '../utils/logger';
import { getEnvConfig, getApiUrl, debugLog } from '../../config/env';

const STORAGE_KEY_SESSION = 'gridd360_session';
const STORAGE_KEY_TOKEN = 'gridd360_token';
const STORAGE_KEY_REFRESH = 'gridd360_refresh_token';

export class AuthService {
  private currentSession: AuthSession | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSessionFromStorage();
  }

  /**
   * Login com Google OAuth
   */
  async loginWithGoogle(code: string): Promise<LoginResponse> {
    try {
      logger.info('🔐 Iniciando login com Google', { code: code?.substring(0, 10) });
      const apiUrl = getApiUrl();
      debugLog('Google callback endpoint:', `${apiUrl}/auth/google/callback`);

      const response = await fetch(`${apiUrl}/auth/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('❌ Erro no login Google', {
          status: response.status,
          error: data.error,
        });
        return {
          success: false,
          error: data.error || 'Falha no login com Google',
        };
      }

      const { user, token } = data;

      this.currentSession = {
        user,
        token,
        isAuthenticated: true,
        provider: AuthProvider.GOOGLE,
      };

      this.scheduleTokenRefresh(token);
      this.saveSessionToStorage();

      logger.success('✅ Login Google bem-sucedido', {
        email: user.email,
        role: user.role,
      });

      return { success: true, user, token };
    } catch (error) {
      logger.error('❌ Erro ao fazer login com Google', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Login com Email e Senha
   */
  async loginWithEmail(email: string, password: string): Promise<LoginResponse> {
    try {
      logger.info('🔐 Tentando login com email', { email });

      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('❌ Falha na autenticação', {
          status: response.status,
          email,
        });
        return {
          success: false,
          error: data.error || 'Email ou senha incorretos',
        };
      }

      const { user, token } = data;

      this.currentSession = {
        user,
        token,
        isAuthenticated: true,
        provider: AuthProvider.LOCAL,
      };

      this.scheduleTokenRefresh(token);
      this.saveSessionToStorage();

      logger.success('✅ Login bem-sucedido', {
        email: user.email,
        role: user.role,
      });

      return { success: true, user, token };
    } catch (error) {
      logger.error('❌ Erro ao fazer login', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na autenticação',
      };
    }
  }

  /**
   * Registro de novo usuário
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      logger.info('📝 Iniciando registro', { email: data.email });

      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        throw new Error('Todos os campos são obrigatórios');
      }

      if (data.password.length < 8) {
        throw new Error('Senha deve ter no mínimo 8 caracteres');
      }

      if (data.password !== data.password) {
        throw new Error('Senhas não conferem');
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('❌ Erro no registro', {
          status: response.status,
          error: result.error,
        });
        return {
          success: false,
          error: result.error || 'Erro ao registrar',
        };
      }

      logger.success('✅ Registro bem-sucedido', {
        email: result.user?.email,
      });

      return {
        success: true,
        user: result.user,
        message: 'Registro realizado com sucesso',
        requiresEmailVerification: result.requiresEmailVerification,
      };
    } catch (error) {
      logger.error('❌ Erro ao registrar usuário', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no registro',
      };
    }
  }

  /**
   * Faz logout
   */
  async logout(): Promise<void> {
    try {
      logger.info('👋 Fazendo logout');

      const token = this.getAccessToken();
      if (token) {
        try {
          const apiUrl = getApiUrl();
          await fetch(`${apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          logger.warn('⚠️ Aviso ao fazer logout no servidor', error);
        }
      }

      this.clearSession();
      logger.success('✅ Logout realizado');
    } catch (error) {
      logger.error('❌ Erro ao fazer logout', error);
      this.clearSession();
    }
  }

  /**
   * Renova o token de acesso
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        logger.warn('⚠️ Nenhum refresh token disponível');
        return false;
      }

      logger.info('🔄 Renovando token');

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('❌ Erro ao renovar token', {
          status: response.status,
        });
        this.clearSession();
        return false;
      }

      const newToken = data.token;

      if (this.currentSession) {
        this.currentSession.token = newToken;
        this.scheduleTokenRefresh(newToken);
        this.saveSessionToStorage();

        logger.success('✅ Token renovado com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Erro ao renovar token', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Obtém a sessão atual
   */
  getSession(): AuthSession | null {
    if (this.currentSession && !this.isTokenExpired()) {
      return this.currentSession;
    }

    return null;
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentSession?.user || null;
  }

  /**
   * Obtém o token de acesso
   */
  getAccessToken(): string | null {
    return this.currentSession?.token.accessToken || null;
  }

  /**
   * Obtém o refresh token
   */
  getRefreshToken(): string | null {
    return this.currentSession?.token.refreshToken || null;
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    return (
      !!this.currentSession?.isAuthenticated &&
      !this.isTokenExpired()
    );
  }

  /**
   * Verifica se é super admin
   */
  isSuperAdmin(): boolean {
    return this.currentSession?.user?.isSuperAdmin ?? false;
  }

  /**
   * Verifica permissão específica
   */
  hasPermission(permission: string): boolean {
    return (
      this.currentSession?.user?.permissions?.includes(permission) ?? false
    );
  }

  /**
   * Verifica papel específico
   */
  hasRole(role: UserRole): boolean {
    return this.currentSession?.user?.role === role;
  }

  /**
   * Atualiza o perfil do usuário
   */
  async updateProfile(data: Partial<User>): Promise<boolean> {
    try {
      logger.info('📝 Atualizando perfil do usuário');

      const token = this.getAccessToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
      }

      const result = await response.json();

      if (this.currentSession) {
        this.currentSession.user = result.user;
        this.saveSessionToStorage();

        logger.success('✅ Perfil atualizado com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Erro ao atualizar perfil', error);
      return false;
    }
  }

  /**
   * Obtém URL de autorização do Google
   */
  getGoogleAuthUrl(config: GoogleAuthConfig): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Agenda a renovação automática do token
   */
  private scheduleTokenRefresh(token: AuthToken): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Renovar 5 minutos antes da expiração
    const timeUntilRefresh = token.expiresAt - Date.now() - 5 * 60 * 1000;

    if (timeUntilRefresh > 0) {
      this.tokenRefreshTimer = setTimeout(async () => {
        logger.info('⏰ Renovando token automaticamente');
        await this.refreshToken();
      }, timeUntilRefresh);
    }
  }

  /**
   * Verifica se token está expirado
   */
  private isTokenExpired(): boolean {
    if (!this.currentSession?.token) {
      return true;
    }

    const bufferMs = 60 * 1000; // 1 minuto de buffer
    return Date.now() + bufferMs > this.currentSession.token.expiresAt;
  }

  /**
   * Salva sessão no localStorage
   */
  private saveSessionToStorage(): void {
    try {
      if (this.currentSession) {
        localStorage.setItem(
          STORAGE_KEY_SESSION,
          JSON.stringify(this.currentSession)
        );
        localStorage.setItem(
          STORAGE_KEY_TOKEN,
          this.currentSession.token.accessToken
        );
        if (this.currentSession.token.refreshToken) {
          localStorage.setItem(
            STORAGE_KEY_REFRESH,
            this.currentSession.token.refreshToken
          );
        }
      }
    } catch (error) {
      logger.warn('⚠️ Erro ao salvar sessão no localStorage', error);
    }
  }

  /**
   * Carrega sessão do localStorage
   */
  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION);
      if (stored) {
        this.currentSession = JSON.parse(stored);

        // Verificar expiração
        if (this.isTokenExpired()) {
          logger.info('🔄 Token expirado, tentando renovar');
          this.refreshToken();
        } else {
          this.scheduleTokenRefresh(this.currentSession!.token);
        }
      }
    } catch (error) {
      logger.warn('⚠️ Erro ao carregar sessão do localStorage', error);
    }
  }

  /**
   * Limpa a sessão
   */
  private clearSession(): void {
    this.currentSession = null;

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
    } catch (error) {
      logger.warn('⚠️ Erro ao limpar localStorage', error);
    }
  }
}

// Singleton
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}
