# ❓ FAQ - Perguntas Frequentes

## 🔐 Autenticação

### P: Como faço login com Google Photos?
**R:** Use o hook `useGooglePhotosAuth()` ou o componente `GooglePhotosLoginButton`:
```typescript
const { login } = useGooglePhotosAuth();
<button onClick={login}>Login</button>
```

### P: O token expira? Como renova?
**R:** Sim, expira em ~1 hora. O sistema renova automaticamente 5 min antes da expiração. Você não precisa fazer nada!

### P: Posso usar o token no backend?
**R:** Sim! Salve o token do `getCurrentToken()` no banco de dados do servidor.

### P: Como fazer logout?
**R:** Use `logout()` do hook ou `revokeToken()` do serviço.

---

## 📤 Upload

### P: Qual é o tamanho máximo de arquivo?
**R:** Padrão é 100 MB. Configurável em `UPLOAD_CONFIG.MAX_FILE_SIZE`.

### P: Quais tipos de arquivo são suportados?
**R:** JPG, PNG, GIF, BMP, WebP, TIFF (fotos) e MP4, MOV, AVI, MKV, WebM (vídeos).

### P: Como monitorar progresso de upload?
**R:** Passe um callback `onProgress` para `uploadMedia()`:
```typescript
await uploadMedia(file, albumId, description, (progress) => {
  console.log(`${progress.progressPercentage}%`);
});
```

### P: Posso fazer upload de múltiplos arquivos?
**R:** Sim, faça upload de um por um em um loop, ou implemente batch com `Promise.all()`.

### P: O que é "upload resumível"?
**R:** Upload que pode ser retomado se a conexão cair. Útil para arquivos grandes.

### P: Como sei se o upload falhou?
**R:** O método lança exceção. Use try/catch:
```typescript
try {
  await uploadMedia(file);
} catch (error) {
  console.error('Upload falhou:', error);
}
```

---

## 🎬 Álbuns

### P: Como criar um álbum?
**R:** Use `createAlbum()`:
```typescript
const album = await createAlbum('Meu Álbum', [
  { name: 'Categoria 1', subcategories: ['Sub 1', 'Sub 2'] }
]);
```

### P: Posso renomear um álbum?
**R:** Google Photos não permite via API. Renomeie localmente na sua app.

### P: Como adicionar fotos a um álbum?
**R:** Use `addMediaItemsToAlbum()`:
```typescript
await addMediaItemsToAlbum('album-id', ['media-id-1', 'media-id-2']);
```

### P: Qual é a diferença entre álbum e pasta?
**R:** 
- **Álbum**: No Google Photos (nuvem)
- **Pasta**: No seu app local (localStorage)

Mapeamos um álbum para uma pasta para adicionar controle de permissões.

### P: Como obter informações do álbum?
**R:** Use `getAlbumStats()` ou `getAlbumShareInfo()`.

---

## 🔒 Permissões

### P: Quais são os níveis de permissão?
**R:** 4 níveis:
- **OWNER**: Tudo
- **EDITOR**: Ler/escrever, com opções granulares
- **VIEWER**: Apenas ler
- **RESTRICTED**: Sem acesso

### P: Como dar acesso a alguém?
**R:** Use `grantPermission()`:
```typescript
grantPermission({
  resourceId: 'folder-id',
  resourceType: 'folder',
  userId: 'usuario@example.com',
  permissionLevel: 'editor',
  canDeleteContent: true,
});
```

### P: Como revogar acesso?
**R:** Use `revokePermission()`:
```typescript
revokePermission('folder-id', 'usuario@example.com');
```

### P: Permissões expõem?
**R:** Sim! Use `expiresAt` para criar permissões temporárias:
```typescript
grantPermission({
  // ...
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
});
```

### P: Posso ver logs de quem fez o quê?
**R:** Sim! Use `getAuditLogs()`:
```typescript
const logs = getAuditLogs(50, { userId: 'usuario@example.com' });
```

---

## 🔍 Pesquisa

### P: Como pesquisar todas as fotos?
**R:** Use `searchPhotos()`:
```typescript
const result = await searchPhotos(50); // 50 fotos mais recentes
```

