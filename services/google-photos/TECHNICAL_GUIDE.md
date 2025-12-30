# Guia Técnico de Implementação - Google Photos API

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Fluxos de Dados](#fluxos-de-dados)
3. [Integração com Backend](#integração-com-backend)
4. [Tratamento de Erros](#tratamento-de-erros)
5. [Performance e Otimização](#performance-e-otimização)
6. [Testes](#testes)

---

## 🏗️ Arquitetura

### Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│         UI Components (React)            │
│  (Login, Upload, Albums, Permissions)   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│        Business Logic (Hooks)            │
│  (useAuth, useAlbums, useMedia, etc)    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Service Layer (Singletons)          │
│  Auth, API, Permissions, Albums, Media  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│     Google Photos Library API            │
│   REST Endpoints + OAuth 2.0             │
└─────────────────────────────────────────┘
```

### Serviços Principais

#### 1. **GooglePhotosAuthService**
- Responsável por OAuth 2.0 flow
- Gerencia tokens (access + refresh)
- Renovação automática de tokens
- Persistência em localStorage

```
┌─────────────────────────────────────────┐
│  GooglePhotosAuthService                │
├─────────────────────────────────────────┤
│ + getAuthorizationUrl()                 │
│ + exchangeCodeForToken()                │
│ + refreshAccessToken()                  │
│ + getValidToken()                       │
│ + revokeToken()                         │
│ + isAuthenticated()                     │
│ + getCurrentToken()                     │
└─────────────────────────────────────────┘
```

**Fluxo de Token:**
```
User Login
    ↓
Generate Auth URL
    ↓
User Authorizes
    ↓
Exchange Code for Token
    ↓
Store Token (localStorage)
    ↓
Auto-refresh 5min before expiry
    ↓
Token Valid ✓
```

#### 2. **GooglePhotosService**
- Comunicação direta com Google Photos API
- Operações de CRUD em álbuns e mídia
- Pesquisa e filtros
- Enriquecimento de álbuns

```
┌─────────────────────────────────────────┐
│  GooglePhotosService                    │
├─────────────────────────────────────────┤
│ + listAlbums()                          │
│ + createAlbum()                         │
│ + searchMediaItems()                    │
│ + uploadMediaBytes()                    │
│ + batchCreateMediaItems()               │
│ + addMediaItemsToAlbum()                │
│ + addAlbumEnrichment()                  │
└─────────────────────────────────────────┘
```

#### 3. **PermissionsService**
- Hierarquia de pastas locais
- Controle de acesso granular
- Auditoria de operações
- Sincronização com álbuns Google

```
┌─────────────────────────────────────────┐
│  PermissionsService                     │
├─────────────────────────────────────────┤
│ + createFolder()                        │
│ + grantPermission()                     │
│ + revokePermission()                    │
│ + checkPermission()                     │
│ + checkHierarchicalPermission()         │
│ + getAuditLogs()                        │
└─────────────────────────────────────────┘
```

**Hierarquia de Permissões:**
```
Folder Root
├── Categoria 1 (herda permissões da raiz)
│   ├── Subcategoria 1.1
│   └── Subcategoria 1.2
├── Categoria 2
│   └── Subcategoria 2.1
└── Categoria 3
```

#### 4. **AlbumsService**
- Orquestração entre Google Photos e permissões locais
- Organização de estruturas de pastas
- Cache de álbuns
- Enriquecimento inteligente

```
┌─────────────────────────────────────────┐
│  AlbumsService                          │
├─────────────────────────────────────────┤
│ + createAlbum()                         │
│ + listAlbums()                          │
│ + listUserAlbums()                      │
│ + enrichAlbumWithText()                 │
│ + enrichAlbumWithLocation()             │
│ + canEditAlbum()                        │
│ + getAlbumAccessList()                  │
└─────────────────────────────────────────┘
```

#### 5. **MediaService**
- Upload com monitoramento de progresso
- Pesquisa avançada com filtros
- Sincronização de operações pendentes
- Tratamento de conflitos

```
┌─────────────────────────────────────────┐
│  MediaService                           │
├─────────────────────────────────────────┤
│ + uploadMedia()                         │
│ + uploadMediaResumable()                │
│ + searchMediaItems()                    │
│ + searchByContentType()                 │
│ + searchByDateRange()                   │
│ + syncPendingOperations()               │
└─────────────────────────────────────────┘
```

---

## 📊 Fluxos de Dados

### Fluxo 1: Autenticação

```typescript
// 1. Usuário clica em "Conectar Google Photos"
const authUrl = auth.getAuthorizationUrl();
window.location.href = authUrl;

// 2. Google redireciona com código de autorização
// http://localhost:3000/auth/callback?code=XXX&state=YYY

// 3. Aplicação troca código por token
const token = await auth.exchangeCodeForToken(code);

// 4. Token é salvo em localStorage
// localStorage['google_photos_auth_token'] = { access_token, refresh_token, expires_at }

// 5. Renovação automática ocorre 5 min antes da expiração
// setTimeout(() => auth.refreshAccessToken(), timeUntilRefresh)
```

### Fluxo 2: Upload de Mídia

```typescript
// 1. Usuário seleciona arquivo
const file = document.querySelector('input[type=file]').files[0];

// 2. Validar arquivo
if (!isValidMediaFile(file)) throw new Error('Tipo inválido');

// 3. Fazer upload dos bytes
const uploadToken = await photosService.uploadMediaBytes(file, onProgress);
// POST https://photoslibrary.googleapis.com/v1/uploads
// Headers: X-Goog-Upload-Protocol: resumable
// Body: bytes do arquivo

// 4. Criar item de mídia
const mediaItem = await photosService.batchCreateMediaItems({
  newMediaItems: [{ uploadToken, description }],
  albumId
});

// 5. Registrar operação para sincronização
recordSyncOperation('CREATE', ResourceType.MEDIA_ITEM, mediaItem.id, {...});

// 6. Atualizar UI
setUploadProgress(100);
setMediaItems([...mediaItems, mediaItem]);
```

### Fluxo 3: Compartilhamento com Controle de Permissões

```typescript
// 1. Proprietário cria pasta/álbum
const album = await albums.createAlbum('Projeto ABC', [...]);
// Cria: album no Google Photos + folder local + permissão OWNER

// 2. Proprietário concede acesso a colaboradores
permissions.grantPermission({
  resourceId: `album_${album.id}`,
  userId: 'colaborador@example.com',
  permissionLevel: PermissionLevel.EDITOR,
  canCreateSubfolders: true,
  canDeleteContent: true,
});
// Registra: FolderPermission + AuditLog

// 3. Colaborador faz login
// Sistema carrega apenas pastas que tem acesso via getUserFolders()

// 4. Colaborador faz upload
// Sistema verifica: checkPermission(userId, folderId)
if (!check.actions.canWrite) throw new Error('Sem permissão');

// 5. Sistema registra auditoria
logAudit({
  action: 'UPLOAD_MEDIA',
  userId: 'colaborador@example.com',
  resourceId: mediaItem.id,
});
```

### Fluxo 4: Pesquisa com Filtros

```typescript
// 1. Usuário define filtros
const filters = {
  contentType: ['LANDSCAPES', 'NATURE'],
  dateRange: [new Date('2024-01-01'), new Date('2024-12-31')],
  mediaType: 'PHOTO',
};

// 2. Construir requisição
const request = {
  pageSize: 50,
  orderBy: 'NEWEST_FIRST',
  filters: {
    contentFilter: { includedContentCategories: filters.contentType },
    dateFilter: { ranges: [{ startDate: filters.dateRange[0], endDate: filters.dateRange[1] }] },
    mediaTypeFilter: { mediaTypes: [filters.mediaType] },
  },
};

// 3. Pesquisar na API
const response = await photosService.searchMediaItems(request);
// GET https://photoslibrary.googleapis.com/v1/mediaItems:search
// Body: { pageSize, filters, orderBy }

// 4. Retornar resultados
return {
  mediaItems: response.mediaItems,
  nextPageToken: response.nextPageToken,
};

// 5. Paginar se necessário
const nextPage = await photosService.searchMediaItems({
  ...request,
  pageToken: response.nextPageToken,
});
```

---

## 🔗 Integração com Backend

### Opção 1: Backend Node.js/Express

```typescript
// backend/routes/auth.ts
app.post('/api/auth/google-callback', async (req, res) => {
  const { code, state } = req.query;

  // Validar state
  if (!validateState(state)) return res.status(400).send('Invalid state');

  try {
    // Trocar código por token
    const token = await googleAuth.exchangeCodeForToken(code);

    // Salvar token no banco de dados
    await User.updateOne(
      { id: req.user.id },
      { googlePhotosToken: token }
    );

    // Criar sessão
    req.session.googlePhotosAuth = true;

    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});

// backend/routes/albums.ts
app.get('/api/albums', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id);
  const token = user.googlePhotosToken;

  // Usar token do backend
  const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  res.json(await response.json());
});

// backend/routes/media.ts
app.post('/api/media/upload', authenticate, async (req, res) => {
  const { file, albumId, description } = req.body;
  const user = await User.findById(req.user.id);

  // Fazer upload
  const uploadToken = await googlePhotosService.uploadMediaBytes(
    file,
    user.googlePhotosToken
  );

  // Salvar referência no banco
  await MediaItem.create({
    googlePhotosId: uploadToken,
    albumId,
    userId: req.user.id,
    description,
  });

  res.json({ success: true });
});
```

### Opção 2: Backend com Banco de Dados

```typescript
// types/models.ts
interface GooglePhotosToken {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

interface AlbumRecord {
  id: string;
  googlePhotosId: string;
  userId: string;
  title: string;
  createdAt: Date;
  categories: string[];
}

interface MediaItemRecord {
  id: string;
  googlePhotosId: string;
  albumId: string;
  userId: string;
  fileName: string;
  uploadedAt: Date;
  description?: string;
}

interface FolderPermissionRecord {
  id: string;
  folderId: string;
  userId: string;
  permissionLevel: PermissionLevel;
  grantedAt: Date;
  expiresAt?: Date;
}

interface AuditLogRecord {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: {
    before: any;
    after: any;
  };
}

// database/schemas.sql
CREATE TABLE google_photos_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT NOT NULL,
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE albums (
  id UUID PRIMARY KEY,
  google_photos_id VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_items (
  id UUID PRIMARY KEY,
  google_photos_id VARCHAR(255) NOT NULL UNIQUE,
  album_id UUID NOT NULL REFERENCES albums(id),
  user_id UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255),
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE folder_permissions (
  id UUID PRIMARY KEY,
  folder_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  permission_level VARCHAR(50) NOT NULL,
  can_create_subfolders BOOLEAN DEFAULT FALSE,
  can_delete_content BOOLEAN DEFAULT FALSE,
  can_share_folder BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  granted_by UUID REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  changes JSONB,
  status VARCHAR(20) DEFAULT 'SUCCESS'
);

CREATE INDEX idx_user_tokens ON google_photos_tokens(user_id);
CREATE INDEX idx_albums_user ON albums(user_id);
CREATE INDEX idx_media_album ON media_items(album_id);
CREATE INDEX idx_permissions_folder ON folder_permissions(folder_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

---

## ⚠️ Tratamento de Erros

### Tipos de Erro

```typescript
// 1. Erro de Autenticação
if (error.code === 401) {
  // Token expirado
  const newToken = await auth.refreshAccessToken();
  // Retry operação
}

// 2. Erro de Autorização
if (error.code === 403) {
  // Sem permissão
  console.error('Acesso negado. Verifique permissões.');
}

// 3. Erro de Validação
if (error.code === 400) {
  // Parâmetros inválidos
  console.error(`Erro de validação: ${error.message}`);
}

// 4. Erro de Limite de Taxa
if (error.code === 429) {
  // Excedeu rate limit
  // Implementar backoff exponencial
  const delay = Math.pow(2, retryCount) * 1000;
  setTimeout(() => retry(), delay);
}

// 5. Erro de Servidor
if (error.code >= 500) {
  // Erro interno do Google
  // Registrar e notificar usuário
}
```

### Estratégia de Retry

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Uso
const mediaItem = await retryWithBackoff(
  () => mediaService.uploadMedia(file, albumId),
  3,
  1000
);
```

---

## ⚡ Performance e Otimização

### 1. Cache de Álbuns

```typescript
// Cache em memória com expiração
const albumCache = new Map<string, { data: Album; expiresAt: number }>();

function getAlbumFromCache(id: string): Album | null {
  const cached = albumCache.get(id);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  albumCache.delete(id);
  return null;
}

function cacheAlbum(album: Album, durationMs: number = 5 * 60 * 1000) {
  albumCache.set(album.id, {
    data: album,
    expiresAt: Date.now() + durationMs,
  });
}
```

### 2. Paginação de Resultados

```typescript
// Buscar resultados paginados
async function* searchMediaPaginated(
  request: MediaItemsSearchRequest
): AsyncGenerator<MediaItem> {
  let pageToken: string | undefined;

  while (true) {
    const response = await photosService.searchMediaItems({
      ...request,
      pageToken,
    });

    if (!response.mediaItems) break;

    for (const item of response.mediaItems) {
      yield item;
    }

    if (!response.nextPageToken) break;
    pageToken = response.nextPageToken;
  }
}

// Usar
for await (const mediaItem of searchMediaPaginated(request)) {
  processItem(mediaItem);
}
```

### 3. Batch Operations

```typescript
// Agrupar operações
async function batchAddMediaToAlbum(
  albumId: string,
  mediaIds: string[],
  batchSize: number = 50
) {
  for (let i = 0; i < mediaIds.length; i += batchSize) {
    const batch = mediaIds.slice(i, i + batchSize);
    await photosService.addMediaItemsToAlbum(albumId, batch);
  }
}

// Uso
await batchAddMediaToAlbum('album-id', largeArrayOfIds, 50);
```

### 4. Web Workers para Upload

```typescript
// worker.ts
self.onmessage = async (event: MessageEvent) => {
  const { file, albumId } = event.data;

  try {
    const uploadToken = await uploadMediaBytes(file);
    self.postMessage({ success: true, uploadToken });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

// main.ts
const worker = new Worker('worker.ts');
worker.postMessage({ file, albumId });
worker.onmessage = (event) => {
  if (event.data.success) {
    // Continuar com batchCreate
  }
};
```

---

## 🧪 Testes

### Testes de Autenticação

```typescript
describe('GooglePhotosAuthService', () => {
  let authService: GooglePhotosAuthService;

  beforeEach(() => {
    authService = new GooglePhotosAuthService({
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      redirectUri: 'http://localhost:3000/callback',
      scopes: [GooglePhotosScope.PHOTOS_LIBRARY_READONLY],
    });
  });

  it('should generate authorization URL', () => {
    const url = authService.getAuthorizationUrl('state123');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('state=state123');
  });

  it('should exchange code for token', async () => {
    const token = await authService.exchangeCodeForToken('auth-code');
    expect(token.access_token).toBeDefined();
    expect(token.expires_at).toBeGreaterThan(Date.now());
  });

  it('should refresh token automatically', async () => {
    // Simular token expirado
    const token = await authService.getValidToken();
    expect(token).toBeDefined();
  });
});
```

### Testes de Permissões

```typescript
describe('PermissionsService', () => {
  let permsService: PermissionsService;

  beforeEach(() => {
    permsService = new PermissionsService();
  });

  it('should create folder hierarchy', () => {
    const folder = permsService.createFolder(
      'folder-1',
      'Test Folder',
      'album-1',
      undefined,
      'owner@example.com'
    );

    expect(folder.id).toBe('folder-1');
    expect(folder.name).toBe('Test Folder');
    expect(folder.permissions).toHaveLength(1);
    expect(folder.permissions[0].permissionLevel).toBe(PermissionLevel.OWNER);
  });

  it('should grant permission', () => {
    permsService.createFolder('folder-1', 'Test', 'album-1');

    const permission = permsService.grantPermission({
      resourceId: 'folder-1',
      resourceType: ResourceType.FOLDER,
      userId: 'user@example.com',
      permissionLevel: PermissionLevel.EDITOR,
    });

    expect(permission.userId).toBe('user@example.com');
    expect(permission.permissionLevel).toBe(PermissionLevel.EDITOR);
  });

  it('should check hierarchical permissions', () => {
    permsService.createFolder('parent', 'Parent', 'album-1', undefined, 'owner@example.com');
    permsService.createFolder('child', 'Child', 'album-2', 'parent');

    const check = permsService.checkHierarchicalPermission('owner@example.com', 'child');

    expect(check.permissionLevel).toBe(PermissionLevel.OWNER);
    expect(check.actions.canWrite).toBe(true);
  });
});
```

---

## 📝 Checklist de Implementação

- [ ] Configurar variáveis de ambiente (.env)
- [ ] Inicializar GooglePhotosAuthService no App
- [ ] Implementar componente de Login
- [ ] Criar hook useGooglePhotosAuth
- [ ] Implementar componente de Upload
- [ ] Criar hook useMediaUpload
- [ ] Implementar gerenciador de álbuns
- [ ] Criar sistema de permissões
- [ ] Adicionar logs de auditoria
- [ ] Implementar tratamento de erros
- [ ] Adicionar testes unitários
- [ ] Implementar testes de integração
- [ ] Documentar endpoints da API
- [ ] Implementar cache
- [ ] Otimizar performance
- [ ] Deploy em produção

---

**Versão:** 1.0  
**Data:** 2024-12-21  
**Autor:** Gridd360 Development Team
