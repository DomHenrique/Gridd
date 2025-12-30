import React, { useState } from 'react';
import { User, Mail, Shield, Settings, ChevronRight, LogOut, Camera } from 'lucide-react';
import { BRAND } from '../constants';
import { User as UserType } from '../types';
import { GoogleConfigSection } from './GoogleConfigSection';

interface ProfileSectionProps {
  currentUser: UserType | null;
  onLogout: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ currentUser, onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5" style={{ backgroundColor: `${BRAND.primaryColor}10` }}></div>
        
        {/* Profile Info Header */}
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={40} />
                </div>
              </div>
              <button className="absolute bottom-1 -right-1 p-1.5 bg-primary text-white rounded-lg shadow-lg hover:scale-110 transition-transform" 
                      style={{ backgroundColor: BRAND.primaryColor }}
                      title="Alterar foto">
                <Camera size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">{currentUser.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Mail size={14} />
              <span>{currentUser.email}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <Shield size={12} />
              {currentUser.role === 'superuser' ? 'Super Administrador' : 'Cliente'}
            </span>
          </div>
        </div>

        {/* Content Tabs/Sections */}
        <div className="border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left Column: Actions */}
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Ações da Conta</h3>
              
              <button className="w-100 flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Editar Perfil</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>

              {currentUser.role === 'superuser' && (
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-100 flex items-center justify-between p-3 rounded-xl transition-all group ${showSettings ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm'}`}
                         style={showSettings ? { backgroundColor: BRAND.primaryColor } : {}}>
                      <Settings size={18} />
                    </div>
                    <span className={`text-sm font-medium ${showSettings ? 'text-primary' : 'text-slate-700'}`}
                          style={showSettings ? { color: BRAND.primaryColor } : {}}>
                      Configurações do Sistema
                    </span>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${showSettings ? 'rotate-90 text-primary' : 'text-slate-300'}`} 
                                style={showSettings ? { color: BRAND.primaryColor } : {}} />
                </button>
              )}

              <button 
                onClick={onLogout}
                className="w-100 flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-white group-hover:shadow-sm">
                    <LogOut size={18} />
                  </div>
                  <span className="text-sm font-medium text-red-600">Sair da Conta</span>
                </div>
                <ChevronRight size={16} className="text-red-200" />
              </button>
            </div>

            {/* Right Column: Info/Summary */}
            <div className="p-6 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Informações Complementares</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 mb-1">Empresa</p>
                  <p className="text-sm font-semibold text-slate-700">Gridd360</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 mb-1">Data de Ingresso</p>
                  <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Settings Section */}
        {showSettings && currentUser.role === 'superuser' && (
          <div className="border-t border-slate-100 p-8 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary text-white rounded-lg" style={{ backgroundColor: BRAND.primaryColor }}>
                <Settings size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Configurações Avançadas</h4>
                <p className="text-xs text-slate-500">Gerencie integrações e parâmetros globais do sistema</p>
              </div>
            </div>
            
            <GoogleConfigSection />
          </div>
        )}
      </div>
    </div>
  );
};
