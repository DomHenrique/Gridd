import { User, Folder, FileAsset, ActivityLog, Notification, PortfolioItem, FolderPermission } from '../types';
import { DEMO_IMAGES } from '../constants';

// --- INITIAL MOCK DATA ---

const USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin Superuser',
    email: 'admin@gridd360.com',
    role: 'superuser',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    permissions: [] // Superuser has implicit access to everything
  },
  {
    id: 'u2',
    name: 'Cliente Rede Franquias',
    email: 'cliente@rede.com',
    role: 'client',
    avatarUrl: 'https://i.pravatar.cc/150?u=client',
    permissions: [
        { folderId: 'f1', accessLevel: 'read' },
        { folderId: 'f2', accessLevel: 'write' }, // Can upload to 'Campanhas 2023'
        { folderId: 'f3', accessLevel: 'read' }
    ]
  }
];

let FOLDERS: Folder[] = [
  { id: 'f1', parentId: null, name: 'Rede Franquias - Assets', note: 'Pasta raiz com todos os ativos da marca', ownerId: 'u2' },
  { id: 'f2', parentId: 'f1', name: 'Campanhas 2023', note: 'Materiais de publicidade do ano corrente', ownerId: 'u2' },
  { id: 'f3', parentId: 'f1', name: 'Fotos Loja', note: 'Imagens para uso em redes sociais e Google Business', ownerId: 'u2' },
  { id: 'f4', parentId: null, name: 'Pasta Interna Admin', note: 'Documentos internos, não compartilhar', ownerId: 'u1' }, // Client shouldn't see this
];

let FILES: FileAsset[] = [
  {
    id: 'fi1', folderId: 'f2', name: 'Banner_Natal.jpg', url: DEMO_IMAGES[0], type: 'image', size: '2.4 MB', uploadedBy: 'u2', createdAt: new Date().toISOString(), note: 'Aprovar arte final'
  },
  {
    id: 'fi2', folderId: 'f3', name: 'Fachada_01.jpg', url: DEMO_IMAGES[1], type: 'image', size: '4.1 MB', uploadedBy: 'u2', createdAt: new Date(Date.now() - 86400000).toISOString(), note: 'Foto tirada na inauguração'
  }
];

let LOGS: ActivityLog[] = [
  { id: 'l1', userId: 'u2', userName: 'Cliente Rede Franquias', action: 'UPLOAD', targetName: 'Banner_Natal.jpg', timestamp: new Date().toISOString() },
  { id: 'l2', userId: 'u1', userName: 'Admin Superuser', action: 'CREATE_FOLDER', targetName: 'Campanhas 2023', timestamp: new Date(Date.now() - 10000000).toISOString() }
];

let NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Bem-vindo ao Gridd360', message: 'Seu ambiente foi configurado com sucesso.', isRead: false, timestamp: new Date(Date.now() - 86400000).toISOString() }
];

