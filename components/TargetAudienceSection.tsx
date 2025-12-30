import React from 'react';
import { Store, Network, Users, ArrowRight } from 'lucide-react';

export const TargetAudienceSection = () => {
    return (
        <section className="bg-white dark:bg-[#0A0A2A] transition-colors duration-300 relative overflow-hidden">
             {/* Background Elements similar to source but adapted for React/Tailwind context */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Column: Text Content */}
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-[2px] w-8 bg-primary"></div>
                        <span className="uppercase text-xs font-bold tracking-wider text-primary">Para quem atendemos</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white mb-6 leading-tight font-display">
                        Especialistas em demandas de <span className="text-primary">rede</span> e <span className="text-primary">operação</span>
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed mb-10">
                        Atendemos empresas que precisam de consistência na comunicação e execução forte no dia a dia: lojas, redes, franquias, cooperativas e operações com múltiplas unidades.
                    </p>

                    <div className="p-6 bg-gradient-to-r from-secondary to-[#1a1a60] dark:from-[#0d0d35] dark:to-[#161642] rounded-3xl shadow-xl max-w-md">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <p className="text-white/90 text-sm font-medium">Sua rede precisa de força operacional?</p>
                            <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 flex items-center justify-center space-x-2">
                                <span>Fale com um especialista</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Cards (formerly stacked vertical in source, now grid or stack depending on layout) */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-[#161642] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Store className="w-7 h-7 text-secondary dark:text-blue-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary dark:text-white text-lg">Redes e Franquias</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Padronização em larga escala</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#161642] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-md transition-shadow transform lg:translate-x-4">
                        <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                            <Network className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary dark:text-white text-lg">Múltiplas Unidades</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Operações complexas e ágeis</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#161642] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary dark:text-white text-lg">Cooperativas e Varejo</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Comunicação consistente</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};
