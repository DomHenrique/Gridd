# Google Photos Library API Integration

Integração completa com a **Google Photos Library API** para o Gridd360 Asset Manager, incluindo autenticação OAuth 2.0, gerenciamento de permissões por pasta, upload/download de mídia e organização de álbuns.

## 📋 Estrutura de Diretórios

```
services/google-photos/
├── index.ts                          # Arquivo principal de exports
├── types.ts                          # Tipos TypeScript (200+ linhas)
├── api.service.ts                    # Serviço principal da API
├── auth/
│   └── auth.service.ts              # Autenticação OAuth 2.0
├── permissions/
│   └── permissions.service.ts       # Gerenciamento de permissões
├── albums/
│   └── albums.service.ts            # Gerenciamento de álbuns
├── media/
│   └── media.service.ts             # Gerenciamento de mídia
├── config/
│   └── config.ts                    # Configuração e variáveis
└── README.md                         # Esta documentação
```

## 🔐 Autenticação OAuth 2.0

### Configuração Inicial

1. **Obter credenciais do Google Console:**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um novo projeto
   - Ative a "Photos Library API"
   - Crie OAuth 2.0 credentials (Client ID + Secret)

2. **Configurar variáveis de ambiente (`.env`):**

```env
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=seu-client-secret
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

3. **Inicializar no aplicativo:**

```typescript
import { initializeGooglePhotos } from '@/services/google-photos';

// No App.tsx ou index.tsx
initializeGooglePhotos();
```

### Fluxo de Autenticação

```typescript
import { getAuthService } from '@/services/google-photos';

const auth = getAuthService();

// 1. Obter URL de autorização
const authUrl = auth.getAuthorizationUrl(state);
window.location.href = authUrl;

// 2. Após redirecionamento, trocar código por token
const token = await auth.exchangeCodeForToken(code);

// 3. Token é renovado automaticamente quando expira
const validToken = await auth.getValidToken();

// 4. Verificar autenticação
if (auth.isAuthenticated()) {
  // Usuário autenticado
}

// 5. Fazer logout
await auth.revokeToken();
```

## 📂 Gerenciamento de Permissões

### Estrutura de Pastas

O sistema organiza álbuns do Google Photos em uma hierarquia local:

```
Álbum (Raiz)
├── Categoria 1
│   ├── Subcategoria 1.1
│   └── Subcategoria 1.2
├── Categoria 2
│   └── Subcategoria 2.1
└── Categoria 3
```

### Níveis de Permissão

| Nível | Leitura | Escrita | Delete | Compartilhar | Criar Subpastas | Admin |
|-------|---------|---------|--------|--------------|-----------------|-------|
| **OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EDITOR** | ✅ | ✅ | ⚙️ | ⚙️ | ⚙️ | ❌ |
| **VIEWER** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **RESTRICTED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

⚙️ = Configurável

### Exemplo de Uso

```typescript
import { getPermissionsService } from '@/services/google-photos';

const permissions = getPermissionsService();

// 1. Criar pasta com hierarquia
const folder = permissions.createFolder(
  'folder-id',
  'Minha Pasta',
  'google-album-id',
  'parent-folder-id'
);

// 2. Conceder permissão a usuário
permissions.grantPermission({
  resourceId: 'folder-id',
  resourceType: 'folder',
  userId: 'user@example.com',
  permissionLevel: 'editor',
  canCreateSubfolders: true,
  canDeleteContent: false,
  canShareFolder: true,
});

// 3. Verificar permissões
const check = permissions.checkPermission('user@example.com', 'folder-id', 'write');

console.log(check.permissionLevel);    // 'editor'
console.log(check.actions.canWrite);   // true
console.log(check.actions.canDelete);  // false

// 4. Revogar permissão
permissions.revokePermission('folder-id', 'user@example.com');

// 5. Listar todas as permissões de uma pasta
const perms = permissions.getFolderPermissions('folder-id');

// 6. Obter todos os logs de auditoria
const logs = permissions.getAuditLogs(50, {
  userId: 'user@example.com',
  action: 'GRANT_PERMISSION',
});
```

## 🎬 Gerenciamento de Álbuns

```typescript
import { getAlbumsService } from '@/services/google-photos';

const albums = getAlbumsService();

// 1. Criar álbum com estrutura de categorias
const album = await albums.createAlbum('Campanhas 2024', [
  {
    name: 'Redes Sociais',
    subcategories: ['Instagram', 'Facebook', 'LinkedIn'],
  },
  {
    name: 'Email Marketing',
    subcategories: ['Newsletter', 'Promover'],
  },
]);

// 2. Listar álbuns
const response = await albums.listAlbums(50);

// 3. Listar álbuns de um usuário específico
const userAlbums = await albums.listUserAlbums('user@example.com');

// 4. Adicionar mídia ao álbum
await albums.addMediaItemsToAlbum('album-id', ['media-id-1', 'media-id-2']);

