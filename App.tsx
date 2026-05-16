
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { uploadFile, deleteFile } from './services/storage';
import { Client, User, View, Folder } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AlbumView from './components/AlbumView';
import Modal from './components/Modal';
import Login from './components/Login';
import { PlusIcon, CameraIcon, PencilIcon, TrashIcon, KeyIcon, ShieldCheckIcon, ArrowLeftIcon, TagIcon, FileIcon } from './components/icons';
import NoAdminNotification from './components/NoAdminNotification';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string; isTextArea?: boolean }> = ({ label, id, isTextArea, ...props }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-gray-400 text-sm font-bold mb-2">{label}</label>
        {isTextArea ? (
            <textarea id={id} {...props} className="shadow appearance-none border border-slate-700 rounded-xl w-full py-3 px-4 bg-slate-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all" />
        ) : (
            <input id={id} {...props} className="shadow appearance-none border border-slate-700 rounded-xl w-full py-3 px-4 bg-slate-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all" />
        )}
    </div>
);

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [session, setSession] = useState<any>(null); // Store Supabase session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [view, setView] = useState<View>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Modals state
  const [isCreateClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setEditClientModalOpen] = useState(false);
  const [isManageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [isAddPhotoModalOpen, setAddPhotoModalOpen] = useState(false);
  const [viewingAddMemberForm, setViewingAddMemberForm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  // App Initialization State
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null); // null = loading
  const [initialLoading, setInitialLoading] = useState(true);

  // Manage Users / Permissions State
  const [editingUserPermissions, setEditingUserPermissions] = useState<User | null>(null);

  // Create Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');

  // Edit Client Form State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientDesc, setEditClientDesc] = useState('');

  // Add User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'manager'>('user');
  const [newUserAllowedClients, setNewUserAllowedClients] = useState<string[]>([]);
  // Credentials Success Modal State
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{email: string, password: string} | null>(null);

  // Add Photo Form State
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoTags, setNewPhotoTags] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState<{name: string, url: string, type: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError, setPhotoError] = useState<string>('');
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);

  // Check for Admin Existence
  const checkAdminStatus = useCallback(async () => {
    try {
        // Use RPC function to bypass RLS for this specific check
        const { data, error } = await supabase.rpc('app_has_admin');
        
        if (error) {
             console.error("Error checking admin:", error);
             // Fallback: If RPC fails (e.g. not deployed), assume false to show config screen
             setHasAdmin(false); 
        } else {
            setHasAdmin(data);
        }
    } catch (e) {
        console.error("Failed to check admin status:", e);
        setHasAdmin(false);
    } finally {
        setInitialLoading(false);
    }
  }, []);

  // Data Fetching
  const fetchData = useCallback(async () => {
      try {
          // Fetch Clients
          const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select(`*, photos (*)`)
              .order('created_at', { ascending: false });
          
          if (clientsError) throw clientsError;
          console.log('DEBUG: Raw clientsData from Supabase:', clientsData);

          // Fetch Folders
          const { data: folderData, error: foldersError } = await supabase.from('folders').select('*');
          if (foldersError) throw foldersError;

          // Normalize Client Data
          const mappedClients: Client[] = (clientsData || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              coverImage: c.cover_image || `https://placehold.co/800x600/1e1e2e/8b5cf6?text=${encodeURIComponent(c.name)}`,
              photos: (c.photos || []).map((p: any) => ({
                  id: p.id,
                  url: p.url,
                  uploadedBy: p.uploaded_by,
                  timestamp: p.timestamp || p.created_at,
                  tags: p.tags || [],
                  folderId: p.folder_id,
                  mimeType: p.mime_type,
                  size: p.size,
                  originalName: p.original_name
              })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
              folders: (folderData || [])
                  .filter((f: any) => f.client_id === c.id)
                  .map((f: any) => ({
                      id: f.id,
                      clientId: f.client_id,
                      parentId: f.parent_id,
                      name: f.name,
                      createdAt: f.created_at,
                      createdBy: f.created_by,
                      thumbnailUrl: f.thumbnail_url
                  }))
          }));

          setClients(mappedClients);

          // Fetch Users (Profiles)
          const { data: usersData, error: usersError } = await supabase
              .from('profiles')
              .select('*');
          
          if (usersError) throw usersError;

          const mappedUsers: User[] = (usersData || []).map((u: any) => ({
              id: u.id,
              email: u.email,
              role: u.role,
              name: u.full_name || u.name || 'Sem Nome',
              allowedClientIds: u.allowed_client_ids || []
          }));

          setUsers(mappedUsers);

      } catch (error) {
          console.error("Error fetching data:", error);
      }
  }, []);

  // Initial Admin Check
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Session Management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
         // Fetch profile logic would go here ideally, but for now we fetch all users and filter
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync Session to CurrentUser (from profiles/users list)
  useEffect(() => {
      
      if (session?.user) {
          if (users.length > 0) {
            // Try to find in loaded list
            const matchedUser = users.find(u => u.email === session.user.email);
            if (matchedUser) {
                setCurrentUser(matchedUser);
            } else {
                // Fallback: Fetch this specific profile
                supabase.from('profiles').select('*').eq('email', session.user.email).single()
                .then(({ data, error }) => {
                    if (data) {
                        const directUser: User = {
                            id: data.id,
                            email: data.email,
                            role: data.role,
                            name: data.full_name || data.name || 'Sem Nome',
                            allowedClientIds: data.allowed_client_ids || []
                        };
                        setCurrentUser(directUser);
                    } else {
                        console.error("Profile definitely not found:", error);
                        // Stop loading even if error, to show something
                        // Maybe set a "guest" state or force logout?
                    }
                });
            }
          } else {
             // Users list empty, but we have session. RLS might be hiding others.
             // Fetch ONLY me.
             supabase.from('profiles').select('*').eq('email', session.user.email).single()
                .then(({ data, error }) => {
                    if (data) {
                        const directUser: User = {
                            id: data.id,
                            email: data.email,
                            role: data.role,
                            name: data.full_name || data.name || 'Sem Nome',
                            allowedClientIds: data.allowed_client_ids || []
                        };
                        setCurrentUser(directUser);
                    } else {
                        console.error("Could not fetch self profile:", error);
                    }
                });
          }
      } else if (!session) {
          setCurrentUser(null);
      }
  }, [session, users]);

  useEffect(() => {
      if (hasAdmin) {
        fetchData();
      }
  }, [hasAdmin, fetchData]);

  // Sync selected Client if it changes in background (e.g. after photo upload)
  useEffect(() => {
      if (selectedClient) {
          const updated = clients.find(c => c.id === selectedClient.id);
          if (updated) setSelectedClient(updated);
      }
  }, [clients, selectedClient]); 

  
  useEffect(() => {
    return () => {
      photoPreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [photoPreviews]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("Login failed:", error.message);
        return false;
    }
    return true;
  }, []);

  const handleLogout = useCallback(async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setView('dashboard');
  }, []);

  const handleSelectClient = useCallback((client: Client) => {
    const isRestrictedUser = currentUser?.role === 'user';
    const allowedIds = currentUser?.allowedClientIds || [];

    if (isRestrictedUser && !allowedIds.includes(client.id)) {
        alert("Acesso Negado: Você não tem permissão para visualizar os arquivos deste cliente.");
        return;
    }
    setSelectedClient(client);
    setView('client');
  }, [currentUser]);

  const handleBackToDashboard = useCallback(() => {
    setSelectedClient(null);
    setView('dashboard');
  }, []);
  


  const handleCreateClient = useCallback(async () => {
    if (!newClientName.trim()) return;
    
    // Pre-flight check for duplicate names (case-insensitive)
    const existingClient = clients.find(c => c.name.toLowerCase() === newClientName.trim().toLowerCase());
    if (existingClient) {
        alert(`Já existe um cliente com o nome "${existingClient.name}". Por favor, escolha um nome diferente.`);
        return;
    }

    const newClientId = `client-${Date.now()}`;
    const coverImage = `https://placehold.co/800x600/1e1e2e/8b5cf6?text=${encodeURIComponent(newClientName)}`;

    try {
        const { error } = await supabase.from('clients').insert({
            id: newClientId,
            name: newClientName.trim(),
            description: newClientDesc,
            cover_image: coverImage
        });

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Já existe um cliente com este nome cadastrado no banco de dados.');
            }
            throw error;
        }

        // Auto-assign creator if they are a regular user
        if (currentUser?.role === 'user') {
            const updatedIds = [...(currentUser.allowedClientIds || []), newClientId];
            await supabase.from('profiles').update({ allowed_client_ids: updatedIds }).eq('email', currentUser.email);
        }

        await fetchData();
        setCreateClientModalOpen(false);
        setNewClientName('');
        setNewClientDesc('');

    } catch (e) {
        console.error("Error creating client:", e);
        alert("Erro ao criar cliente.");
    }

  }, [newClientName, newClientDesc, currentUser, fetchData]);

  const handleOpenEditClient = useCallback((client: Client) => {
    setEditingClient(client);
    setEditClientName(client.name);
    setEditClientDesc(client.description);
    setEditClientModalOpen(true);
  }, []);

  const handleUpdateClient = useCallback(async () => {
    if (!editingClient || !editClientName.trim()) return;

    // Pre-flight check for duplicate names (excluding self)
    const existingClient = clients.find(c => c.id !== editingClient.id && c.name.toLowerCase() === editClientName.trim().toLowerCase());
    if (existingClient) {
        alert(`Já existe outro cliente com o nome "${existingClient.name}". Por favor, escolha um nome diferente.`);
        return;
    }

    try {
         const { error } = await supabase.from('clients').update({
            name: editClientName.trim(),
            description: editClientDesc,
        }).eq('id', editingClient.id);

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Já existe um cliente com este nome cadastrado no banco de dados.');
            }
            throw error;
        }

        await fetchData();
        setEditClientModalOpen(false);
        setEditingClient(null);
        setEditClientName('');
        setEditClientDesc('');

    } catch (e) {
        console.error("Error updating client:", e);
        alert("Erro ao atualizar cliente.");
    }
  }, [editingClient, editClientName, editClientDesc, fetchData]);

  const handleDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;

    try {
        if (clientToDelete.photos) {
            await Promise.all(clientToDelete.photos.map(p => deleteFile(p.url)));
        }

        const { error } = await supabase.from('clients').delete().eq('id', clientToDelete.id);
        if (error) throw error;

        await fetchData();
        setClientToDelete(null);

    } catch (e) {
         console.error("Error deleting client:", e);
         alert("Erro ao excluir cliente.");
    }

  }, [clientToDelete, fetchData]);

  const handleAddUser = useCallback(async () => {
    if (!newUserEmail.trim() || users.some(u => u.email === newUserEmail)) return;

    // Validate Mandatory Client Selection for 'user' role
    if (newUserRole === 'user' && newUserAllowedClients.length === 0) {
        alert("Atenção: Para adicionar um membro 'Staff/Criativo', você deve selecionar pelo menos um cliente para ele ter acesso.");
        return;
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "!Aa1";
    
    try {
        // Call Edge Function to create user securely
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: { 
                email: newUserEmail, 
                password: tempPassword,
                role: currentUser?.role === 'admin' ? newUserRole : 'user',
                name: newUserEmail.split('@')[0],
                allowed_client_ids: newUserRole === 'user' ? newUserAllowedClients : [] 
            }
        });

        if (error) {
            console.error("DEBUG Edge function returned error object:", error);
            // supabase-js functions.invoke usually puts the text response in context or error.message
            let errorText = error.message;
            if (error.context) {
              try {
                const contextJson = await error.context.json();
                errorText = contextJson.error || JSON.stringify(contextJson);
              } catch (e) {
                try { errorText = await error.context.text(); } catch(e2) {}
              }
            }
            alert("Erro detalhado da Função: " + errorText);
            throw error;
        }
        
        // Show success modal instead of alert
        setCreatedUserCredentials({ email: newUserEmail, password: tempPassword });

        await fetchData();
        setNewUserEmail('');
        setNewUserRole('user');
        setNewUserAllowedClients([]); // Reset selection
        setViewingAddMemberForm(false); // Return to list view
        // setManageUsersModalOpen(false); // Keep modal open to show success or list? User flow suggests maybe returning to list or closing. Let's keep separate success modal logic as is, but maybe return to list.
        // The success modal is separate, so we can keep this open or close it. 
        // Let's close the form view (return to list) so they see the new user there?
        // Actually, previous logic closed the whole modal.
        // For better UX, let's keep modal open but switch back to list
        
    } catch (e: any) {
        console.error("Error adding user:", e);
        // Better error message handling
        const msg = e.context?.json?.error || e.message || "Erro desconhecido";
        alert(`Erro ao adicionar usuário: ${msg}. \n\nVerifique se a função 'create-user' está implantada.`);
    }
  }, [newUserEmail, users, currentUser, newUserRole, fetchData, newUserAllowedClients]);

  const toggleUserClientAccess = async (clientId: string) => {
      if (!editingUserPermissions) return;

      const currentIds = editingUserPermissions.allowedClientIds || [];
      const hasAccess = currentIds.includes(clientId);
      
      let newIds: string[];
      if (hasAccess) {
          newIds = currentIds.filter(id => id !== clientId);
      } else {
          newIds = [...currentIds, clientId];
      }

      try {
          const { error } = await supabase.from('profiles').update({
              allowed_client_ids: newIds
          }).eq('email', editingUserPermissions.email);

          if (error) throw error;

          setEditingUserPermissions({ ...editingUserPermissions, allowedClientIds: newIds });
          await fetchData();

      } catch (e) {
          console.error("Error updating permissions:", e);
      }
  };

  const handleAddPhoto = useCallback(async () => {
    if (newPhotoFiles.length === 0 || !selectedClient || !currentUser || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setPhotoError('');

    const totalFiles = newPhotoFiles.length;
    let completedFiles = 0;

    try {
      const parsedTags = newPhotoTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      for (const file of newPhotoFiles) {
          try {
              // Upload to Storage
              const photoUrl = await uploadFile(file, selectedClient.name);
              
              // Insert Metadata to DB
              const { error } = await supabase.from('photos').insert({
                  id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  client_id: selectedClient.id,
                  url: photoUrl,
                  uploaded_by: currentUser.name,
                  tags: parsedTags,
                  timestamp: new Date().toISOString(),
                  folder_id: uploadTargetFolderId,
                  mime_type: file.type,
                  size: file.size,
                  original_name: file.name
              });

              if (error) throw error;

              // Log Activity
              await supabase.from('activity_logs').insert({
                  client_id: selectedClient.id,
                  folder_id: uploadTargetFolderId,
                  user_id: currentUser.id, // Assuming currentUser has ID, if not use email or fetch profile
                  action_type: 'upload',
                  details: { fileName: file.name, fileSize: file.size, fileType: file.type }
              });
              
              completedFiles++;
              setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
          } catch (err: any) {
              console.error(`Error uploading file ${file.name}:`, err);
              // We could continue or stop. For now, we log and continue best effort, or throw?
              // Let's stop if one fails to avoid partial state confusion for user or implement better UI for partials.
              // For simplicity, let's just log and try next? 
              // Actually, better to inform user.
              // setPhotoError(`Erro no arquivo ${file.name}`);
          }
      }

      await fetchData();

      setAddPhotoModalOpen(false);
      setNewPhotoFiles([]);
      setNewPhotoTags('');
      setPhotoPreviews([]);
      setUploadTargetFolderId(null);
    } catch (error) {
      console.error("Failed to upload:", error);
      setPhotoError("Falha ao fazer upload de alguns arquivos.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [newPhotoFiles, selectedClient, currentUser, isUploading, newPhotoTags, fetchData, uploadTargetFolderId]);

  const handleDeletePhoto = useCallback(async (clientId: string, photoId: string) => {
    const client = clients.find(c => c.id === clientId);
    const photo = client?.photos.find(p => p.id === photoId);
    
    if (!photo) return;

    try {
        await deleteFile(photo.url);
        
        const { error } = await supabase.from('photos').delete().eq('id', photoId);
        if (error) throw error;

        // Log Activity
        await supabase.from('activity_logs').insert({
            client_id: clientId,
            folder_id: photo.folderId, // Assuming photo object has folderId
            user_id: session?.user?.id,
            action_type: 'delete',
            details: { fileName: photo.originalName || 'arquivo', photoId: photoId }
        });

        await fetchData();
    } catch (e) {
        console.error("Error deleting photo:", e);
    }
  }, [clients, fetchData, session]);

  const handleCreateFolder = useCallback(async (clientId: string, parentId: string | null, name: string) => {
      try {
          const { error } = await supabase.from('folders').insert({
              client_id: clientId,
              parent_id: parentId,
              name: name,
              created_by: session?.user?.id
          });

          if (error) throw error;

          // Log Activity
          await supabase.from('activity_logs').insert({
              client_id: clientId,
              folder_id: parentId, // Parent folder
              user_id: session?.user?.id,
              action_type: 'create_folder',
              details: { folderName: name }
          });
          await fetchData();
      } catch (e: any) {
          console.error("Error creating folder:", e);
          alert("Erro ao criar pasta: " + e.message);
      }
  }, [session, fetchData]);
  
  const handleUpdateFolder = useCallback(async (clientId: string, folderId: string, updates: { name?: string; thumbnail_url?: string }) => {
      try {
          const { error } = await supabase.from('folders').update(updates).eq('id', folderId);

          if (error) throw error;

          // Log Activity (Rename or Update Thumbnail)
          await supabase.from('activity_logs').insert({
              client_id: clientId,
              folder_id: folderId,
              user_id: session?.user?.id,
              action_type: 'create_folder', // reusing or new type 'update_folder'? 'create_folder' is close enough for log or I can ignore logging for thumbnail updates to keep simple
              details: { folderId, updates }
          });
          
          await fetchData();
      } catch (e: any) {
           console.error("Error updating folder:", e);
           alert("Erro ao atualizar pasta: " + e.message);
      }
  }, [session, fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous previews
    photoPreviews.forEach(p => URL.revokeObjectURL(p.url));
    setPhotoPreviews([]);
    setPhotoError('');
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const newPreviews: {name: string, url: string, type: string}[] = [];

      Array.from(files).forEach((file: File) => {
          // Validate size logic if needed
          if (file.size > MAX_FILE_SIZE) {
             // Maybe warn?
             console.warn(`File ${file.name} too large`);
             return; 
          }
          validFiles.push(file);
          
          if (file.type.startsWith('image/')) {
              newPreviews.push({ name: file.name, url: URL.createObjectURL(file), type: 'image' });
          } else {
              newPreviews.push({ name: file.name, url: '', type: 'file' });
          }
      });

      setNewPhotoFiles(validFiles);
      setPhotoPreviews(newPreviews);
    } else {
      setNewPhotoFiles([]);
      setPhotoPreviews([]);
    }
  };

  if (initialLoading) {
     return <div className="min-h-screen bg-brand-darker flex items-center justify-center text-white">Carregando sistema...</div>;
  }

  if (hasAdmin === false) {
      return <NoAdminNotification />;
  }

  // Show Login if no session
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }
  
  // Show "Loading User Profile" if session exists but currentUser not yet matched
  if (!currentUser) {
       return <div className="min-h-screen bg-brand-darker flex items-center justify-center text-white">Carregando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-brand-darker text-brand-light font-sans selection:bg-brand-accent selection:text-white">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8">
        {view === 'dashboard' && (
          <Dashboard 
            clients={clients} 
            onSelectClient={handleSelectClient}
            currentUser={currentUser}
            onOpenCreateClientModal={() => setCreateClientModalOpen(true)}
            onOpenManageUsersModal={() => setManageUsersModalOpen(true)}
            onEditClient={handleOpenEditClient}
            onDeleteClient={(client) => setClientToDelete(client)}
          />
        )}
        {view === 'client' && selectedClient && (
          <AlbumView 
            project={selectedClient} 
            onBack={handleBackToDashboard}
            onOpenAddPhotoModal={(folderId) => {
                setUploadTargetFolderId(folderId || null);
                setAddPhotoModalOpen(true);
            }}
            onDeletePhoto={handleDeletePhoto}
            onCreateFolder={handleCreateFolder}
            onUpdateFolder={handleUpdateFolder}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Create Client Modal */}
      <Modal isOpen={isCreateClientModalOpen} onClose={() => setCreateClientModalOpen(false)} title="Novo Cliente">
          <form onSubmit={(e) => { e.preventDefault(); handleCreateClient(); }}>
              <FormInput label="Nome do Cliente" id="clientName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} required />
              <FormInput label="Descrição da Campanha" id="clientDesc" isTextArea value={newClientDesc} onChange={(e) => setNewClientDesc(e.target.value)} />
              <button type="submit" className="w-full flex justify-center items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-brand-accent/20">
                  <PlusIcon className="w-5 h-5" /> Criar Cliente
              </button>
          </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={isEditClientModalOpen} onClose={() => setEditClientModalOpen(false)} title="Editar Cliente">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateClient(); }}>
              <FormInput label="Nome do Cliente" id="editClientName" value={editClientName} onChange={(e) => setEditClientName(e.target.value)} required />
              <FormInput label="Descrição da Campanha" id="editClientDesc" isTextArea value={editClientDesc} onChange={(e) => setEditClientDesc(e.target.value)} />
              <button type="submit" className="w-full flex justify-center items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-brand-accent/20">
                  <PencilIcon className="w-5 h-5" /> Salvar Alterações
              </button>
          </form>
      </Modal>

       {/* Delete Client Confirmation Modal */}
       <Modal 
        isOpen={!!clientToDelete} 
        onClose={() => setClientToDelete(null)} 
        title="Excluir Cliente"
      >
        <div>
            <p className="text-gray-300 mb-2">Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.name}</strong>?</p>
            <p className="text-red-400 text-sm mb-6 font-semibold bg-red-400/10 p-2 rounded border border-red-400/20">Esta ação apagará todos os {clientToDelete?.photos.length} arquivos associados e não pode ser desfeita.</p>
            
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setClientToDelete(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleDeleteClient}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-900/20 flex items-center gap-2"
                >
                    <TrashIcon className="w-4 h-4" /> Excluir Cliente
                </button>
            </div>
        </div>
      </Modal>

      {/* Manage Users Modal */}
      <Modal isOpen={isManageUsersModalOpen} onClose={() => { setManageUsersModalOpen(false); setEditingUserPermissions(null); setViewingAddMemberForm(false); }} title={viewingAddMemberForm ? "Novo Membro" : "Gerenciar Equipe"} maxWidth="max-w-4xl">
          {viewingAddMemberForm ? (
              // Add Member Form View
              <div className="space-y-4">
                  <button 
                       onClick={() => setViewingAddMemberForm(false)}
                       className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
                   >
                       <ArrowLeftIcon className="w-4 h-4" /> Voltar para lista
                   </button>
                   
                   <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                        <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }} className="space-y-6">
                            
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">E-mail</label>
                                <input 
                                    type="email" 
                                    placeholder="email@agencia.com" 
                                    value={newUserEmail} 
                                    onChange={(e) => setNewUserEmail(e.target.value)} 
                                    className="w-full shadow appearance-none border border-slate-700 rounded-xl py-3 px-4 bg-slate-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent" 
                                    required 
                                />
                            </div>
                            
                            {/* Role Select */}
                            {currentUser.role === 'admin' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Cargo</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${newUserRole === 'user' ? 'border-brand-accent bg-brand-accent/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                            <input type="radio" className="hidden" name="role" value="user" checked={newUserRole === 'user'} onChange={() => setNewUserRole('user')} />
                                            <span className={`font-bold ${newUserRole === 'user' ? 'text-brand-accent' : 'text-gray-400'}`}>Staff / Criativo</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${newUserRole === 'manager' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                            <input type="radio" className="hidden" name="role" value="manager" checked={newUserRole === 'manager'} onChange={() => setNewUserRole('manager')} />
                                            <span className={`font-bold ${newUserRole === 'manager' ? 'text-blue-500' : 'text-gray-400'}`}>Gerente</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                             {/* Client Select (Conditional) */}
                            {newUserRole === 'user' && (
                                 <div className="relative group">
                                     <label className="block text-sm font-bold text-gray-400 mb-2">Acesso aos Clientes</label>
                                     <div className="bg-slate-800 border border-slate-700 rounded-xl max-h-60 overflow-y-auto">
                                        {clients.length === 0 ? (
                                             <p className="p-4 text-center text-gray-500 text-sm">Nenhum cliente cadastrado.</p>
                                        ) : (
                                            clients.map(client => (
                                                <label key={client.id} className="flex items-center gap-3 p-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newUserAllowedClients.includes(client.id) ? 'bg-brand-accent border-brand-accent' : 'border-slate-600 bg-slate-900'}`}>
                                                        {newUserAllowedClients.includes(client.id) && <ShieldCheckIcon className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden"
                                                        checked={newUserAllowedClients.includes(client.id)}
                                                        onChange={() => {
                                                            setNewUserAllowedClients(prev => 
                                                                prev.includes(client.id) ? prev.filter(c => c !== client.id) : [...prev, client.id]
                                                            );
                                                        }}
                                                    />
                                                    <span className="text-sm text-gray-300 font-medium">{client.name}</span>
                                                </label>
                                            ))
                                        )}
                                     </div>
                                     <p className="text-xs text-gray-500 mt-2 ml-1">Selecione quais clientes este membro poderá acessar.</p>
                                 </div>
                            )}

                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-accent/20 text-base mt-2">
                                <PlusIcon className="w-5 h-5"/> Criar Usuário
                            </button>
                        </form>
                   </div>
              </div>
          ) : editingUserPermissions ? (
              <div className="space-y-4">
                   <button 
                        onClick={() => setEditingUserPermissions(null)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeftIcon className="w-4 h-4" /> Voltar para lista
                    </button>
                    
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white">Permissões de Acesso</h3>
                        <p className="text-sm text-gray-400">Gerenciando acesso para: <span className="text-brand-accent font-semibold">{editingUserPermissions.name}</span></p>
                    </div>

                    <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-700 max-h-64 overflow-y-auto">
                        {clients.length === 0 ? (
                            <p className="p-4 text-center text-gray-500">Nenhum cliente cadastrado.</p>
                        ) : (
                            <ul className="divide-y divide-slate-800">
                                {clients.map(client => {
                                    const hasAccess = editingUserPermissions.allowedClientIds?.includes(client.id);
                                    return (
                                        <li 
                                            key={client.id} 
                                            className={`flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${hasAccess ? 'bg-slate-800/30' : ''}`}
                                            onClick={() => toggleUserClientAccess(client.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasAccess ? 'bg-brand-accent border-brand-accent' : 'border-slate-600'}`}>
                                                    {hasAccess && <ShieldCheckIcon className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className={hasAccess ? 'text-white font-medium' : 'text-gray-400'}>{client.name}</span>
                                            </div>
                                            {hasAccess && <span className="text-xs text-brand-accent font-bold uppercase tracking-wider">Permitido</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="pt-4 border-t border-slate-700 mt-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Segurança</h4>
                        <button 
                            onClick={async () => {
                                if(!window.confirm(`Deseja redefinir a senha de ${editingUserPermissions.name}? O acesso atual será revogado.`)) return;
                                
                                const newPassword = Math.random().toString(36).slice(-8) + "!Aa1";
                                try {
                                    const { error } = await supabase.functions.invoke('reset-password', {
                                        body: { email: editingUserPermissions.email, newPassword }
                                    });
                                    
                                    if(error) throw error;
                                    
                                    setCreatedUserCredentials({ email: editingUserPermissions.email, newPassword });
                                    setEditingUserPermissions(null); // Close edit mode to show success overlay purely
                                    // Keep Manage Users Modal open though? Yes, success overlay is inside or on top? 
                                    // Success overlay is a separate Modal controlled by 'createdUserCredentials'.
                                    // It will show up on top or replace the current view if z-index is handled or if they stack.
                                    // Actually, let's keep ManageUsersModal open, the Success Modal will appear on top of it.
                                    
                                } catch(e: any) {
                                    console.error("Error resetting password:", e);
                                    const msg = e.context?.json?.error || e.message || "Erro desconhecido";
                                    alert(`Erro ao redefinir senha: ${msg}`);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 py-2.5 rounded-xl transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Redefinir Senha e Gerar Credenciais
                        </button>
                    </div>

                    <button 
                        onClick={() => setEditingUserPermissions(null)}
                        className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2.5 rounded-xl transition-colors mt-2"
                    >
                        Concluir Edição
                    </button>
              </div>
          ) : (
            <div className="flex flex-col min-h-[60vh] max-h-[80vh]">
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Membros da Equipe ({users.length})</h3>
                            <div className="text-xs text-gray-500 mt-1">
                                {users.filter(u => u.role === 'admin').length} Admins • {users.filter(u => u.role === 'user').length} Criativos
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setViewingAddMemberForm(true)}
                            className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-brand-accent/20"
                        >
                            <PlusIcon className="w-4 h-4" /> Novo Membro
                        </button>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden flex-1 relative">
                        {/* Scrollable Container with Custom Scrollbar */}
                        <div className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-slate-800 sticky top-0 z-10 shadow-lg">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-slate-800">Membro</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-slate-800">Cargo</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-slate-800">Acesso</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap bg-slate-800">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {users.map(user => {
                                        const allowedNames = clients
                                            .filter(c => user.allowedClientIds.includes(c.id))
                                            .map(c => c.name);
                                        
                                        return (
                                            <tr key={user.email} className="hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-4 align-top">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${user.role === 'admin' ? 'bg-amber-500 text-black' : 'bg-slate-700 text-white'}`}>
                                                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-white text-sm truncate max-w-[200px]" title={user.name || user.email}>{user.name || 'Sem Nome'}</span>
                                                            <span className="text-xs text-gray-500 truncate max-w-[200px]" title={user.email}>{user.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : user.role === 'manager' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-slate-700 text-gray-300 border-slate-600'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-top">
                                                    {user.role === 'admin' ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-emerald-400/80 bg-emerald-500/5 px-2 py-1 rounded self-start inline-flex whitespace-nowrap">
                                                            <ShieldCheckIcon className="w-3 h-3" />
                                                            <span>Acesso Total</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full min-w-[200px]">
                                                            {allowedNames.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {allowedNames.map(name => (
                                                                        <span key={name} className="inline-block px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-gray-300 whitespace-nowrap">{name}</span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-red-400/60 text-xs italic flex items-center gap-1 whitespace-nowrap"><KeyIcon className="w-3 h-3"/> Sem acesso</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 align-top text-right">
                                                     <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        {user.role === 'user' && (
                                                            <button 
                                                                onClick={() => setEditingUserPermissions(user)}
                                                                className="p-1.5 bg-slate-800 hover:bg-brand-accent text-gray-400 hover:text-white rounded border border-slate-700 transition-colors"
                                                                title="Editar Permissões"
                                                            >
                                                                <PencilIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        
                                                        {currentUser.role === 'admin' && user.email !== currentUser.email && (
                                                            <button 
                                                                onClick={async () => {
                                                                    if(!window.confirm(`Tem certeza que deseja remover ${user.name}?`)) return;
                                                                    try {
                                                                        const { error } = await supabase.functions.invoke('delete-user', {
                                                                            body: { userId: user.id }
                                                                        });

                                                                        if (error) throw error;

                                                                        alert("Usuário removido com sucesso.");
                                                                        fetchData();
                                                                    } catch (e: any) {
                                                                        console.error("Error deleting user:", e);
                                                                        const msg = e.context?.json?.error || e.message || "Erro desconhecido";
                                                                        alert(`Erro ao remover usuário: ${msg}`);
                                                                    }
                                                                }}
                                                                className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 text-gray-400 rounded border border-slate-700 transition-colors"
                                                                title="Remover Usuário"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                     </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500 italic">Nenhum membro encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          )}
      </Modal>

       {/* Credential Success Modal */}
       <Modal 
        isOpen={!!createdUserCredentials} 
        onClose={() => setCreatedUserCredentials(null)} 
        title="Usuário Criado!"
       >
        {createdUserCredentials && (
            <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheckIcon className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="text-emerald-400 font-bold text-lg">Sucesso!</h4>
                        <p className="text-gray-300 text-sm">O usuário foi criado e já pode acessar o sistema. Envie os dados abaixo para ele.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative group">
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">E-mail de Acesso</label>
                        <div className="flex gap-2">
                             <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm break-all">
                                {createdUserCredentials.email}
                             </div>
                             <button 
                                onClick={() => navigator.clipboard.writeText(createdUserCredentials.email)}
                                className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg border border-slate-700 transition-colors"
                                title="Copiar E-mail"
                             >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Senha Temporária</label>
                        <div className="flex gap-2">
                             <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-xl tracking-wider font-bold">
                                {createdUserCredentials.password}
                             </div>
                             <button 
                                onClick={() => navigator.clipboard.writeText(createdUserCredentials.password)}
                                className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg border border-slate-700 transition-colors"
                                title="Copiar Senha"
                             >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             </button>
                        </div>
                        <p className="text-xs text-amber-500/80 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Peça para alterar a senha no primeiro acesso (futuramente).
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            const text = `Olá! Aqui estão suas credenciais de acesso ao GRIDD Marketing 360:\n\nLink: ${window.location.origin}\nE-mail: ${createdUserCredentials.email}\nSenha: ${createdUserCredentials.password}`;
                            navigator.clipboard.writeText(text);
                            alert("Texto copiado para a área de transferência!");
                        }}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        Copiar Tudo
                    </button>
                    <button
                        onClick={() => {
                             const text = `Olá! Aqui estão suas credenciais de acesso ao GRIDD Marketing 360:\n\nLink: ${window.location.origin}\nE-mail: ${createdUserCredentials.email}\nSenha: ${createdUserCredentials.password}`;
                             window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-[#25D366]/20"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        Enviar no WhatsApp
                    </button>
                    <button
                        onClick={() => setCreatedUserCredentials(null)}
                         className="col-span-2 mt-2 bg-transparent text-gray-500 hover:text-white py-2 text-sm transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        )}
       </Modal>
  
       {/* Add Photo Modal */}
      <Modal 
        isOpen={isAddPhotoModalOpen} 
        onClose={() => {
            if(!isUploading) {
                setAddPhotoModalOpen(false);
                setPhotoError('');
                setNewPhotoFiles([]);
                setNewPhotoTags('');
                setPhotoPreviews([]);
            } 
        }} 
        title={`Novo Arquivo para ${selectedClient?.name}`}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddPhoto(); }}>
          <div className="mb-4">
            <label htmlFor="photoFile" className="block text-gray-400 text-sm font-bold mb-2">Arquivo Criativo</label>
            <div className="relative">
                <input 
                    type="file" 
                    id="photoFile" 
                    accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-accent file:text-white hover:file:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                    disabled={isUploading} 
                    required 
                    multiple
                />
            </div>
            {photoError && <p className="text-red-400 text-xs mt-2 bg-red-400/10 p-1.5 rounded">{photoError}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="photoTags" className="block text-gray-400 text-sm font-bold mb-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-brand-accent" />
                Tags
            </label>
            <input 
                id="photoTags"
                type="text"
                value={newPhotoTags}
                onChange={(e) => setNewPhotoTags(e.target.value)}
                placeholder="Ex: cozinha, moderna, 2024 (separadas por vírgula)"
                className="shadow appearance-none border border-slate-700 rounded-xl w-full py-3 px-4 bg-slate-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">Tags ajudam a filtrar fotos no álbum depois.</p>
          </div>

          {photoPreviews.length > 0 && (
              <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto bg-slate-800 p-2 rounded-xl border border-slate-700">
                  {photoPreviews.map((preview, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-white/5">
                          {preview.type === 'image' ? (
                               <img src={preview.url} alt={preview.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                               <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                                   <FileIcon className="w-4 h-4 text-gray-400" />
                               </div>
                          )}
                          <span className="text-xs text-gray-300 truncate">{preview.name}</span>
                      </div>
                  ))}
              </div>
          )}
          
          {isUploading ? (
              <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Enviando Asset...</span>
                      <span className="text-xs font-bold text-gray-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-brand-accent to-purple-400 h-2 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
              </div>
          ) : (
            <button type="submit" className="w-full flex justify-center items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-brand-accent/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled={newPhotoFiles.length === 0}>
                {newPhotoFiles.length > 1 ? `Enviar ${newPhotoFiles.length} Arquivos` : 'Enviar Arquivo'} <CameraIcon className="w-5 h-5" />
            </button>
          )}
        </form>
      </Modal>
    </div>
  );
};



export default App;
