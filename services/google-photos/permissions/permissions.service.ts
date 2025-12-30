/**
 * Serviço de Gerenciamento de Permissões por Pasta
 * Respeitando a hierarquia de folders e permissões granulares
 */

import {
  FolderHierarchy,
  FolderPermission,
  PermissionLevel,
  ResourceType,
  PermissionCheck,
  PermissionRequest,
  AuditLog,
} from '../types';

interface StorageDatabase {
  folders: Map<string, FolderHierarchy>;
  permissions: Map<string, FolderPermission[]>;
  auditLogs: AuditLog[];
}

/**
 * Serviço para gerenciar permissões em pastas/álbuns
 * Implementa controle de acesso granular respeitando hierarquia
 */
export class PermissionsService {
  private db: StorageDatabase = {
    folders: new Map(),
    permissions: new Map(),
    auditLogs: [],
  };

  private readonly STORAGE_KEY = 'gridd360_folders_db';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Cria uma nova pasta com hierarquia
   */
  createFolder(
    id: string,
    name: string,
    albumId: string,
    parentId?: string,
    ownerId?: string
  ): FolderHierarchy {
    // Validar se pasta pai existe
    if (parentId && !this.db.folders.has(parentId)) {
      throw new Error(`Pasta pai com ID ${parentId} não existe`);
    }

    const folder: FolderHierarchy = {
      id,
      name,
      parentId,
      albumId,
      permissions: [],
      subfolders: [],
      mediaItems: [],
    };

    // Adicionar permissão para o owner se fornecido
    if (ownerId) {
      const ownerPermission: FolderPermission = {
        id: `perm_${id}_${ownerId}_${Date.now()}`,
        folderId: id,
        userId: ownerId,
        permissionLevel: PermissionLevel.OWNER,
        canCreateSubfolders: true,
        canDeleteContent: true,
        canShareFolder: true,
        grantedAt: new Date(),
      };
      folder.permissions.push(ownerPermission);
      this.db.permissions.set(id, [ownerPermission]);
    }

    // Adicionar à pasta pai se existir
    if (parentId) {
      const parentFolder = this.db.folders.get(parentId);
      if (parentFolder) {
        parentFolder.subfolders.push(folder);
      }
    }

    this.db.folders.set(id, folder);
    this.saveToStorage();
    this.logAudit({
      action: 'CREATE_FOLDER',
      resourceType: ResourceType.FOLDER,
      resourceId: id,
      userId: ownerId || 'system',
    });

    return folder;
  }

  /**
   * Obtém uma pasta e sua hierarquia completa
   */
  getFolder(folderId: string): FolderHierarchy | null {
    return this.db.folders.get(folderId) || null;
  }

  /**
   * Lista todas as pastas raiz
   */
  listRootFolders(): FolderHierarchy[] {
    return Array.from(this.db.folders.values()).filter((f) => !f.parentId);
  }

  /**
   * Lista subpastas de uma pasta pai
   */
  listSubfolders(parentId: string): FolderHierarchy[] {
    const parent = this.db.folders.get(parentId);
    return parent ? parent.subfolders : [];
  }

  /**
   * Cria a hierarquia de pastas a partir de um álbum do Google Photos
   * Estrutura: Album -> Categoria -> Subcategoria -> Itens
   */
  createFolderStructureFromAlbum(
    albumId: string,
    albumTitle: string,
    categories: { name: string; subcategories?: string[] }[]
  ): FolderHierarchy {
    // Criar pasta raiz para o álbum
    const rootFolderId = `album_${albumId}`;
    const rootFolder = this.createFolder(rootFolderId, albumTitle, albumId);

    // Criar categorias
    categories.forEach((category, categoryIndex) => {
      const categoryFolderId = `${rootFolderId}_cat_${categoryIndex}`;
      const categoryFolder = this.createFolder(
        categoryFolderId,
        category.name,
        `${albumId}_cat_${categoryIndex}`,
        rootFolderId
      );

      // Criar subcategorias se existirem
      if (category.subcategories) {
        category.subcategories.forEach((subcategory, subIndex) => {
          this.createFolder(
            `${categoryFolderId}_sub_${subIndex}`,
            subcategory,
            `${albumId}_cat_${categoryIndex}_sub_${subIndex}`,
            categoryFolderId
          );
        });
      }
    });

    return this.getFolder(rootFolderId)!;
  }

