import React, { useState, useEffect } from 'react';
import { User, Folder, FileAsset, ActivityLog, Notification } from './types';
import { AuthService, DataService } from './services/dataService';
import { UploadModal } from './components/UploadModal';
import { FileDetailModal } from './components/FileDetailModal';
import { PortfolioSection } from './components/PortfolioSection';
import { UserManagement } from './components/UserManagement';
import { 
    LayoutDashboard, 
    Folder as FolderIcon, 
    LogOut, 
    Bell, 
    Menu, 
    FolderPlus, 
    ChevronRight, 
    Image as ImageIcon,
    FileText,
    Activity,
    Shield,
    Zap,
    CheckCircle,
    ArrowRight,
    Users,
    Edit2
} from 'lucide-react';
import { BRAND } from './constants';
import { TargetAudienceSection } from './components/TargetAudienceSection';

// --- COMPONENTS: PUBLIC INSTITUTIONAL SITE ---

const LandingPage = ({ onNavigateToLogin }: { onNavigateToLogin: () => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-body text-slate-800 flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-secondary text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold font-display">G</div>
                        <h1 className="font-display font-bold text-xl tracking-tight">GRID<span className="text-primary">360</span></h1>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="hover:text-primary transition-colors text-sm font-medium">Soluções</a>
                        <a href="#portfolio" className="hover:text-primary transition-colors text-sm font-medium">Portfólio</a>
                        <a href="#contact" className="hover:text-primary transition-colors text-sm font-medium">Contato</a>
                        <button 
                            onClick={onNavigateToLogin}
                            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5"
                        >
                            Área do Cliente
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-secondary-light border-t border-white/10 p-4 space-y-4">
                        <a href="#features" className="block hover:text-primary">Soluções</a>
                        <a href="#portfolio" className="block hover:text-primary">Portfólio</a>
                        <button 
                            onClick={onNavigateToLogin}
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold"
                        >
                            Acessar Sistema
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header className="relative bg-secondary py-20 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-white space-y-6 animate-fade-in">
                        <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold tracking-wide text-primary border border-white/10">
                            NOVA PLATAFORMA 2.0
                        </div>
                        <h1 className="font-display font-extrabold text-4xl lg:text-6xl leading-tight">
                            Centralize seus ativos visuais com <span className="text-primary">inteligência</span>.
                        </h1>
                        <p className="text-lg text-gray-300 max-w-xl">
                            A Gridd360 oferece uma gestão completa para franquias e grandes marcas. Organize, compartilhe e controle o acesso aos seus materiais de marketing em um único lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={onNavigateToLogin} className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-lg shadow-xl shadow-orange-900/20 transition-all flex items-center justify-center gap-2">
                                Acessar Minha Conta <ArrowRight className="w-5 h-5" />
                            </button>
                            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg transition-all border border-white/10">
                                Agendar Demo
                            </button>
                        </div>
                    </div>
                    <div className="hidden lg:block relative">
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                             <img 
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                alt="Dashboard Preview" 
                                className="rounded-lg shadow-inner opacity-90"
                             />
                             {/* Floating Badges */}
                             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                                 <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle className="w-6 h-6" /></div>
                                 <div>
                                     <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                                     <p className="font-bold text-secondary">Sistema Operacional</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </header>

            {/* Target Audience Section */}
            <TargetAudienceSection />

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="font-display font-bold text-3xl text-secondary mb-4">Por que escolher a Gridd360?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Nossa arquitetura foi desenhada pensando na escalabilidade de redes de franquias e departamentos de marketing.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: "Segurança Total", desc: "Controle granular de permissões por usuário e pastas criptografadas." },
                            { icon: Zap, title: "Upload Inteligente", desc: "Integração com Google Photos e sistema de anotações pré-upload." },
                            { icon: Users, title: "Multi-Cliente", desc: "Ambientes segregados para cada cliente com personalização de marca." }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-display font-bold text-xl text-secondary mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Portfolio Section */}
            <section id="portfolio" className="py-12 bg-gray-50/50 border-t border-gray-100">
                 <PortfolioSection />
            </section>

             {/* Footer */}
             <footer className="bg-secondary text-white py-12 border-t border-white/10 mt-auto">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="font-display font-bold text-2xl tracking-tight mb-4">GRID<span className="text-primary">360</span></h2>
                        <p className="text-gray-400 max-w-sm">A plataforma definitiva para gestão de ativos digitais corporativos.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Plataforma</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-primary">Login</a></li>
                            <li><a href="#" className="hover:text-primary">Suporte</a></li>
                            <li><a href="#" className="hover:text-primary">Documentação</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-primary">Privacidade</a></li>
                            <li><a href="#" className="hover:text-primary">Termos de Uso</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                    © 2024 Gridd360 Manager. Todos os direitos reservados.
                </div>
             </footer>
        </div>
    );
};

