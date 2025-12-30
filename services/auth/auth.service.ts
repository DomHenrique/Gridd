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
import { getEnvConfig, debugLog } from '../../config/env';
import { supabase } from '../supabase';

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
    logger.info('🔐 Login com Google solicitado - Favor usar fluxo Supabase direto se possível');
    return {
      success: false,
      error: 'Google OAuth via legacy API desativado. Use supabase.auth.signInWithOAuth()',
    };
  }

  /**
   * Login com Email e Senha
   */
  async loginWithEmail(email: string, password: string): Promise<LoginResponse> {
    try {
      logger.info('🔐 Tentando login com email (Supabase)', { email });

      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('❌ Falha na autenticação Supabase', { error: error.message, email });
        return {
          success: false,
          error: error.message || 'Email ou senha incorretos',
        };
      }

      const { user, session } = data;

      // Buscar perfil estendido para pegar o papel (role)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const mappedUser: User = {
        id: user.id,
        email: user.email || '',
        firstName: profile?.full_name?.split(' ')[0] || '',
        lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
        name: profile?.full_name || user.email || '',
        role: (profile?.role as UserRole) || UserRole.CLIENT,
        provider: AuthProvider.LOCAL,
        isSuperAdmin: profile?.role === 'superuser',
        isActive: true,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(),
        picture: profile?.avatar_url,
      };

      const token: AuthToken = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: Date.now() + (session.expires_in * 1000),
        tokenType: 'Bearer',
      };

      this.currentSession = {
        user: mappedUser,
        token,
        isAuthenticated: true,
        provider: AuthProvider.LOCAL,
      };

      this.scheduleTokenRefresh(token);
      this.saveSessionToStorage();

      logger.success('✅ Login Supabase bem-sucedido', {
        email: mappedUser.email,
        role: mappedUser.role,
      });

      return { success: true, user: mappedUser, token };
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
      logger.info('📝 Iniciando registro (Supabase)', { email: data.email });

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
          }
        }
      });

      if (signUpError) throw signUpError;

      return {
        success: true,
        message: 'Registro realizado com sucesso. Verifique seu email se necessário.',
        requiresEmailVerification: true,
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
      logger.info('👋 Fazendo logout (Supabase)');
      await supabase.auth.signOut();
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
      logger.info('🔄 Renovando token (Supabase)');
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        logger.error('❌ Erro ao renovar sessão Supabase', error);
        this.clearSession();
        return false;
      }

      const { session } = data;
      const token: AuthToken = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: Date.now() + (session.expires_in * 1000),
        tokenType: 'Bearer',
      };

      if (this.currentSession) {
        this.currentSession.token = token;
        this.scheduleTokenRefresh(token);
        this.saveSessionToStorage();
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
      logger.info('📝 Atualizando perfil do usuário (Supabase)');

      const user = this.getCurrentUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.name || `${data.firstName} ${data.lastName}`,
          avatar_url: data.picture,
        })
        .eq('id', user.id);

      if (error) throw error;

      if (this.currentSession) {
        this.currentSession.user = { ...this.currentSession.user, ...data };
        this.saveSessionToStorage();
        logger.success('✅ Perfil atualizado');
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
