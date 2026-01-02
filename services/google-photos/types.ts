/**
 * Tipos e interfaces para integração com Google Photos Library API
 * Estrutura completa respeitando permissões por pasta/álbum
 */

// ============================================================================
// AUTENTICAÇÃO E TOKENS
// ============================================================================

export interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
  expires_at: number; // timestamp em ms
}

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: GooglePhotosScope[];
}

export enum GooglePhotosScope {
  // Escopos para API Library (após mudanças de 01/04/2025)
  PHOTOS_LIBRARY_READONLY = 'https://www.googleapis.com/auth/photoslibrary.readonly',
  PHOTOS_LIBRARY_EDIT_APPSOURCE = 'https://www.googleapis.com/auth/photoslibrary.edit.appsource',
  PHOTOS_LIBRARY_SHARING = 'https://www.googleapis.com/auth/photoslibrary.sharing',
  // Escopos de perfil
  USERINFO_PROFILE = 'https://www.googleapis.com/auth/userinfo.profile',
  USERINFO_EMAIL = 'https://www.googleapis.com/auth/userinfo.email',
}

// ============================================================================
// ITENS DE MÍDIA
// ============================================================================

export interface MediaItem {
  id: string;
  description: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
    video?: {
      cameraMake?: string;
      cameraModel?: string;
      fps?: number;
      status: 'PROCESSING' | 'READY' | 'FAILED';
      duration?: string;
    };
  };
  filename: string;
  albumId?: string; // ID do álbum que contém o item
}

export interface MediaItemsSearchRequest {
  albumId?: string;
  pageSize?: number;
  pageToken?: string;
  filters?: MediaFilter;
  orderBy?: 'NEWEST_FIRST' | 'OLDEST_FIRST';
}

export interface MediaFilter {
  dateFilter?: {
    ranges?: Array<{
      startDate?: Date;
      endDate?: Date;
    }>;
  };
  contentFilter?: {
    includedContentCategories?: Array<
      | 'LANDSCAPES'
      | 'RECEIPTS'
      | 'CITYSCAPES'
      | 'LANDMARKS'
      | 'SELFIES'
      | 'PEOPLE'
      | 'PETS'
      | 'ARTS'
      | 'CRAFTS'
      | 'FASHION'
      | 'HOUSES'
      | 'GARDENS'
      | 'FLOWERS'
      | 'TREE'
      | 'FOOD'
      | 'INSECTS'
      | 'SPORT'
      | 'CAR'
      | 'TRAVEL'
      | 'CAMPING'
      | 'BEACH'
      | 'WEDDING'
      | 'BIRTHDAY'
      | 'DOCUMENT'
      | 'SCREENSHOT'
    >;
    excludedContentCategories?: string[];
  };
  mediaTypeFilter?: {
    mediaTypes?: ('PHOTO' | 'VIDEO')[];
  };
  featureFilter?: {
    includedFeatures?: (
      | 'FAVORITES'
      | 'SCREENSHOTS'
      | 'ARCHIVED'
      | 'RECENTLY_DELETED'
    )[];
  };
}

export interface UploadMediaRequest {
  file: File;
  description?: string;
  albumId?: string; // Adicionar a um álbum específico após upload
}

export interface SimpleMediaItem {
  uploadToken?: string;
  description?: string;
}

export interface BatchCreateMediaItemRequest {
  newMediaItems: Array<{
    description?: string;
    simpleMediaItem: SimpleMediaItem;
  }>;
  albumId?: string;
}

// ============================================================================
// ÁLBUNS
// ============================================================================

export interface Album {
  id: string;
  title: string;
  productUrl: string;
  isWriteable: boolean;
  coverPhotoBaseUrl?: string;
  coverPhotoMediaItemId?: string;
  mediaItemsCount: string;
  shareInfo?: {
    sharedAlbumOptions?: {
      isCollaborative?: boolean;
      isCommentable?: boolean;
    };
    shareableUrl?: string;
    shareToken?: string;
  };
}

export interface CreateAlbumRequest {
  album: {
    title: string;
  };
}

export interface BatchAddMediaItemsRequest {
  mediaItemIds: string[];
}

export interface BatchRemoveMediaItemsRequest {
  mediaItemIds: string[];
}

// ============================================================================
// ENRIQUECIMENTOS
// ============================================================================

