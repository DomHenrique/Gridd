
export interface Photo {
  id: string;
  url: string;
  uploadedBy: string;
  timestamp: string;
  tags: string[]; // Tags para categorização e busca
}

export interface Client {
  id: string;
  name: string;
  description: string; // Descrição da campanha ou do cliente
  coverImage: string; // Logo ou imagem da campanha principal
  photos: Photo[]; // Arquivos criativos
  folders?: Folder[];
}

export interface Folder {
    id: string;
    clientId: string;
    parentId: string | null;
    name: string;
    createdAt: string;
    createdBy: string;
    thumbnailUrl?: string; // Optional custom thumbnail
}

export interface Photo {
  id: string;
  url: string;
  uploadedBy: string;
  timestamp: string;
  tags: string[];
  folderId?: string;
  mimeType?: string;
  size?: number;
  originalName?: string;
}

export interface User {
  id?: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  name: string;
  allowedClientIds?: string[]; // IDs dos clientes que este usuário pode acessar
}

export interface ActivityLog {
    id: string;
    client_id: string;
    folder_id?: string;
    user_id: string;
    action_type: 'upload' | 'delete' | 'create_folder' | 'delete_folder';
    details: any;
    timestamp: string;
    user?: { name: string }; // For display join
}

export type View = 'dashboard' | 'client';
