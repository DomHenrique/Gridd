import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Key, Globe, Lock, ArrowRight, ArrowLeft, Timer, Terminal, AlertTriangle } from 'lucide-react';
import { BRAND } from '../constants';
import { useSession } from '../context/SessionContext';
import { getAuthService, getConfigurationStatus, updateConfig, getConfig } from '../services/google-photos';

export const GoogleConfigSection: React.FC = () => {
  const { timeLeft } = useSession();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState(getConfigurationStatus());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Local form state
  const [formData, setFormData] = useState({
    clientId: getConfig().clientId || '',
    clientSecret: getConfig().clientSecret || '',
    redirectUri: getConfig().redirectUri || 'http://localhost:5173/auth/callback'
  });

  const envValues = {
    clientId: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: (import.meta as any).env.VITE_GOOGLE_CLIENT_SECRET || '',
    redirectUri: (import.meta as any).env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback'
  };

  useEffect(() => {
    const auth = getAuthService();
    setIsAuthenticated(auth.isAuthenticated());
    if (auth.isAuthenticated()) {
        setStep(3);
    }
    
    addLog('Fluxo de configuração inicializado.');
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleUpdateRuntimeConfig = () => {
    updateConfig({
      clientId: formData.clientId,
      clientSecret: formData.clientSecret,
      redirectUri: formData.redirectUri
    });
    setStatus(getConfigurationStatus());
    addLog('Configuração em tempo de execução atualizada.');
    setStep(2);
  };

  const handleConnect = () => {
    addLog('Iniciando conexão com Google...');
    const auth = getAuthService();
    const url = auth.getAuthorizationUrl();
    
    setTimeout(() => {
        window.location.href = url;
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Session Monitor Area */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Timer size={20} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">Segurança da Sessão</p>
                <p className="text-xs text-slate-600 m-0">Suspensão automática em 1 min de inatividade. Logout em 10 min.</p>
            </div>
        </div>
        <div className="text-right">
            <span className="text-xl font-mono font-bold text-slate-800">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <p className="text-[9px] text-slate-400 m-0 italic">Tempo total restante</p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="flex justify-between items-center mb-8 px-4">
        <WizardStep num={1} label="Credenciais" active={step === 1} done={step > 1} />
        <div className="flex-grow h-px bg-slate-200 mx-4 mt-[-10px]"></div>
        <WizardStep num={2} label="Conexão" active={step === 2} done={step > 2} />
        <div className="flex-grow h-px bg-slate-200 mx-4 mt-[-10px]"></div>
        <WizardStep num={3} label="Status" active={step === 3} done={step >= 3 && isAuthenticated} />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Main Step Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {step === 1 && <><Key size={20} className="text-primary" style={{ color: BRAND.primaryColor }} /> Passo 1: Credenciais da API</>}
                    {step === 2 && <><Globe size={20} className="text-primary" style={{ color: BRAND.primaryColor }} /> Passo 2: Vincular Conta</>}
                    {step === 3 && <><ShieldCheck size={20} className="text-green-600" /> Integração Ativa</>}
                </h3>
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <InputField 
                                label="Google Client ID" 
                                value={formData.clientId}
                                onChange={(val) => setFormData({...formData, clientId: val})}
                                placeholder={envValues.clientId || "82736....apps.googleusercontent.com"}
                                description="Obtenha no Google Cloud Console > Credenciais"
                                envValue={envValues.clientId}
                                onUseEnv={() => setFormData({...formData, clientId: envValues.clientId})}
                            />
                            <InputField 
                                label="Google Client Secret" 
                                type="password"
                                value={formData.clientSecret}
                                onChange={(val) => setFormData({...formData, clientSecret: val})}
                                placeholder={envValues.clientSecret ? "********" : "GOCSPX-..."}
                                description="Mantenha em segredo"
                                envValue={envValues.clientSecret}
                                onUseEnv={() => setFormData({...formData, clientSecret: envValues.clientSecret})}
                            />
                            <InputField 
                                label="URI de Redirecionamento" 
                                value={formData.redirectUri}
                                onChange={(val) => setFormData({...formData, redirectUri: val})}
                                placeholder={envValues.redirectUri || "http://localhost:5173/auth/callback"}
                                description="Deve ser idêntica à configurada no Google Console"
                                envValue={envValues.redirectUri}
                                onUseEnv={() => setFormData({...formData, redirectUri: envValues.redirectUri})}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                onClick={handleUpdateRuntimeConfig}
                                disabled={!formData.clientId || !formData.clientSecret}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                                style={{ backgroundColor: BRAND.primaryColor }}
                            >
                                Salvar e Continuar <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${BRAND.primaryColor}15`, color: BRAND.primaryColor }}>
                            <Lock size={40} />
                        </div>
                        <div className="max-w-md mx-auto">
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Conectar ao Google</h4>
                            <p className="text-slate-500 text-sm mb-8">
                                Clique no botão abaixo para autorizar o Gridd360 a acessar sua biblioteca do Google Photos. 
                                Você será redirecionado para a tela de login do Google.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleConnect}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors shadow-xl"
                                >
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                    Vincular Conta Google
                                </button>
                                <button 
                                    onClick={() => setStep(1)}
                                    className="text-slate-400 text-xs font-semibold hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                                >
                                    <ArrowLeft size={12} /> Voltar para credenciais
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="p-6 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800">Parabéns! O sistema está conectado.</h4>
                                <p className="text-sm text-green-700/80">O Super Usuário agora é o proprietário oficial do drive geral da aplicação.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Status da API</p>
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Operacional
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Sincronização</p>
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    Ativa
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                            <button 
                                onClick={() => setStep(1)}
                                className="text-slate-400 text-xs font-semibold hover:text-slate-600 transition-colors"
                            >
                                Editar Credenciais
                            </button>
                            <button 
                                onClick={() => setIsAuthenticated(false)} // Force logout/reconnect
                                className="text-red-400 text-xs font-semibold hover:text-red-600 transition-colors"
                            >
                                Desvincular Conta
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Console / Status Side Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl h-full flex flex-col">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={14} /> Console de Integração
            </h4>
            
            <div className="flex-grow font-mono text-[10px] space-y-2 overflow-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-400 flex gap-2">
                   <span className="text-primary opacity-50 shrink-0" style={{ color: BRAND.primaryColor }}>{log.split(' ')[0]}</span>
                   <span className="break-all">{log.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
              <div className="text-slate-600 italic">-- Aguardando comandos --</div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Credenciais .env</span>
                    <span className={`font-bold ${status.isConfigured ? 'text-green-500' : 'text-amber-500'}`}>
                        {status.isConfigured ? 'Detectadas' : 'Não Detectadas'}
                    </span>
                </div>
                {!status.isConfigured && (
                    <p className="text-[9px] text-amber-500/80 leading-relaxed">
                        <AlertTriangle size={10} className="inline mr-1" />
                        Lembre-se de salvar permanentemente no seu arquivo .env para que as configurações persistam após o restart.
                    </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponents
const WizardStep: React.FC<{ num: number; label: string; active: boolean; done: boolean }> = ({ num, label, active, done }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
            done ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 
            active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
            'bg-slate-100 text-slate-400'
        }`} style={active && !done ? { backgroundColor: BRAND.primaryColor } : {}}>
            {done ? <CheckCircle2 size={20} /> : num}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
);

const InputField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder: string; 
    description?: string; 
    type?: string;
    envValue?: string;
    onUseEnv?: () => void;
}> = ({ label, value, onChange, placeholder, description, type = 'text', envValue, onUseEnv }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 ml-1 flex justify-between">
            {label}
            {envValue && value !== envValue && (
                <button 
                    onClick={onUseEnv}
                    className="text-[9px] text-primary hover:underline"
                    style={{ color: BRAND.primaryColor }}
                >
                    Usar valor do ambiente
                </button>
            )}
        </label>
        <input 
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder={placeholder}
        />
        {description && <p className="text-[10px] text-slate-400 ml-1">{description}</p>}
    </div>
);
