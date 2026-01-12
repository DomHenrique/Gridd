import React, { useState, useEffect } from 'react';
import { BRAND } from '../constants';
import { User, ActivityLog, FileAsset } from '../types';
import UploadModalComponent from '../components/UploadModalComponent';
import { GoogleConfigSection } from '../components/GoogleConfigSection';
import { PhotosManager } from './PhotosManager';
import { getAuthService } from '../services/google-photos/auth/auth.service';
import { ProfileSection } from '../components/ProfileSection';
import { SessionSecurityManager } from '../components/SessionSecurityManager';
import { UserManagement } from '../components/UserManagement';
import { FolderExplorer } from '../components/FolderExplorer';
import { ActivityReports } from '../components/ActivityReports';
import { DataService } from '../services/dataService';
import { logger } from '../services/utils/logger';
import { supabase } from '../services/supabase';

interface DashboardPageProps {
  currentUser: User | null;
  onLogout: () => void;
  onUpload?: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onLogout, onUpload }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);
  const [uploadInitialSource, setUploadInitialSource] = useState<'local' | 'google'>('local');
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // States for real data
  const [stats, setStats] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileAsset[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);

  // Fetch real data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardStats, logs] = await Promise.all([
          DataService.getDashboardStats(),
          DataService.getLogs()
        ]);
        
        setStats(dashboardStats);
        setRecentActivities(logs.slice(0, 5));
        setLoading(false);
      } catch (error) {
        logger.error('Erro ao carregar dados do dashboard', error);
        setLoading(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown')) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    fetchDashboardData();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUser, profileMenuOpen]);

  return (
    <SessionSecurityManager 
      currentUser={currentUser} 
      onLogout={onLogout}
    >
      <div className="d-flex h-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Sidebar */}
      <nav
        className={`bg-white border-end transition-all ${sidebarOpen ? 'w-250' : 'w-80'}`}
        style={{
          width: sidebarOpen ? '280px' : '80px',
          overflow: 'hidden',
          transition: 'width 0.3s ease',
        }}
      >
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          {sidebarOpen && (
            <h6 className="mb-0 fw-bold">Menu</h6>
          )}
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Recolher Menu" : "Expandir Menu"}
          >
            <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
          </button>
        </div>

        <ul className="list-unstyled p-3 m-0">
          {[
            { id: 'files', icon: 'bi-house-fill', label: 'Início', active: activeTab === 'files' },
            { id: 'assets', icon: 'bi-file-earmark', label: 'Meus Arquivos', active: activeTab === 'assets' },
            { id: 'favorites', icon: 'bi-star-fill', label: 'Favoritos', active: activeTab === 'favorites' },
            { id: 'shared', icon: 'bi-share-fill', label: 'Compartilhados', active: activeTab === 'shared' },
            { id: 'management', icon: 'bi-people-fill', label: 'Gerenciar Usuários', active: activeTab === 'management', adminOnly: true },
            { id: 'reports', icon: 'bi-file-earmark-bar-graph', label: 'Relatórios', active: activeTab === 'reports', adminOnly: true },
            { id: 'photos', icon: 'bi-google', label: 'Google Photos', active: activeTab === 'photos', adminOnly: true },
          ].map((item, idx) => {
            // Check if user has permission for this item
            if (item.adminOnly && currentUser?.role !== 'superuser') return null;

            return (
              <li key={idx} className="mb-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }}
                  className={`btn btn-ghost w-100 text-start p-2 text-decoration-none d-flex align-items-center gap-2`}
                  style={{
                    color: item.active ? BRAND.primaryColor : '#666',
                    backgroundColor: item.active ? `${BRAND.primaryColor}10` : 'transparent',
                    borderRadius: '8px',
                  }}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {sidebarOpen && <span>{item.label}</span>}
                </a>
              </li>
            );
          })}
        </ul>

        <hr className="my-3" />

        <ul className="list-unstyled p-3 m-0">
          {[
            { icon: 'bi-question-circle', label: 'Ajuda' },
          ].map((item, idx) => (
            <li key={idx} className="mb-2">
              <a
                href="#"
                className="btn btn-ghost w-100 text-start p-2 text-decoration-none d-flex align-items-center gap-2"
                style={{ color: '#666', borderRadius: '8px' }}
              >
                <i className={`bi ${item.icon}`}></i>
                {sidebarOpen && <span>{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>

        <div className="p-3 mt-4 border-top">
          <button
            className="btn w-100 text-danger text-start p-2 d-flex align-items-center gap-2"
            onClick={onLogout}
          >
            <i className="bi bi-box-arrow-left"></i>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden' }}>
        {/* Top Bar */}
        <div className="bg-white border-bottom px-5 py-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <div className="flex-grow-1">
              <h5 className="mb-0 fw-bold">Bem-vindo, {currentUser?.name}!</h5>
              <small className="text-secondary">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <span className="input-group-text border-0" style={{ backgroundColor: '#f8f9fa' }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0"
                  placeholder="Pesquisar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>

              <button
                className="btn text-white fw-bold"
                style={{ backgroundColor: BRAND.primaryColor }}
                onClick={async () => {
                  // Se estiver na aba de fotos do Google, mantém o comportamento atual
                  if (activeTab === 'photos') {
                    try {
                      const googleAuth = getAuthService();
                      if (!googleAuth.isAuthenticated()) {
                        const confirmLogin = window.confirm(
                          "Para acessar seu Google Photos, você precisa estar conectado.\n\nDeseja conectar agora?"
                        );
                        if (confirmLogin) {
                          window.location.href = await googleAuth.getAuthorizationUrl();
                        }
                        return;
                      }
                      setActiveTab('photos');
                    } catch (e) {
                      console.error("Google Auth Check Failed", e);
                    }
                  } else {
                    // Para outras abas, abre o upload local na raiz por padrão
                    setUploadTargetFolderId(null);
                    setUploadModalOpen(true);
                  }
                }}
              >
                <i className="bi bi-cloud-upload me-2"></i>Enviar
              </button>

              <div className="dropdown position-relative">
                <button
                  className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  style={{ width: '40px', height: '40px' }}
                  title="Menu do Perfil"
                >
                  <i className="bi bi-person-fill"></i>
                </button>
                
                {profileMenuOpen && (
                  <ul 
                    className="dropdown-menu dropdown-menu-end show" 
                    style={{ 
                      position: 'absolute', 
                      right: 0, 
                      top: '100%', 
                      display: 'block',
                      zIndex: 1000,
                      minWidth: '200px',
                      marginTop: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #eee'
                    }}
                  >
                    <li>
                      <a 
                        className="dropdown-item py-2 d-flex align-items-center gap-2" 
                        href="#" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          setActiveTab('profile'); 
                          setProfileMenuOpen(false); 
                        }}
                      >
                        <i className="bi bi-person"></i> Meu Perfil
                      </a>
                    </li>
                    <li>
                      <a 
                        className="dropdown-item py-2 d-flex align-items-center gap-2" 
                        href="#" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          setActiveTab('profile'); 
                          setProfileMenuOpen(false); 
                        }}
                      >
                        <i className="bi bi-gear"></i> Configurações
                      </a>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a 
                        className="dropdown-item text-danger py-2 d-flex align-items-center gap-2" 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          onLogout();
                        }}
                      >
                        <i className="bi bi-box-arrow-left"></i> Sair
                      </a>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow-1 overflow-auto p-5">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="row mb-4 g-3">
                {stats.map((stat, idx) => (
                  <div key={idx} className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <small className="text-secondary d-block mb-2">{stat.label}</small>
                            <h4 className="mb-0 fw-bold">{stat.value}</h4>
                          </div>
                          <div className="rounded-circle p-3" style={{ backgroundColor: `${stat.color}20` }}>
                            <i className={`bi ${stat.icon}`} style={{ fontSize: '1.5rem', color: stat.color }}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                  >
                    <i className="bi bi-file-earmark me-2"></i>Arquivos Recentes
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <i className="bi bi-clock-history me-2"></i>Atividades Recentes
                  </button>
                </li>
                {currentUser?.role === 'superuser' && (
                  <>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'photos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('photos')}
                      >
                        <i className="bi bi-google me-2"></i>Google Photos
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'management' ? 'active' : ''}`}
                        onClick={() => setActiveTab('management')}
                      >
                        <i className="bi bi-people me-2"></i>Usuários
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                      >
                        <i className="bi bi-file-earmark-bar-graph me-2"></i>Relatórios
                      </button>
                    </li>
                  </>
                )}
              </ul>

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th className="px-4 py-3 fw-bold">Nome</th>
                            <th className="px-4 py-3 fw-bold">Tamanho</th>
                            <th className="px-4 py-3 fw-bold">Modificado</th>
                            <th className="px-4 py-3 fw-bold text-end">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentFiles.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5 text-secondary">
                                <i className="bi bi-inbox d-block mb-2" style={{ fontSize: '2rem' }}></i>
                                Nenhum arquivo recente encontrado.
                              </td>
                            </tr>
                          ) : (
                            recentFiles.map((file) => (
                              <tr key={file.id}>
                                <td className="px-4 py-3">
                                  <div className="d-flex align-items-center gap-3">
                                    <i className={`bi bi-file-earmark-image`} style={{ fontSize: '1.5rem', color: BRAND.primaryColor }}></i>
                                    <span className="fw-500">{file.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">{file.size}</td>
                                <td className="px-4 py-3">{new Date(file.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-end">
                                  <button className="btn btn-sm btn-ghost me-2">
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  <button className="btn btn-sm btn-ghost me-2">
                                    <i className="bi bi-download"></i>
                                  </button>
                                  <div className="dropdown d-inline">
                                    <button className="btn btn-sm btn-ghost" data-bs-toggle="dropdown" title="Mais Ações">
                                      <i className="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                      <li><a className="dropdown-item" href="#">Compartilhar</a></li>
                                      <li><a className="dropdown-item" href="#">Renomear</a></li>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li><a className="dropdown-item text-danger" href="#">Deletar</a></li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="timeline">
                      {recentActivities.length === 0 ? (
                        <p className="text-center py-5 text-secondary">Nenhuma atividade registrada.</p>
                      ) : (
                        recentActivities.map((activity, idx) => (
                          <div key={activity.id} className="d-flex gap-3 mb-4">
                            <div>
                              <div
                                className="rounded-circle p-3 d-flex align-items-center justify-content-center"
                                style={{
                                  backgroundColor: `${BRAND.primaryColor}20`,
                                  width: '50px',
                                  height: '50px',
                                  minWidth: '50px',
                                }}
                              >
                                <i className={`bi bi-${activity.action === 'UPLOAD' ? 'cloud-upload' : activity.action === 'CREATE_FOLDER' ? 'folder-plus' : activity.action === 'DELETE' ? 'trash' : 'info-circle'}`} style={{ color: BRAND.primaryColor }}></i>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1 fw-bold">{activity.action}</h6>
                              <p className="mb-1 text-secondary">{activity.targetName}</p>
                              <small className="text-secondary">{new Date(activity.timestamp).toLocaleString('pt-BR')}</small>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* User Management Tab */}
              {activeTab === 'management' && currentUser?.role === 'superuser' && (
                <UserManagement currentUser={currentUser} />
              )}

              {/* Activity Reports Tab */}
              {activeTab === 'reports' && currentUser?.role === 'superuser' && (
                <ActivityReports currentUser={currentUser} />
              )}

              {/* Assets & Shared Tab */}
              {(activeTab === 'assets' || activeTab === 'shared') && currentUser && (
                <FolderExplorer 
                  currentUser={currentUser} 
                  onUploadClick={(folderId) => {
                    setUploadTargetFolderId(folderId);
                    setUploadModalOpen(true);
                  }}
                />
              )}

              {/* Google Photos Tab */}
              {activeTab === 'photos' && currentUser?.role === 'superuser' && (
                <PhotosManager 
                  onImport={() => {
                    // Abrir modal com fonte Google pré-selecionada
                    setUploadTargetFolderId(null);
                    setUploadInitialSource('google');
                    setUploadModalOpen(true);
                  }}
                />
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <ProfileSection 
                  currentUser={currentUser}
                  onLogout={onLogout}
                />
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .btn-ghost {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
        }
        .btn-ghost:hover {
          background-color: #f8f9fa;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .fw-500 {
          font-weight: 500;
        }
      `}</style>

      {/* Upload Modal */}
      <UploadModalComponent 
        isOpen={uploadModalOpen}
        onClose={() => {
            setUploadModalOpen(false);
            setUploadInitialSource('local'); // Reset default
        }}
        currentUser={currentUser}
        targetFolderId={uploadTargetFolderId}
        initialSource={uploadInitialSource}
        onSuccess={async () => {
            // Recarregar dados do dashboard
            try {
                const [dashboardStats, logs] = await Promise.all([
                    DataService.getDashboardStats(),
                    DataService.getLogs()
                ]);
                setStats(dashboardStats);
                setRecentActivities(logs.slice(0, 5));
            } catch (error) {
                console.error("Erro ao atualizar após upload:", error);
            }
        }}
      />
      </div>
    </SessionSecurityManager>
  );
};

export default DashboardPage;
