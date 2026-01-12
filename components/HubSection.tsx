import React from 'react';
import { BRAND } from '../constants';
import { ShieldCheck, Cpu, Briefcase, Camera } from 'lucide-react';

const HubSection: React.FC = () => {
  const categories = [
    {
      title: "Parceiros de Tecnologia",
      icon: <Cpu className="w-8 h-8 text-primary" />,
      items: [
        "Sites e Landing Pages",
        "Marketplace para Redes",
        "Aplicativos de Cash Back",
        "Catálogo Digital e WhatsApp Profissional",
        "Ferramentas de IA e Consultor Virtual"
      ]
    },
    {
      title: "Parceiros de Consultoria",
      icon: <Briefcase className="w-8 h-8 text-primary" />,
      items: [
        "Especialistas em Negociação",
        "Especialistas em Capacitação",
        "Gestão de Tráfego e Mídias Digitais",
        "Arquitetura para Matcon (Visual Merchandising)",
        "Treinamentos e Cursos Online"
      ]
    },
    {
      title: "Prestadores de Serviços",
      icon: <Camera className="w-8 h-8 text-primary" />,
      items: [
        "Produção de Foto, Áudio e Vídeo",
        "Comunicação Visual (Fachadas e Sinalização)",
        "Gráficas, Brindes e Uniformes",
        "Gestão de Conteúdo com Influencers",
        "Especialistas em CRM e Fidelização"
      ]
    }
  ];

  return (
    <section id="hub" className="py-24 bg-slate-50 dark:bg-[#0A0A2A] overflow-hidden">
      <div className="container-lg px-4 mx-auto">
        <div className="row align-items-center mb-16">
          <div className="col-lg-7">
            <span className="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-bold text-uppercase">HUB DE SERVIÇOS</span>
            <h2 className="display-4 fw-black text-[#101663] dark:text-white mb-4">
              Um ecossistema completo para facilitar a <span className="text-primary">vida do lojista</span>
            </h2>
          </div>
          <div className="col-lg-5">
            <p className="lead text-secondary">
              Contamos com uma rede de parceiros homologados e especializados no varejo de construção para entregar excelência em cada detalhe.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {categories.map((cat, index) => (
            <div key={index} className="col-lg-4">
              <div className="card h-100 border-0 rounded-4 shadow-sm p-5 hover-shadow transition-all group">
                <div className="mb-4 p-3 bg-light dark:bg-slate-800 rounded-3 d-inline-block group-hover:bg-primary-subtle transition-colors">
                  {cat.icon}
                </div>
                <h3 className="h5 fw-bold text-[#101663] dark:text-white mb-4">{cat.title}</h3>
                <ul className="list-unstyled space-y-3">
                  {cat.items.map((item, i) => (
                    <li key={i} className="d-flex align-items-center gap-3 mb-3">
                      <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </section>
  );
};

export default HubSection;
