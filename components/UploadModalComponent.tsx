import React, { useState, useEffect } from 'react';
import { BRAND } from '../constants';
import { DataService } from '../services/dataService';
import { Folder, User } from '../types';
import { PhotosManager } from '../pages/PhotosManager';
import { MediaItem } from '../services/google-photos';
import { Image, Laptop, Cloud, CheckCircle2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  targetFolderId?: string | null;
  onSuccess?: () => void;
  initialSource?: 'local' | 'google';
}

const UploadModalComponent: React.FC<UploadModalProps> = ({ 
  isOpen,
  onClose,
  currentUser,
  targetFolderId = null,
  onSuccess,
  initialSource = 'local'
}) => {
  const [source, setSource] = useState<'local' | 'google'>(initialSource);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(targetFolderId);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [googleItems, setGoogleItems] = useState<MediaItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
      setSelectedFolderId(targetFolderId);
      setLocalFiles([]);
      setGoogleItems([]);
      setSource(initialSource);
    }
  }, [isOpen, targetFolderId, initialSource]);

  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const data = await DataService.getAllAccessibleFolders();
      setFolders(data);
    } catch (e) {
      console.error("Erro ao carregar pastas:", e);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setLocalFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setLocalFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeLocalFile = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAction = async () => {
    if (!currentUser) return;
    if (!selectedFolderId) {
        alert("Por favor, selecione uma pasta de destino.");
        return;
    }

    setIsUploading(true);
    try {
      if (source === 'local') {
        if (localFiles.length === 0) return;
        const uploadItems = localFiles.map(f => ({ file: f, note: '' }));
        await DataService.uploadFiles(selectedFolderId, uploadItems, currentUser.id);
      } else {
        if (googleItems.length === 0) return;
        await DataService.importGooglePhotos(selectedFolderId, googleItems, currentUser.id);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Erro no processo: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const hasSelection = source === 'local' ? localFiles.length > 0 : googleItems.length > 0;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>

      <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1060 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg overflow-hidden" style={{ borderRadius: '1.25rem' }}>
            
            {/* Header with Source Switcher */}
            <div className="px-4 pt-4 pb-3 border-bottom bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-white rounded-circle shadow-sm">
                        <Cloud size={24} style={{ color: BRAND.primaryColor }} />
                    </div>
                    <div>
                        <h5 className="mb-0 fw-bold">Enviar para o Gridd360</h5>
                        <small className="text-secondary">Selecione a origem e o destino</small>
                    </div>
                </div>
                <button type="button" className="btn-close" onClick={onClose} disabled={isUploading} aria-label="Fechar modal"></button>
              </div>

              <div className="row g-2">
                <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary text-uppercase mb-1">Pasta de Destino</label>
                    <select 
                        className="form-select border-0 shadow-sm"
                        value={selectedFolderId || ''}
                        onChange={(e) => setSelectedFolderId(e.target.value || null)}
                        disabled={loadingFolders || isUploading}
                        style={{ padding: '0.6rem 1rem' }}
                        title="Selecione a pasta de destino"
                        aria-label="Pasta de destino"
                    >
                        <option value="">-- Selecione uma pasta --</option>
                        {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary text-uppercase mb-1">Origem dos Arquivos</label>
                    <div className="d-flex bg-white rounded p-1 shadow-sm">
                        <button 
                            className={`flex-grow-1 btn btn-sm d-flex align-items-center justify-content-center gap-2 border-0 ${source === 'local' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
                            style={source === 'local' ? { backgroundColor: BRAND.primaryColor } : {}}
                            onClick={() => setSource('local')}
                            disabled={isUploading}
                        >
                            <Laptop size={16} /> Meu Computador
                        </button>
                        <button 
                            className={`flex-grow-1 btn btn-sm d-flex align-items-center justify-content-center gap-2 border-0 ${source === 'google' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
                            style={source === 'google' ? { backgroundColor: BRAND.primaryColor } : {}}
                            onClick={() => setSource('google')}
                            disabled={isUploading}
                        >
                            <Image size={16} /> Google Photos
                        </button>
                    </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body p-0" style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
              
              {source === 'local' ? (
                <div className="p-4">
                  <div
                    className="border-2 rounded-4 p-5 text-center mb-4 transition-all"
                    style={{
                      borderColor: isDragActive ? BRAND.primaryColor : '#e2e8f0',
                      borderStyle: 'dashed',
                      backgroundColor: isDragActive ? `${BRAND.primaryColor}08` : '#f8fafc',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Cloud className="d-block mx-auto mb-3 opacity-20" size={64} style={{ color: isDragActive ? BRAND.primaryColor : 'currentColor' }} />
                    <h6 className="fw-bold mb-1">
                      {isDragActive ? 'Solte para importar' : 'Arraste e solte arquivos aqui'}
                    </h6>
                    <p className="text-secondary small mb-0">ou clique para procurar no seu dispositivo</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                      title="Clique ou arraste para selecionar arquivos locais"
                      aria-label="Selecionar arquivos locais"
                    />
                  </div>

                  {localFiles.length > 0 && (
                    <div className="card border-0 bg-light rounded-3 overflow-hidden">
                      <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                        <span className="fw-bold small text-uppercase text-secondary">Arquivos Selecionados</span>
                        <span className="badge rounded-pill bg-primary" style={{ backgroundColor: BRAND.primaryColor }}>{localFiles.length}</span>
                      </div>
                      <div className="list-group list-group-flush max-h-300 overflow-auto no-scrollbar">
                        {localFiles.map((file, index) => (
                          <div key={index} className="list-group-item bg-transparent border-0 px-3 py-2 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2 min-w-0">
                              <Laptop size={14} className="text-secondary" />
                              <span className="small text-truncate d-block">{file.name}</span>
                            </div>
                            <button 
                                className="btn btn-sm btn-link text-danger p-0" 
                                onClick={() => removeLocalFile(index)}
                                aria-label={`Remover ${file.name}`}
                            >
                                <i className="bi bi-x-circle"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-100" style={{ height: '500px' }}>
                    <PhotosManager 
                        isPicker={true} 
                        onSelectionChange={setGoogleItems} 
                    />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-top p-4 gap-3 bg-light">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 fw-bold"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn text-white px-5 fw-bold shadow-sm"
                style={{
                  backgroundColor: BRAND.primaryColor,
                  opacity: (!hasSelection || !selectedFolderId) ? 0.5 : 1,
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem'
                }}
                onClick={handleConfirmAction}
                disabled={!hasSelection || !selectedFolderId || isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="me-2" />
                    Confirmar Envio {hasSelection ? `(${source === 'local' ? localFiles.length : googleItems.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .max-h-300 { max-height: 250px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .transition-all { transition: all 0.2s ease; }
      `}</style>
    </>
  );
};

export default UploadModalComponent;
