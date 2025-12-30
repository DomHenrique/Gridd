/**
 * Google Photos Integration - Exports principais
 * Reexporta todos os serviços, tipos e utilitários
 */

// ============================================================================
// TIPOS
// ============================================================================

export * from './types';

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export {
  GooglePhotosAuthService,
  initializeAuthService,
  getAuthService,
} from './auth/auth.service';

// ============================================================================
// API PRINCIPAL
// ============================================================================

export {
  GooglePhotosService,
  getGooglePhotosService,
} from './api.service';

// ============================================================================
// PERMISSÕES
// ============================================================================

export {
  PermissionsService,
  getPermissionsService,
} from './permissions/permissions.service';

// ============================================================================
// ÁLBUNS
// ============================================================================

export {
  AlbumsService,
  getAlbumsService,
} from './albums/albums.service';

// ============================================================================
// MÍDIA
// ============================================================================

export {
  MediaService,
  getMediaService,
} from './media/media.service';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

export {
  GOOGLE_PHOTOS_CONFIG,
  DEFAULT_ALBUM_STRUCTURE,
  UPLOAD_CONFIG,
  CACHE_CONFIG,
  SYNC_CONFIG,
  SECURITY_CONFIG,
  DEFAULT_PERMISSIONS,
  initializeGooglePhotos,
  getConfigurationStatus,
  getConfig,
  updateConfig,
} from './config/config';