### P: Como pesquisar por data?
**R:** Use `searchByDateRange()`:
```typescript
const result = await searchByDateRange(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

### P: Como pesquisar por tipo de conteúdo?
**R:** Use `searchByContentType()`:
```typescript
const landscapes = await searchByContentType('LANDSCAPES');
const people = await searchByContentType(['PEOPLE', 'PETS']);
```

### P: Posso combinar filtros?
**R:** Sim! Use `searchMediaItems()` com filtros personalizados:
```typescript
const result = await searchMediaItems({
  pageSize: 50,
  filters: {
    mediaTypeFilter: { mediaTypes: ['PHOTO'] },
    contentFilter: { includedContentCategories: ['LANDSCAPES'] },
    dateFilter: { ranges: [{ startDate: ..., endDate: ... }] },
  },
});
```

### P: Como paginar resultados?
**R:** Use `pageToken`:
```typescript
const page1 = await searchPhotos(50);
const page2 = await searchPhotos(50, page1.nextPageToken);
```

---

## 💾 Cache e Performance

### P: Por que usar cache?
**R:** Reduz requisições à API, melhora performance.

### P: Quanto tempo dados ficam em cache?
**R:**
- Álbuns: 5 minutos
- Itens de mídia: 10 minutos
- Permissões: 15 minutos

Configurável em `CACHE_CONFIG`.

### P: Como limpar o cache?
**R:** Use `clearCache()` ou deixe expirar naturalmente.

### P: Posso desabilitar cache?
**R:** Sim, passe `useCache: false`:
```typescript
await getAlbum('album-id', false);
```

---

## 🔄 Sincronização

### P: O que é sincronização?
**R:** Registra operações offline (upload, delete) para sincronizar depois.

### P: Como sincronizar?
**R:** Use `syncPendingOperations()`:
```typescript
const result = await syncPendingOperations();
console.log(`${result.successCount} sucesso, ${result.failedCount} falha`);
```

### P: O que acontece se perder conexão?
**R:** Operações são registradas em `pendingOperations` e sincronizadas quando reconectar.

### P: Como verificar estado de sincronização?
**R:** Use `getSyncState()`:
```typescript
const state = getSyncState();
console.log(state.pendingOperations); // O que está pendente
```

---

## 🐛 Erros

### P: "Client ID não configurado"
**R:** Configure variáveis de ambiente:
```env
REACT_APP_GOOGLE_CLIENT_ID=seu-id
REACT_APP_GOOGLE_CLIENT_SECRET=seu-secret
```

### P: "Token expirado"
**R:** Sistema renova automaticamente. Se persistir, faça logout e login novamente.

### P: "Permissão negada"
**R:** Verifique se o usuário tem permissão:
```typescript
const check = checkPermission(userId, folderId);
if (!check.actions.canWrite) {
  console.error('Sem permissão');
}
```

### P: "Upload falhou com status 413"
**R:** Arquivo muito grande. Verifique `UPLOAD_CONFIG.MAX_FILE_SIZE`.

### P: "Rate limit exceeded"
**R:** Muitas requisições. Sistema tenta retry automático com backoff.

### P: Como debugar erros?
**R:** Ative logs:
```typescript
localStorage.setItem('DEBUG_GOOGLE_PHOTOS', 'true');
```

---

## 📱 Mobile/Web

### P: Funciona em mobile?
**R:** Sim! Mas com limitações:
- Upload: até 100 MB (configurável)
- Cache: localStorage limitado

### P: Funciona offline?
**R:** Parcialmente:
- Ler dados em cache: Sim
- Fazer operações: Sim (sincronizam depois)
- Novo upload: Não (precisa conexão)

### P: Qual navegador usar?
**R:** Chrome, Firefox, Safari, Edge. Qualquer moderno com suporte a:
- localStorage
- Fetch API
- FormData

---

## 🔧 Desenvolvimento

### P: Como escrever testes?
**R:** Veja exemplos em `TECHNICAL_GUIDE.md`:
```typescript
describe('GooglePhotosAuthService', () => {
  it('should generate auth URL', () => {
    const url = authService.getAuthorizationUrl('state');
    expect(url).toContain('oauth2');
  });
});
```

### P: Como fazer debug?
**R:** Use as ferramentas:
```typescript
console.log(getAuthService().getCurrentToken());
console.log(getPermissionsService().getAuditLogs());
console.log(getMediaService().getSyncState());
```

### P: Posso estender os serviços?
**R:** Sim! Herde das classes:
```typescript
class CustomMediaService extends MediaService {
  async uploadCustom(file) {
    // Seu código
  }
}
```

### P: Como integrar com backend?
**R:** Veja `TECHNICAL_GUIDE.md` - Seção "Integração com Backend".

---

## 📚 Documentação

### P: Onde está a documentação?
**R:**
- `QUICKSTART.md` - Setup rápido
- `README.md` - Documentação principal
- `TECHNICAL_GUIDE.md` - Guia técnico
- `examples.tsx` - Exemplos de código
- `types.ts` - Definição de tipos
- `INDEX.md` - Índice completo

### P: Como encontrar um método específico?
**R:**
1. Procure no `INDEX.md`
2. Procure no `README.md` (Ctrl+F)
3. Veja em `types.ts`
4. Veja em `examples.tsx`

### P: Existe API reference?
**R:** Sim, em `types.ts`. Todas as interfaces e tipos estão documentados.

---

## 💡 Dicas e Truques

### Dica 1: Use singletons
```typescript
// ✅ Correto
const auth = getAuthService();
const media = getMediaService();

// ❌ Evitar
new GooglePhotosAuthService(...);
```

### Dica 2: Sempre verifique permissões
```typescript
const check = checkPermission(userId, folderId);
if (check.actions.canWrite) {
  // Seguro fazer upload
}
```

### Dica 3: Use tipos TypeScript
```typescript
import { MediaItem, PermissionLevel } from '@/services/google-photos';

const item: MediaItem = await getMediaItem('id');
const level: PermissionLevel = 'editor';
```

### Dica 4: Trate erros específicos
```typescript
try {
  await uploadMedia(file);
} catch (error) {
  if (error.statusCode === 401) {
    // Token expirou
  } else if (error.statusCode === 403) {
    // Sem permissão
  }
}
```

### Dica 5: Use hooks em componentes
```typescript
function MyComponent() {
  const { albums } = useGooglePhotosAlbums();
  return <div>{albums.map(a => <p>{a.title}</p>)}</div>;
}
```

---

## 📞 Mais Ajuda?

Se não encontrou resposta aqui:

1. **Procure em:** `README.md` → `TECHNICAL_GUIDE.md` → `types.ts`
2. **Veja exemplo em:** `examples.tsx`
3. **Leia o código:** `auth/auth.service.ts`, etc
4. **Documentação oficial:** [Google Photos Library API](https://developers.google.com/photos/library)

---

**Última atualização:** 21 de dezembro de 2024  
**Versão:** 1.0