// --- COMPONENTS: AUTH & SYSTEM ---

const LoginView = ({ onLogin, onBack }: { onLogin: (email: string) => void, onBack: () => void }) => {
    const [email, setEmail] = useState('cliente@rede.com');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(email);
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20"
            >
                ← Voltar ao site
            </button>

            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="font-display font-bold text-3xl text-secondary">
                        {BRAND.logoText}<span className="text-primary">{BRAND.logoSuffix}</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">Área Restrita</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email de Acesso</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
                        <p>Dica: Use <b>admin@gridd360.com</b> para Superuser</p>
                        <p>ou <b>cliente@rede.com</b> para Cliente</p>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-70"
                    >
                        {loading ? 'Validando...' : 'Entrar no Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ActivityTable = ({ logs }: { logs: ActivityLog[] }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-display font-bold text-lg text-secondary flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Atividades Recentes
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-3">Ação</th>
                        <th className="px-6 py-3">Item</th>
                        <th className="px-6 py-3">Usuário</th>
                        <th className="px-6 py-3">Data</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <span className={`
                                    px-2 py-1 rounded text-[10px] font-bold
                                    ${log.action === 'UPLOAD' ? 'bg-green-100 text-green-700' : ''}
                                    ${log.action === 'DELETE' ? 'bg-red-100 text-red-700' : ''}
                                    ${log.action === 'RENAME' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${log.action === 'CREATE_FOLDER' ? 'bg-purple-100 text-purple-700' : ''}
                                    ${log.action === 'USER_CREATE' ? 'bg-indigo-100 text-indigo-700' : ''}
                                    ${log.action === 'PERM_UPDATE' ? 'bg-orange-100 text-orange-700' : ''}
                                    ${log.action === 'UPDATE_FOLDER' ? 'bg-teal-100 text-teal-700' : ''}
                                `}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-700">{log.targetName}</td>
                            <td className="px-6 py-4 text-gray-500">{log.userName}</td>
                            <td className="px-6 py-4 text-gray-400 text-xs">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhuma atividade registrada.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
    // Routes: 'home' (public site) | 'login' | 'app' (dashboard)
    const [currentRoute, setCurrentRoute] = useState<'home' | 'login' | 'app'>('home');
    
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<'dashboard' | 'albums' | 'users'>('dashboard');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    
    // Data State
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<FileAsset[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileAsset | null>(null);
    
    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        if(user) {
            refreshData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, currentFolderId, view]);

    const refreshData = async () => {
        if (!user) return;

        // Load Logs
        const fetchedLogs = await DataService.getLogs();
        setLogs(fetchedLogs);

        // Load Notifications
        const notifs = await DataService.getNotifications();
        setNotifications(notifs);

        if (view === 'albums') {
            const fetchedFolders = await DataService.getFolders(currentFolderId, user.id, user.role);
            setFolders(fetchedFolders);

            if (currentFolderId) {
                const fetchedFiles = await DataService.getFiles(currentFolderId);
                setFiles(fetchedFiles);
            } else {
                setFiles([]);
            }
        }
    };

    const handleLogin = async (email: string) => {
        const foundUser = await AuthService.login(email);
        if (foundUser) {
            setUser(foundUser);
            // Default logic logic
            if (foundUser.role === 'client') {
                 // Try to find first accessible folder since assignedRootFolderId is deprecated in favor of permissions
                 // But for compatibility with existing logic, we just reset view to Albums
                 setCurrentFolderId(null); 
                 setBreadcrumbs([]);
                 setView('albums');
            } else {
                setView('dashboard');
            }
            setCurrentRoute('app');
        } else {
            alert("Usuário não encontrado.");
        }
    };

    const handleFolderClick = (folder: Folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (id: string, index: number) => {
        setCurrentFolderId(id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    };

    const handleCreateFolder = async () => {
        const name = prompt("Nome da nova pasta:");
        if (name && user) {
            const note = prompt("Adicione uma descrição/anotação para esta pasta (opcional):") || "";
            try {
                await DataService.createFolder(currentFolderId, name, note, user.id);
                refreshData();
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    const handleEditFolder = async (folder: Folder) => {
        const newName = prompt("Editar nome da pasta:", folder.name);
        if (newName === null) return; // Cancelled
        
        const newNote = prompt("Editar descrição/anotação:", folder.note || "");
        if (newNote === null) return; // Cancelled

        if (user) {
            try {
                await DataService.updateFolder(folder.id, newName || folder.name, newNote || "", user.id);
                refreshData();
            } catch (e: any) {
                alert(e.message);
            }
        }
    }

    const handleUpload = async (fileList: {file: File, note: string}[]) => {
        if (currentFolderId && user) {
            try {
                await DataService.uploadFiles(currentFolderId, fileList, user.id);
                refreshData();
            } catch (e: any) {
                console.error(e);
            }
        }
    };

    const handleDeleteFile = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir?") && user) {
            try {
                await DataService.deleteFile(id, user.id);
                refreshData();
            } catch (e: any) {
                console.error(e);
            }
        }
    };

    const handleRenameFile = async (id: string, currentName: string) => {
        const newName = prompt("Novo nome:", currentName);
        if (newName && user) {
            await DataService.renameFile(id, newName, user.id);
            refreshData();
        }
    };

    const handleLogout = () => {
        setUser(null);
        setBreadcrumbs([]);
        setCurrentFolderId(null);
        setFiles([]);
        setFolders([]);
        setCurrentRoute('home'); // Go back to public site
    }

    // --- ROUTING LOGIC ---

    if (currentRoute === 'home') {
        return <LandingPage onNavigateToLogin={() => setCurrentRoute('login')} />;
    }

    if (currentRoute === 'login') {
        return <LoginView onLogin={handleLogin} onBack={() => setCurrentRoute('home')} />;
    }

    if (!user) {
        // Fallback safety
        return <LoginView onLogin={handleLogin} onBack={() => setCurrentRoute('home')} />;
    }

    // --- DASHBOARD APP RENDER ---

    return (
        <div className="flex min-h-screen bg-background font-body">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-secondary text-white transition-all duration-300 flex flex-col fixed h-full z-20 shadow-2xl`}>
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <h1 className="font-display font-bold text-2xl tracking-tight">GRID<span className="text-primary">360</span></h1>
                    ) : (
                        <h1 className="font-display font-bold text-xl text-primary mx-auto">G360</h1>
                    )}
                </div>
                
                <nav className="flex-1 mt-6 px-3 space-y-2">
                    <button 
                        onClick={() => setView('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                        <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="font-medium">Dashboard</span>}
                    </button>
                    <button 
                        onClick={() => setView('albums')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'albums' ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                        <FolderIcon className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="font-medium">Meus Álbuns</span>}
                    </button>
                    {user.role === 'superuser' && (
                        <button 
                            onClick={() => setView('users')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'users' ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            <Users className="w-5 h-5 flex-shrink-0" />
                            {isSidebarOpen && <span className="font-medium">Usuários</span>}
                        </button>
                    )}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20 mb-3">
                        <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-primary" />
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 text-red-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors text-sm">
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        {isSidebarOpen && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <Menu className="w-5 h-5" />
                        </button>
                        {view === 'albums' && (
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">Álbuns</span>
                                {breadcrumbs.map((crumb, idx) => (
                                    <React.Fragment key={crumb.id}>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                        <button 
                                            onClick={() => handleBreadcrumbClick(crumb.id, idx)}
                                            className="hover:text-primary font-medium transition-colors"
                                        >
                                            {crumb.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                             </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-secondary text-sm">Notificações</h3>
                                        <button className="text-xs text-primary font-bold hover:underline">Marcar como lidas</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-sm">Nenhuma notificação nova</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-800">{n.title}</p>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    {view === 'users' && user.role === 'superuser' && (
                        <UserManagement currentUser={user} />
                    )}

                    {view === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-primary to-orange-400 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="font-bold text-lg opacity-90">Total de Arquivos</h3>
                                    <p className="text-4xl font-display font-bold mt-2">1,204</p>
                                    <p className="text-xs mt-2 opacity-75">Update hoje</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg text-secondary">Pastas Ativas</h3>
                                    <p className="text-4xl font-display font-bold mt-2 text-gray-800">24</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg text-secondary">Aprovações</h3>
                                    <p className="text-4xl font-display font-bold mt-2 text-gray-800">8</p>
                                    <p className="text-xs text-primary mt-2">Pendentes</p>
                                </div>
                            </div>

                            <ActivityTable logs={logs} />
                        </div>
                    )}

                    {view === 'albums' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-display font-bold text-2xl text-secondary">
                                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Meus Álbuns'}
                                </h2>
                                <div className="flex gap-3">
                                    {currentFolderId && (
                                        <button 
                                            onClick={() => setIsUploadOpen(true)}
                                            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            <UploadModal 
                                                isOpen={isUploadOpen} 
                                                onClose={() => setIsUploadOpen(false)}
                                                onUpload={handleUpload}
                                            />
                                            <FolderPlus className="w-5 h-5" />
                                            Upload Fotos
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleCreateFolder}
                                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors"
                                    >
                                        <FolderPlus className="w-5 h-5" />
                                        Nova Pasta
                                    </button>
                                </div>
                            </div>

                            {/* Folders Grid */}
                            {folders.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pastas</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {folders.map(folder => (
                                            <div 
                                                key={folder.id}
                                                onClick={() => handleFolderClick(folder)}
                                                className="group relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 cursor-pointer transition-all flex flex-col justify-between min-h-[120px]"
                                            >
                                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                                                        className="p-1.5 bg-gray-100 rounded-full hover:bg-white hover:text-primary hover:shadow-sm"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="w-10 h-10 bg-blue-50 text-secondary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                            <FolderIcon className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                    <p className="font-semibold text-gray-700 truncate group-hover:text-primary transition-colors">{folder.name}</p>
                                                </div>
                                                
                                                {folder.note && (
                                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 border-t border-gray-50 pt-2 leading-relaxed">
                                                        {folder.note}
                                                    </p>
                                                )}
                                                
                                                {!folder.note && (
                                                    <p className="text-xs text-gray-300 mt-1 italic">Items privados</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files Grid */}
                            {currentFolderId && (
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Arquivos ({files.length})</h3>
                                    </div>
                                    
                                    {files.length === 0 ? (
                                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-400 font-medium">Pasta vazia. Comece fazendo um upload.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                            {files.map(file => (
                                                <div 
                                                    key={file.id} 
                                                    onClick={() => setSelectedFile(file)}
                                                    className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                                                >
                                                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRenameFile(file.id, file.name); }}
                                                                className="p-2 bg-white rounded-full text-gray-700 hover:text-primary transition-colors shadow-sm" title="Renomear"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                                                                className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm" title="Excluir"
                                                            >
                                                                <LogOut className="w-4 h-4" /> 
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-800 truncate w-32" title={file.name}>{file.name}</p>
                                                                <p className="text-xs text-gray-400">{file.size}</p>
                                                            </div>
                                                        </div>
                                                        {file.note && (
                                                            <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 p-1.5 rounded border border-yellow-100">
                                                                <span className="font-bold">Obs:</span> {file.note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            
            {/* Detail Modal */}
            <FileDetailModal 
                file={selectedFile} 
                onClose={() => setSelectedFile(null)} 
            />
        </div>
    );
}