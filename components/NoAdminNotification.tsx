import React from 'react';

const NoAdminNotification: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
                <div className="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-accent">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Configuração Inicial Necessária</h2>
                <p className="text-gray-400 mb-6">
                    Nenhum administrador foi detectado no sistema. Por razões de segurança, a aplicação não pode ser iniciada até que o primeiro administrador seja criado.
                </p>

                <div className="bg-slate-800/50 rounded-xl p-4 text-left mb-6 font-mono text-xs border border-slate-700">
                    <p className="text-gray-500 mb-2">Execute o seguinte comando no terminal do servidor:</p>
                    <code className="text-brand-accent block break-all">
                        node scripts/create-super-admin.js
                    </code>
                </div>

                <p className="text-xs text-gray-500">
                    Certifique-se de que as variáveis <span className="text-gray-300">SUPER_ADMIN_...</span> estejam configuradas no arquivo <span className="text-gray-300">.env</span>.
                </p>
                
                 <button 
                    onClick={() => window.location.reload()} 
                    className="mt-6 w-full bg-slate-700 hover:bg-white hover:text-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all"
                >
                    Verificar Novamente
                </button>
            </div>
        </div>
    );
};

export default NoAdminNotification;
