/**
 * Página de Login - Autenticação com Gmail e Email/Senha
 */

import React, { useState, useEffect } from 'react';
import { getAuthService } from '../services/auth/auth.service';
import { logger } from '../services/utils/logger';
import './LoginPage.css';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginPage: React.FC = () => {
  const authService = getAuthService();

  // Estados
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    rememberMe: !!localStorage.getItem('rememberedEmail'),
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Redireciona se já está autenticado
  useEffect(() => {
    if (authService.isAuthenticated()) {
      logger.info('👤 Usuário já autenticado, redirecionando');
      window.location.href = authService.isSuperAdmin() ? '/dashboard' : '/portfolio';
    }
  }, []);

  // Monitora parâmetro de redirecionamento do Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state === 'google_oauth') {
      logger.info('🔐 Código de autorização do Google recebido');
      handleGoogleCallback(code);
    }
  }, []);

  // Valida formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para callback do Google OAuth
  const handleGoogleCallback = async (code: string) => {
    setGoogleLoading(true);
    setServerError(null);

    try {
      const response = await authService.loginWithGoogle(code);

      if (response.success) {
        logger.success('✅ Login Google bem-sucedido', {
          email: response.user?.email,
        });

        // Limpar parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);

        setTimeout(() => {
          const destination = authService.isSuperAdmin() ? '/dashboard' : '/portfolio';
          window.location.href = destination;
        }, 1500);
      } else {
        setServerError(response.error || 'Erro ao fazer login com Google');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setServerError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handler para login com email
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const response = await authService.loginWithEmail(
        formData.email,
        formData.password
      );

      if (response.success) {
        // Salvar email se "lembrar-me" está ativado
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        logger.success('✅ Login bem-sucedido', {
          email: response.user?.email,
        });

        setTimeout(() => {
          const destination = authService.isSuperAdmin() ? '/dashboard' : '/portfolio';
          window.location.href = destination;
        }, 1500);
      } else {
        setServerError(response.error || 'Erro na autenticação');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handler para iniciar login com Google
  const handleGoogleLogin = () => {
    setGoogleLoading(true);

    try {
      const config = {
        clientId: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/login`,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/photoslibrary.readonly',
          'https://www.googleapis.com/auth/photoslibrary.edit.appsource',
        ],
      };

      if (!config.clientId) {
        throw new Error('Client ID do Google não configurado');
      }

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'token', // Alterado para token (Implicit Flow) para evitar CORS
        scope: config.scopes.join(' '),
        state: 'google_oauth',
        prompt: 'consent',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      window.location.href = authUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao iniciar login';
      setServerError(message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <i className="bi bi-building"></i>
            </div>
            <h1>Gridd360 Asset Manager</h1>
            <p>Acesse sua conta</p>
          </div>

          <div className="login-body">
            {/* Mensagem de erro */}
            {serverError && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-circle me-2"></i>
                {serverError}
              </div>
            )}

            {/* Formulário de Email */}
            <form onSubmit={handleEmailLogin}>
              {/* Email */}
              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              {/* Senha */}
              <div className="form-group mb-3">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={loading}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}
              </div>

              {/* Lembrar-me */}
              <div className="form-group mb-4">
                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData({ ...formData, rememberMe: e.target.checked })
                    }
                    disabled={loading}
                  />
                  <span className="form-check-label">Lembrar meu email</span>
                </label>
              </div>

              {/* Botão de Login */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Conectando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Links */}
            <div className="text-center">
              <a href="/forgot-password" disabled className="text-muted small">
                Esqueceu a senha?
              </a>
            </div>

            {/* Rodapé de Informação */}
            <p className="text-muted small text-center mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Acesso restrito para administradores e colaboradores autorizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