export interface AlbumEnrichment {
  text?: {
    text: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    intervalDegrees?: number;
  };
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
}

export interface AddEnrichmentRequest {
  newEnrichmentItem: {
    textEnrichment?: {
      text: string;
    };
    locationEnrichment?: {
      location: {
        latitude: number;
        longitude: number;
        intervalDegrees?: number;
      };
    };
    dateRangeEnrichment?: {
      dateRange: {
        startDate?: string;
        endDate?: string;
      };
    };
  };
}

// ============================================================================
// PERMISSÕES E CONTROLE DE ACESSO
// ============================================================================

export enum PermissionLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  RESTRICTED = 'restricted',
}

export enum ResourceType {
  ALBUM = 'album',
  MEDIA_ITEM = 'mediaItem',
  FOLDER = 'folder',
}

export interface FolderHierarchy {
  id: string;
  name: string;
  parentId?: string;
  albumId: string; // Mapeia para um álbum do Google Photos
  permissions: FolderPermission[];
  subfolders: FolderHierarchy[];
  mediaItems?: MediaItem[];
}

export interface FolderPermission {
  id: string;
  folderId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  permissionLevel: PermissionLevel;
  canCreateSubfolders: boolean;
  canDeleteContent: boolean;
  canShareFolder: boolean;
  grantedAt: Date;
  expiresAt?: Date; // Para permissões temporárias
}

export interface PermissionRequest {
  resourceId: string;
  resourceType: ResourceType;
  userId: string;
  permissionLevel: PermissionLevel;
  canCreateSubfolders?: boolean;
  canDeleteContent?: boolean;
  canShareFolder?: boolean;
  expiresAt?: Date;
}

export interface PermissionCheck {
  resource: {
    id: string;
    type: ResourceType;
  };
  user: {
    id: string;
    email?: string;
  };
  permissionLevel: PermissionLevel;
  actions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canShare: boolean;
    canManagePermissions: boolean;
    canCreateSubfolders: boolean;
  };
}

// ============================================================================
// RESPOSTAS E PAGINAÇÃO
// ============================================================================

export interface ListAlbumsResponse {
  albums?: Album[];
  nextPageToken?: string;
  shareInfo?: {
    sharedAlbumOptions?: {
      isCollaborative?: boolean;
      isCommentable?: boolean;
    };
    shareableUrl?: string;
    shareToken?: string;
  };
}

export interface SearchMediaItemsResponse {
  mediaItems?: MediaItem[];
  nextPageToken?: string;
  resultsCount?: number;
}

export interface BatchCreateMediaItemResponse {
  newMediaItemResults?: Array<{
    uploadToken?: string;
    status?: {
      code: number;
      message: string;
      details?: Array<{
        '@type': string;
        [key: string]: any;
      }>;
    };
    mediaItem?: MediaItem;
  }>;
}

// ============================================================================
// ERROS
// ============================================================================

export interface GooglePhotosError {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
    locationType?: string;
    location?: string;
  }>;
  status: string;
}

export class GooglePhotosApiException extends Error {
  constructor(
    public statusCode: number,
    public errorData: GooglePhotosError,
    message?: string
  ) {
    super(message || errorData.message);
    this.name = 'GooglePhotosApiException';
  }
}

// ============================================================================
// CACHE E SINCRONIZAÇÃO
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  tag?: string; // Para invalidação em grupo
}

export interface SyncState {
  lastSync: number;
  lastSyncedAlbumIds: string[];
  pendingOperations: SyncOperation[];
  conflictingItems: string[];
}

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: ResourceType;
  resourceId: string;
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error?: string;
  retryCount: number;
}

// ============================================================================
// UPLOAD RECUPERÁVEL
// ============================================================================

export interface ResumableUploadSession {
  sessionUri: string;
  fileSize: number;
  uploadedBytes: number;
  startTime: number;
  lastActivityTime: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
}

export interface UploadProgress {
  fileSize: number;
  uploadedBytes: number;
  progressPercentage: number;
  estimatedTimeRemaining?: number; // ms
  speed?: number; // bytes/ms
}

// ============================================================================
// AUDITORIA
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  changes?: {
    before: any;
    after: any;
  };
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  ipAddress?: string;
  userAgent?: string;
}
