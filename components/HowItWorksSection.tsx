import React from 'react';
import { BRAND } from '../constants';

const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            icon: 'bi-search',
            title: 'Diagnóstico Rápido',
            description: 'Análise profunda de objetivo, público, canais e contexto atual.'
        },
        {
            icon: 'bi-map',
            title: 'Plano de Ação 360',
            description: 'Definição clara de prioridades, calendário editorial e alocação de orçamento.'
        },
        {
            icon: 'bi-rocket-takeoff',
            title: 'Execução',
            description: 'Produção e lançamento de eventos, campanhas e criação de conteúdo.',
            highlight: true
        },
        {
            icon: 'bi-graph-up-arrow',
            title: 'Acompanhamento',
            description: 'Monitoramento constante de dados, geração de relatórios e ajustes rápidos.'
        },
        {
            icon: 'bi-get-app', // Changed from sync to better represent optimization or just use bi-arrow-repeat
            title: 'Otimização Contínua',
            description: 'Evolução mensal baseada em aprendizados para maximizar o ROI.'
        }
    ];

    return (
        <section id="how-it-works" className="py-5 bg-white">
            <div className="container-lg px-4">
                <div className="text-center mb-5">
                    <h2 className="display-5 fw-bold mb-3">Como funciona</h2>
                    <p className="lead text-secondary mx-auto" style={{ maxWidth: '600px' }}>
                        Nosso processo comprovado para acelerar seus resultados em 5 passos.
                    </p>
                </div>

                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="position-relative">
                            {/* Vertical Line */}
                            <div 
                                className="position-absolute d-none d-md-block" 
                                style={{ 
                                    left: '2.5rem', 
                                    top: '20px', 
                                    bottom: '20px', 
                                    width: '2px', 
                                    backgroundColor: '#e9ecef',
                                    zIndex: 0
                                }}
                            ></div>

                            <div className="d-flex flex-column gap-4 position-relative" style={{ zIndex: 1 }}>
                                {steps.map((step, index) => (
                                    <div key={index} className="d-flex gap-4 align-items-start">
                                        <div className="flex-shrink-0">
                                            <div 
                                                className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm transition ${step.highlight ? 'text-white' : 'bg-white text-primary border border-primary-subtle'}`}
                                                style={{ 
                                                    width: '5rem', 
                                                    height: '5rem',
                                                    backgroundColor: step.highlight ? BRAND.primaryColor : 'white',
                                                    fontSize: '1.5rem'
                                                }}
                                            >
                                                <i className={`bi ${step.icon}`}></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 pt-2">
                                            <div className="card border-0 shadow-sm p-4 rounded-4 hover-shadow transition">
                                                <h3 className="h5 fw-bold mb-2">{step.title}</h3>
                                                <p className="text-secondary mb-0">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <p className="text-secondary small">
                        Transforme sua estratégia de marketing hoje com a Gridd360.
                    </p>
                </div>
            </div>

            <style>{`
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
                    transform: translateX(5px);
                }
                .transition {
                    transition: all 0.3s ease;
                }
            `}</style>
        </section>
    );
};

export default HowItWorksSection;
