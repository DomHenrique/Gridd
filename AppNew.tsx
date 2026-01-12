import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { getAuthService } from './services/auth/auth.service';
import { UserRole } from './services/auth/auth.types';
import { initializeSystem } from './services/dbInit';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PortfolioPage from './pages/PortfolioPage';

const AppNew: React.FC = () => {
  const authService = getAuthService();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync session with Supabase
  useEffect(() => {
    const checkSession = async () => {
      await initializeSystem();

      const session = authService.getSession();
      if (session && session.user) {
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

        // CHECK FOR GOOGLE OAUTH CALLBACK
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const hasHashToken = window.location.hash.includes('access_token=');

        if ((code || hasHashToken) && user.role === 'superuser') {
          try {
            const { getAuthService: getGoogleAuth } = await import('./services/google-photos');
            const googleAuth = getGoogleAuth();
            
            if (hasHashToken) {
              await googleAuth.handleAuthCallback();
            } else if (code) {
              await googleAuth.exchangeCodeForToken(code);
            }
            
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error: any) {
            console.error('[App] Erro crítico ao processar retorno do Google:', error.message || error);
          }
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    window.location.href = '/';
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

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/servicos" element={<LandingPage />} />
        <Route path="/planos" element={<LandingPage />} />
        <Route path="/portfolio" element={<PortfolioPage onBack={() => window.location.href = '/'} />} />
        <Route path="/login" element={
          currentUser ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage 
              onLogin={() => {}} 
              isLoading={false} 
              onBackToHome={() => window.location.href = '/'} 
            />
          )
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          currentUser ? (
            <DashboardPage
              currentUser={currentUser}
              onLogout={handleLogout}
              onUpload={() => console.log('Upload')}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppNew;
