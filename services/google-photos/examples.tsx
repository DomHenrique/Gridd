/**
 * Exemplo de Integração Google Photos com a Aplicação
 * Copie e adapte conforme necessário
 */

import React, { useState, useEffect } from 'react';
import {
  initializeGooglePhotos,
  getAuthService,
  getAlbumsService,
  getMediaService,
  getPermissionsService,
} from '@/services/google-photos';
import { GooglePhotosScope, PermissionLevel, ResourceType } from '@/services/google-photos/types';

/**
 * Exemplo de Hook para autenticação
 */
export function useGooglePhotosAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthService();

    // Verificar se já está autenticado
    if (auth.isAuthenticated()) {
      setIsAuthenticated(true);
      // Carregar informações do usuário
      auth.getUserInfo().then(setUserInfo).catch(setError);
    }

    setIsLoading(false);
  }, []);

  const login = async () => {
    try {
      setIsLoading(true);
      const auth = getAuthService();
      const authUrl = auth.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const auth = getAuthService();
      await auth.revokeToken();
      setIsAuthenticated(false);
      setUserInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthenticated, userInfo, isLoading, error, login, logout };
}

/**
 * Exemplo de Hook para gerenciar álbuns
 */
export function useGooglePhotosAlbums() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const albumsService = getAlbumsService();
      const response = await albumsService.listAlbums();
      setAlbums(response.albums || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar álbuns');
    } finally {
      setIsLoading(false);
    }
  };

  const createAlbum = async (title: string, categories?: any[]) => {
    try {
      setIsLoading(true);
      const albumsService = getAlbumsService();
      const newAlbum = await albumsService.createAlbum(title, categories);
      setAlbums([...albums, newAlbum]);
      return newAlbum;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar álbum');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  return { albums, isLoading, error, loadAlbums, createAlbum };
}

/**
 * Exemplo de Hook para fazer upload de mídia
 */
export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    albumId?: string,
    description?: string
  ) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const mediaService = getMediaService();
      const mediaItem = await mediaService.uploadMedia(
        file,
        albumId,
        description,
        (progress) => {
          setUploadProgress(progress.progressPercentage);
        }
      );

      setUploadProgress(100);
      return mediaItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, uploadProgress, error };
}

/**
 * Exemplo de Hook para gerenciar permissões
 */
