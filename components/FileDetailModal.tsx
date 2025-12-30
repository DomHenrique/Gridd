import React from 'react';
import { X, Calendar, HardDrive, FileText, User, Tag } from 'lucide-react';
import { FileAsset } from '../types';

interface FileDetailModalProps {
  file: FileAsset | null;
  onClose: () => void;
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Preview Section */}
        <div className="w-full md:w-2/3 bg-gray-100 flex items-center justify-center p-6 relative group">
           {file.type === 'image' ? (
             <img 
               src={file.url} 
               alt={file.name} 
               className="max-w-full max-h-[70vh] object-contain shadow-sm rounded-lg"
             />
           ) : (
             <div className="text-gray-400 flex flex-col items-center">
                <FileText className="w-24 h-24 mb-4" />
                <p>Visualização não disponível</p>
             </div>
           )}
           
           <button 
             onClick={onClose}
             className="absolute top-4 left-4 md:hidden bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
             <div>
                <h3 className="font-display font-bold text-xl text-secondary line-clamp-2 break-words" title={file.name}>
                  {file.name}
                </h3>
                <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase tracking-wide">
                  {file.type}
                </span>
             </div>
             <button 
               onClick={onClose}
               className="hidden md:block text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Metadata Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-secondary">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tamanho</p>
                  <p className="font-medium">{file.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-secondary">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Data de Upload</p>
                  <p className="font-medium">{new Date(file.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-secondary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Enviado por</p>
                  <p className="font-medium">Usuário ID: {file.uploadedBy}</p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {file.note ? (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-2 mb-2 text-yellow-800 font-bold text-sm">
                  <Tag className="w-4 h-4" />
                  Observações
                </div>
                <p className="text-sm text-yellow-900 leading-relaxed">
                  {file.note}
                </p>
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center mt-6">
                <p className="text-xs text-gray-400 italic">Nenhuma observação adicionada a este arquivo.</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 mt-auto">
            <button 
                onClick={() => alert('Funcionalidade de Download seria implementada aqui')} 
                className="w-full bg-secondary hover:bg-secondary-light text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
            >
                Baixar Arquivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
