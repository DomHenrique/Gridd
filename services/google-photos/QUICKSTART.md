# 🚀 Quick Start - Google Photos API Integration

## 5 Minutos de Setup

### 1️⃣ Obter Credenciais do Google (5 min)

```bash
# Acesse: https://console.cloud.google.com/

# 1. Criar novo projeto
# 2. Ativar "Photos Library API"
# 3. Criar OAuth 2.0 ID de cliente (Desktop application)
# 4. Copiar Client ID e Secret
```

### 2️⃣ Configurar Variáveis de Ambiente (1 min)

```bash
# Criar .env.local
cat > .env.local << 'EOF'
REACT_APP_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=seu-client-secret
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
EOF
```

### 3️⃣ Inicializar no App (1 min)

```typescript
// App.tsx ou index.tsx
import { initializeGooglePhotos } from '@/services/google-photos';

useEffect(() => {
  initializeGooglePhotos();
}, []);
```

### 4️⃣ Adicionar Botão de Login (2 min)

```typescript
import { GooglePhotosLoginButton } from '@/services/google-photos/examples';

export function App() {
  return (
    <nav>
      <GooglePhotosLoginButton />
    </nav>
  );
}
```

### 5️⃣ Usar Components (1 min)

```typescript
import {
  GooglePhotosAlbumManager,
  MediaUploadComponent,
  PermissionsManager,
} from '@/services/google-photos/examples';

export function Dashboard() {
  return (
    <div>
      <GooglePhotosAlbumManager />
      <MediaUploadComponent albumId="album-123" />
      <PermissionsManager resourceId="folder-abc" />
    </div>
  );
}
```

---

## 📚 Próximos Passos

### Autenticação
```typescript
const { isAuthenticated, login, logout } = useGooglePhotosAuth();

if (!isAuthenticated) {
  return <button onClick={login}>Login</button>;
}
```

### Criar Álbum com Estrutura
```typescript
const { createAlbum } = useGooglePhotosAlbums();

const album = await createAlbum('Campanhas 2024', [
  { name: 'Instagram', subcategories: ['Stories', 'Feed'] },
  { name: 'Email', subcategories: ['Newsletter'] },
]);
```

### Fazer Upload
```typescript
const { uploadFile, uploadProgress } = useMediaUpload();

const file = document.querySelector('input[type=file]').files[0];
const mediaItem = await uploadFile(file, albumId, 'Descrição');

console.log(`Upload: ${uploadProgress}%`);
```

### Gerenciar Permissões
```typescript
const { grantPermission } = usePermissions(folderId);

await grantPermission('usuario@example.com', 'editor', {
  canCreateSubfolders: true,
  canDeleteContent: true,
});
```

### Pesquisar Mídia
```typescript
const media = getMediaService();

// Todas as fotos
const photos = await media.searchPhotos(50);

// Por conteúdo
const landscapes = await media.searchByContentType('LANDSCAPES');

// Por período
const december = await media.searchByDateRange(
  new Date('2024-12-01'),
  new Date('2024-12-31')
);
```

---

## 🔗 Referências

- 📖 [README.md](./README.md) - Documentação Completa
- 🔧 [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md) - Guia Técnico
- 💻 [examples.tsx](./examples.tsx) - Exemplos de Código
- 📊 [SUMMARY.md](./SUMMARY.md) - Sumário da Implementação
- 📋 [types.ts](./types.ts) - Definição de Tipos

---

## ❓ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| **"Client ID inválido"** | Verificar .env.local e copiar do Google Console |
| **"Token expirado"** | Sistema renova automaticamente, aguarde 5 min |
| **"Sem permissão"** | Verificar scopes no Google Console |
| **"Upload falhou"** | Verificar tamanho e tipo de arquivo |
| **"404 não encontrado"** | Verificar redirect URI no Google Console |

---

**Pronto para usar!** 🎉

Acesse `http://localhost:3000` e teste a integração.
