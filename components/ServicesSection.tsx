import React from 'react';

interface ServicesSectionProps {
  onContactClick: () => void;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ onContactClick }) => {
  const services = [
    {
      title: "Eventos & Experiências",
      description: "Criação e produção de eventos corporativos, ativações de marca e experiências imersivas inesquecíveis.",
      icon: "event_available",
      colorClass: "bg-primary"
    },
    {
      title: "Anúncios & Performance",
      description: "Gestão de tráfego pago, SEO e otimização de conversão para maximizar o ROI do seu investimento.",
      icon: "trending_up",
      colorClass: "bg-secondary"
    },
    {
      title: "Conteúdo & Social",
      description: "Gestão de redes sociais, produção audiovisual e copywriting estratégico para construir autoridade.",
      icon: "campaign",
      colorClass: "bg-primary"
    },
    {
      title: "Campanhas & Publicidade",
      description: "Planejamento 360º de campanhas on e offline, branding e posicionamento de mercado.",
      icon: "rocket_launch",
      colorClass: "bg-secondary"
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50 dark:bg-[#0f172a]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-12 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#101663] dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-3">
            O Que Fazemos
          </span>
          <h2 className="font-display font-bold text-4xl text-[#101663] dark:text-white leading-tight mb-4">
            Tudo o que sua marca precisa, em um <span className="text-primary relative inline-block">
              só lugar
              <svg className="absolute w-full h-2 bottom-0 left-0 text-primary opacity-30" preserveAspectRatio="none" viewBox="0 0 100 10">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3"></path>
              </svg>
            </span>.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Estratégias completas para conectar, engajar e converter. Do planejamento à execução.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group relative overflow-hidden bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${service.colorClass} group-hover:w-2 transition-all`}></div>
              <div className="p-8 pl-10 flex items-start gap-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${service.colorClass} shadow-lg shadow-orange-500/20`}>
                  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                  <span className="material-icons text-3xl">{service.icon}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-3 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={onContactClick}
            className="inline-flex items-center gap-2 bg-[#101663] hover:bg-black text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all duration-200 group"
          >
            Solicitar Orçamento
            <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            Transforme sua marca com a GRID Marketing 360
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
