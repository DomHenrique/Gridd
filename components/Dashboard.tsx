
import React, { useMemo, useState } from 'react';
import { Client, User } from '../types';
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon, SearchIcon, XMarkIcon } from './icons';

interface ClientCardProps {
  client: Client;
  onSelectClient: (client: Client) => void;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (client: Client) => void;
  canEdit: boolean;
}

const ClientCard: React.FC<ClientCardProps> = React.memo(({ client, onSelectClient, onEditClient, onDeleteClient, canEdit }) => (
  <div 
    className="bg-brand-dark/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg group cursor-pointer transition-all duration-300 ease-in-out border border-white/5 hover:border-brand-accent/50 hover:shadow-brand-accent/10 hover:shadow-2xl relative flex flex-col h-full"
    onClick={() => onSelectClient(client)}
    aria-label={`Ver arquivos de ${client.name}`}
  >
    <div className="h-48 overflow-hidden relative">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={client.coverImage} alt={client.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent opacity-80"></div>
    </div>
    
    {canEdit && (
      <div className="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEditClient && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEditClient(client);
            }}
            className="p-2 bg-slate-900/80 rounded-full text-white hover:bg-brand-accent hover:text-white transition-all shadow-md backdrop-blur-sm border border-white/10"
            title="Editar Cliente"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
        {onDeleteClient && (
           <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClient(client);
            }}
            className="p-2 bg-slate-900/80 rounded-full text-white hover:bg-red-500 hover:text-white transition-all shadow-md backdrop-blur-sm border border-white/10"
            title="Excluir Cliente"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    )}

    <div className="p-5 flex-grow flex flex-col justify-between -mt-12 relative z-10">
      <div>
        <h3 className="font-bold text-2xl mb-1 text-white leading-tight">{client.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{client.description}</p>
      </div>
      <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
        <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">Campanha Ativa</span>
        <span className="inline-flex items-center justify-center bg-slate-800 rounded-full px-3 py-1 text-xs font-medium text-gray-300 border border-white/5">
            {client.photos.length} arquivos
        </span>
      </div>
    </div>
  </div>
));


interface DashboardProps {
  clients: Client[];
  currentUser: User;
  onSelectClient: (client: Client) => void;
  onOpenCreateClientModal: () => void;
  onOpenManageUsersModal: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, currentUser, onSelectClient, onOpenCreateClientModal, onOpenManageUsersModal, onEditClient, onDeleteClient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const canManageUsers = currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'superuser';
  
  // Filter clients based on user permissions AND search query
  const visibleClients = useMemo(() => {
    let filtered = clients;

    // 1. Permission Filter
    if (!canManageUsers) {
      const allowedIds = currentUser.allowedClientIds || [];
      filtered = filtered.filter(client => allowedIds.includes(client.id));
    }
    
    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [clients, currentUser, searchQuery]);
  
  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-8 gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Gerenciamento de Arquivos</h1>
            <p className="text-slate-400 mt-1">Gerencie conteudos para as campanhas e anuncios da Gridd 360</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            {/* Campo de Busca */}
            <div className="relative group w-full md:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                </span>
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all shadow-sm"
                    aria-label="Buscar clientes"
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

            <div className="flex gap-3">
                <button onClick={onOpenCreateClientModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-brand-accent/20">
                <PlusIcon className="w-5 h-5"/>
                <span className="inline">Novo</span>
                </button>
                {canManageUsers && (
                <button onClick={onOpenManageUsersModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all border border-white/10">
                    <UsersIcon className="w-5 h-5"/>
                    <span className="inline">Equipe</span>
                </button>
                )}
            </div>
        </div>
      </div>

      {visibleClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleClients.map(client => (
              <ClientCard 
                key={client.id} 
                client={client} 
                onSelectClient={onSelectClient}
                onEditClient={onEditClient}
                onDeleteClient={onDeleteClient}
                canEdit={canManageUsers}
              />
            ))}
          </div>
      ) : (
        <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
             <div className="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? `Nenhum cliente encontrado para "${searchQuery}"` : "Nenhum cliente disponível"}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery 
                    ? "Tente buscar por outro nome ou limpe o filtro."
                    : currentUser.role === 'user' 
                        ? "Você não possui permissão para acessar nenhuma campanha no momento. Solicite acesso ao seu gerente." 
                        : "Comece adicionando seu primeiro cliente para gerenciar arquivos."
                }
            </p>
             {searchQuery ? (
                 <button onClick={() => setSearchQuery('')} className="mt-6 text-brand-accent hover:text-brand-accent-hover font-bold underline">
                    Limpar busca
                 </button>
             ) : canManageUsers && (
                <button onClick={onOpenCreateClientModal} className="mt-6 text-brand-accent hover:text-brand-accent-hover font-bold">
                    Criar primeiro cliente
                </button>
             )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
