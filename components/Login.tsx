
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(email, password);
    if (!success) {
      setError('Falha no login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-accent/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-gradient-to-tr from-brand-accent to-brand-accent-hover rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-accent/20 rotate-6">
                <span className="font-bold text-white text-3xl">G</span>
            </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            GRIDD <span className="text-brand-accent">Marketing 360</span>
          </h1>
          <p className="text-brand-light mt-2 font-light tracking-wide">Agência Digital & Gestão de Assets</p>
        </div>
        <div className="bg-brand-dark/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-brand-light text-sm font-medium mb-2 ml-1">Email Corporativo</label>
              <input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@agenciacriativa.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-brand-light text-sm font-medium mb-2 ml-1">Senha</label>
              <input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded border border-red-400/20">{error}</p>}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-brand-accent to-brand-accent-hover hover:from-brand-accent-hover hover:to-brand-accent text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-brand-accent/25"
            >
              Acessar Painel
            </button>
          </form>
        </div>
        <p className="text-center text-slate-500 text-xs mt-8">© 2024 GRIDD Marketing 360. Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default Login;
