import React from 'react';
import { Settings, Megaphone, BarChart3, ArrowRight } from 'lucide-react';
import { BRAND } from '../constants';

interface ServicesSectionProps {
  onContactClick: () => void;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ onContactClick }) => {
  const services = [
    {
      title: "📌 PILAR 1 — ESTRATÉGIA E PLANEJAMENTO",
      description: "Diagnóstico completo, Plano de Marketing 360, Análise de concorrência, CRM e Calendário Anual Baseado em Sazonalidade.",
      icon: <Settings className="w-10 h-10" />,
      colorClass: "bg-[#101663]",
      points: [
        "Diagnóstico completo e plano de Marketing 360",
        "Análise de concorrência regional",
        "Criação de calendário Promocional e Institucional anual",
        "Plano de Mídia on e off"
      ]
    },
    {
      title: "📌 PILAR 2 — COMUNICAÇÃO E BRANDING",
      description: "Identidade visual, Padronização, Campanhas sazonais e Comunicação Visual completa (fachadas, sinalização e frota).",
      icon: <Megaphone className="w-10 h-10" />,
      colorClass: "bg-[#FF6B26]",
      points: [
        "Identidade visual e Padronização",
        "Campanhas sazonais e Tabloides",
        "Comunicação Visual: fachadas e sinalização",
        "Auditoria de marca e posicionamento"
      ]
    },
    {
      title: "📌 PILAR 3 — MARKETING DIGITAL 360°",
      description: "Gestão de Redes Sociais, Google & Meta Ads, Conteúdos exclusivos para o varejo de construção e Produção de Motions.",
      icon: <BarChart3 className="w-10 h-10" />,
      colorClass: "bg-[#0d0d35]",
      points: [
        "Gestão de Redes sociais",
        "Gestão de anúncios (Meta + Google Ads)",
        "Conteúdos exclusivos para varejo de construção",
        "Produção de conteúdos com influencers"
      ]
    }
  ];

  return (
    <section id="services" className="py-24 bg-gray-50 dark:bg-[#0f172a]">
      <div className="container-lg px-4 max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <span className="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-bold text-uppercase">NOSSOS PILARES</span>
          <h2 className="display-4 fw-black text-[#101663] dark:text-white mb-4">
            Estratégia, Conteúdo e <span className="text-primary">Performance</span>
          </h2>
          <p className="lead text-secondary max-w-2xl mx-auto">
            Marketing organizado, eficiente e criado sob medida para a realidade do mercado de construção.
          </p>
        </div>

        <div className="row g-4">
          {services.map((service, index) => (
            <div key={index} className="col-lg-4">
              <div className="card h-100 border-0 rounded-4 shadow-sm hover:shadow-xl transition-all p-5">
                <div className={`w-16 h-16 rounded-3 flex items-center justify-center mb-6 text-white ${service.colorClass} shadow-lg`}>
                  {service.icon}
                </div>
                <h3 className="h5 fw-bold text-[#101663] dark:text-white mb-3">
                  {service.title}
                </h3>
                <p className="text-secondary small mb-4">
                  {service.description}
                </p>
                <ul className="list-unstyled mb-0">
                  {service.points.map((point, i) => (
                    <li key={i} className="d-flex align-items-start gap-2 mb-2 small text-muted">
                      <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button 
            onClick={onContactClick}
            className="btn btn-primary btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg shadow-orange-500/20 active:scale-95 transition-all group"
          >
            Solicitar Consultoria
            <ArrowRight className="ms-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