const PORTFOLIO_ITEMS: PortfolioItem[] = [
    // Eventos
    {
        id: 'p1', title: 'Tech Summit SP', category: 'Eventos', client: 'Inovatech', year: '2023',
        description: 'Produção completa do maior evento de tecnologia do ano, com 3 palcos simultâneos.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ7LzYU8j7DT12bH_FIEB9GPGARfBxuUfRdEKRJ7nvfL3bhkpwC_-lWVDDhaL2u50WyxVY3rWSPNh-MMjgkNLMMzKiP52zsNgpJEhuT8ZNEciwXqFpeLdYnBPqxJumLYqoh42f6dAJ3zTMpAsR0TJ8ELiP__jNINkhFl5RxgOuW8XYpS7GwlKi2Rx0zoErhzl4xKv528DTFMr1ndN6cv9jl-g6LyAacrCI_5iU6KJO2XVqtIEh0O6tOB1pxJALu-5Kkmtcwous_Js',
        tags: ['Inovatech', 'Lançamento']
    },
    {
        id: 'p2', title: 'Summer Festival', category: 'Eventos', client: 'Bebidas Solar',
        description: 'Ativação de marca em festival de verão com stand interativo e brindes.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSDf9fffXp4ocOtoDgGA2Tn82d1X7t4SBYm7fDKgIhkkSeiMBb_L932SiEGLc3ACc4giDVaz9W6wotYrmEdDfAe05dZDILJpZ7_9EUNYpbiQeRbochS4YEgACI4cjM5p71dIWMmRwMh43r46S1ZHPCpvAXEH1xM5zMt0v712i6iQT3G2bWd2UGGdEmF0OGnDMBbp_PGFiGvY186VDlAZBy0FiLWGs97_ux6rPyx0QgaIZTuJ-BCPZU7XecnSap0pqkJbbBOTkVbT0',
        tags: ['Bebidas Solar', 'Ativação']
    },
    {
        id: 'p3', title: 'Meeting Nacional', category: 'Eventos', client: 'Banco Alpha',
        description: 'Encontro anual de lideranças para alinhamento estratégico e premiação.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwmVjzub1_UhJ7G07FMBTMavqysAOaY0xRkqDnoTXppdRDrwxMYATUs3kUtOBkPGVY3Ri3f-4YuPFmkom_tkFaBDgZxBaK1Gm0_eEhEOZBtkXKlvbiLjkpXhJjc0_B32O77BjEW0mzEpXtRaMOT6ZOw7n_YZkzI4cKd8evs2osDbeBNzbPGJLFrcOteDlR2er3RNJkKyxtqgNjoTKIrAdXre1ztAB6r_VqyX3lk4X4SO6jQGilRSIs-PXwLvkMwlr0KMrxP-R43Hc',
        tags: ['Banco Alpha', 'Endomarketing']
    },
    // Campanhas
    {
        id: 'p4', title: 'Black Friday 2023', category: 'Campanhas', client: 'Varejo Express',
        description: 'Campanha integrada On e Offline que bateu recordes de venda.',
        subtitle: 'Varejo Express • Vendas',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS39c9kM8bufqmu0FRFzq26hG8jU7bWyKRiju6XKIUp3Om2wRcG8LKov9PCnnWoEkIeMjAadXBADJg_tr8FwebzUrAv9vABy8C9p3_teKWz7rSSJBJkGI0ggWPMd03lq_8QIqACJ2BBlp6KrJgVI---8ZGW9NNLw_9Ti2MEf8wFH3kl5x0uOIWuSC5siACNS-7gMjzIcG_jeI3Wb789PylGY7BpqmIZgd8duiep8Q1Z8x4bQ8B7R6H5_TEQLTJBTn-g976zBy6DIk',
        tags: ['360°'],
        isHighlight: true
    },
    {
        id: 'p5', title: 'Verão Sem Fim', category: 'Campanhas', client: 'Moda Praia',
        description: 'Awareness',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChG-sT2K0VbxxrAJIf1jGFhMrYhaNS0mtCuMFxYZ5iBOG5hFX6IH9OYibOVovwXYLCgB03D9iHX_t6gbKZeKnkWp7W8iuvqri_OZ3kZ43uTEgSkI5I4aTKItcvZFT79iXI5r6kGWhPNKfInCvh83hzr7ReMgeZcUQZ63LVwFJgMuZGnRlDSQnNt3F_aPRd7K2qXdlJUSBNo_-k-fiVCR-UHR2j4kVZ5jIN2IVlF9oFZoFYkxGYttr7MgMdRqm_Hb-uzzWTP5D7SlQ',
        tags: ['Awareness']
    },
    {
        id: 'p6', title: 'Volta às Aulas', category: 'Campanhas', client: 'Papelaria Top',
        description: 'Conversão',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5U0Ge2fxvAHd5BAD6ZIQ_QJdzFa9uui8Af8arkNQdiIeiCmzHvNRDkmRgGIWsDE9MFo7CJB8ZyzZU_blj-IlfeYcdcMSocBbkPATHcLfsEKKTVeP8wLEjdjtL9uj16nUR9E5nwT5eAQ0HhWZwWzQItadBWOKYwM87vJKFn8BHiOv7JWgygHc0BIeNmoGgI1nKqtztaIsjRVapi7bYZKDqLc9e7KWReKa4kq5thR47HwQoFZjEYzGNmh-f3-L_8dugESydUzZst4o',
        tags: ['Conversão']
    },
    // Branding
    {
        id: 'p7', title: 'Rebranding Total', category: 'Branding', client: 'Construtora Build',
        description: 'Posicionamento',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9PN23HSHIg8mSzfHDxzWU4RNMNtaK2EKMv1g7taLYwRuproE1SRN6ppIfMozorF21OniBN6HyyOdrgmuijyhfDx2b8p195581vzvtJI2iscTn_pTQ3vozMAl8adFHitHBRr4SEOFa3DRdQVd6uSIxjRGkjPP7EIuGcSoY0_qiRGnf8IvPj77xww2Z1tqwCTYr9a1RGmIcTti94relC3Mg3QM-kKOoOTgpxt0cq87PdL_ccWDFz_Vnw-HhN5kA1Kc0Q509Td_UOeo',
        tags: ['Posicionamento']
    },
    {
        id: 'p8', title: 'Social Media', category: 'Branding', client: 'Restaurante Chef',
        description: 'Engajamento',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnT744qdxtBTiL5T4QD-Nx4ZC-7a-3w815-z5OC7cXZTVsfxx9Of1MXJVpX8j1bu8YmVZdWxDGe-xFpeT2GYrr_0PhG71lRJyQEqMMFUY_4jPVLJ9qqf8kPLrNaAu9Yaj3nVvxIZmpY0VrfBvahXPSmEF1etVsv61ouh7Z2JRlTcUH9gGdESNFWQH0yfDLddwlr--ZpwZUFhYXWvywCxkHf8pFhNLlt9yj2u9d-LVXzDyvBq49i32a08qhqAfUNSYj9HWQ_crEbPo',
        tags: ['Engajamento']
    },
    {
        id: 'p9', title: 'Identidade Visual', category: 'Branding', client: 'Café da Serra',
        description: 'Lançamento de Produto',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0Va9Oq0m5E7MtS-obPSCA18PgqqzOEXGGcqn2gmBRV_8VN08bWqU2ZdeW_8XD_ryoohkmFTFOtCtx9jYT-yaPnBl_AkmnIZNMS2jST22oWFRXRpv5ctOALDCo7X5CecNbSYJ7qCyR-tDYifyWZbfK3oirVUhg7u2yrcojNTBqDj6f2fmz78RIVu4o-hABCk-Ue4QqqeVz4X0tCCV7BWd3FTx03tgsYUwz6Qmp-Srg9Hne-NppmM6sIhg9EezfAD-ghwGHeV8Ia94',
        tags: ['Lançamento']
    }
];

