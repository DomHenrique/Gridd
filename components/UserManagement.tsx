import React, { useState, useEffect } from 'react';
import { User, Folder, FolderPermission, UserRole, AccessLevel } from '../types';
import { DataService } from '../services/dataService';
import { Users, UserPlus, Shield, Check, X, Lock, Unlock, Folder as FolderIcon, ChevronRight, ChevronDown, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { getAuthService } from '../services/google-photos/auth/auth.service';

interface UserManagementProps {
    currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // New User Form State
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'client' as UserRole });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await DataService.getUsers(currentUser.id);
            const fetchedFolders = await DataService.getAllFolders();
            
            // Enrich users with their current permissions
            const usersWithPerms = await Promise.all(fetchedUsers.map(async (u) => {
                const perms = await DataService.getUserPermissions(u.id);
                return { ...u, permissions: perms };
            }));

            setUsers(usersWithPerms);
            setFolders(fetchedFolders);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.name || !newUserForm.email) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        try {
            // Nota: No Supabase Real, a criação de usuário Auth deve ser feita via Admin ou Convite.
            // Aqui vamos simular criando o perfil, mas o usuário precisará se registrar com o mesmo email.
            // Em uma implementação real completa, usaríamos uma Edge Function.
            const { data, error } = await supabase.from('profiles').insert({
                email: newUserForm.email,
                full_name: newUserForm.name,
                role: newUserForm.role,
                id: crypto.randomUUID() // Placeholder - real ID viria do Auth
            });

            if (error) throw error;
            
            setIsAddModalOpen(false);
            setNewUserForm({ name: '', email: '', role: 'client' });
            loadData();
            alert("Perfil de usuário criado. O usuário deve se registrar com este e-mail.");
        } catch (e: any) {
            alert(`Erro ao criar usuário: ${e.message}`);
        }
    };

    const handlePermissionToggle = (folderId: string, level: AccessLevel) => {
        if (!selectedUserForPerms) return;

        const currentPerms = [...selectedUserForPerms.permissions];
        const existingIndex = currentPerms.findIndex(p => p.folderId === folderId);

        if (existingIndex >= 0) {
            const existing = currentPerms[existingIndex];
            if (existing.accessLevel === level) {
                currentPerms.splice(existingIndex, 1); // Toggle off
            } else {
                currentPerms[existingIndex].accessLevel = level; // Switch level
            }
        } else {
            currentPerms.push({ folderId, accessLevel: level });
        }

        setSelectedUserForPerms({ ...selectedUserForPerms, permissions: currentPerms });
    };

    const savePermissions = async () => {
        if (!selectedUserForPerms) return;

        try {
            // Get original permissions from users list
            const originalUser = users.find(u => u.id === selectedUserForPerms.id);
            if (!originalUser) return;

            const originalPerms = originalUser.permissions;
            const currentPerms = selectedUserForPerms.permissions;

            // Revoke removed permissions
            const toRevoke = originalPerms.filter(op => !currentPerms.some(cp => cp.folderId === op.folderId));
            for (const p of toRevoke) {
                await DataService.revokePermission(p.folderId, selectedUserForPerms.id, currentUser.id);
            }

            // Grant new or updated permissions
            for (const p of currentPerms) {
                await DataService.grantPermission(p.folderId, selectedUserForPerms.id, p.accessLevel, currentUser.id);
            }

            setSelectedUserForPerms(null);
            loadData();
            alert("Permissões sincronizadas com sucesso.");
        } catch (e: any) {
            alert(`Erro ao salvar permissões: ${e.message}`);
        }
    };

    // Helper to get folder hierarchy visual (flat list with depth simulation)
    const renderFolderList = () => {
        const rootFolders = folders.filter(f => !f.parentId);
        
        const renderFolderRow = (folder: Folder, depth: number) => {
            const perm = selectedUserForPerms?.permissions.find(p => p.folderId === folder.id);
            const currentLevel = perm?.accessLevel;

            const children = folders.filter(f => f.parentId === folder.id);

            return (
                <React.Fragment key={folder.id}>
                    <div className={`flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/50' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden" style={{ paddingLeft: `${depth * 20}px` }}>
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                ${currentLevel ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}
                            `}>
                                <FolderIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col truncate">
                                <span className={`text-sm font-medium truncate ${currentLevel ? 'text-slate-900' : 'text-gray-500'}`}>
                                    {folder.name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {currentLevel === 'admin' ? 'Administrador' : currentLevel === 'editor' ? 'Editor' : currentLevel === 'viewer' ? 'Leitor' : 'Sem Acesso'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1 flex-shrink-0">
                            {(['viewer', 'editor', 'admin'] as AccessLevel[]).map((level) => (
                                <button 
                                    key={level}
                                    onClick={() => handlePermissionToggle(folder.id, level)}
                                    className={`
                                        relative px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200 flex items-center gap-1
                                        ${currentLevel === level 
                                            ? 'bg-white text-orange-600 shadow-sm ring-1 ring-black/5' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                                    `}
                                    title={level === 'admin' ? 'Acesso total' : level === 'editor' ? 'Pode enviar e renomear' : 'Apenas visualização'}
                                >
                                    {currentLevel === level && <CheckCircle2 className="w-3 h-3" />}
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {children.map(child => renderFolderRow(child, depth + 1))}
                </React.Fragment>
            );
        };

        return (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estrutura de Pastas</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nível de Permissão</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {rootFolders.map(f => renderFolderRow(f, 0))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-display font-bold text-2xl text-secondary flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" /> Gerenciamento de Usuários
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Adicione usuários e configure permissões de acesso às pastas.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                    >
                        <UserPlus className="w-5 h-5" /> Novo Usuário
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Users List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Usuário</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Acesso</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${selectedUserForPerms?.id === user.id ? 'bg-blue-50/50' : ''}`}>
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={user.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200" alt="" />
                                            <div>
                                                <p className="font-bold text-sm text-secondary">{user.name}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                                ${user.role === 'superuser' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                                            `}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-gray-500">
                                                {user.role === 'superuser' ? (
                                                    <span className="flex items-center gap-1 text-green-600 font-bold"><Shield className="w-3 h-3" /> Total</span>
                                                ) : (
                                                    <span>{user.permissions.length} pastas liberadas</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            {user.role !== 'superuser' && (
                                                <button 
                                                    onClick={() => setSelectedUserForPerms(user)}
                                                    className={`
                                                        font-semibold text-xs border px-3 py-1.5 rounded transition-all flex items-center gap-2 ml-auto
                                                        ${selectedUserForPerms?.id === user.id 
                                                            ? 'bg-primary text-white border-primary shadow-md' 
                                                            : 'text-primary border-primary/20 hover:border-primary hover:bg-primary/5'}
                                                    `}
                                                >
                                                    {selectedUserForPerms?.id === user.id ? 'Editando...' : 'Permissões'}
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Permission Editor Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[600px]">
                    <h3 className="font-bold text-lg text-secondary mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gray-400" /> Controle de Acesso
                    </h3>
                    
                    {selectedUserForPerms ? (
                        <div className="animate-fade-in flex flex-col h-full">
                            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Editando permissões para</p>
                                <div className="flex items-center gap-2">
                                    <img src={selectedUserForPerms.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                    <p className="font-bold text-secondary text-lg">{selectedUserForPerms.name}</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Selecione o nível de acesso por pasta:</p>
                                {renderFolderList()}
                            </div>

                            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
                                <button 
                                    onClick={savePermissions}
                                    className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
                                >
                                    Salvar Alterações
                                </button>
                                <button 
                                    onClick={() => setSelectedUserForPerms(null)}
                                    className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h4 className="text-gray-900 font-bold mb-2">Nenhum usuário selecionado</h4>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                Clique no botão "Permissões" na lista ao lado para configurar os acessos de um usuário específico.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="font-display font-bold text-xl mb-4 text-secondary">Novo Usuário</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={newUserForm.name}
                                    onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                                    required
                                    title="Insira o nome completo do usuário"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Corporativo</label>
                                <input 
                                    type="email" 
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={newUserForm.email}
                                    onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                                    required
                                    title="Insira o e-mail corporativo do usuário"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Acesso</label>
                                <select 
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                    value={newUserForm.role}
                                    onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}
                                    title="Selecione o nível de acesso global"
                                >
                                    <option value="client">Cliente (Acesso Restrito)</option>
                                    <option value="superuser">Superusuário (Acesso Total)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover shadow-lg">Criar Usuário</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