  /**
   * Concede permissão a um usuário em uma pasta
   */
  grantPermission(request: PermissionRequest): FolderPermission {
    const folder = this.db.folders.get(request.resourceId);
    if (!folder) {
      throw new Error(`Pasta com ID ${request.resourceId} não existe`);
    }

    // Validar se quem concede tem permissão
    // (simplificado - em produção verificar token/session)

    // Verificar se já tem permissão
    const existingPermissions = this.db.permissions.get(request.resourceId) || [];
    const existingPerm = existingPermissions.find((p) => p.userId === request.userId);

    if (existingPerm) {
      // Atualizar permissão existente
      existingPerm.permissionLevel = request.permissionLevel;
      existingPerm.canCreateSubfolders = request.canCreateSubfolders ?? false;
      existingPerm.canDeleteContent = request.canDeleteContent ?? false;
      existingPerm.canShareFolder = request.canShareFolder ?? false;
      existingPerm.expiresAt = request.expiresAt;

      this.saveToStorage();
      this.logAudit({
        action: 'UPDATE_PERMISSION',
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        userId: request.userId,
        changes: {
          before: existingPerm,
          after: existingPerm,
        },
      });

      return existingPerm;
    }

    // Criar nova permissão
    const permission: FolderPermission = {
      id: `perm_${request.resourceId}_${request.userId}_${Date.now()}`,
      folderId: request.resourceId,
      userId: request.userId,
      permissionLevel: request.permissionLevel,
      canCreateSubfolders: request.canCreateSubfolders ?? false,
      canDeleteContent: request.canDeleteContent ?? false,
      canShareFolder: request.canShareFolder ?? false,
      grantedAt: new Date(),
      expiresAt: request.expiresAt,
    };

    const permissions = this.db.permissions.get(request.resourceId) || [];
    permissions.push(permission);
    this.db.permissions.set(request.resourceId, permissions);
    folder.permissions.push(permission);

    this.saveToStorage();
    this.logAudit({
      action: 'GRANT_PERMISSION',
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      userId: request.userId,
    });

    return permission;
  }

  /**
   * Revoga permissão de um usuário
   */
  revokePermission(folderId: string, userId: string): void {
    const folder = this.db.folders.get(folderId);
    if (!folder) {
      throw new Error(`Pasta com ID ${folderId} não existe`);
    }

    // Remover de folder.permissions
    folder.permissions = folder.permissions.filter((p) => p.userId !== userId);

    // Remover do mapa de permissões
    const permissions = this.db.permissions.get(folderId) || [];
    const filteredPermissions = permissions.filter((p) => p.userId !== userId);
    this.db.permissions.set(folderId, filteredPermissions);

    this.saveToStorage();
    this.logAudit({
      action: 'REVOKE_PERMISSION',
      resourceType: ResourceType.FOLDER,
      resourceId: folderId,
      userId,
    });
  }

  /**
   * Obtém todas as permissões de uma pasta
   */
  getFolderPermissions(folderId: string): FolderPermission[] {
    return this.db.permissions.get(folderId) || [];
  }

  /**
   * Verifica se um usuário tem permissão para uma ação
   */
  checkPermission(userId: string, folderId: string, action: string): PermissionCheck {
    const folder = this.db.folders.get(folderId);
    if (!folder) {
      throw new Error(`Pasta com ID ${folderId} não existe`);
    }

    const permission = folder.permissions.find((p) => p.userId === userId);
    const actions = this.getAvailableActions(permission);

    const result: PermissionCheck = {
      resource: {
        id: folderId,
        type: ResourceType.FOLDER,
      },
      user: {
        id: userId,
      },
      permissionLevel: permission?.permissionLevel || PermissionLevel.RESTRICTED,
      actions,
    };

    // Verificar expiração
    if (permission?.expiresAt && new Date() > permission.expiresAt) {
      // Permissão expirou
      this.revokePermission(folderId, userId);
      result.permissionLevel = PermissionLevel.RESTRICTED;
      result.actions = this.getAvailableActions(undefined);
    }

    return result;
  }

