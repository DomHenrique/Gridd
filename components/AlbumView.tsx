import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Client, Photo, User, Folder, ActivityLog } from '../types';
import { ArrowLeftIcon, CameraIcon, XMarkIcon, TrashIcon, SearchIcon, TagIcon, DownloadIcon, FolderIcon, ArrowUpIcon, VideoIcon, DocumentIcon, FileIcon, ChartBarIcon, ClockIcon, DocumentTextIcon, UsersIcon, PencilIcon } from './icons';
import Modal from './Modal';
import { getFileUrl, uploadFile } from '../services/storage';
import { supabase } from '../lib/supabase';

// Folder Card Component
interface FolderCardProps {
    folder: Folder;
    onClick: () => void;
}
const FolderCard: React.FC<FolderCardProps & { onEdit: (e: React.MouseEvent) => void }> = ({ folder, onClick, onEdit }) => (
    <div 
        onClick={onClick}
        className="group relative w-full h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-brand-accent/10 transition-all duration-300 aspect-[4/3] bg-slate-800/50 cursor-pointer border border-white/5 flex flex-col items-center justify-center gap-2"
    >
        {folder.thumbnailUrl ? (
            <>
                <img src={folder.thumbnailUrl} alt={folder.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>
                <div className="absolute bottom-4 inset-x-0 flex flex-col items-center z-10 px-4">
                     <FolderIcon className="w-8 h-8 text-white mb-1 drop-shadow-md" />
                     <span className="text-white font-bold text-lg drop-shadow-md text-center truncate w-full">{folder.name}</span>
                </div>
            </>
        ) : (
            <>
                <FolderIcon className="w-16 h-16 text-yellow-500/80 group-hover:text-yellow-400 transition-colors" />
                <span className="text-gray-300 font-medium group-hover:text-white transition-colors px-4 text-center truncate w-full">{folder.name}</span>
            </>
        )}

        <button 
            onClick={(e) => { e.stopPropagation(); onEdit(e); }}
            className="absolute top-2 right-2 bg-slate-900/80 hover:bg-brand-accent text-white rounded-full p-2 shadow-lg backdrop-blur-sm border border-white/10 transition-colors opacity-0 group-hover:opacity-100 z-20"
            title="Editar Pasta"
        >
            <PencilIcon className="w-3.5 h-3.5" />
        </button>
    </div>
);

interface PhotoCardProps {
    photo: Photo;
    onClick: () => void;
    onDelete: (photo: Photo) => void;
    canDelete: boolean;
}

const PhotoCard: React.FC<PhotoCardProps> = React.memo(({ photo, onClick, onDelete, canDelete }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [secureUrl, setSecureUrl] = useState<string | null>(null);
    
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;
        getFileUrl(photo.url).then(url => {
            if (mounted) setSecureUrl(url);
        });
        return () => { mounted = false; };
    }, [photo.url]);

    useEffect(() => {
        if (!cardRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px',
                threshold: 0.01
            }
        );

        observer.observe(cardRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `download-${photo.id}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Falha no download:");
            window.open(photo.url, '_blank');
        }
    };

    return (
        <div 
            ref={cardRef}
            className="group relative w-full h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-brand-accent/10 transition-all duration-300 aspect-square bg-slate-800 cursor-pointer border border-white/5"
            onClick={onClick}
        >
            {(!isLoaded && !hasError) && (
                <div className="absolute inset-0 z-0 bg-slate-800 animate-pulse flex items-center justify-center">
                    <CameraIcon className="w-10 h-10 text-slate-700 opacity-50" />
                </div>
            )}

            {hasError && (
                <div className="absolute inset-0 z-10 bg-slate-800 flex flex-col items-center justify-center text-slate-500">
                    <XMarkIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Falha ao carregar</span>
                </div>
            )}

            {isVisible && !hasError && (
                photo.mimeType?.startsWith('image/') || (!photo.mimeType && photo.url.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                    secureUrl && <img 
                        src={secureUrl} 
                        alt={photo.originalName || `Arquivo de ${photo.uploadedBy}`} 
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => {
                            setHasError(true);
                            setIsLoaded(true);
                        }}
                        loading="lazy" 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-4 text-center">
                        {photo.mimeType?.startsWith('video/') ? (
                             <VideoIcon className="w-16 h-16 text-blue-400 mb-2" />
                        ) : photo.mimeType?.includes('pdf') || photo.mimeType?.includes('document') ? (
                             <DocumentIcon className="w-16 h-16 text-red-400 mb-2" />
                        ) : (
                             <FileIcon className="w-16 h-16 text-gray-400 mb-2" />
                        )}
                        <span className="text-xs text-gray-300 font-medium break-all line-clamp-2">{photo.originalName || 'Arquivo'}</span>
                    </div>
                )
            )}
            
            {isLoaded && !hasError && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none shadow-lg border border-white/10 z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                        <p className="text-white font-bold text-xs truncate leading-tight">{photo.uploadedBy}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono tracking-wide uppercase">{new Date(photo.timestamp).toLocaleDateString('pt-BR')} • {new Date(photo.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    {photo.tags && photo.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {photo.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[9px] bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded border border-brand-accent/20">#{tag}</span>
                            ))}
                            {photo.tags.length > 3 && <span className="text-[9px] text-gray-400">+{photo.tags.length - 3}</span>}
                        </div>
                    )}
                </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
                 <button 
                    onClick={handleDownload}
                    className="bg-slate-900/80 hover:bg-brand-accent text-white rounded-full p-2 shadow-lg backdrop-blur-sm border border-white/10 transition-colors"
                    aria-label="Baixar arquivo original"
                    title="Baixar original"
                >
                    <DownloadIcon className="w-4 h-4" />
                </button>

                {canDelete && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(photo);
                        }}
                        className="bg-slate-900/80 hover:bg-red-500 text-white rounded-full p-2 shadow-lg backdrop-blur-sm border border-white/10 transition-colors"
                        aria-label="Excluir arquivo"
                        title="Excluir arquivo"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
});


// --- New Components for Activity & Reports ---

const ActivityFeed: React.FC<{ logs: ActivityLog[] }> = ({ logs }) => {
    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                <ClockIcon className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-gray-400">Nenhuma atividade recente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {logs.map(log => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className={`p-2 rounded-lg ${
                        log.action_type === 'upload' ? 'bg-blue-500/10 text-blue-500' :
                        log.action_type === 'delete' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                    }`}>
                        {log.action_type === 'upload' && <CameraIcon className="w-5 h-5" />}
                        {log.action_type === 'delete' && <TrashIcon className="w-5 h-5" />}
                        {log.action_type.includes('folder') && <FolderIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-gray-200 text-sm">
                            <span className="font-bold text-white">{log.user?.name || 'Usuário'}</span>
                            {' '}
                            {log.action_type === 'upload' ? 'enviou um arquivo:' : 
                             log.action_type === 'delete' ? 'excluiu um arquivo:' :
                             log.action_type === 'create_folder' ? 'criou a pasta:' : 'realizou uma ação:'}
                             {' '}
                             <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-brand-light text-xs">
                                {log.details.fileName || log.details.folderName || 'Desconhecido'}
                             </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportsDashboard: React.FC<{ logs: ActivityLog[], client: Client }> = ({ logs, client }) => {
    const stats = useMemo(() => {
        const totalUploads = logs.filter(l => l.action_type === 'upload').length;
        const totalDeletes = logs.filter(l => l.action_type === 'delete').length;
        const totalFolders = logs.filter(l => l.action_type === 'create_folder').length;
        
        // Group by User
        const userActivity: {[key: string]: number} = {};
        logs.forEach(log => {
            const userName = log.user?.name || 'Unknown';
            userActivity[userName] = (userActivity[userName] || 0) + 1;
        });

        return { totalUploads, totalDeletes, totalFolders, userActivity };
    }, [logs]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-6 rounded-2xl border border-white/5 shadow-lg">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total de Ações</p>
                    <p className="text-3xl font-black text-white">{logs.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-white/5 shadow-lg">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Uploads</p>
                    <p className="text-3xl font-black text-white">{stats.totalUploads}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-white/5 shadow-lg">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Exclusões</p>
                    <p className="text-3xl font-black text-white">{stats.totalDeletes}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-white/5 shadow-lg">
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Alterações</p>
                    <p className="text-3xl font-black text-white">{stats.totalFolders}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-brand-accent"/> Atividade por Usuário
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.userActivity).map(([user, count]) => (
                            <div key={user} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                <span className="text-gray-300 font-medium">{user}</span>
                                <span className="bg-brand-accent text-white hover:bg-brand-accent-hover text-xs font-bold px-2 py-1 rounded-full transition-colors">{count} ações</span>
                            </div>
                        ))}
                         {Object.keys(stats.userActivity).length === 0 && <p className="text-gray-500 italic">Sem dados.</p>}
                    </div>
                </div>
                <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             <DocumentTextIcon className="w-5 h-5 text-brand-accent"/> Exportar Dados
                         </h3>
                         <button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/20">
                             <DownloadIcon className="w-4 h-4" /> Exportar CSV
                         </button>
                     </div>
                     <p className="text-gray-400 text-sm leading-relaxed">
                         Baixe um relatório completo de todas as atividades nesta pasta/projeto em formato CSV para análise externa ou auditoria.
                     </p>
                </div>
            </div>
        </div>
    );
};

interface AlbumViewProps {
  project: Client;
  onBack: () => void;
  onOpenAddPhotoModal: (folderId?: string | null) => void;
  onDeletePhoto: (projectId: string, photoId: string) => void;
  onCreateFolder: (projectId: string, parentId: string | null, name: string) => Promise<void>;
  onUpdateFolder: (projectId: string, folderId: string, updates: { name?: string; thumbnail_url?: string }) => Promise<void>;
  currentUser: User;
}

const AlbumView: React.FC<AlbumViewProps> = ({ project: client, onBack, onOpenAddPhotoModal, onDeletePhoto, onCreateFolder, onUpdateFolder, currentUser }) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isCreateFolderModalOpen, setCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    
    // Edit Folder State
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [editFolderThumbnail, setEditFolderThumbnail] = useState<File | null>(null);
    const [isUpdatingFolder, setIsUpdatingFolder] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [secureSelectedUrl, setSecureSelectedUrl] = useState<string | null>(null);
    const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
    
    // Activity Logs State
    const [activeTab, setActiveTab] = useState<'files' | 'activity' | 'reports'>('files');
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Fetch Logs Logic
    useEffect(() => {
        if (activeTab === 'files') return;

        const fetchLogs = async () => {
            setIsLoadingLogs(true);
            try {
                let query = supabase
                    .from('activity_logs')
                    .select('*, user:profiles(name)')
                    .eq('client_id', client.id)
                    .order('timestamp', { ascending: false });
                
                const { data, error } = await query;

                if (error) throw error;
                
                const mappedData = data?.map(item => ({
                    ...item,
                    user: item.user
                })) as ActivityLog[];

                setActivityLogs(mappedData || []);
            } catch (err) {
                console.error("Error fetching activity logs:");
            } finally {
                setIsLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [activeTab, client.id]);
    
    // Breadcrumbs Logic
    const breadcrumbs = useMemo(() => {
        if (!currentFolderId) return [];
        const path: Folder[] = [];
        let curr = client.folders?.find(f => f.id === currentFolderId);
        while (curr) {
            path.unshift(curr);
            curr = client.folders?.find(f => f.id === curr.parentId);
        }
        return path;
    }, [currentFolderId, client.folders]);
    
    // Update secure url when selected photo changes
    useEffect(() => {
        if (selectedPhoto) {
            let mounted = true;
            setSecureSelectedUrl(null);
            getFileUrl(selectedPhoto.url).then(url => {
                if(mounted) setSecureSelectedUrl(url);
            });
            return () => { mounted = false; };
        }
    }, [selectedPhoto]);
    
    // Filtros State
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [uploaderFilter, setUploaderFilter] = useState<string>('all');
    
    // Tags State
    const [tagInput, setTagInput] = useState('');
    const [filterTags, setFilterTags] = useState<string[]>([]);

    const handleDeleteRequest = (photo: Photo) => {
        setPhotoToDelete(photo);
    };

    const handleConfirmDelete = () => {
        if (photoToDelete) {
            onDeletePhoto(client.id, photoToDelete.id);
            setPhotoToDelete(null);
        }
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagInput.trim().toLowerCase();
            if (tag && !filterTags.includes(tag)) {
                setFilterTags([...filterTags, tag]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFilterTags(filterTags.filter(tag => tag !== tagToRemove));
    };

    // Extrair lista única de uploaders para o dropdown
    const availableUploaders = useMemo(() => {
        const uploaders = new Set(client.photos.map(p => p.uploadedBy));
        return Array.from(uploaders);
    }, [client.photos]);

    // Lógica combinada de filtros
    const filteredContent = useMemo(() => {
        // Current Folder Content
        const currentPhotos = client.photos.filter(p => p.folderId === (currentFolderId || null) || (!p.folderId && !currentFolderId));
        const currentFolders = client.folders?.filter(f => f.parentId === (currentFolderId || null)) || [];

        const photos = currentPhotos.filter(photo => {
            // 1. Filtro de Texto (Search)
            const matchesSearch = photo.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
            
            // 2. Filtro de Uploader
            const matchesUploader = uploaderFilter === 'all' || photo.uploadedBy === uploaderFilter;

            // 3. Filtro de Data
            let matchesDate = true;
            if (dateFilter !== 'all') {
                const photoDate = new Date(photo.timestamp);
                const now = new Date();
                
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const pDate = new Date(photoDate.getFullYear(), photoDate.getMonth(), photoDate.getDate());

                if (dateFilter === 'today') {
                    matchesDate = pDate.getTime() === today.getTime();
                } else if (dateFilter === 'week') {
                    const oneWeekAgo = new Date(today);
                    oneWeekAgo.setDate(today.getDate() - 7);
                    matchesDate = pDate >= oneWeekAgo;
                } else if (dateFilter === 'month') {
                    const oneMonthAgo = new Date(today);
                    oneMonthAgo.setMonth(today.getMonth() - 1);
                    matchesDate = pDate >= oneMonthAgo;
                }
            }

            // 4. Filtro de Tags
            let matchesTags = true;
            if (filterTags.length > 0) {
                if (!photo.tags || photo.tags.length === 0) {
                    matchesTags = false;
                } else {
                    matchesTags = filterTags.every(filterTag => 
                        photo.tags!.some(photoTag => photoTag.toLowerCase() === filterTag)
                    );
                }
            }

            return matchesSearch && matchesUploader && matchesDate && matchesTags;
        });

        return { photos, folders: currentFolders };
    }, [client.photos, client.folders, currentFolderId, searchQuery, uploaderFilter, dateFilter, filterTags]);


    return (
        <div>
            <div className="mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white font-medium py-2 transition-colors mb-6 group">
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-brand-accent"/>
                    Voltar para Carteira de Clientes
                </button>
                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8">
                    <div className="flex items-end gap-6">
                        <img src={client.coverImage} className="w-20 h-20 rounded-xl object-cover shadow-lg border border-white/10 hidden md:block" alt="Logo" />
                        <div>
                            <span className="text-brand-accent text-xs font-bold uppercase tracking-widest mb-1 block">Cliente / Campanha</span>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">{client.name}</h1>
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <span 
                                    className={`cursor-pointer hover:text-brand-accent ${!currentFolderId ? 'text-white font-bold' : ''}`}
                                    onClick={() => setCurrentFolderId(null)}
                                >
                                    Raiz
                                </span>
                                {breadcrumbs.map((folder, index) => (
                                    <React.Fragment key={folder.id}>
                                        <span>/</span>
                                        <span 
                                            className={`cursor-pointer hover:text-brand-accent ${index === breadcrumbs.length - 1 ? 'text-white font-bold' : ''}`}
                                            onClick={() => setCurrentFolderId(folder.id)}
                                        >
                                            {folder.name}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="w-full">
                {/* Tabs Navigation */}
                <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl w-fit mb-6 border border-slate-700/50">
                    <button 
                        onClick={() => setActiveTab('files')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'files' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <DocumentIcon className="w-4 h-4"/> Arquivos Recentes
                    </button>
                    <button 
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <ClockIcon className="w-4 h-4"/> Atividades Recentes
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <ChartBarIcon className="w-4 h-4"/> Relatórios
                    </button>
                </div>

                {/* Files Tab Content */}
                {activeTab === 'files' && (
                    <div className="flex flex-col gap-6">
                        {/* Toolbar (Filters & Actions) */}
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
                                {/* Filtro de Data */}
                                <select 
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value as any)}
                                    className="bg-slate-900/50 border border-slate-700 text-gray-300 text-sm rounded-xl focus:ring-brand-accent focus:border-brand-accent block p-3 outline-none transition-colors hover:bg-slate-800"
                                >
                                    <option value="all">Todas as Datas</option>
                                    <option value="today">Hoje</option>
                                    <option value="week">Última Semana</option>
                                    <option value="month">Último Mês</option>
                                </select>

                                {/* Filtro de Uploader */}
                                <select 
                                    value={uploaderFilter}
                                    onChange={(e) => setUploaderFilter(e.target.value)}
                                    className="bg-slate-900/50 border border-slate-700 text-gray-300 text-sm rounded-xl focus:ring-brand-accent focus:border-brand-accent block p-3 outline-none transition-colors hover:bg-slate-800"
                                >
                                    <option value="all">Todos os Enviadores</option>
                                    {availableUploaders.map(uploader => (
                                        <option key={uploader} value={uploader}>{uploader}</option>
                                    ))}
                                </select>

                                {/* Campo de Busca (Tags) */}
                                <div className="relative group w-full sm:w-auto">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <TagIcon className="w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Filtrar por tags + Enter"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagInputKeyDown}
                                        className="w-full sm:w-56 pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all shadow-sm"
                                        aria-label="Filtrar por tags"
                                    />
                                </div>

                                {/* Campo de Busca (Texto) */}
                                <div className="relative flex-grow sm:flex-grow-0 group w-full sm:w-auto">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <SearchIcon className="w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full sm:w-48 pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all shadow-sm"
                                        aria-label="Buscar arquivos por nome"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            aria-label="Limpar busca"
                                        >
                                            <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Active Tags Display */}
                            {filterTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {filterTags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-brand-accent/20 text-brand-accent border border-brand-accent/30 animate-fade-in">
                                            #{tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-white">
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <button onClick={() => setFilterTags([])} className="text-xs text-gray-500 hover:text-white underline ml-2">
                                        Limpar tags
                                    </button>
                                </div>
                            )}

                            <div className="mt-4 flex flex-col gap-2">
                                <button onClick={() => onOpenAddPhotoModal(currentFolderId)} className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-brand-accent/20 transform hover:-translate-y-0.5">
                                    <CameraIcon className="w-5 h-5"/>
                                    Upload de Arquivo
                                </button>
                                <button onClick={() => setCreateFolderModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg border border-slate-700">
                                    <FolderIcon className="w-5 h-5"/>
                                    Nova Pasta
                                </button>
                            </div>
                        </div>

                        {/* Grid or Empty State */}
                        {filteredContent.folders.length > 0 || filteredContent.photos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                {/* Back Button if in subfolder */}
                                {currentFolderId && (
                                    <div 
                                        onClick={() => {
                                            const curr = client.folders?.find(f => f.id === currentFolderId);
                                            setCurrentFolderId(curr?.parentId || null);
                                        }}
                                        className="group relative w-full h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-brand-accent/10 transition-all duration-300 aspect-[4/3] bg-slate-800/30 cursor-pointer border border-white/5 flex flex-col items-center justify-center gap-2 border-dashed border-gray-600 hover:border-brand-accent"
                                    >
                                        <ArrowUpIcon className="w-10 h-10 text-gray-500 group-hover:text-brand-accent transition-colors" />
                                        <span className="text-gray-400 font-medium group-hover:text-brand-accent transition-colors text-sm">Voltar</span>
                                    </div>
                                )}

                                {/* Folders */}
                                {filteredContent.folders.map(folder => (
                                    <FolderCard 
                                        key={folder.id}
                                        folder={folder}
                                        onClick={() => setCurrentFolderId(folder.id)}
                                        onEdit={(e) => {
                                            setEditingFolder(folder);
                                            setEditFolderName(folder.name);
                                            setEditFolderThumbnail(null);
                                        }}
                                    />
                                ))}

                                {/* Photos */}
                                {filteredContent.photos.map(photo => {
                                    const canDelete = currentUser.role === 'admin' 
                                                   || currentUser.role === 'manager' 
                                                   || currentUser.name === photo.uploadedBy;
                                    return (
                                        <PhotoCard 
                                            key={photo.id} 
                                            photo={photo} 
                                            onClick={() => setSelectedPhoto(photo)} 
                                            onDelete={handleDeleteRequest}
                                            canDelete={canDelete}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700/50">
                                <div className="bg-slate-800/50 rounded-full p-6 mb-4">
                                    <CameraIcon className="w-10 h-10 text-gray-500" />
                                </div>
                                <p className="text-gray-300 text-lg font-medium text-center px-4">
                                    {client.photos.length > 0 
                                        ? "Nenhum arquivo corresponde aos filtros selecionados."
                                        : "Nenhum material criativo enviado ainda."
                                    }
                                </p>
                                {client.photos.length > 0 && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setDateFilter('all'); setUploaderFilter('all'); setFilterTags([]); }}
                                        className="mt-2 text-sm text-brand-accent hover:text-white underline transition-colors"
                                    >
                                        Limpar todos os filtros
                                    </button>
                                )}
                                {client.photos.length === 0 && (
                                    <button onClick={onOpenAddPhotoModal} className="mt-4 text-brand-accent hover:text-brand-accent-hover font-semibold transition-colors">
                                        Faça o primeiro upload para esta campanha
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div className="max-w-4xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ClockIcon className="w-6 h-6 text-brand-accent"/> Timeline de Atividades
                        </h2>
                        {isLoadingLogs ? (
                            <div className="text-center py-12 text-gray-500 animate-pulse">Carregando atividades...</div>
                        ) : (
                            <ActivityFeed logs={activityLogs} />
                        )}
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="w-full">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ChartBarIcon className="w-6 h-6 text-brand-accent"/> Relatórios de Atividade
                        </h2>
                        <div className="mb-6 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                            <p className="text-sm text-gray-400">Acompanhe detalhadamente as ações de cada usuário no sistema.</p>
                        </div>

                        {isLoadingLogs ? (
                            <div className="text-center py-12 text-gray-500 animate-pulse">Gerando relatórios...</div>
                        ) : (
                            <ReportsDashboard logs={activityLogs} client={client} />
                        )}
                    </div>
                )}
            </div>

            {selectedPhoto && (
                <div 
                   className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in"
                   onClick={() => setSelectedPhoto(null)}
                 >
                       <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => setSelectedPhoto(null)} className="absolute top-2 right-2 md:top-6 md:right-6 bg-white/5 hover:bg-white/20 text-white rounded-full p-3 transition-colors z-20 backdrop-blur-md border border-white/10">
                           <XMarkIcon className="w-8 h-8" />
                       </button>
                       
                       {/* Rendering in Modal */}
                       {selectedPhoto.mimeType?.startsWith('image/') || (!selectedPhoto.mimeType && selectedPhoto.url.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                           <img 
                               src={secureSelectedUrl || selectedPhoto.url} 
                               alt="Visualização ampliada" 
                               className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                           />
                       ) : (
                            <div className="bg-slate-800 p-12 rounded-2xl flex flex-col items-center text-center shadow-2xl border border-white/10">
                               {selectedPhoto.mimeType?.startsWith('video/') ? (
                                   <VideoIcon className="w-32 h-32 text-blue-500 mb-6" />
                               ) : (
                                   <FileIcon className="w-32 h-32 text-gray-500 mb-6" />
                               )}
                               <h3 className="text-2xl text-white font-bold mb-2">{selectedPhoto.originalName || 'Arquivo'}</h3>
                               <p className="text-gray-400 mb-6">Visualização não disponível para este formato.</p>
                               <a 
                                   href={secureSelectedUrl || selectedPhoto.url} 
                                   download 
                                   className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2"
                               >
                                   <DownloadIcon className="w-5 h-5" />
                                   Baixar Arquivo
                               </a>
                            </div>
                       )}
                       
                       <div className="mt-6 text-center">
                            <p className="text-white text-xl font-bold tracking-wide">{selectedPhoto.uploadedBy}</p>
                           <p className="text-sm text-gray-400 mt-1 font-mono mb-3">{new Date(selectedPhoto.timestamp).toLocaleString('pt-BR')}</p>
                           {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                               <div className="flex justify-center gap-2">
                                   {selectedPhoto.tags.map(tag => (
                                       <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-brand-light text-sm">#{tag}</span>
                                   ))}
                               </div>
                           )}
                       </div>
                   </div>
                </div>
            )}

            <Modal
                isOpen={!!photoToDelete}
                onClose={() => setPhotoToDelete(null)}
                title="Confirmar Exclusão"
            >
                <div>
                    <p className="text-gray-300 mb-6">
                        Tem certeza que deseja remover este arquivo permanentemente? Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setPhotoToDelete(null)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-900/20"
                        >
                            Deletar Arquivo
                        </button>
                    </div>
                </div>
            </Modal>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
            <Modal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setCreateFolderModalOpen(false)}
                title="Nova Pasta"
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (newFolderName.trim()) {
                        onCreateFolder(client.id, currentFolderId, newFolderName.trim());
                        setNewFolderName('');
                        setCreateFolderModalOpen(false);
                    }
                }}>
                    <div className="mb-4">
                        <label htmlFor="folderName" className="block text-gray-400 text-sm font-bold mb-2">Nome da Pasta</label>
                        <input 
                            id="folderName"
                            type="text" 
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="shadow appearance-none border border-slate-700 rounded-xl w-full py-3 px-4 bg-slate-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                            placeholder="Ex: Campanha Natal 2026"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-brand-accent/20">
                        Criar Pasta
                    </button>
                </form>
            </Modal>
            
            <Modal
                isOpen={!!editingFolder}
                onClose={() => setEditingFolder(null)}
                title="Editar Pasta"
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingFolder || !editFolderName.trim()) return;
                    
                    setIsUpdatingFolder(true);
                    try {
                         let thumbUrl = editingFolder.thumbnailUrl;
                         if (editFolderThumbnail) {
                              // Upload thumb
                              // Using client name for path context
                              thumbUrl = await uploadFile(editFolderThumbnail, client.name);
                         }
                         
                         await onUpdateFolder(client.id, editingFolder.id, {
                             name: editFolderName,
                             thumbnail_url: thumbUrl
                         });
                         setEditingFolder(null);
                    } catch(e) {
                        console.error(e);
                        alert("Falha ao atualizar pasta");
                    } finally {
                        setIsUpdatingFolder(false);
                    }
                }}>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2">Nome da Pasta</label>
                        <input 
                            type="text" 
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            className="shadow appearance-none border border-slate-700 rounded-xl w-full py-3 px-4 bg-slate-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                            disabled={isUpdatingFolder}
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm font-bold mb-2">Capa da Pasta (Thumbnail)</label>
                        <div className="flex items-start gap-4">
                            {(editFolderThumbnail || editingFolder?.thumbnailUrl) && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0">
                                    <img 
                                        src={editFolderThumbnail ? URL.createObjectURL(editFolderThumbnail) : editingFolder?.thumbnailUrl} 
                                        className="w-full h-full object-cover" 
                                        alt="Preview" 
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-800 hover:border-brand-accent transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <CameraIcon className="w-6 h-6 text-gray-400 mb-1" />
                                        <p className="text-xs text-gray-500">Clique para alterar a capa</p>
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            if(e.target.files && e.target.files[0]) {
                                                setEditFolderThumbnail(e.target.files[0]);
                                            }
                                        }}
                                        disabled={isUpdatingFolder}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2" disabled={isUpdatingFolder}>
                        {isUpdatingFolder ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default AlbumView;