// --- SERVICE FUNCTIONS ---

// Helper to check permissions
const checkPermission = (userId: string, folderId: string, requiredLevel: 'read' | 'write'): boolean => {
    const user = USERS.find(u => u.id === userId);
    if (!user) return false;
    if (user.role === 'superuser') return true;

    const perm = user.permissions.find(p => p.folderId === folderId);
    if (!perm) return false;

    if (requiredLevel === 'read') return true; // Both read and write have read access
    if (requiredLevel === 'write') return perm.accessLevel === 'write';
    
    return false;
};

// Helper to add notification
const addSystemNotification = (title: string, message: string) => {
    NOTIFICATIONS.unshift({
        id: `n${Date.now()}`,
        title,
        message,
        isRead: false,
        timestamp: new Date().toISOString()
    });
};

export const AuthService = {
  login: async (email: string): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = USERS.find(u => u.email === email);
        resolve(user || null);
      }, 500);
    });
  }
};

export const DataService = {
  // === USER MANAGEMENT ===
  getUsers: async (requestorId: string): Promise<User[]> => {
      const requestor = USERS.find(u => u.id === requestorId);
      if(requestor?.role !== 'superuser') throw new Error("Unauthorized");
      return Promise.resolve(USERS);
  },

  addUser: async (requestorId: string, newUser: Omit<User, 'id' | 'permissions'>): Promise<User> => {
      const requestor = USERS.find(u => u.id === requestorId);
      if(requestor?.role !== 'superuser') throw new Error("Unauthorized");

      const user: User = {
          ...newUser,
          id: `u${Date.now()}`,
          permissions: []
      };
      USERS.push(user);
      await DataService.logActivity(requestorId, 'USER_CREATE', user.name);
      return user;
  },

  updateUserPermissions: async (requestorId: string, targetUserId: string, newPermissions: FolderPermission[]): Promise<void> => {
      const requestor = USERS.find(u => u.id === requestorId);
      if(requestor?.role !== 'superuser') throw new Error("Unauthorized");
      
      const targetUser = USERS.find(u => u.id === targetUserId);
      if(targetUser) {
          targetUser.permissions = newPermissions;
          await DataService.logActivity(requestorId, 'PERM_UPDATE', `Permissions updated for ${targetUser.name}`);
      }
  },

  getAllFolders: async (): Promise<Folder[]> => {
      return Promise.resolve(FOLDERS);
  },

  // === FILE/FOLDER OPERATIONS ===

  getFolders: async (parentId: string | null, userId: string, role: string): Promise<Folder[]> => {
    return new Promise(resolve => {
        if (role === 'superuser') {
             // Superuser sees all folders matching parentId
             resolve(FOLDERS.filter(f => f.parentId === parentId));
             return;
        }

        const user = USERS.find(u => u.id === userId);
        if (!user) {
            resolve([]);
            return;
        }

        // Strict Permission Check for Clients
        // 1. Filter folders that match parentId
        // 2. Filter those folders where user has explicit permission
        // NOTE: In a real app, this might be recursive. Here we use explicit listing.
        const siblings = FOLDERS.filter(f => f.parentId === parentId);
        const allowedFolders = siblings.filter(f => 
            user.permissions.some(p => p.folderId === f.id)
        );
        
        resolve(allowedFolders);
    });
  },

  createFolder: async (parentId: string | null, name: string, note: string, userId: string): Promise<Folder> => {
    // Check if user has write access to parent folder (if not root)
    if (parentId && !checkPermission(userId, parentId, 'write')) {
        throw new Error("Acesso negado: Sem permissão de escrita nesta pasta.");
    }

    const newFolder: Folder = {
        id: `f${Date.now()}`,
        parentId,
        name,
        note,
        ownerId: userId
    };
    FOLDERS.push(newFolder);
    
    // If creator is client, auto-add write permission to the new folder
    const user = USERS.find(u => u.id === userId);
    if(user && user.role === 'client') {
        user.permissions.push({ folderId: newFolder.id, accessLevel: 'write' });
    }

    await DataService.logActivity(userId, 'CREATE_FOLDER', name);
    addSystemNotification('Nova Pasta Criada', `A pasta "${name}" foi criada com sucesso.`);
    
    return newFolder;
  },

  updateFolder: async (folderId: string, name: string, note: string, userId: string): Promise<void> => {
      const folder = FOLDERS.find(f => f.id === folderId);
      if (!folder) return;

      // Check permission: need write access to the folder itself (implicit) or its parent
      // For simplicity, we check if user has write permission on the folder ID
      // NOTE: For root folders or new structure, logic might vary, but assuming permission model holds.
      if (!checkPermission(userId, folderId, 'write')) {
         throw new Error("Acesso negado: Sem permissão para editar esta pasta.");
      }

      folder.name = name;
      folder.note = note;
      await DataService.logActivity(userId, 'UPDATE_FOLDER', name);
  },

  getFiles: async (folderId: string): Promise<FileAsset[]> => {
    // No specific check needed here as access to folderId implies read access to files
    // But validation is good practice
    return new Promise(resolve => resolve(FILES.filter(f => f.folderId === folderId)));
  },

  uploadFiles: async (folderId: string, files: {file: File, note: string}[], userId: string): Promise<void> => {
     if (!checkPermission(userId, folderId, 'write')) {
         alert("Acesso Negado: Você não tem permissão para fazer upload nesta pasta.");
         return Promise.reject("Unauthorized");
     }

     const user = USERS.find(u => u.id === userId);
     files.forEach((item, idx) => {
         const newFile: FileAsset = {
             id: `fi${Date.now()}-${idx}`,
             folderId,
             name: item.file.name,
             url: DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)], // Mock URL
             type: 'image',
             size: `${(item.file.size / 1024 / 1024).toFixed(2)} MB`,
             uploadedBy: userId,
             createdAt: new Date().toISOString(),
             note: item.note
         };
         FILES.push(newFile);
         DataService.logActivity(userId, 'UPLOAD', newFile.name);
     });

     addSystemNotification('Upload Concluído', `${files.length} arquivos foram adicionados à pasta.`);
     return Promise.resolve();
  },

  deleteFile: async (fileId: string, userId: string): Promise<void> => {
    const file = FILES.find(f => f.id === fileId);
    if (!file) return;

    if (!checkPermission(userId, file.folderId, 'write')) {
        alert("Acesso Negado: Você não tem permissão para excluir arquivos desta pasta.");
        return Promise.reject("Unauthorized");
    }

    FILES = FILES.filter(f => f.id !== fileId);
    await DataService.logActivity(userId, 'DELETE', file.name);
    return Promise.resolve();
  },

  renameFile: async (fileId: string, newName: string, userId: string): Promise<void> => {
      const file = FILES.find(f => f.id === fileId);
      if (!file) return;

      if (!checkPermission(userId, file.folderId, 'write')) {
          alert("Acesso Negado.");
          return;
      }

      const oldName = file.name;
      file.name = newName;
      await DataService.logActivity(userId, 'RENAME', `${oldName} -> ${newName}`);
  },

  getLogs: async (): Promise<ActivityLog[]> => {
      // Sort by newest
      return new Promise(resolve => resolve([...LOGS].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));
  },

  logActivity: async (userId: string, action: ActivityLog['action'], targetName: string) => {
     const user = USERS.find(u => u.id === userId);
     LOGS.unshift({
         id: `l${Date.now()}`,
         userId,
         userName: user?.name || 'Unknown',
         action,
         targetName,
         timestamp: new Date().toISOString()
     });
  },

  getNotifications: async (): Promise<Notification[]> => {
      return Promise.resolve(NOTIFICATIONS);
  },

  getPortfolio: async (): Promise<PortfolioItem[]> => {
      return Promise.resolve(PORTFOLIO_ITEMS);
  }
};

export { PORTFOLIO_ITEMS };