

## 📖 Visão Geral

O **Gridd360 Asset Manager** é uma solução empresarial projetada para centralizar, organizar e gerenciar permissões de ativos digitais (imagens, vídeos e documentos). O sistema combina a robustez do **Supabase** para dados e autenticação com a flexibilidade da biblioteca do **Google Photos**.

### ✨ Diferenciais
- 🔐 **Autenticação Híbrida**: Google OAuth 2.0 (Implicit Flow) e Email/Senha tradicionais.
- 📂 **Gestão de Pastas**: Estrutura hierárquica com controle de acesso granular.
- 🛡️ **Permissões Inteligentes**: Sistema RBAC (Viewer, Editor, Admin) com herança automática para subpastas.
- 📊 **Auditoria Completa**: Logs de atividades detalhados com filtros de período e usuário.
- 🎨 **UI/UX Premium**: Interface moderna construída com React, Bootstrap e Lucide Icons.

---

## 🛠️ Tecnologias

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Bootstrap 5](https://getbootstrap.com/), Vanilla CSS, [Lucide Icons](https://lucide.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Integrações**: [Google Photos API](https://developers.google.com/photos)
- **IA**: Integração com Google Gemini para análise de ativos (opcional).

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js (v18+)
- Conta no Supabase
- Google Cloud Project (para OAuth)

### Instalação
```bash
# 1. Clone o repositório e instale dependências
npm install

# 2. Configure o ambiente
cp .env.example .env.local
# Preencha as chaves no .env.local (veja seção de Configuração abaixo)

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

---

## ⚙️ Configuração de Ambiente

Crie um arquivo `.env.local` na raiz com as seguintes chaves:

```env
# Supabase
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Google OAuth
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com

# Aplicação
VITE_APP_URL=http://localhost:5173
```

---

## 🏗️ Arquitetura e Lógica

### 🔐 Autenticação (Google Photos)
Para evitar erros de CORS e facilitar a integração frontend, utilizamos o **Implicit Flow** do Google. 
- O token é recebido via hash na URL (`#access_token=...`).
- Tokens do Google são persistidos no Supabase através do `GoogleTokenService` para facilitar o uso da API de Fotos sem re-login imediato.

### 🛡️ Sistema de Permissões (RBAC)
O acesso às pastas é controlado via tabela `folder_access`.
- **Viewer**: Visualização e download.
- **Editor**: Upload e alteração de nomes.
- **Admin**: Controle total, incluindo gestão de subpastas.
- **Herança**: Implementada via função SQL recursiva `public.has_folder_access(folder_id, user_id, level)`. Se um usuário tem acesso a uma pasta pai, ele automaticamente tem acesso às filhas.

### 📊 Relatórios e Auditoria
Superusuários têm acesso a uma aba de **Relatórios** onde:
- Podem filtrar atividades por intervalo de datas.
- Podem filtrar por usuário específico.
- Podem exportar os dados em formato **CSV**.

---

## 📁 Estrutura do Projeto

- `/components`: Componentes reutilizáveis (FolderExplorer, UserManagement, ActivityReports).
- `/pages`: Páginas principais (Dashboard, LoginPage, PortfolioPage).
- `/services`: Lógica de negócio e integração (dataService, supabase, google-photos).
- `/database`: Scripts SQL de migração e estrutura do banco.
- `/types`: Definições globais de tipos TypeScript.

---

## 🎓 Guia do Desenvolvedor

### Como adicionar uma nova regra de acesso?
1. Atualize o tipo `AccessLevel` em `types.ts`.
2. Modifique a função SQL `has_folder_access` no Supabase se houver lógica de herança customizada.
3. Atualize os componentes `UserManagement` e `FolderExplorer` para refletir as novas regras na UI.

### Como logar uma nova atividade?
Use o método `DataService.logActivity(userId, action, targetName)` disponível em `services/dataService.ts`.

---

## 📜 Histórico de Melhorias Recentes
- ✅ **Refatoração Supabase**: Migração completa dos dados mockados para o Supabase real.
- ✅ **Correção Google OAuth**: Mudança para Implicit Flow eliminando erros de CORS.
- ✅ **Dashboard Unificado**: Integração das abas de Usuários e Relatórios no Painel Administrativo.
- ✅ **Acessibilidade**: Correção de problemas de contraste e adição de `titles` em todos os elementos interativos.

---

<div align="center">
  <p>Desenvolvido com ❤️ pela equipe Gridd360</p>
  <p><strong>Copyright © 2025 - Gridd360 - HN Performance Digital </strong></p>
</div>
