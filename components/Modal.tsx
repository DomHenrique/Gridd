
import React from 'react';
import { XMarkIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`bg-brand-dark rounded-2xl shadow-2xl p-6 w-full ${maxWidth} border border-slate-700 animate-fade-in-up relative my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-brand-light">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        <div>{children}</div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
