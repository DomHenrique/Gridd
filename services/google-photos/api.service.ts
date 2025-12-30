/**
 * Serviço Principal da Google Photos Library API
 * Gerencia todas as operações de mídia, álbuns e pesquisa
 */

import {
  GooglePhotosApiException,
  GooglePhotosError,
  MediaItem,
  MediaItemsSearchRequest,
  SearchMediaItemsResponse,
  BatchCreateMediaItemRequest,
  BatchCreateMediaItemResponse,
  Album,
  ListAlbumsResponse,
  UploadProgress,
} from './types';
import { getAuthService } from './auth/auth.service';

const API_BASE_URL = 'https://photoslibrary.googleapis.com/v1';
const UPLOAD_URL = 'https://photoslibrary.googleapis.com/v1/uploads';

/**
 * Serviço para operações com a API Google Photos
 */
export class GooglePhotosService {
  /**
   * Lista todos os álbuns criados pelo app
   */
  async listAlbums(pageSize: number = 50, pageToken?: string): Promise<ListAlbumsResponse> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/albums?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(token.access_token),
      });

      return this.handleResponse<ListAlbumsResponse>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtém um álbum específico
   */
  async getAlbum(albumId: string): Promise<Album> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    try {
      const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: 'GET',
        headers: this.getHeaders(token.access_token),
      });

      return this.handleResponse<Album>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cria um novo álbum
   */
  async createAlbum(title: string): Promise<Album> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    const body = {
      album: {
        title,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/albums`, {
        method: 'POST',
        headers: this.getHeaders(token.access_token),
        body: JSON.stringify(body),
      });

      return this.handleResponse<Album>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Pesquisa itens de mídia com filtros
   */
  async searchMediaItems(
    request: MediaItemsSearchRequest
  ): Promise<SearchMediaItemsResponse> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    try {
      const response = await fetch(`${API_BASE_URL}/mediaItems:search`, {
        method: 'POST',
        headers: this.getHeaders(token.access_token),
        body: JSON.stringify(request),
      });

      return this.handleResponse<SearchMediaItemsResponse>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtém um item de mídia específico
   */
  async getMediaItem(mediaItemId: string): Promise<MediaItem> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    try {
      const response = await fetch(`${API_BASE_URL}/mediaItems/${mediaItemId}`, {
        method: 'GET',
        headers: this.getHeaders(token.access_token),
      });

      return this.handleResponse<MediaItem>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtém múltiplos itens de mídia
   */
  async batchGetMediaItems(mediaItemIds: string[]): Promise<MediaItem[]> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    const params = new URLSearchParams();
    mediaItemIds.forEach((id) => params.append('mediaItemIds', id));

    try {
      const response = await fetch(`${API_BASE_URL}/mediaItems:batchGet?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(token.access_token),
      });

      const data = await this.handleResponse<{ mediaItems?: MediaItem[] }>(response);
      return data.mediaItems || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Faz upload de um arquivo de mídia (primeira etapa)
   * Retorna um uploadToken que será usado em batchCreate
   */
  async uploadMediaBytes(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fileSize = file.size;

      // Monitora o progresso
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const uploadedBytes = event.loaded;
            const progressPercentage = Math.round((uploadedBytes / fileSize) * 100);
            const elapsed = Date.now() - startTime;
            const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
            const estimatedTimeRemaining =
              speed > 0 ? (fileSize - uploadedBytes) / speed : undefined;

            onProgress({
              fileSize,
              uploadedBytes,
              progressPercentage,
              estimatedTimeRemaining,
              speed,
            });
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const uploadToken = xhr.getResponseHeader('X-Goog-Upload-Status');
          resolve(uploadToken || '');
        } else {
          reject(new Error(`Upload falhou com status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro na requisição de upload'));
      });

      // Configurar headers personalizados para resumable upload
      xhr.open('POST', UPLOAD_URL);
      xhr.setRequestHeader('Authorization', `Bearer ${token.access_token}`);
      xhr.setRequestHeader('X-Goog-Upload-Protocol', 'resumable');
      xhr.setRequestHeader('X-Goog-Upload-Command', 'start');
      xhr.setRequestHeader('X-Goog-Upload-Content-Type', file.type);
      xhr.setRequestHeader('X-Goog-Upload-Content-Length', fileSize.toString());

      const startTime = Date.now();
      xhr.send();
    });
  }

  /**
   * Upload simples de arquivo (completa em uma requisição)
   */
  async uploadMediaSimple(file: File): Promise<string> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'X-Goog-Upload-Protocol': 'raw',
          'X-Goog-Upload-Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha no upload'
        );
      }

      // Retorna o uploadToken do header
      const uploadToken = response.headers.get('X-Goog-Upload-Status');
      if (!uploadToken) {
        throw new Error('Nenhum upload token retornado');
      }

      return uploadToken;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cria itens de mídia a partir de upload tokens
   */
  async batchCreateMediaItems(
    request: BatchCreateMediaItemRequest
  ): Promise<BatchCreateMediaItemResponse> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    try {
      const response = await fetch(`${API_BASE_URL}/mediaItems:batchCreate`, {
        method: 'POST',
        headers: this.getHeaders(token.access_token),
        body: JSON.stringify(request),
      });

      return this.handleResponse<BatchCreateMediaItemResponse>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Adiciona itens de mídia a um álbum
   */
  async addMediaItemsToAlbum(albumId: string, mediaItemIds: string[]): Promise<void> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    const body = {
      mediaItemIds,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/albums/${albumId}:batchAddMediaItems`, {
        method: 'POST',
        headers: this.getHeaders(token.access_token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha ao adicionar itens ao álbum'
        );
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Remove itens de mídia de um álbum
   */
  async removeMediaItemsFromAlbum(albumId: string, mediaItemIds: string[]): Promise<void> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    const body = {
      mediaItemIds,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/albums/${albumId}:batchRemoveMediaItems`, {
        method: 'POST',
        headers: this.getHeaders(token.access_token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha ao remover itens do álbum'
        );
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Adiciona enriquecimento a um álbum
   */
  async addAlbumEnrichment(albumId: string, enrichment: any): Promise<void> {
    const auth = getAuthService();
    const token = await auth.getValidToken();

    const body = {
      newEnrichmentItem: enrichment,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/albums/${albumId}:addEnrichment`, {
        method: 'POST',
        headers: this.getHeaders(token.access_token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new GooglePhotosApiException(
          response.status,
          data as GooglePhotosError,
          'Falha ao adicionar enriquecimento'
        );
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Headers padrão para requisições da API
   */
  private getHeaders(accessToken: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
  }

  /**
   * Processa a resposta da API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      throw new GooglePhotosApiException(
        response.status,
        data as GooglePhotosError,
        `Erro da API: ${response.status}`
      );
    }

    return data as T;
  }

  /**
   * Trata erros da API
   */
  private handleError(error: any): Error {
    if (error instanceof GooglePhotosApiException) {
      return error;
    }
    return new Error(`Erro ao comunicar com Google Photos API: ${error.message}`);
  }
}

// Singleton
let serviceInstance: GooglePhotosService | null = null;

export function getGooglePhotosService(): GooglePhotosService {
  if (!serviceInstance) {
    serviceInstance = new GooglePhotosService();
  }
  return serviceInstance;
}
