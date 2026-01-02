import { supabase } from './supabase';
import { User, Folder, FileAsset, ActivityLog, Notification, PortfolioItem, FolderPermission, AccessLevel } from '../types';
import { getGooglePhotosService, getAuthService } from './google-photos';

// --- REFACTORED DATA SERVICE USING SUPABASE ---

export const AuthService = {
    login: async (email: string): Promise<User | null> => {
        // Since we don't have the password in the mock flow, we rely on the implementation in dbInit 
        // that handles the actual auth. This function serves the UI login flow.
        // For the 'mock' UI flow which just took an email, we need to adapt.
        // Option 1: Trigger a magic link (not ideal for this dev stage)
        // Option 2: Assume a default password for dev or ask user.
        // Option 3: For now, we query the profile directly to 'simulate' login if we want to bypass real Auth for a bit, 
        // BUT the goal is real auth.
        // Let's assume the UI will be updated or we use a hardcoded dev password for 'client' roles if they don't have one.
        
        // HOWEVER, `ensureSuperUser` sets the admin password.
        // For this function, let's try to find the profile first.
        const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
        
        if (!profile) return null;

        // If it exists, we return the User object structure expected by App.
        // NOTE: This doesn't actually "log in" to Supabase Auth (set session) in the browser 
        // unless we use signInWithPassword.
        // For a proper migration, `LoginPage.tsx` should call `supabase.auth.signInWithPassword`.
        // To keep existing interfaces, we might need to Auto-login or prompt password.
        
        // TEMPORARY ADAPTER: return profile as User. 
        // Real auth state should be managed via onAuthStateChange in AppNew.
        return {
            id: profile.id,
            name: profile.full_name || email.split('@')[0],
            email: profile.email,
            role: profile.role,
            avatar_url: profile.avatar_url,
            permissions: [] // We'd need to fetch permissions if we kept that table
        } as unknown as User;
    }
};

