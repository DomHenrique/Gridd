import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Plus, Trash2, Edit2, Cloud } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: { file: File; note: string }[]) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [pendingFiles, setPendingFiles] = useState<{ file: File; note: string; id: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        file: f,
        note: '',
        id: Math.random().toString(36).substr(2, 9),
      }));
      setPendingFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateNote = (id: string, note: string) => {
    setPendingFiles((prev) => prev.map((f) => (f.id === id ? { ...f, note } : f)));
  };

  const handleSubmit = async () => {
    if (pendingFiles.length === 0) return;
    setIsUploading(true);
    await onUpload(pendingFiles);
    setIsUploading(false);
    setPendingFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary text-white">
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload de Arquivos
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {pendingFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl bg-white">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-gray-500 font-medium mb-4">Arraste fotos ou clique para adicionar</p>
              
              <div className="flex gap-3">
                 <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-light transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Selecionar do PC
                </button>
                <button
                    onClick={() => alert("Simulação: Conectando com API do Google Photos...")}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <Cloud className="w-4 h-4 text-blue-500" /> Google Photos
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-500">Arquivos selecionados ({pendingFiles.length})</span>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                        <Plus className="w-4 h-4" /> Adicionar mais
                    </button>
               </div>
              {pendingFiles.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start animate-fade-in">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <ImageIcon className="text-gray-400 w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">{item.file.name}</h4>
                        <button onClick={() => removeFile(item.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    <div className="relative">
                        <Edit2 className="w-3 h-3 absolute left-2 top-2.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Adicionar anotação/obs..."
                            value={item.note}
                            onChange={(e) => updateNote(item.id, e.target.value)}
                            className="w-full text-sm pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pendingFiles.length === 0 || isUploading}
            className={`px-8 py-2.5 bg-primary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 
                ${pendingFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover transform active:scale-95 transition-all'}
            `}
          >
            {isUploading ? 'Enviando...' : `Enviar ${pendingFiles.length > 0 ? pendingFiles.length : ''} Arquivos`}
          </button>
        </div>
      </div>
    </div>
  );
};
