/**
 * Componente de Rota Protegida
 * Garante que apenas usuários autenticados possam acessar
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingIndicator } from './common/LoadingIndicator';
import { UserRole } from '../services/auth/auth.types';
import { logger } from '../services/utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente de Rota Protegida
 * Renderiza o componente filho apenas se o usuário está autenticado
 * Opcionalmente verifica role ou permissão específica
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Carregando
  if (isLoading) {
    return fallback || <LoadingIndicator message="Verificando autenticação..." />;
  }

  // Não autenticado
  if (!isAuthenticated) {
    logger.warn('🔒 Acesso negado: usuário não autenticado', {
      path: location.pathname,
    });

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar role específica
  if (requiredRole && !hasRole(requiredRole)) {
    logger.warn('🔒 Acesso negado: role insuficiente', {
      required: requiredRole,
      actual: user?.role,
      path: location.pathname,
    });

    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar permissão específica
  if (requiredPermission && !hasPermission(requiredPermission)) {
    logger.warn('🔒 Acesso negado: permissão insuficiente', {
      required: requiredPermission,
      path: location.pathname,
    });

    return <Navigate to="/unauthorized" replace />;
  }

  // Acesso concedido
  logger.info('✅ Acesso concedido', {
    user: user?.email,
    path: location.pathname,
  });

  return <>{children}</>;
};

/**
 * Componente para rota pública que redireciona se já está autenticado
 */
export const PublicRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}> = ({ children, redirectTo = '/dashboard', fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return fallback || <LoadingIndicator message="Verificando status..." />;
  }

  if (isAuthenticated) {
    logger.info('👤 Usuário já autenticado, redirecionando', {
      from: location.pathname,
      to: redirectTo,
    });

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * Componente para rota de super admin apenas
 */
export const SuperAdminRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading, user, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return fallback || <LoadingIndicator message="Verificando permissões..." />;
  }

  if (!isAuthenticated) {
    logger.warn('🔒 Acesso negado: não autenticado (Super Admin)', {
      path: location.pathname,
    });

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin()) {
    logger.warn('🔒 Acesso negado: não é super admin', {
      user: user?.email,
      role: user?.role,
      path: location.pathname,
    });

    return <Navigate to="/unauthorized" replace />;
  }

  logger.info('✅ Acesso de super admin concedido', {
    user: user?.email,
    path: location.pathname,
  });

  return <>{children}</>;
};

export default ProtectedRoute;
