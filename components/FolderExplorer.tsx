import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Folder, FileAsset, User, AccessLevel } from '../types';
import { BRAND } from '../constants';
import { Folder as FolderIcon, File, MoreVertical, Plus, ChevronRight, Home, Upload, Trash2, Download } from 'lucide-react';

interface FolderExplorerProps {
  currentUser: User;
  onUploadClick?: (folderId: string | null) => void;
}

export const FolderExplorer: React.FC<FolderExplorerProps> = ({ currentUser, onUploadClick }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Raiz' }]);
  const [activeAccessLevel, setActiveAccessLevel] = useState<AccessLevel>('viewer');

  useEffect(() => {
    loadContent(currentFolderId);
    checkAccessLevel(currentFolderId);
  }, [currentFolderId]);

  const loadContent = async (parentId: string | null) => {
    setLoading(true);
    try {
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        DataService.getFolders(parentId, currentUser.id, currentUser.role),
        parentId ? DataService.getFiles(parentId) : Promise.resolve([])
      ]);
      setFolders(fetchedFolders);
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAccessLevel = async (folderId: string | null) => {
    if (currentUser.role === 'superuser') {
        setActiveAccessLevel('admin');
        return;
    }
    
    if (!folderId) {
        setActiveAccessLevel('viewer'); // Raiz costuma ser apenas leitura ou filtrada
        return;
    }

    try {
        const perms = await DataService.getUserPermissions(currentUser.id);
        // Find if user has specific access to this folder or any parent
        // (Simplified check: look for direct permission first)
        const directPerm = perms.find(p => p.folderId === folderId);
        if (directPerm) {
            setActiveAccessLevel(directPerm.accessLevel);
        } else {
            // In a real scenario, we'd need to walk up the tree or rely on a "best" permission
            // For now, if they see it (via RLS), they at least have 'viewer'.
            setActiveAccessLevel('viewer');
        }
    } catch (e) {
        setActiveAccessLevel('viewer');
    }
  };

  const navigateTo = (folder: Folder | null) => {
    if (!folder) {
      setCurrentFolderId(null);
      setBreadcrumb([{ id: null, name: 'Raiz' }]);
    } else {
      setCurrentFolderId(folder.id);
      // Actual logic would find all parents. Simplified path for now.
      const exists = breadcrumb.find(b => b.id === folder.id);
      if (exists) {
          const idx = breadcrumb.indexOf(exists);
          setBreadcrumb(breadcrumb.slice(0, idx + 1));
      } else {
          setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
      }
    }
  };

  const handleCreateFolder = async () => {
      const name = prompt("Nome da pasta:");
      if (!name) return;
      
      try {
          await DataService.createFolder(currentFolderId, name, '', currentUser.id);
          loadContent(currentFolderId);
      } catch (e: any) {
          alert(`Erro: ${e.message}`);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header & Breadcrumbs */}
      <div className="flex justify-between items-center mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb.id || 'root'}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              <button 
                onClick={() => navigateTo(crumb.id ? { id: crumb.id, name: crumb.name, parentId: null } : null)}
                className={`hover:text-primary transition-colors font-medium ${idx === breadcrumb.length - 1 ? 'text-secondary font-bold' : ''}`}
              >
                {crumb.id === null ? <Home className="w-4 h-4" /> : crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex gap-2">
            {(activeAccessLevel === 'editor' || activeAccessLevel === 'admin') && (
                <>
                    <button 
                        onClick={handleCreateFolder}
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                        title="Nova Pasta"
                    >
                        <Plus className="w-4 h-4" /> <span className="d-none d-sm-inline">Nova Pasta</span>
                    </button>
                    <button 
                        onClick={() => onUploadClick?.(currentFolderId)}
                        className="btn btn-sm btn-primary d-flex align-items-center gap-2"
                        title="Upload"
                    >
                        <Upload className="w-4 h-4" /> <span className="d-none d-sm-inline">Upload</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* List Folders */}
          {folders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => navigateTo(folder)}
              className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <FolderIcon className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{folder.name}</p>
                <p className="text-[10px] text-gray-400">Pasta</p>
              </div>
              <MoreVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100" />
            </div>
          ))}

          {/* List Files */}
          {files.map(file => (
            <div 
              key={file.id}
              className="flex flex-col p-3 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                {file.url ? (
                    <img src={file.url} className="w-full h-full object-cover" alt="" />
                ) : (
                    <File className="w-10 h-10 text-gray-200" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white rounded-full text-secondary hover:text-primary transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                    {(activeAccessLevel === 'editor' || activeAccessLevel === 'admin') && (
                        <button className="p-2 bg-white rounded-full text-danger hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-800 text-xs truncate mb-1">{file.name}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>{file.size}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          {folders.length === 0 && files.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              <FolderIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Esta pasta está vazia.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
