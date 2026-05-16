# WG Serralheria - Gestor de Obras

Este é um aplicativo web projetado para ajudar a WG Serralheria a gerenciar e visualizar fotos de suas obras e projetos de forma eficiente. A plataforma permite que funcionários e gerentes criem álbuns para cada obra, façam upload de fotos do progresso e as acessem de qualquer lugar.

## ✨ Funcionalidades Principais

- **Autenticação de Usuários:** Sistema de login simples baseado em email com três níveis de permissão:
  - `admin`: Controle total sobre projetos, fotos e usuários.
  - `manager`: Pode criar projetos, gerenciar usuários com cargo "padrão" e deletar qualquer foto.
  - `user`: Pode visualizar todos os projetos e adicionar fotos. Pode deletar apenas as fotos que ele mesmo enviou.

- **Dashboard de Projetos:** Uma visão geral em formato de galeria com todos os projetos (obras), exibindo uma imagem de capa, nome, descrição e a quantidade de fotos.

- **Visualização de Álbuns:** Ao clicar em um projeto, o usuário acessa uma galeria de fotos detalhada, onde pode visualizar todas as imagens daquela obra.

- **Gerenciamento de Fotos:**
  - **Upload:** Usuários autenticados podem adicionar novas fotos a um projeto.
  - **Exclusão:** A exclusão de fotos é baseada em permissões para garantir a integridade dos dados.
  - **Visualização:** Modo de visualização em tela cheia para cada foto, com informações de quem a enviou e a data.

- **Busca Rápida:** Dentro de um álbum, é possível buscar fotos pelo nome do autor (quem fez o upload).

- **Gerenciamento de Usuários:** Administradores e Gerentes podem adicionar novos usuários à plataforma.

- **Design Responsivo:** A interface foi construída com Tailwind CSS para se adaptar a diferentes tamanhos de tela, de desktops a celulares.

- **Persistência de Dados (Local):** Utiliza o `localStorage` do navegador para simular um banco de dados, salvando todas as alterações (novos projetos, fotos, usuários) e permitindo o uso offline.

## 💻 Tecnologias Utilizadas

- **Frontend:** React com TypeScript
- **Estilização:** Tailwind CSS
- **Gerenciamento de Estado:** Hooks nativos do React (`useState`, `useEffect`, `useCallback`)
- **Tipagem:** TypeScript

## 📂 Estrutura do Projeto

```
.
├── components/
│   ├── AlbumView.tsx     # Tela de visualização das fotos de um projeto
│   ├── Dashboard.tsx     # Tela principal com a lista de projetos
│   ├── Header.tsx        # Cabeçalho da aplicação
│   ├── icons.tsx         # Componentes de ícones SVG
│   ├── Login.tsx         # Tela de login
│   └── Modal.tsx         # Componente genérico para modais
├── types.ts              # Definições de tipos do TypeScript
├── App.tsx               # Componente principal que gerencia o estado e a lógica
├── minio-simulation.ts   # Simula o upload de arquivos para o MinIO
├── index.html            # Arquivo HTML de entrada
├── index.tsx             # Ponto de entrada do React
└── README.md             # Este arquivo
```

## 🔧 Configuração do Ambiente (`.env`)

Para a versão de produção, a aplicação precisará de um arquivo `.env` na raiz do projeto backend para configurar a conexão com o MinIO e outras informações sensíveis.

```bash
# Configurações do Servidor MinIO (ou outro S3 compatível)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=wg-serralheria-obras

# Outras variáveis
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="seu-segredo-super-secreto"
```

## 🚀 Como Colocar em Produção (Guia Passo a Passo)

A versão atual é um protótipo funcional que utiliza o `localStorage` e simula uploads de imagem. Para colocar a aplicação em produção, é necessário substituir essas partes por um backend robusto e serviços de nuvem.

### Passo 1: Construir um Backend e um Banco de Dados

A lógica de negócios e os dados precisam ser gerenciados por um servidor.

1.  **Escolha da Tecnologia:**
    - **Backend:** Node.js com Express.js é uma excelente escolha.
    - **Banco de Dados:** PostgreSQL para robustez ou MongoDB para flexibilidade.

2.  **Desenvolvimento da API:**
    Crie endpoints para lidar com as operações de CRUD (Criar, Ler, Atualizar, Deletar) para usuários, projetos e fotos. O endpoint de upload de fotos será especialmente importante (veja Passo 4).

### Passo 2: Integrar o Frontend com a API

Substitua a lógica de dados mocados e o `localStorage` no `App.tsx` por chamadas à API que você criou.

- Utilize `axios` ou a `fetch` API para fazer as requisições HTTP.
- Adicione estados de `loading` para feedback visual ao usuário.
- Implemente um tratamento de erros robusto.

### Passo 3: Implementar Autenticação Segura

1.  **Backend:** Use senhas com hash (`bcrypt`) e implemente um sistema de tokens, como o **JWT (JSON Web Tokens)**.
2.  **Frontend:** Armazene o token JWT no `localStorage` e envie-o no cabeçalho `Authorization` de cada requisição para rotas protegidas.

### Passo 4: Configurar Armazenamento de Imagens com MinIO (S3)

As imagens devem ser armazenadas em um serviço de armazenamento de objetos, não no servidor do backend. O **MinIO** é uma excelente alternativa auto-hospedada aos serviços de nuvem como AWS S3.

1.  **Instale e Configure o MinIO:** Siga a documentação oficial do MinIO para iniciar seu próprio servidor de armazenamento. Crie um "bucket" (ex: `wg-serralheria-obras`) e configure suas políticas de acesso.

2.  **Fluxo de Upload:**
    a. O usuário seleciona a imagem no frontend.
    b. O frontend envia a imagem para um endpoint específico no backend (ex: `POST /projects/:id/photos`).
    c. O backend recebe o arquivo e, usando o SDK do MinIO (ou AWS S3), faz o upload do arquivo para o bucket que você criou.
    d. O MinIO retorna a URL permanente do objeto armazenado.
    e. O backend salva essa URL no banco de dados, associada ao projeto correspondente.
    f. O backend retorna a informação da nova foto (incluindo a URL) para o frontend, que atualiza a interface.

### Passo 5: Gerenciar Variáveis de Ambiente

Use o arquivo `.env` (descrito na seção "Configuração do Ambiente") para gerenciar todas as chaves de API e credenciais de forma segura no seu backend.

### Passo 6: Build e Hospedagem

1.  **Build do Frontend:**
    - Use uma ferramenta como Vite ou Create React App.
    - Rode o comando de build (ex: `npm run build`) para gerar os arquivos estáticos.

2.  **Hospedagem:**
    - **Frontend (Estático):** Vercel, Netlify, ou AWS S3/CloudFront.
    - **Backend:** Heroku, Render, ou um servidor próprio (VPS, Docker).
    - **MinIO:** Pode ser hospedado no mesmo servidor do backend ou em uma máquina separada, preferencialmente usando Docker.

Seguindo esses passos, você transformará este protótipo em uma aplicação web completa, segura e escalável, pronta para ser utilizada pela equipe da WG Serralheria.
