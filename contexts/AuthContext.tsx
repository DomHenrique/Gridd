/**
 * Contexto de Autenticação
 * Gerencia estado global de autenticação da aplicação
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession, UserRole } from '../services/auth/auth.types';
import { getAuthService } from '../services/auth/auth.service';
import { logger } from '../services/utils/logger';

/**
 * Interface do Contexto de Autenticação
 */
interface AuthContextType {
  // Estado
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Métodos
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (code: string) => Promise<boolean>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;

  // Verificações
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
}

/**
 * Contexto
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de Autenticação
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authService = getAuthService();

  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega sessão ao montar
  useEffect(() => {
    const loadSession = async () => {
      try {
        logger.info('🔄 Carregando sessão de autenticação');

        const storedSession = authService.getSession();

        if (storedSession) {
          setSession(storedSession);
          setUser(storedSession.user);
          logger.success('✅ Sessão carregada', {
            email: storedSession.user.email,
            role: storedSession.user.role,
          });
        } else {
          logger.info('ℹ️ Nenhuma sessão ativa encontrada');
        }
      } catch (err) {
        logger.error('❌ Erro ao carregar sessão', err);
        setError('Erro ao carregar sessão de autenticação');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Handler para login com email
  const handleLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        logger.info('🔐 Tentando fazer login', { email });

        const response = await authService.loginWithEmail(email, password);

        if (response.success && response.user) {
          const currentSession = authService.getSession();
          setSession(currentSession);
          setUser(response.user);

          logger.success('✅ Login bem-sucedido', {
            email: response.user.email,
          });

          return true;
        } else {
          setError(response.error || 'Falha no login');
          logger.error('❌ Falha no login', { error: response.error });
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        logger.error('❌ Erro ao fazer login', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  // Handler para login com Google
  const handleLoginWithGoogle = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        logger.info('🔐 Autenticando com Google');

        const response = await authService.loginWithGoogle(code);

        if (response.success && response.user) {
          const currentSession = authService.getSession();
          setSession(currentSession);
          setUser(response.user);

          logger.success('✅ Login Google bem-sucedido', {
            email: response.user.email,
          });

          return true;
        } else {
          setError(response.error || 'Falha no login com Google');
          logger.error('❌ Falha no login Google', { error: response.error });
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        logger.error('❌ Erro ao fazer login com Google', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  // Handler para registro
  const handleRegister = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        logger.info('📝 Registrando novo usuário', { email: data.email });

        const response = await authService.register(data);

        if (response.success && response.user) {
          logger.success('✅ Registro bem-sucedido', {
            email: response.user.email,
          });

          // Se não requer verificação de email, faz auto-login
          if (!response.requiresEmailVerification) {
            const currentSession = authService.getSession();
            setSession(currentSession);
            setUser(response.user);
          }

          return true;
        } else {
          setError(response.error || 'Falha no registro');
          logger.error('❌ Falha no registro', { error: response.error });
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        logger.error('❌ Erro ao registrar', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  // Handler para logout
  const handleLogout = useCallback(async () => {
    try {
      logger.info('👋 Desconectando');

      await authService.logout();

      setSession(null);
      setUser(null);
      setError(null);

      logger.success('✅ Logout realizado');
    } catch (err) {
      logger.error('❌ Erro ao fazer logout', err);
      // Mesmo se houver erro, limpa o estado localmente
      setSession(null);
      setUser(null);
    }
  }, [authService]);

  // Handler para renovar sessão
  const handleRefreshSession = useCallback(async () => {
    try {
      logger.info('🔄 Renovando sessão');

      const success = await authService.refreshToken();

      if (success) {
        const currentSession = authService.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);

        logger.success('✅ Sessão renovada');
      } else {
        setError('Sessão expirada. Por favor, faça login novamente.');
        handleLogout();
      }
    } catch (err) {
      logger.error('❌ Erro ao renovar sessão', err);
      setError('Erro ao renovar sessão');
      handleLogout();
    }
  }, [authService, handleLogout]);

  // Verifica papel
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  // Verifica permissão
  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

  // Verifica super admin
  const isSuperAdmin = useCallback((): boolean => {
    return user?.isSuperAdmin ?? false;
  }, [user]);

  // Limpa erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Value do contexto
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoading,
    error,
    login: handleLogin,
    loginWithGoogle: handleLoginWithGoogle,
    register: handleRegister,
    logout: handleLogout,
    refreshSession: handleRefreshSession,
    clearError,
    hasRole,
    hasPermission,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default AuthContext;
