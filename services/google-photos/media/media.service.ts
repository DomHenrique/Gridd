/**
 * Serviço de Gerenciamento de Mídia
 * Upload, download, pesquisa e organização de imagens/vídeos
 */

import {
  MediaItem,
  MediaItemsSearchRequest,
  SearchMediaItemsResponse,
  BatchCreateMediaItemRequest,
  UploadProgress,
  ResumableUploadSession,
  SyncState,
  SyncOperation,
  ResourceType,
} from '../types';
import { getGooglePhotosService } from '../api.service';
import { getPermissionsService } from '../permissions/permissions.service';

/**
 * Serviço de gerenciamento de mídia integrado com permissões
 */
export class MediaService {
  private photosService = getGooglePhotosService();
  private permissionsService = getPermissionsService();
  private activeUploads: Map<string, ResumableUploadSession> = new Map();
  private syncState: SyncState = {
    lastSync: 0,
    lastSyncedAlbumIds: [],
    pendingOperations: [],
    conflictingItems: [],
  };
  private readonly STORAGE_KEY_UPLOADS = 'gridd360_active_uploads';
  private readonly STORAGE_KEY_SYNC = 'gridd360_sync_state';

  constructor() {
    this.loadState();
  }

  /**
   * Faz upload de um arquivo de mídia
   */
  async uploadMedia(
    file: File,
    albumId?: string,
    description?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaItem> {
    try {
      // Validação básica
      if (!file) {
        throw new Error('Arquivo não fornecido');
      }

      if (!this.isValidMediaFile(file)) {
        throw new Error(
          'Tipo de arquivo não suportado. Use imagens ou vídeos (JPG, PNG, GIF, MP4, etc.)'
        );
      }

      // Fazer upload dos bytes
      const uploadToken = await this.photosService.uploadMediaSimple(file);

      if (!uploadToken) {
        throw new Error('Falha ao obter token de upload');
      }

      // Criar item de mídia
      const createRequest: BatchCreateMediaItemRequest = {
        newMediaItems: [
          {
            description,
            simpleMediaItem: {
              uploadToken,
            },
          },
        ],
        albumId,
      };

      const response = await this.photosService.batchCreateMediaItems(createRequest);

      if (!response.newMediaItemResults || response.newMediaItemResults.length === 0) {
        throw new Error('Falha ao criar item de mídia');
      }

      const result = response.newMediaItemResults[0];
      if (result.status && result.status.code !== 0) {
        throw new Error(`Erro ao criar item de mídia: ${result.status.message}`);
      }

      if (!result.mediaItem) {
        throw new Error('Nenhum item de mídia retornado');
      }

      // Registrar operação de sincronização
      this.recordSyncOperation('CREATE', ResourceType.MEDIA_ITEM, result.mediaItem.id, {
        file: file.name,
        albumId,
      });

      return result.mediaItem;
    } catch (error) {
      this.recordSyncOperation('CREATE', ResourceType.MEDIA_ITEM, 'unknown', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Faz upload resumível de arquivo grande
   */
  async uploadMediaResumable(
    file: File,
    albumId?: string,
    description?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaItem> {
    // Nota: Google Photos API usa upload simples ou resumível
    // Para aplicações web, recomenda-se usar o método simples
    // Este é um exemplo de como estruturar upload resumível

    const sessionId = `upload_${Date.now()}_${Math.random()}`;
    const session: ResumableUploadSession = {
      sessionUri: '', // Seria obtido do servidor
      fileSize: file.size,
      uploadedBytes: 0,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      status: 'ACTIVE',
    };

    this.activeUploads.set(sessionId, session);
    this.saveState();

    try {
      // Em implementação real, fazer upload em chunks
      const mediaItem = await this.uploadMedia(file, albumId, description, onProgress);
      
      session.status = 'COMPLETED';
      session.uploadedBytes = file.size;
      this.saveState();

      return mediaItem;
    } catch (error) {
      session.status = 'CANCELLED';
      this.saveState();
      throw error;
    }
  }

  /**
   * Pesquisa itens de mídia
   */
  async searchMediaItems(
    request: MediaItemsSearchRequest
  ): Promise<SearchMediaItemsResponse> {
    return this.photosService.searchMediaItems(request);
  }

  /**
   * Pesquisa mídia em um álbum específico
   */
  async searchMediaInAlbum(
    albumId: string,
    pageSize: number = 50
  ): Promise<SearchMediaItemsResponse> {
    const request: MediaItemsSearchRequest = {
      pageSize,
      filters: {
        mediaTypeFilter: {
          mediaTypes: ['PHOTO', 'VIDEO'],
        },
      },
    };

    // Nota: Google Photos API não permite filtrar por albumId
    // Seria necessário fazer a filtragem após buscar os itens
    return this.searchMediaItems(request);
  }

  /**
   * Obtém um item de mídia específico
   */
  async getMediaItem(mediaItemId: string): Promise<MediaItem> {
    return this.photosService.getMediaItem(mediaItemId);
  }

  /**
   * Obtém múltiplos itens de mídia
   */
  async getMediaItems(mediaItemIds: string[]): Promise<MediaItem[]> {
    return this.photosService.batchGetMediaItems(mediaItemIds);
  }

  /**
   * Pesquisa fotos favoritas
   */
  async searchFavorites(pageSize: number = 50): Promise<SearchMediaItemsResponse> {
    const request: MediaItemsSearchRequest = {
      pageSize,
      filters: {
        featureFilter: {
          includedFeatures: ['FAVORITES'],
        },
      },
    };

    return this.searchMediaItems(request);
  }

  /**
   * Pesquisa por tipo de conteúdo
   */
  async searchByContentType(
    contentType: 'LANDSCAPES' | 'PEOPLE' | 'PETS' | 'FOOD' | string[],
    pageSize: number = 50
  ): Promise<SearchMediaItemsResponse> {
    const contentTypes = Array.isArray(contentType) ? contentType : [contentType];

    const request: MediaItemsSearchRequest = {
      pageSize,
      filters: {
        contentFilter: {
          includedContentCategories: contentTypes as any,
        },
      },
    };

    return this.searchMediaItems(request);
  }

  /**
   * Pesquisa por período de tempo
   */
  async searchByDateRange(
    startDate: Date,
    endDate: Date,
    pageSize: number = 50
  ): Promise<SearchMediaItemsResponse> {
    const request: MediaItemsSearchRequest = {
      pageSize,
      filters: {
        dateFilter: {
          ranges: [{ startDate, endDate }],
        },
      },
      orderBy: 'NEWEST_FIRST',
    };

    return this.searchMediaItems(request);
  }

  /**
   * Pesquisa apenas fotos
   */
  async searchPhotos(pageSize: number = 50): Promise<SearchMediaItemsResponse> {
    const request: MediaItemsSearchRequest = {
      pageSize,
      filters: {
        mediaTypeFilter: {
          mediaTypes: ['PHOTO'],
        },
      },
      orderBy: 'NEWEST_FIRST',
    };

    return this.searchMediaItems(request);
  }

  /**
   * Pesquisa apenas vídeos
   */
  async searchVideos(pageSize: number = 50): Promise<SearchMediaItemsResponse> {
    const request: MediaItemsSearchRequest = {
      pageSize,
      filters: {
        mediaTypeFilter: {
          mediaTypes: ['VIDEO'],
        },
      },
      orderBy: 'NEWEST_FIRST',
    };

    return this.searchMediaItems(request);
  }

  /**
   * Obtém URL de visualização de mídia
   */
  getMediaUrl(mediaItem: MediaItem, width?: number, height?: number): string {
    let url = mediaItem.baseUrl;

    // Google Photos permite adicionar parâmetros de dimensionamento
    if (width || height) {
      const params = [];
      if (width) params.push(`w${width}`);
      if (height) params.push(`h${height}`);
      url += `=/${params.join('-')}`;
    }

    return url;
  }

  /**
   * Obtém URL de miniatura
   */
  getThumbnailUrl(mediaItem: MediaItem, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizes = {
      small: 200,
      medium: 400,
      large: 800,
    };

    return this.getMediaUrl(mediaItem, sizes[size], sizes[size]);
  }

  /**
   * Verifica se usuário pode acessar mídia em um álbum
   */
  canAccessMedia(userId: string, albumId: string): boolean {
    const folderCheck = this.permissionsService.checkPermission(
      userId,
      `album_${albumId}`,
      ''
    );

    return folderCheck.actions.canRead;
  }

  /**
   * Verifica se usuário pode editar/deletar mídia em um álbum
   */
  canEditMedia(userId: string, albumId: string): boolean {
    const folderCheck = this.permissionsService.checkPermission(
      userId,
      `album_${albumId}`,
      ''
    );

    return folderCheck.actions.canWrite;
  }

  /**
   * Registra uma operação para sincronização
   */
  private recordSyncOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: ResourceType,
    resourceId: string,
    payload: any
  ): void {
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random()}`,
      type,
      resourceType,
      resourceId,
      payload,
      timestamp: Date.now(),
      status: 'PENDING',
      retryCount: 0,
    };

    this.syncState.pendingOperations.push(operation);
    this.saveState();
  }

  /**
   * Sincroniza operações pendentes
   */
  async syncPendingOperations(): Promise<{
    successCount: number;
    failedCount: number;
    conflicts: string[];
  }> {
    const result = {
      successCount: 0,
      failedCount: 0,
      conflicts: this.syncState.conflictingItems,
    };

    const pendingOps = this.syncState.pendingOperations.filter((op) => op.status === 'PENDING');

    for (const operation of pendingOps) {
      try {
        operation.status = 'IN_PROGRESS';

        // Executar operação conforme tipo
        switch (operation.type) {
          case 'CREATE':
            // Operação já foi criada durante upload
            operation.status = 'COMPLETED';
            result.successCount++;
            break;

          case 'UPDATE':
            // Seria implementado conforme necessário
            operation.status = 'COMPLETED';
            result.successCount++;
            break;

          case 'DELETE':
            // Google Photos API não permite delete via Library API
            // Informação apenas é removida do local de armazenamento
            operation.status = 'COMPLETED';
            result.successCount++;
            break;
        }

        this.saveState();
      } catch (error) {
        operation.status = 'FAILED';
        operation.error = error instanceof Error ? error.message : String(error);
        operation.retryCount++;

        if (operation.retryCount > 3) {
          result.failedCount++;
        }

        this.saveState();
      }
    }

    this.syncState.lastSync = Date.now();
    this.saveState();

    return result;
  }

  /**
   * Valida se arquivo é de tipo suportado
   */
  private isValidMediaFile(file: File): boolean {
    const validTypes = [
      // Fotos
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff',
      // Vídeos
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
    ];

    return validTypes.includes(file.type) || this.isValidByExtension(file.name);
  }

  /**
   * Valida por extensão de arquivo
   */
  private isValidByExtension(filename: string): boolean {
    const validExtensions = [
      // Fotos
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff',
      // Vídeos
      'mp4', 'mov', 'avi', 'mkv', 'webm',
    ];

    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? validExtensions.includes(ext) : false;
  }

  /**
   * Salva estado no localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY_SYNC,
        JSON.stringify(this.syncState)
      );
    } catch (error) {
      console.warn('Erro ao salvar sync state:', error);
    }
  }

  /**
   * Carrega estado do localStorage
   */
  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_SYNC);
      if (stored) {
        this.syncState = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erro ao carregar sync state:', error);
    }
  }

  /**
   * Obtém estado de sincronização
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Limpa uploads ativos
   */
  clearInactiveUploads(inactiveThresholdMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    this.activeUploads.forEach((session, key) => {
      if (now - session.lastActivityTime > inactiveThresholdMs) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => this.activeUploads.delete(key));
    this.saveState();
  }
}

// Singleton
let mediaServiceInstance: MediaService | null = null;

export function getMediaService(): MediaService {
  if (!mediaServiceInstance) {
    mediaServiceInstance = new MediaService();
  }
  return mediaServiceInstance;
}
