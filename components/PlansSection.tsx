import React from 'react';
import { BRAND } from '../constants';
import { Check, ArrowRight } from 'lucide-react';

interface PlansSectionProps {
  onContactClick: () => void;
}

const PlansSection: React.FC<PlansSectionProps> = ({ onContactClick }) => {
  const plans = [
    {
      name: "PLANO 45°",
      price: "R$ 1.900,00",
      description: "Ideal para o mapeamento inicial e ações essenciais.",
      features: [
        "Mapeamento e diagnóstico",
        "Calendário de campanhas",
        "1 Campanha promocional",
        "1 Tabloide mensal (12 produtos)",
        "30 criativos Redes Sociais"
      ],
      color: BRAND.primaryColor
    },
    {
      name: "PLANO 90°",
      price: "R$ 3.000,00",
      description: "Ações intensificadas e presença digital robusta.",
      features: [
        "Tudo do plano 45°",
        "2 Campanhas promocionais",
        "1 Landing Page",
        "Tabloide (até 30 produtos)",
        "Campanhas dia \"D\" semanais"
      ],
      color: "#1a1a60",
      featured: true
    },
    {
      name: "PLANO 180°",
      price: "Sob Consulta",
      description: "Transformação visual e imersão estratégica.",
      features: [
        "Tudo do plano 90°",
        "Atualização identidade visual",
        "Plano visual merchandising",
        "Workshop GRIDD DAY presencial",
        "Gestão de Tráfego inclusa*"
      ],
      color: BRAND.primaryColor
    },
    {
      name: "PLANO 360°",
      price: "Sob Consulta",
      description: "Assessoria completa e personalizada individual.",
      features: [
        "Assessoria Completa 360°",
        "Mentoria com especialistas",
        "Plano personalizado individual",
        "Suporte criativo full-time",
        "Calendário de eventos on/off"
      ],
      color: "#0d0d35"
    }
  ];

  return (
    <section id="plans" className="py-24 bg-white dark:bg-[#0A0E45]">
      <div className="container-lg px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="display-4 fw-black text-[#101663] dark:text-white mb-4">
            Planos sob medida para sua <span className="text-primary">Loja Matcon</span>
          </h2>
          <p className="lead text-secondary max-w-2xl mx-auto">
            Escolha o nível de aceleração que seu negócio precisa hoje.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {plans.map((plan, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <div 
                className={`card h-100 border-0 rounded-4 shadow-sm transition-all duration-300 hover:shadow-xl ${plan.featured ? 'scale-105 border-primary border-2' : ''}`}
                style={{ overflow: 'hidden' }}
              >
                {plan.featured && (
                  <div className="bg-primary text-white text-center py-2 fw-bold text-uppercase small">
                    Mais Procurado
                  </div>
                )}
                <div className="card-body p-5">
                  <div className="mb-4">
                    <h3 className="h4 fw-bold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
                    <div className="d-flex align-items-baseline gap-1 mt-3">
                      <span className="h2 fw-black mb-0">{plan.price}</span>
                      {plan.price.includes('R$') && <span className="text-secondary">/mês</span>}
                    </div>
                    <p className="text-muted small mt-2">{plan.description}</p>
                  </div>

                  <ul className="list-unstyled mb-5 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 mb-2">
                        <Check className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: plan.color }} />
                        <span className="text-secondary small">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={onContactClick}
                    className={`btn w-100 py-3 fw-bold rounded-pill transition-all ${plan.featured ? 'btn-primary shadow-lg shadow-orange-500/20' : 'btn-outline-secondary'}`}
                  >
                    Quero este plano
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center text-muted small">
          * Custos de deslocamento, alimentação e hotel não inclusos caso necessário. Vigência sugerida: 6 meses.
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