export function usePermissions(resourceId: string) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const permService = getPermissionsService();
      const folder = permService.getFolder(resourceId);
      if (folder) {
        setPermissions(folder.permissions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const grantPermission = async (
    userId: string,
    permissionLevel: PermissionLevel,
    options?: {
      canCreateSubfolders?: boolean;
      canDeleteContent?: boolean;
      canShareFolder?: boolean;
      expiresAt?: Date;
    }
  ) => {
    try {
      setIsLoading(true);
      const permService = getPermissionsService();
      
      const permission = permService.grantPermission({
        resourceId,
        resourceType: ResourceType.FOLDER,
        userId,
        permissionLevel,
        canCreateSubfolders: options?.canCreateSubfolders,
        canDeleteContent: options?.canDeleteContent,
        canShareFolder: options?.canShareFolder,
        expiresAt: options?.expiresAt,
      });

      setPermissions([...permissions, permission]);
      return permission;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao conceder permissão';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokePermission = async (userId: string) => {
    try {
      setIsLoading(true);
      const permService = getPermissionsService();
      permService.revokePermission(resourceId, userId);
      setPermissions(permissions.filter((p) => p.userId !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao revogar permissão';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [resourceId]);

  return {
    permissions,
    isLoading,
    error,
    grantPermission,
    revokePermission,
    loadPermissions,
  };
}

/**
 * Componente Exemplo: Login Google Photos
 */
export function GooglePhotosLoginButton() {
  const { isAuthenticated, isLoading, login, logout } = useGooglePhotosAuth();

  if (isLoading) {
    return <button className="btn btn-secondary" disabled>Carregando...</button>;
  }

  if (isAuthenticated) {
    return (
      <button className="btn btn-outline-danger" onClick={logout}>
        Desconectar Google Photos
      </button>
    );
  }

  return (
    <button className="btn btn-primary" onClick={login}>
      <i className="bi bi-google"></i> Conectar Google Photos
    </button>
  );
}

/**
 * Componente Exemplo: Gerenciador de Álbuns
 */
export function GooglePhotosAlbumManager() {
  const { albums, isLoading, createAlbum } = useGooglePhotosAlbums();
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  const handleCreateAlbum = async () => {
    if (newAlbumTitle.trim()) {
      await createAlbum(newAlbumTitle, [
        {
          name: 'Campanha',
          subcategories: ['Instagram', 'Facebook', 'LinkedIn'],
        },
        {
          name: 'Produção',
          subcategories: ['Fotos', 'Vídeos'],
        },
      ]);
      setNewAlbumTitle('');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Meus Álbuns Google Photos</h5>
      </div>
      <div className="card-body">
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Nome do novo álbum"
            value={newAlbumTitle}
            onChange={(e) => setNewAlbumTitle(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleCreateAlbum}
            disabled={isLoading || !newAlbumTitle.trim()}
          >
            {isLoading ? 'Criando...' : 'Criar'}
          </button>
        </div>

        {albums.length === 0 ? (
          <p className="text-muted">Nenhum álbum encontrado</p>
        ) : (
          <ul className="list-group">
            {albums.map((album) => (
              <li key={album.id} className="list-group-item">
                <strong>{album.title}</strong>
                <br />
                <small className="text-muted">{album.mediaItemsCount} itens</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Componente Exemplo: Upload de Mídia
 */
export function MediaUploadComponent({ albumId }: { albumId?: string }) {
  const { uploadFile, isUploading, uploadProgress, error } = useMediaUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadFile(file, albumId, `Enviado em ${new Date().toLocaleString()}`);
        alert('Arquivo enviado com sucesso!');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error('Erro no upload:', err);
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Fazer Upload de Mídia</h5>
      </div>
      <div className="card-body">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="form-control"
        />

        {isUploading && (
          <div className="progress mt-3">
            <div
              className="progress-bar bg-success"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mt-3 mb-0">{error}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente Exemplo: Gerenciador de Permissões
 */
export function PermissionsManager({ resourceId }: { resourceId: string }) {
  const { permissions, grantPermission, revokePermission } = usePermissions(resourceId);
  const [userEmail, setUserEmail] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<PermissionLevel>(PermissionLevel.VIEWER);

  const handleAddPermission = async () => {
    if (userEmail.trim()) {
      await grantPermission(userEmail, selectedLevel, {
        canCreateSubfolders: selectedLevel !== PermissionLevel.VIEWER,
        canDeleteContent: selectedLevel === PermissionLevel.EDITOR,
        canShareFolder: selectedLevel !== PermissionLevel.VIEWER,
      });
      setUserEmail('');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Permissões</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Adicionar Usuário</label>
          <div className="input-group">
            <input
              type="email"
              className="form-control"
              placeholder="email@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
            <select
              className="form-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as PermissionLevel)}
            >
              <option value={PermissionLevel.VIEWER}>Visualizador</option>
              <option value={PermissionLevel.EDITOR}>Editor</option>
              <option value={PermissionLevel.OWNER}>Proprietário</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={handleAddPermission}
              disabled={!userEmail.trim()}
            >
              Adicionar
            </button>
          </div>
        </div>

        <label className="form-label">Usuários com Acesso</label>
        {permissions.length === 0 ? (
          <p className="text-muted">Nenhum usuário com acesso</p>
        ) : (
          <ul className="list-group">
            {permissions.map((perm) => (
              <li key={perm.id} className="list-group-item d-flex justify-content-between">
                <div>
                  <strong>{perm.userId}</strong>
                  <br />
                  <small className="text-muted">{perm.permissionLevel}</small>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => revokePermission(perm.userId)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Inicialização no App.tsx
 */
export function initializeGooglePhotosIntegration() {
  initializeGooglePhotos({
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI,
    scopes: [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.edit.appsource',
    ],
  });

  console.log('Google Photos Integration initialized');
}