  /**
   * Verifica recursivamente as permissões considerando hierarquia
   */
  checkHierarchicalPermission(userId: string, folderId: string): PermissionCheck {
    const check = this.checkPermission(userId, folderId, '');

    // Se não tem permissão, verificar pasta pai
    if (
      check.permissionLevel === PermissionLevel.RESTRICTED &&
      this.db.folders.has(folderId)
    ) {
      const folder = this.db.folders.get(folderId)!;
      if (folder.parentId) {
        return this.checkHierarchicalPermission(userId, folder.parentId);
      }
    }

    return check;
  }

  /**
   * Retorna ações disponíveis com base no nível de permissão
   */
  private getAvailableActions(permission?: FolderPermission) {
    const actions = {
      canRead: false,
      canWrite: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
      canCreateSubfolders: false,
    };

    if (!permission) {
      return actions;
    }

    switch (permission.permissionLevel) {
      case PermissionLevel.OWNER:
        actions.canRead = true;
        actions.canWrite = true;
        actions.canDelete = true;
        actions.canShare = true;
        actions.canManagePermissions = true;
        actions.canCreateSubfolders = true;
        break;

      case PermissionLevel.EDITOR:
        actions.canRead = true;
        actions.canWrite = true;
        actions.canDelete = permission.canDeleteContent;
        actions.canShare = permission.canShareFolder;
        actions.canManagePermissions = false;
        actions.canCreateSubfolders = permission.canCreateSubfolders;
        break;

      case PermissionLevel.VIEWER:
        actions.canRead = true;
        actions.canWrite = false;
        actions.canDelete = false;
        actions.canShare = false;
        actions.canManagePermissions = false;
        actions.canCreateSubfolders = false;
        break;

      case PermissionLevel.RESTRICTED:
      default:
        // Sem permissões
        break;
    }

    return actions;
  }

  /**
   * Obtém todas as pastas de um usuário
   */
  getUserFolders(userId: string): FolderHierarchy[] {
    const userFolders: FolderHierarchy[] = [];

    this.db.folders.forEach((folder) => {
      const hasPermission = folder.permissions.some((p) => p.userId === userId);
      if (hasPermission) {
        userFolders.push(folder);
      }
    });

    return userFolders;
  }

  /**
   * Registra auditoria
   */
  private logAudit(data: Partial<AuditLog>): void {
    const log: AuditLog = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      userId: data.userId || 'unknown',
      action: data.action || 'UNKNOWN',
      resourceType: data.resourceType || ResourceType.FOLDER,
      resourceId: data.resourceId || '',
      changes: data.changes,
      status: 'SUCCESS',
    };

    this.db.auditLogs.push(log);

    // Manter apenas últimos 1000 logs
    if (this.db.auditLogs.length > 1000) {
      this.db.auditLogs = this.db.auditLogs.slice(-1000);
    }

    this.saveToStorage();
  }

  /**
   * Obtém logs de auditoria
   */
  getAuditLogs(
    limit: number = 100,
    filters?: {
      userId?: string;
      resourceType?: ResourceType;
      action?: string;
    }
  ): AuditLog[] {
    let logs = this.db.auditLogs;

    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }

    if (filters?.resourceType) {
      logs = logs.filter((l) => l.resourceType === filters.resourceType);
    }

    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Salva o banco de dados no localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        folders: Array.from(this.db.folders.entries()),
        permissions: Array.from(this.db.permissions.entries()),
        auditLogs: this.db.auditLogs,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Carrega o banco de dados do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.db.folders = new Map(data.folders);
        this.db.permissions = new Map(data.permissions);
        this.db.auditLogs = data.auditLogs || [];
      }
    } catch (error) {
      console.warn('Erro ao carregar do localStorage:', error);
    }
  }

  /**
   * Limpa todos os dados (útil para testes)
   */
  clearAll(): void {
    this.db = {
      folders: new Map(),
      permissions: new Map(),
      auditLogs: [],
    };
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Singleton
let permissionsServiceInstance: PermissionsService | null = null;

export function getPermissionsService(): PermissionsService {
  if (!permissionsServiceInstance) {
    permissionsServiceInstance = new PermissionsService();
  }
  return permissionsServiceInstance;
}
