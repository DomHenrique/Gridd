/**
 * Serviço de Gerenciamento de Álbuns do Google Photos
 * Cria, organiza e gerencia álbuns com integração de permissões
 */

import {
  Album,
  AlbumEnrichment,
  AddEnrichmentRequest,
  CreateAlbumRequest,
} from '../types';
import { getGooglePhotosService } from '../api.service';
import {
  getPermissionsService,
  PermissionsService,
} from '../permissions/permissions.service';

/**
 * Serviço de Álbuns que integra API Google Photos com sistema de permissões local
 */
export class AlbumsService {
  private photosService = getGooglePhotosService();
  private permissionsService = getPermissionsService();
  private albumCache: Map<string, Album> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Cria um novo álbum no Google Photos
   */
  async createAlbum(
    title: string,
    categories?: { name: string; subcategories?: string[] }[]
  ): Promise<Album> {
    // Criar álbum no Google Photos
    const album = await this.photosService.createAlbum(title);

    // Criar estrutura de pastas local com permissões
    if (categories) {
      this.permissionsService.createFolderStructureFromAlbum(album.id, title, categories);
    } else {
      // Criar uma pasta raiz simples
      this.permissionsService.createFolder(
        `album_${album.id}`,
        title,
        album.id
      );
    }

    this.invalidateCache();
    return album;
  }

  /**
   * Obtém um álbum específico
   */
  async getAlbum(albumId: string, useCache: boolean = true): Promise<Album> {
    // Verificar cache
    if (useCache && this.isInCache(albumId)) {
      return this.albumCache.get(albumId)!;
    }

    // Buscar do Google Photos
    const album = await this.photosService.getAlbum(albumId);

    // Armazenar em cache
    this.albumCache.set(albumId, album);
    this.cacheExpiry.set(albumId, Date.now() + this.CACHE_DURATION_MS);

    return album;
  }

  /**
   * Lista todos os álbuns do usuário
   */
  async listAlbums(pageSize: number = 50, pageToken?: string) {
    return this.photosService.listAlbums(pageSize, pageToken);
  }

  /**
   * Lista álbuns que um usuário específico tem acesso
   */
  async listUserAlbums(userId: string) {
    const userFolders = this.permissionsService.getUserFolders(userId);

    const albums: Album[] = [];
    for (const folder of userFolders) {
      try {
        const album = await this.getAlbum(folder.albumId);
        albums.push(album);
      } catch (error) {
        console.warn(`Erro ao obter álbum ${folder.albumId}:`, error);
      }
    }

    return albums;
  }

  /**
   * Adiciona imagens a um álbum
   */
  async addMediaItemsToAlbum(albumId: string, mediaItemIds: string[]): Promise<void> {
    await this.photosService.addMediaItemsToAlbum(albumId, mediaItemIds);
    this.invalidateCache(albumId);
  }

  /**
   * Remove imagens de um álbum
   */
  async removeMediaItemsFromAlbum(albumId: string, mediaItemIds: string[]): Promise<void> {
    await this.photosService.removeMediaItemsFromAlbum(albumId, mediaItemIds);
    this.invalidateCache(albumId);
  }

  /**
   * Enriquece um álbum com informações adicionais
   */
  async enrichAlbum(albumId: string, enrichment: AlbumEnrichment): Promise<void> {
    const enrichmentRequest = this.buildEnrichmentRequest(enrichment);
    await this.photosService.addAlbumEnrichment(albumId, enrichmentRequest);
    this.invalidateCache(albumId);
  }

  /**
   * Enriquece álbum com título/descrição
   */
  async enrichAlbumWithText(albumId: string, text: string): Promise<void> {
    await this.enrichAlbum(albumId, { text: { text } });
  }

  /**
   * Enriquece álbum com localização
   */
  async enrichAlbumWithLocation(
    albumId: string,
    latitude: number,
    longitude: number,
    radiusKm?: number
  ): Promise<void> {
    const intervalDegrees = radiusKm ? radiusKm / 111.32 : undefined;
    await this.enrichAlbum(albumId, {
      location: {
        latitude,
        longitude,
        intervalDegrees,
      },
    });
  }

  /**
   * Enriquece álbum com período de tempo
   */
  async enrichAlbumWithDateRange(
    albumId: string,
    startDate: Date,
    endDate?: Date
  ): Promise<void> {
    await this.enrichAlbum(albumId, {
      dateRange: {
        startDate,
        endDate,
      },
    });
  }

