import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getAuthService } from './services/auth/auth.service';
import { UserRole } from './services/auth/auth.types';
import { initializeSystem } from './services/dbInit';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PortfolioPage from './pages/PortfolioPage';

type AppPage = 'landing' | 'login' | 'dashboard' | 'portfolio' | 'assets';

const AppNew: React.FC = () => {
  const authService = getAuthService();
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync session with Supabase
  useEffect(() => {
    const checkSession = async () => {
      await initializeSystem(); // Initialize DB and Superuser

      const session = authService.getSession();
      if (session && session.user) {
        // ... mappedUser logic ...
        const user = session.user;
        const mappedUser: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role === 'superuser' ? 'superuser' : 'client',
          avatarUrl: user.picture || '',
          permissions: []
        };
        setCurrentUser(mappedUser);
        setCurrentPage(user.isSuperAdmin ? 'dashboard' : 'portfolio');

        // CHECK FOR GOOGLE OAUTH CALLBACK
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const hasHashToken = window.location.hash.includes('access_token=');

        if ((code || hasHashToken) && user.role === 'superuser') {
          console.log('[App] Detectado retorno do Google OAuth. Processando...');
          try {
            const { getAuthService: getGoogleAuth } = await import('./services/google-photos');
            const googleAuth = getGoogleAuth();
            
            if (hasHashToken) {
              await googleAuth.handleAuthCallback();
            } else if (code) {
              await googleAuth.exchangeCodeForToken(code);
            }
            
            console.log('[App] Conexão com Google Photos estabelecida com sucesso!');
            // Limpar a URL (query e fragmento) sem recarregar a página
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error('[App] Erro ao processar retorno do Google:', error);
          }
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = async (email: string) => {
    // Note: LoginPage now handles its own login via authService and reloads.
    // This function is kept for compatibility but should be migrated if SPA flow is preferred.
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleNavigateToPortfolio = () => {
    setCurrentPage('portfolio');
  };

  const handleBackToHome = () => {
    if (currentUser) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('landing');
    }
  };

  const handleUpload = () => {
    // TODO: Implement upload modal
    console.log('Upload initiated');
  };

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  // Render different pages based on current state
  if (!currentUser) {
    return currentPage === 'landing' ? (
      <LandingPage 
        onNavigateToLogin={() => setCurrentPage('login')}
        onNavigateToPortfolio={handleNavigateToPortfolio}
      />
    ) : currentPage === 'portfolio' ? (
      <PortfolioPage 
        onBack={handleBackToHome}
      />
    ) : (
      <LoginPage 
        onLogin={handleLogin}
        isLoading={isLoading}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // Logged in - show dashboard or portfolio
  if (currentPage === 'portfolio') {
    return (
      <PortfolioPage 
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <DashboardPage
      currentUser={currentUser}
      onLogout={handleLogout}
      onUpload={handleUpload}
    />
  );
};

export default AppNew;