export const DataService = {
  // === USER MANAGEMENT ===
  getUsers: async (requestorId: string): Promise<User[]> => {
      // Check role
      const { data: requestor } = await supabase.from('profiles').select('role').eq('id', requestorId).single();
      if(requestor?.role !== 'superuser') throw new Error("Unauthorized");

      const { data: profiles } = await supabase.from('profiles').select('*');
      return (profiles || []).map(p => ({
          id: p.id,
          name: p.full_name,
          email: p.email,
          role: p.role,
          avatarUrl: p.avatar_url,
          permissions: []
      })) as unknown as User[];
  },

  getAllFolders: async (): Promise<Folder[]> => {
      const { data } = await supabase.from('folders').select('*');
      return (data || []).map(f => ({...f, ownerId: f.owner_id, parentId: f.parent_id}));
  },

  // === FILE/FOLDER OPERATIONS ===

  getFolders: async (parentId: string | null, userId: string, role: string): Promise<Folder[]> => {
       // Superuser sees all in parent
       let query = supabase.from('folders').select('*');
       
       if (parentId) query = query.eq('parent_id', parentId);
       else query = query.is('parent_id', null);

       const { data, error } = await query;
       if (error) throw error;
       
       // Filter logic is now handled by RLS on Supabase side ideally.
       // But if we need manual filtering for the 'Client' role based on specific logic:
       // The RLS I wrote allows 'Owners' and 'Superusers'. 
       // If 'Client' needs to see folders they don't own, we need `folder_permissions` table (not implemented in schema yet).
       // For MVP, we assume RLS handles visibility.
       return (data || []).map(f => ({...f, ownerId: f.owner_id, parentId: f.parent_id}));
  },

  createFolder: async (name: string, parentId: string | null = null, ownerId: string): Promise<Folder> => {
        try {
            let googleAlbumId: string | undefined;

            // Tentativa de criar álbum no Google Photos se for superuser ou se tiver permissão
            try {
                const auth = getAuthService();
                if (auth.isAuthenticated()) {
                    const photosService = getGooglePhotosService();
                    const album = await photosService.createAlbum(name);
                    googleAlbumId = album.id;
                    console.log(`Álbum '${name}' criado no Google Photos: ${googleAlbumId}`);
                }
            } catch (e) {
                console.error("Falha ao criar álbum no Google Photos:", e);
                // Não bloqueamos a criação da pasta local se o Google falhar, 
                // para não quebrar a experiência do usuário.
            }

            const { data, error } = await supabase.from('folders').insert({
                name,
                parent_id: parentId,
                owner_id: ownerId,
                google_album_id: googleAlbumId
            }).select().single();

            if (error) throw error;
            await DataService.logActivity(ownerId, 'CREATE_FOLDER', name);
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

  updateFolder: async (folderId: string, name: string, note: string, userId: string): Promise<void> => {
      const { error } = await supabase.from('folders').update({ name, note }).eq('id', folderId);
      if (error) throw error;
      await DataService.logActivity(userId, 'UPDATE_FOLDER', name);
  },

  getFiles: async (folderId: string): Promise<FileAsset[]> => {
    const { data, error } = await supabase.from('files').select('*').eq('folder_id', folderId);
    if (error) throw error;
    return (data || []).map(f => ({...f, folderId: f.folder_id, uploadedBy: f.uploaded_by}));
  },

  uploadFiles: async (folderId: string, items: { file: File; note: string }[], userId: string): Promise<void> => {
        try {
            const photosService = getGooglePhotosService();
            const auth = getAuthService();
            
            // 1. Buscar a pasta para obter o google_album_id
            let targetAlbumId: string | undefined;
            if (folderId) {
                const { data: folder } = await supabase.from('folders').select('google_album_id').eq('id', folderId).single();
                targetAlbumId = folder?.google_album_id;
            }

            for (const item of items) {
                const { file, note } = item;
                
                // 2. Upload para o Google Photos se autenticado
                let googleMediaItemId: string | undefined;
                let finalUrl: string | undefined;

                if (auth.isAuthenticated()) {
                    try {
                        // Upload dos bytes para obter token
                        const uploadToken = await photosService.uploadMediaSimple(file);
                        
                        // Criar o Media Item (opcionalmente no álbum)
                        const response = await photosService.batchCreateMediaItems({
                            albumId: targetAlbumId,
                            newMediaItems: [{
                                description: note || file.name,
                                simpleMediaItem: {
                                    uploadToken
                                }
                            }]
                        });

                        const resItem = response.newMediaItemResults?.[0];
                        if (resItem?.status?.message === 'OK' || !resItem?.status) {
                            googleMediaItemId = resItem?.mediaItem?.id;
                            finalUrl = resItem?.mediaItem?.baseUrl;
                        } else {
                            throw new Error(`Erro Google: ${resItem?.status?.message}`);
                        }
                    } catch (e) {
                        console.error(`Falha no upload para Google Photos (${file.name}):`, e);
                        // Fallback para Supabase Storage se o Google falhar? 
                        // O usuário pediu especificamente Google, então vamos avisar se falhar.
                    }
                }

                // Se o Google Photos falhou ou não autenticado, mas queremos persistir o registro
                // NOTA: No fluxo "Google Photos First", o link é essencial.
                
                const { error } = await supabase.from('files').insert({
                    folder_id: folderId || null,
                    name: file.name,
                    url: finalUrl || '', // URL do Google Photos (BaseUrl)
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    size: `${(file.size / 1024).toFixed(2)} KB`,
                    uploaded_by: userId,
                    note: note,
                    google_media_item_id: googleMediaItemId
                });

                if (error) throw error;
                await DataService.logActivity(userId, 'UPLOAD', file.name);
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

  deleteFile: async (fileId: string, userId: string): Promise<void> => {
    const { error } = await supabase.from('files').delete().eq('id', fileId);
    if (error) throw error;
    await DataService.logActivity(userId, 'DELETE', 'File ID ' + fileId);
  },

  renameFile: async (fileId: string, newName: string, userId: string): Promise<void> => {
      const { error } = await supabase.from('files').update({ name: newName }).eq('id', fileId);
      if (error) throw error;
      await DataService.logActivity(userId, 'RENAME', newName);
  },

  getLogs: async (): Promise<ActivityLog[]> => {
      const { data } = await supabase
        .from('activity_logs')
        .select(`
            *,
            profiles:user_id (full_name)
        `)
        .order('timestamp', { ascending: false });
      
      return (data || []).map(l => ({
          ...l, 
          userId: l.user_id, 
          targetName: l.target_name,
          userName: (l as any).profiles?.full_name || 'Desconhecido'
      }));
  },

  getFilteredLogs: async (startDate?: string, endDate?: string, userId?: string): Promise<ActivityLog[]> => {
      let query = supabase
        .from('activity_logs')
        .select(`
            *,
            profiles:user_id (full_name)
        `)
        .order('timestamp', { ascending: false });
      
      if (startDate) {
          query = query.gte('timestamp', startDate);
      }
      if (endDate) {
          query = query.lte('timestamp', endDate);
      }
      if (userId) {
          query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(l => ({
          ...l, 
          userId: l.user_id, 
          targetName: l.target_name,
          userName: (l as any).profiles?.full_name || 'Desconhecido'
      }));
  },

  logActivity: async (userId: string, action: string, targetName: string) => {
     await supabase.from('activity_logs').insert({
         user_id: userId,
         action,
         target_name: targetName
     });
  },

  getNotifications: async (): Promise<Notification[]> => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      return (data || []).map(n => ({...n, isRead: n.is_read, timestamp: n.created_at}));
  },

  getPortfolio: async (): Promise<PortfolioItem[]> => {
      const { data } = await supabase.from('portfolio').select('*');
      return (data || []) as unknown as PortfolioItem[];
  },

  // === PERMISSIONS ===
  getFolderPermissions: async (folderId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('folder_access')
      .select('*, profiles(full_name, email)')
      .eq('folder_id', folderId);
    
    if (error) throw error;
    return data || [];
  },

  getUserPermissions: async (userId: string): Promise<FolderPermission[]> => {
    const { data, error } = await supabase
      .from('folder_access')
      .select('folder_id, access_level')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map(p => ({
      folderId: p.folder_id,
      accessLevel: p.access_level as AccessLevel
    }));
  },

  grantPermission: async (folderId: string, userId: string, accessLevel: AccessLevel, granterId: string): Promise<void> => {
    const { error } = await supabase.from('folder_access').upsert({
      folder_id: folderId,
      user_id: userId,
      access_level: accessLevel,
      granted_by: granterId
    }, { onConflict: 'folder_id,user_id' });

    if (error) throw error;

    await DataService.logActivity(granterId, 'PERM_UPDATE', `Grant ${accessLevel} on folder ${folderId} to user ${userId}`);
  },

  revokePermission: async (folderId: string, userId: string, revokerId: string): Promise<void> => {
    const { error } = await supabase
      .from('folder_access')
      .delete()
      .eq('folder_id', folderId)
      .eq('user_id', userId);

    if (error) throw error;

    await DataService.logActivity(revokerId, 'PERM_UPDATE', `Revoke permission on folder ${folderId} from user ${userId}`);
  },

  getDashboardStats: async () => {
    const [{ count: fileCount }, { count: folderCount }, { count: logCount }, { count: userCount }] = await Promise.all([
      supabase.from('files').select('*', { count: 'exact', head: true }),
      supabase.from('folders').select('*', { count: 'exact', head: true }),
      supabase.from('activity_logs').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    return [
      { label: 'Arquivos', value: (fileCount || 0).toString(), icon: 'bi-file-earmark', color: '#4A90E2' },
      { label: 'Pastas', value: (folderCount || 0).toString(), icon: 'bi-folder', color: '#7B68EE' },
      { label: 'Usuários', value: (userCount || 0).toString(), icon: 'bi-people', color: '#FF9500' },
      { label: 'Atividades', value: (logCount || 0).toString(), icon: 'bi-clock-history', color: '#50C878' },
    ];
  }
};