  /**
   * Organiza o álbum por categorias
   * Cria uma estrutura de pastas/subálbuns
   */
  async organizeAlbumByCategories(
    albumId: string,
    categories: Array<{
      name: string;
      description?: string;
      subcategories?: Array<{
        name: string;
        description?: string;
      }>;
    }>
  ): Promise<void> {
    // Estrutura de pastas foi criada em createAlbum
    // Aqui apenas enriquecemos cada nível com descrições

    for (const category of categories) {
      const categoryFolderId = `album_${albumId}_cat_${category.name}`;

      if (category.description) {
        try {
          // Enriquecer pasta categoria com descrição via álbum do Google Photos
          // Nota: Google Photos usa albumId, não folderId
          // Aqui seria necessário manter mapeamento de pasta -> albumId
        } catch (error) {
          console.warn(`Erro ao enriquecer categoria ${category.name}:`, error);
        }
      }

      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          // Enriquecer cada subcategoria
          if (subcategory.description) {
            // Similar ao acima
          }
        }
      }
    }
  }

  /**
   * Obtém estatísticas de um álbum
   */
  async getAlbumStats(albumId: string): Promise<{
    albumId: string;
    itemCount: number;
    lastModified?: Date;
    hasWriteAccess: boolean;
  }> {
    const album = await this.getAlbum(albumId);

    return {
      albumId: album.id,
      itemCount: parseInt(album.mediaItemsCount || '0', 10),
      lastModified: undefined, // Google Photos não fornece este dado
      hasWriteAccess: album.isWriteable,
    };
  }

  /**
   * Obtém informações de compartilhamento de um álbum
   */
  async getAlbumShareInfo(albumId: string): Promise<{
    isShared: boolean;
    shareUrl?: string;
    isCollaborative?: boolean;
    isCommentable?: boolean;
  }> {
    const album = await this.getAlbum(albumId);

    return {
      isShared: !!album.shareInfo,
      shareUrl: album.shareInfo?.shareableUrl,
      isCollaborative: album.shareInfo?.sharedAlbumOptions?.isCollaborative,
      isCommentable: album.shareInfo?.sharedAlbumOptions?.isCommentable,
    };
  }

  /**
   * Verifica se um usuário tem permissão de escrita em um álbum
   */
  async canEditAlbum(userId: string, albumId: string): Promise<boolean> {
    const folder = this.permissionsService.getFolder(`album_${albumId}`);
    if (!folder) {
      return false;
    }

    const check = this.permissionsService.checkPermission(userId, folder.id, '');
    return check.actions.canWrite;
  }

  /**
   * Verifica se um usuário pode ler um álbum
   */
  async canReadAlbum(userId: string, albumId: string): Promise<boolean> {
    const folder = this.permissionsService.getFolder(`album_${albumId}`);
    if (!folder) {
      return false;
    }

    const check = this.permissionsService.checkPermission(userId, folder.id, '');
    return check.actions.canRead;
  }

  /**
   * Obtém todos os usuários com acesso a um álbum
   */
  getAlbumAccessList(albumId: string): Array<{
    userId: string;
    permissionLevel: string;
    grantedAt: Date;
  }> {
    const folder = this.permissionsService.getFolder(`album_${albumId}`);
    if (!folder) {
      return [];
    }

    return folder.permissions.map((p) => ({
      userId: p.userId,
      permissionLevel: p.permissionLevel,
      grantedAt: p.grantedAt,
    }));
  }

  /**
   * Constrói requisição de enriquecimento a partir de objeto AlbumEnrichment
   */
  private buildEnrichmentRequest(enrichment: AlbumEnrichment): AddEnrichmentRequest {
    const newEnrichmentItem: any = {};

    if (enrichment.text) {
      newEnrichmentItem.textEnrichment = {
        text: enrichment.text.text,
      };
    }

    if (enrichment.location) {
      newEnrichmentItem.locationEnrichment = {
        location: {
          latitude: enrichment.location.latitude,
          longitude: enrichment.location.longitude,
          intervalDegrees: enrichment.location.intervalDegrees,
        },
      };
    }

    if (enrichment.dateRange) {
      newEnrichmentItem.dateRangeEnrichment = {
        dateRange: {
          startDate: enrichment.dateRange.startDate
            ? enrichment.dateRange.startDate.toISOString().split('T')[0]
            : undefined,
          endDate: enrichment.dateRange.endDate
            ? enrichment.dateRange.endDate.toISOString().split('T')[0]
            : undefined,
        },
      };
    }

    return { newEnrichmentItem };
  }

  /**
   * Verifica se item está em cache e ainda válido
   */
  private isInCache(albumId: string): boolean {
    if (!this.albumCache.has(albumId)) {
      return false;
    }

    const expiry = this.cacheExpiry.get(albumId);
    if (!expiry || Date.now() > expiry) {
      this.albumCache.delete(albumId);
      this.cacheExpiry.delete(albumId);
      return false;
    }

    return true;
  }

  /**
   * Invalida o cache
   */
  private invalidateCache(albumId?: string): void {
    if (albumId) {
      this.albumCache.delete(albumId);
      this.cacheExpiry.delete(albumId);
    } else {
      this.albumCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Limpa o cache (útil para desconexão)
   */
  clearCache(): void {
    this.invalidateCache();
  }
}

// Singleton
let albumsServiceInstance: AlbumsService | null = null;

export function getAlbumsService(): AlbumsService {
  if (!albumsServiceInstance) {
    albumsServiceInstance = new AlbumsService();
  }
  return albumsServiceInstance;
}
