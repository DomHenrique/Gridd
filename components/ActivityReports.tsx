import React, { useState, useEffect } from 'react';
import { ActivityLog, User } from '../types';
import { DataService } from '../services/dataService';
import { Calendar, User as UserIcon, FileText, Download, Filter, Search, RotateCcw } from 'lucide-react';

interface ActivityReportsProps {
    currentUser: User;
}

export const ActivityReports: React.FC<ActivityReportsProps> = ({ currentUser }) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await DataService.getUsers(currentUser.id);
            const initialLogs = await DataService.getLogs();
            setUsers(fetchedUsers);
            setLogs(initialLogs);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined;
            const end = endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined;
            const filtered = await DataService.getFilteredLogs(start, end, selectedUserId || undefined);
            setLogs(filtered);
        } catch (error) {
            console.error('Erro ao filtrar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ['Data', 'Usuario', 'Acao', 'Alvo'];
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.userName.replace(/,/g, ''),
            log.action,
            log.targetName.replace(/,/g, '')
        ]);

        const csvContent = "\uFEFF" // UTF-8 BOM
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_atividades_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUserId('');
        loadInitialData();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-600" /> Relatórios de Atividade
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Acompanhe detalhadamente as ações de cada usuário no sistema.</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all w-full sm:w-auto justify-center"
                >
                    <Download className="w-5 h-5" /> Exportar CSV
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-600" /> Data Inicial
                        </label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="Data inicial do filtro"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-600" /> Data Final
                        </label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="Data final do filtro"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-orange-600" /> Usuário
                        </label>
                        <select 
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-white text-sm"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            title="Filtrar por usuário específico"
                        >
                            <option value="">Todos os Usuários</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button 
                            onClick={handleFilter}
                            className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <Filter className="w-4 h-4" /> Filtrar
                        </button>
                        <button 
                            onClick={resetFilters}
                            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                            title="Limpar Filtros"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total de Ações</p>
                    <p className="text-3xl font-bold text-slate-900">{logs.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Uploads</p>
                    <p className="text-3xl font-bold text-blue-600">{logs.filter(l => l.action === 'UPLOAD').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Exclusões</p>
                    <p className="text-3xl font-bold text-red-600">{logs.filter(l => l.action === 'DELETE').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-green-500">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Alterações</p>
                    <p className="text-3xl font-bold text-green-600">{logs.filter(l => ['RENAME', 'UPDATE_FOLDER', 'PERM_UPDATE'].includes(l.action)).length}</p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data e Hora</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Usuário</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ação</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Alvo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                                        <p className="mt-2 text-gray-500 font-medium">Carregando logs...</p>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-800">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold border border-orange-100 shadow-sm">
                                                    {log.userName.charAt(0)}
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{log.userName}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider
                                                ${log.action === 'UPLOAD' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                                                  log.action === 'DELETE' ? 'bg-red-50 text-red-700 border border-red-100' : 
                                                  'bg-slate-50 text-slate-700 border border-slate-200'}
                                            `}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-600 truncate max-w-[200px] md:max-w-xs" title={log.targetName}>
                                                {log.targetName}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-gray-400">
                                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 opacity-20" />
                                        </div>
                                        <h4 className="text-slate-900 font-bold mb-1">Sem resultados</h4>
                                        <p className="text-sm">Nenhuma atividade encontrada para os filtros selecionados.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
