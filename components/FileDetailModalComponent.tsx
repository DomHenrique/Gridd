import React, { useState } from 'react';
import { BRAND } from '../constants';
import { FileAsset } from '../types';

interface FileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: FileAsset | null;
}

const FileDetailModalComponent: React.FC<FileDetailModalProps> = ({ isOpen, onClose, file }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  if (!isOpen || !file) return null;

  const handleShare = async () => {
    if (!shareEmail) return;
    setIsSharing(true);
    // TODO: Implementar compartilhamento
    setTimeout(() => {
      setIsSharing(false);
      setShareEmail('');
    }, 1000);
  };

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
                    className="bi bi-file-earmark-text"
                    style={{
                      fontSize: '1.5rem',
                      color: BRAND.primaryColor,
                    }}
                  ></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-truncate">{file.name}</h5>
                  <small className="text-secondary">Detalhes do arquivo</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              {/* File Info */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Informações</h6>
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-secondary d-block mb-1">Tamanho</small>
                    <div className="fw-bold">{file.size}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-secondary d-block mb-1">Tipo</small>
                    <div className="fw-bold text-capitalize">{file.fileType}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-secondary d-block mb-1">Criado em</small>
                    <div className="fw-bold">
                      {new Date(file.uploadedDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="col-6">
                    <small className="text-secondary d-block mb-1">Por</small>
                    <div className="fw-bold">{file.uploadedBy}</div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Activity */}
              {file.activityLog && file.activityLog.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Atividade Recente</h6>
                  <div className="timeline">
                    {file.activityLog.slice(0, 3).map((activity, idx) => (
                      <div key={idx} className="d-flex gap-2 mb-3">
                        <div
                          className="rounded-circle p-2"
                          style={{
                            backgroundColor: `${BRAND.primaryColor}20`,
                            minWidth: '40px',
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i
                            className={`bi ${
                              activity === 'viewed'
                                ? 'bi-eye'
                                : activity === 'downloaded'
                                ? 'bi-download'
                                : 'bi-share'
                            }`}
                            style={{ color: BRAND.primaryColor }}
                          ></i>
                        </div>
                        <div>
                          <small className="d-block fw-bold text-capitalize">
                            {activity === 'viewed' ? 'Visualizado' : activity === 'downloaded' ? 'Baixado' : 'Compartilhado'}
                          </small>
                          <small className="text-secondary">Há pouco</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr />

              {/* Share Section */}
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-share-fill me-2"></i>Compartilhar
                </h6>
                <div className="input-group mb-2">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@exemplo.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                  <button
                    className="btn text-white fw-bold"
                    style={{ backgroundColor: BRAND.primaryColor }}
                    onClick={handleShare}
                    disabled={isSharing || !shareEmail}
                  >
                    {isSharing ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-arrow-right"></i>
                    )}
                  </button>
                </div>

                {file.sharedWith && file.sharedWith.length > 0 && (
                  <div className="mt-3">
                    <small className="text-secondary d-block mb-2">Compartilhado com:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {file.sharedWith.map((email, idx) => (
                        <span
                          key={idx}
                          className="badge"
                          style={{
                            backgroundColor: `${BRAND.primaryColor}20`,
                            color: BRAND.primaryColor,
                            padding: '0.5rem 0.75rem',
                          }}
                        >
                          {email}
                          <button
                            className="btn-close btn-sm ms-2 p-0"
                            style={{ opacity: 0.7 }}
                          ></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-top px-4 py-4 gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
              >
                <i className="bi bi-download me-2"></i>Baixar
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
              >
                <i className="bi bi-trash me-2"></i>Deletar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal.show {
          display: block;
        }
      `}</style>
    </>
  );
};

export default FileDetailModalComponent;