// 5. Enriquecer álbum com informações
await albums.enrichAlbumWithText('album-id', 'Descrição do álbum');
await albums.enrichAlbumWithLocation('album-id', -23.5505, -46.6333, 10); // SP com 10km
await albums.enrichAlbumWithDateRange(
  'album-id',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// 6. Obter estatísticas
const stats = await albums.getAlbumStats('album-id');
console.log(stats.itemCount);
console.log(stats.hasWriteAccess);

// 7. Verificar permissões de escrita
const canEdit = await albums.canEditAlbum('user@example.com', 'album-id');

// 8. Obter lista de acesso
const accessList = albums.getAlbumAccessList('album-id');
```

## 📸 Gerenciamento de Mídia

### Upload de Arquivos

```typescript
import { getMediaService } from '@/services/google-photos';

const media = getMediaService();

// Upload simples
const file = new File([...], 'photo.jpg', { type: 'image/jpeg' });

const mediaItem = await media.uploadMedia(
  file,
  'album-id',
  'Descrição da foto',
  (progress) => {
    console.log(`${progress.progressPercentage}% uploaded`);
    console.log(`Speed: ${progress.speed} bytes/ms`);
  }
);

// Upload com monitoramento de progresso
const session = await media.uploadMediaResumable(
  file,
  'album-id',
  'Descrição',
  (progress) => {
    updateProgressBar(progress.progressPercentage);
    updateETA(progress.estimatedTimeRemaining);
  }
);
```

### Pesquisa de Mídia

```typescript
// Buscar todas as fotos
const photos = await media.searchPhotos(50);

// Buscar vídeos
const videos = await media.searchVideos(50);

// Buscar favoritos
const favorites = await media.searchFavorites();

// Pesquisa por conteúdo
const landscapes = await media.searchByContentType('LANDSCAPES');
const people = await media.searchByContentType(['PEOPLE', 'PETS']);

// Pesquisa por período
const decemberPhotos = await media.searchByDateRange(
  new Date('2024-12-01'),
  new Date('2024-12-31')
);

// Pesquisa avançada com filtros
const results = await media.searchMediaItems({
  pageSize: 50,
  orderBy: 'NEWEST_FIRST',
  filters: {
    mediaTypeFilter: {
      mediaTypes: ['PHOTO'],
    },
    contentFilter: {
      includedContentCategories: ['LANDSCAPES', 'NATURE'],
    },
    dateFilter: {
      ranges: [
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      ],
    },
  },
});

// Obter item específico
const item = await media.getMediaItem('media-id');

// Obter múltiplos itens
const items = await media.getMediaItems(['id-1', 'id-2', 'id-3']);
```

### Obter URLs de Mídia

```typescript
// URL completa
const url = media.getMediaUrl(mediaItem);

// URL com dimensões específicas
const resizedUrl = media.getMediaUrl(mediaItem, 800, 600);

// Thumbnail
const thumbnail = media.getThumbnailUrl(mediaItem, 'large');

// Verificar acesso
const canAccess = media.canAccessMedia('user@example.com', 'album-id');
const canEdit = media.canEditMedia('user@example.com', 'album-id');
```

## 🔄 Sincronização

```typescript
import { getMediaService } from '@/services/google-photos';

const media = getMediaService();

// Obter estado de sincronização
const syncState = media.getSyncState();
console.log(syncState.lastSync);           // Timestamp último sync
console.log(syncState.pendingOperations);  // Operações pendentes
console.log(syncState.conflictingItems);   // Itens com conflito

// Sincronizar operações pendentes
const result = await media.syncPendingOperations();
console.log(result.successCount);  // Operações bem-sucedidas
console.log(result.failedCount);   // Operações falhadas
console.log(result.conflicts);     // Conflitos detectados

// Limpar uploads inativos
media.clearInactiveUploads(24 * 60 * 60 * 1000); // 24 horas
```

## ⚙️ Configuração

### Arquivo de Configuração

O arquivo `services/google-photos/config/config.ts` contém:

```typescript
// Limites de upload
UPLOAD_CONFIG.MAX_FILE_SIZE           // 100 MB
UPLOAD_CONFIG.MAX_TOTAL_SIZE          // 1 GB
UPLOAD_CONFIG.MAX_RETRIES             // 3 tentativas

// Cache
CACHE_CONFIG.ALBUMS_CACHE_DURATION    // 5 minutos
CACHE_CONFIG.MEDIA_ITEMS_CACHE_DURATION // 10 minutos

// Sincronização
SYNC_CONFIG.AUTO_SYNC_INTERVAL        // 5 minutos
SYNC_CONFIG.BATCH_SIZE                // 50 itens

// Segurança
SECURITY_CONFIG.SESSION_TIMEOUT       // 1 hora
SECURITY_CONFIG.ENABLE_AUDIT_LOGS     // true
```

### Personalizar Configuração

```typescript
import { updateConfig } from '@/services/google-photos';

updateConfig({
  clientId: 'novo-client-id',
  clientSecret: 'novo-secret',
  redirectUri: 'https://seu-dominio.com/auth/callback',
});
```

## 📊 Auditoria

```typescript
import { getPermissionsService } from '@/services/google-photos';

const permissions = getPermissionsService();

// Obter logs de auditoria (últimos 50)
const logs = permissions.getAuditLogs(50);

// Filtrar por usuário
const userLogs = permissions.getAuditLogs(100, {
  userId: 'user@example.com',
});

// Filtrar por ação
const grantLogs = permissions.getAuditLogs(100, {
  action: 'GRANT_PERMISSION',
});

// Filtrar por tipo de recurso
const folderLogs = permissions.getAuditLogs(100, {
  resourceType: 'folder',
});

// Cada log contém:
console.log(log.id);              // ID único
console.log(log.timestamp);       // Data/hora
console.log(log.userId);          // Quem fez
console.log(log.action);          // O que fez
console.log(log.resourceType);    // Tipo de recurso
console.log(log.resourceId);      // ID do recurso
console.log(log.changes);         // Antes/depois
console.log(log.status);          // SUCCESS/FAILED
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca commitar credenciais:**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Usar variáveis de ambiente:**
   ```typescript
   // ✅ Correto
   const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
   
   // ❌ Evitar
   const clientId = 'abc123...';
   ```

3. **Validar tokens:**
   ```typescript
   const auth = getAuthService();
   const token = await auth.getValidToken(); // Renova se expirado
   ```

4. **Sessão com timeout:**
   - Configurado em `SECURITY_CONFIG.SESSION_TIMEOUT`
   - Padrão: 1 hora

5. **Logs de auditoria:**
   - Todas as operações são registradas
   - Máximo 5000 registros mantidos

## 🚀 Exemplos Completos

### Exemplo 1: Setup Inicial

```typescript
// 1. Importar
import { initializeGooglePhotos, getAuthService } from '@/services/google-photos';

// 2. Inicializar
initializeGooglePhotos();

// 3. Checar autenticação
const auth = getAuthService();
if (!auth.isAuthenticated()) {
  // Fazer login
  const authUrl = auth.getAuthorizationUrl();
  window.location.href = authUrl;
}
```

### Exemplo 2: Criar Estrutura de Projeto

```typescript
import { getAlbumsService, getPermissionsService } from '@/services/google-photos';

const albums = getAlbumsService();
const permissions = getPermissionsService();

// 1. Criar álbum para projeto
const projectAlbum = await albums.createAlbum('Projeto ABC', [
  { name: 'Briefing', subcategories: ['Estratégia', 'Referências'] },
  { name: 'Produção', subcategories: ['Fotos', 'Vídeos', 'Edição'] },
  { name: 'Aprovação', subcategories: ['Cliente', 'Interno'] },
]);

// 2. Dar acesso aos membros
const folderPerms = permissions.getPermissionsService();
folderPerms.grantPermission({
  resourceId: `album_${projectAlbum.id}`,
  resourceType: 'folder',
  userId: 'designer@example.com',
  permissionLevel: 'editor',
  canCreateSubfolders: true,
  canDeleteContent: true,
});

folderPerms.grantPermission({
  resourceId: `album_${projectAlbum.id}`,
  resourceType: 'folder',
  userId: 'client@example.com',
  permissionLevel: 'viewer',
});
```

### Exemplo 3: Upload e Organização

```typescript
import { getMediaService, getAlbumsService } from '@/services/google-photos';

const media = getMediaService();
const albums = getAlbumsService();

// 1. Upload de arquivo
const file = document.getElementById('file-input').files[0];
const mediaItem = await media.uploadMedia(
  file,
  projectAlbum.id,
  'Design final aprovado',
  (progress) => console.log(`${progress.progressPercentage}% done`)
);

// 2. Adicionar a subcategoria
await albums.addMediaItemsToAlbum(`album_${projectAlbum.id}_cat_0_sub_0`, [mediaItem.id]);

// 3. Enriquecer
await albums.enrichAlbumWithText(mediaItem.id, 'Versão final - 2024-01-15');
```

## 🐛 Troubleshooting

### Erro: "Client ID não configurado"

```
AVISO: Google Client ID não configurado.
Configure REACT_APP_GOOGLE_CLIENT_ID no arquivo .env
```

**Solução:** Adicionar variáveis de ambiente no `.env`

### Erro: "Token expirado"

```typescript
// GooglePhotosAuthService renova automaticamente
const token = await auth.getValidToken(); // Já renova se necessário
```

### Erro: "Permissão negada para álbum"

```typescript
// Verificar permissões
const check = permissions.checkPermission(userId, folderId, '');
if (!check.actions.canWrite) {
  console.log('Usuário não tem permissão de escrita');
}
```

## 📚 Referências

- [Google Photos Library API](https://developers.google.com/photos/library)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [API Reference](https://developers.google.com/photos/library/reference/rest)
- [Upload Media Guide](https://developers.google.com/photos/library/guides/upload-media)

## 📝 Próximas Implementações

- [ ] Criptografia de dados sensíveis no localStorage
- [ ] Suporte a compartilhamento avançado
- [ ] Cache com IndexedDB para datasets grandes
- [ ] Sincronização em tempo real com WebSocket
- [ ] Backup automático de metadados
- [ ] Integração com banco de dados backend
- [ ] API REST para operações batidas
- [ ] Suporte a colaboração em tempo real

## 📄 Licença

Copyright © 2024 Gridd360. Todos os direitos reservados.
