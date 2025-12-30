import React, { useState } from 'react';
import { Lock, LogOut, Timer, Key } from 'lucide-react';
import { BRAND } from '../constants';
import { getAuthService } from '../services/auth/auth.service';
import { useSession, SessionProvider } from '../context/SessionContext';

interface SessionSecurityManagerProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: any;
}

const SecurityOverlay: React.FC<{ onLogout: () => void; currentUser: any }> = ({ onLogout, currentUser }) => {
  const { isLocked, setIsLocked, resetTimer } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isLocked) return null;

  const handleUnlock = async () => {
    setError('');
    const auth = getAuthService();
    try {
      const success = await auth.login(currentUser.email, password);
      if (success) {
        setIsLocked(false);
        setPassword('');
        resetTimer();
      } else {
        setError('Senha incorreta. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao validar senha. Verifique sua conexão.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sessão Suspensa</h2>
            <p className="text-sm text-slate-500">
              Você ficou inativo por mais de 1 minuto. Por segurança, digite sua senha para continuar.
            </p>
          </div>

          <div className="space-y-4 pt-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Senha de {currentUser?.name}</label>
              <div className="relative">
                  <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                  <Key size={18} className="absolute right-4 top-3 text-slate-300" />
              </div>
              {error && <p className="text-[10px] text-red-500 ml-1">{error}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleUnlock}
                disabled={!password}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: BRAND.primaryColor }}
              >
                Continuar Sessão
              </button>
              <button 
                onClick={onLogout}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
              >
                <LogOut size={18} /> Sair agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionTimer: React.FC = () => {
    const { timeLeft } = useSession();
    return (
        <div className="fixed bottom-4 right-4 z-[50] flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full border border-slate-200 shadow-sm text-[10px] font-bold text-slate-500">
            <Timer size={12} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : ''} />
            Sessão expira em: <span className={timeLeft < 60 ? 'text-red-600' : 'text-slate-900'}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
        </div>
    );
};

export const SessionSecurityManager: React.FC<SessionSecurityManagerProps> = ({ 
  children, 
  onLogout,
  currentUser 
}) => {
  return (
    <SessionProvider onLogout={onLogout}>
        <SecurityOverlay onLogout={onLogout} currentUser={currentUser} />
        <SessionTimer />
        {children}
    </SessionProvider>
  );
};
