import React, { useState, useEffect } from 'react';
import { Calendar, Megaphone, Palette, ChevronRight } from 'lucide-react';
import { DataService } from '../services/mockDb';
import { PortfolioItem, PortfolioCategoryType } from '../types';

export const PortfolioSection = () => {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [filter, setFilter] = useState<PortfolioCategoryType | 'Todos'>('Todos');

    useEffect(() => {
        DataService.getPortfolio().then(setItems);
    }, []);

    const filteredItems = filter === 'Todos' ? items : items.filter(i => i.category === filter);

    const renderEvents = () => {
        const eventItems = items.filter(i => i.category === 'Eventos');
        if (filter !== 'Todos' && filter !== 'Eventos') return null;
        
        return (
            <section className="animate-fade-in">
                <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="text-primary w-6 h-6" />
                    <h2 className="text-xl font-bold text-secondary">Eventos</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {eventItems.map(item => (
                        <article key={item.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                            <div className="h-40 bg-gray-200 relative overflow-hidden">
                                <img alt={item.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" src={item.imageUrl} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                {item.year && (
                                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-secondary text-[10px] font-bold px-2 py-1 rounded">{item.year}</span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-secondary mb-1">{item.title}</h3>
                                <div className="flex items-center text-xs text-gray-500 mb-3 space-x-2">
                                    <span className="font-semibold text-primary">{item.client}</span>
                                    <span>•</span>
                                    <span>{item.tags[1] || item.tags[0]}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        );
    };

    const renderCampaigns = () => {
        const campaignItems = items.filter(i => i.category === 'Campanhas');
        if (filter !== 'Todos' && filter !== 'Campanhas') return null;

        // Separate highlight item for better layout control like in HTML
        const highlight = campaignItems.find(i => i.isHighlight);
        const others = campaignItems.filter(i => !i.isHighlight);

        return (
            <section className="animate-fade-in">
                <div className="flex items-center space-x-2 mb-4">
                    <Megaphone className="text-primary w-6 h-6" />
                    <h2 className="text-xl font-bold text-secondary">Campanhas</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {highlight && (
                        <article className="col-span-2 relative bg-secondary rounded-2xl shadow-md overflow-hidden text-white h-64">
                            <div className="absolute inset-0 opacity-20">
                                <img alt="Background" className="w-full h-full object-cover" src={highlight.imageUrl} />
                            </div>
                            <div className="relative p-5 flex flex-col justify-end h-full">
                                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded self-start mb-2">{highlight.tags[0]}</span>
                                <h3 className="font-bold text-xl mb-1">{highlight.title}</h3>
                                <p className="text-xs text-white/80 mb-2">{highlight.subtitle}</p>
                                <p className="text-sm text-white/90">{highlight.description}</p>
                            </div>
                        </article>
                    )}
                    {others.map(item => (
                        <article key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="bg-gray-100 rounded-lg h-24 mb-3 w-full overflow-hidden">
                                <img alt={item.title} className="w-full h-full object-cover" src={item.imageUrl} />
                            </div>
                            <h3 className="font-bold text-sm text-secondary leading-tight">{item.title}</h3>
                            <p className="text-[10px] text-primary font-semibold mt-1">{item.client}</p>
                            <p className="text-[10px] text-gray-500">{item.description}</p>
                        </article>
                    ))}
                </div>
            </section>
        );
    };

    const renderBranding = () => {
        const brandingItems = items.filter(i => i.category === 'Branding');
        if (filter !== 'Todos' && filter !== 'Branding') return null;

        return (
            <section className="animate-fade-in">
                <div className="flex items-center space-x-2 mb-4">
                    <Palette className="text-primary w-6 h-6" />
                    <h2 className="text-xl font-bold text-secondary">Branding & Conteúdo</h2>
                </div>
                <div className="space-y-4">
                    {brandingItems.map(item => (
                        <article key={item.id} className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                            <div className="w-1/3 bg-gray-100 relative">
                                <img alt={item.title} className="w-full h-full object-cover" src={item.imageUrl} />
                            </div>
                            <div className="w-2/3 p-4 flex flex-col justify-center">
                                <h3 className="font-bold text-secondary">{item.title}</h3>
                                <p className="text-xs text-primary font-bold mb-1">{item.client}</p>
                                <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                            <div className="pr-4 flex items-center justify-center">
                                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        );
    };

    return (
        <div className="max-w-lg mx-auto py-8">
            <div className="mb-8 text-center">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3 uppercase tracking-widest">
                    Cases / Portfólio
                </span>
                <h1 className="text-3xl font-extrabold text-secondary leading-tight mb-2">
                    Projetos e campanhas que já colocamos na <span className="text-primary relative inline-block">
                        rua
                        <svg className="absolute w-full h-2 -bottom-0 left-0 text-primary/30" preserveAspectRatio="none" viewBox="0 0 100 10">
                            <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3"></path>
                        </svg>
                    </span>
                </h1>
                <p className="text-gray-600 text-sm mt-3">
                    Conheça algumas das nossas histórias de sucesso divididas por área de atuação.
                </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex overflow-x-auto space-x-2 pb-6 no-scrollbar snap-x mb-4">
                {['Todos', 'Eventos', 'Campanhas', 'Branding'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`snap-start flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                            ${filter === cat 
                                ? 'bg-primary text-white shadow-md shadow-primary/30' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="space-y-12">
                {renderEvents()}
                {renderCampaigns()}
                {renderBranding()}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center bg-gradient-to-r from-secondary to-blue-900 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary opacity-20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-primary opacity-20 rounded-full blur-2xl"></div>
                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Gostou do que viu?</h2>
                <p className="text-blue-200 text-sm mb-6 relative z-10">Vamos colocar o seu projeto na rua também.</p>
                <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 relative z-10 w-full">
                    Falar com consultor
                </button>
            </div>
        </div>
    );
};
