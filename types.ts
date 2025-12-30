// === DATABASE STRUCTURE DEFINITIONS ===

export type UserRole = 'superuser' | 'client';
export type AccessLevel = 'viewer' | 'editor' | 'admin'; // 'viewer' = read, 'editor' = write, 'admin' = all

export interface FolderPermission {
  folderId: string;
  accessLevel: AccessLevel;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  permissions: FolderPermission[]; // Explicit folder permissions
}

export interface FileAsset {
  id: string;
  folderId: string;
  name: string;
  url: string; // URL to storage
  type: 'image' | 'video' | 'document';
  size: string;
  uploadedBy: string; // User ID
  createdAt: string; // ISO Date
  note?: string; // User annotation
}

export interface Folder {
  id: string;
  parentId: string | null; // Null if root
  name: string;
  note?: string; // Folder description/annotation
  ownerId?: string; // If null, global/superuser
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'UPLOAD' | 'DELETE' | 'RENAME' | 'CREATE_FOLDER' | 'USER_CREATE' | 'PERM_UPDATE' | 'UPDATE_FOLDER';
  targetName: string; // Name of file or folder
  timestamp: string;
  details?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

// === PORTFOLIO ===

export type PortfolioCategoryType = 'Eventos' | 'Campanhas' | 'Branding';

export interface PortfolioItem {
  id: string;
  title: string;
  category: PortfolioCategoryType;
  client: string;
  subtitle?: string; // e.g. "Vendas • Varejo"
  description: string;
  imageUrl: string;
  year?: string;
  tags: string[];
  isHighlight?: boolean;
}