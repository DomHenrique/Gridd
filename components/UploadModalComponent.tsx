import React, { useState } from 'react';
import { BRAND } from '../constants';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (files: File[]) => Promise<void>;
}

const UploadModalComponent: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      if (onUpload) {
        await onUpload(files);
      }
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg">
            {/* Header */}
            <div className="modal-header border-bottom px-4 py-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle p-3"
                  style={{
                    backgroundColor: `${BRAND.primaryColor}20`,
                  }}
                >
                  <i
                    className="bi bi-cloud-upload"
                    style={{
                      fontSize: '1.5rem',
                      color: BRAND.primaryColor,
                    }}
                  ></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Enviar Arquivos</h5>
                  <small className="text-secondary">Arraste ou selecione arquivos</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={isUploading}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              {/* Drop Zone */}
              <div
                className="border-2 rounded p-4 text-center mb-4"
                style={{
                  borderColor: isDragActive ? BRAND.primaryColor : '#dee2e6',
                  borderStyle: 'dashed',
                  backgroundColor: isDragActive ? `${BRAND.primaryColor}10` : '#f8f9fa',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <i
                  className="bi bi-cloud-arrow-up d-block mb-2"
                  style={{
                    fontSize: '3rem',
                    color: isDragActive ? BRAND.primaryColor : '#ccc',
                  }}
                ></i>
                <p className="mb-2 fw-bold">
                  {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui'}
                </p>
                <small className="text-secondary">ou clique para selecionar</small>
                <input
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div>
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-file-earmark me-2"></i>
                    {files.length} arquivo{files.length !== 1 ? 's' : ''} selecionado{files.length !== 1 ? 's' : ''}
                  </h6>
                  <div className="list-group">
                    {files.map((file, index) => (
                      <div key={index} className="list-group-item px-3 py-2 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2 flex-grow-1 min-width-0">
                          <i className="bi bi-file-earmark-text"></i>
                          <div className="flex-grow-1 min-width-0">
                            <small className="d-block text-truncate fw-500">{file.name}</small>
                            <small className="text-secondary">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </small>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => removeFile(index)}
                          disabled={isUploading}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              {files.length === 0 && (
                <div
                  className="alert alert-info mb-0"
                  role="alert"
                >
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    Máximo 100 MB por arquivo. Formatos suportados: PDF, DOC, XLS, PPT, IMG
                  </small>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-top px-4 py-4 gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn text-white fw-bold"
                style={{
                  backgroundColor: BRAND.primaryColor,
                  opacity: files.length === 0 ? 0.5 : 1,
                }}
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Enviar {files.length > 0 ? `(${files.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal.show {
          display: block;
        }
        .border-2 {
          border-width: 2px !important;
        }
        .min-width-0 {
          min-width: 0;
        }
        .fw-500 {
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default UploadModalComponent;
