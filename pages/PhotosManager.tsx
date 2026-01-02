import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Search, 
  FolderOpen, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Info,
  ExternalLink,
  Download
} from 'lucide-react';
import { getGooglePhotosService, getAuthService, Album, MediaItem } from '../services/google-photos';
import { BRAND } from '../constants';

interface PhotosManagerProps {
  onImport?: (items: MediaItem[]) => void;
}

export const PhotosManager: React.FC<PhotosManagerProps> = ({ onImport }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isImporting, setIsImporting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const photosService = getGooglePhotosService();
  const auth = getAuthService();

  useEffect(() => {
    // 1. Ouvir mudanças de estado (para reações em tempo real)
    const unsubscribe = auth.onAuthStateChanged((authed) => {
      setIsAuthenticated(authed);
      if (authed) {
        loadAlbums();
        loadPhotos();
      }
    });

    // 2. Aguardar inicialização (sync com Supabase)
    const init = async () => {
      setCheckingSession(true);
      await auth.isInitialized;
      const authed = auth.isAuthenticated();
      setIsAuthenticated(authed);
      
      if (authed) {
        await Promise.all([loadAlbums(), loadPhotos()]);
      }
      setCheckingSession(false);
    };

    init();

    return () => unsubscribe();
  }, []);

  const loadAlbums = async () => {
    try {
      const response = await photosService.listAlbums(20);
      setAlbums(response.albums || []);
    } catch (error) {
      console.error('Erro ao carregar álbuns:', error);
    }
  };

  const loadPhotos = async (albumId?: string, pageToken?: string) => {
    setLoading(true);
    try {
      let response;
      if (albumId) {
        response = await photosService.searchMediaItems({
          albumId,
          pageSize: 24,
          pageToken
        });
      } else {
        response = await photosService.searchMediaItems({
          pageSize: 24,
          pageToken
        });
      }
      
      if (pageToken) {
        setMediaItems(prev => [...prev, ...(response.mediaItems || [])]);
      } else {
        setMediaItems(response.mediaItems || []);
      }
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumSelect = (album: Album | null) => {
    setSelectedAlbum(album);
    setSelectedItems(new Set());
    loadPhotos(album?.id);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleLoadMore = () => {
    if (nextPageToken) {
      loadPhotos(selectedAlbum?.id, nextPageToken);
    }
  };

  const handleImport = async () => {
    if (selectedItems.size === 0) return;
    
    setIsImporting(true);
    try {
      const itemsToImport = mediaItems.filter(item => selectedItems.has(item.id));
      if (onImport) {
        onImport(itemsToImport);
      }
      // Simulate import delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSelectedItems(new Set());
      alert(`${itemsToImport.length} itens importados com sucesso!`);
    } catch (error) {
       console.error('Erro ao importar:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConnect = async () => {
    try {
      const auth = getAuthService();
      window.location.href = await auth.getAuthorizationUrl();
    } catch (error) {
      console.error('Erro ao iniciar conexão:', error);
      alert('Erro ao iniciar conexão com Google Photos.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
      {/* Search & Filter Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar na biblioteca..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[300px] md:max-w-none no-scrollbar">
            <button
              onClick={() => handleAlbumSelect(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!selectedAlbum ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={!selectedAlbum ? { backgroundColor: BRAND.primaryColor } : {}}
            >
              Biblioteca Total
            </button>
            {albums.map(album => (
              <button
                key={album.id}
                onClick={() => handleAlbumSelect(album)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedAlbum?.id === album.id ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={selectedAlbum?.id === album.id ? { backgroundColor: BRAND.primaryColor } : {}}
              >
                {album.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedItems.size > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {isImporting ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
              Importar {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'itens'}
            </button>
          )}
          <button 
            onClick={() => loadPhotos(selectedAlbum?.id)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Recarregar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-auto p-4 md:p-6 no-scrollbar min-h-0">
        {checkingSession ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <RefreshCw size={48} className="animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium">Verificando conexão com Google...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <img src="https://www.gstatic.com/images/branding/product/1x/photos_48dp.png" alt="Google Photos" className="w-12 h-12" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Conecte sua conta do Google Photos</h3>
             <p className="text-slate-500 max-w-md mb-8">
               Para visualizar e importar suas mídias diretamente para o Gridd360, precisamos de permissão para acessar sua biblioteca do Google Photos.
             </p>
             <button
               onClick={handleConnect}
               className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-primary-hover transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
               style={{ backgroundColor: BRAND.primaryColor }}
             >
               <i className="bi bi-google"></i>
               Conectar com Google Photos
             </button>
             <p className="mt-6 text-[10px] text-slate-400">
               Suas credenciais são processadas de forma segura via Google OAuth 2.0.
             </p>
          </div>
        ) : loading && mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <RefreshCw size={48} className="animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium">Carregando mídias do Google Photos...</p>
          </div>
        ) : mediaItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleItemSelection(item.id)}
                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedItems.has(item.id) ? 'border-primary shadow-lg scale-[0.98]' : 'border-transparent hover:border-slate-300'}`}
                style={selectedItems.has(item.id) ? { borderColor: BRAND.primaryColor } : {}}
              >
                <img 
                  src={`${item.baseUrl}=w400-h400-c`} 
                  alt={item.filename}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Selection Overlay */}
                <div className={`absolute inset-0 bg-primary/10 transition-opacity ${selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                
                {/* Checkbox Icon */}
                <div className={`absolute top-2 right-2 p-1 rounded-full bg-white shadow-md transition-transform ${selectedItems.has(item.id) ? 'scale-100 text-primary' : 'scale-0 group-hover:scale-100 text-slate-400'}`}
                   style={selectedItems.has(item.id) ? { color: BRAND.primaryColor } : {}}
                >
                  <CheckCircle2 size={16} fill={selectedItems.has(item.id) ? 'currentColor' : 'none'} className={selectedItems.has(item.id) ? 'text-white' : ''} />
                </div>

                {/* Info Overlay (appears on hover) */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white font-medium truncate m-0">{item.filename}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <Image size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Nenhuma mídia encontrada neste álbum.</p>
            <button 
              onClick={() => handleAlbumSelect(null)}
              className="mt-4 text-primary font-bold text-xs uppercase tracking-widest hover:underline"
              style={{ color: BRAND.primaryColor }}
            >
              Voltar para Biblioteca Total
            </button>
          </div>
        )}

        {isAuthenticated && nextPageToken && (
          <div className="mt-12 flex justify-center pb-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              {loading && <RefreshCw className="animate-spin" size={18} />}
              Carregar Mais Fotos
            </button>
          </div>
        )}
      </div>

      {/* Footer / Stats */}
      <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Image size={14} /> {mediaItems.length} Arquivos Carregados
          </span>
          {selectedAlbum && (
            <span className="flex items-center gap-1.5">
              <FolderOpen size={14} /> Álbum: <strong className="text-slate-700">{selectedAlbum.title}</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Info size={14} /> Sincronizado via Google Photos Library API
        </div>
      </div>
    </div>
  );
};
