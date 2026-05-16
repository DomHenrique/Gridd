
import React from 'react';
import { User } from '../types';
import { LogOutIcon } from './icons';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-brand-dark shadow-lg border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center transform rotate-3">
                <span className="font-bold text-white text-lg">G</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-white tracking-tight">
            GRIDD <span className="text-brand-accent">Marketing 360</span>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-white font-semibold text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.email}</p>
            </div>
{/* User switcher removed */}
          <button onClick={onLogout} className="p-2 rounded-full text-gray-400 hover:bg-slate-800 hover:text-white transition-colors" title="Sair">
                <LogOutIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
