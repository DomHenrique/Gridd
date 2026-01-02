import React from 'react';
import { BRAND } from '../constants';

interface WhyGridd360SectionProps {
  onContactClick: () => void;
}

const WhyGridd360Section: React.FC<WhyGridd360SectionProps> = ({ onContactClick }) => {
  const benefits = [
    {
      title: "Planejamento Claro",
      description: "+ cronograma de entrega definido. Sem surpresas, apenas resultados.",
      icon: "event_note"
    },
    {
      title: "Padronização Total",
      description: "Ideal para marcas com múltiplas unidades. Mantemos sua identidade coesa em todos os lugares.",
      icon: "storefront"
    },
    {
      title: "Operação de Eventos",
      description: "Atenção total ao espaço e experiência do público. Cuidamos de cada detalhe.",
      icon: "confirmation_number"
    },
    {
      title: "Campanhas Digitais",
      description: "Estratégias orientadas a performance real e métricas que importam.",
      icon: "trending_up"
    },
    {
      title: "Criativos e Conteúdo",
      description: "Visual e narrativa 100% alinhados com seus objetivos comerciais.",
      icon: "brush"
    }
  ];

  return (
    <section id="why-gridd360" className="py-20 bg-gray-50 dark:bg-[#0A0E45] transition-colors duration-300 overflow-hidden">
      <div className="container-lg px-4 max-w-5xl mx-auto">
        <div className="row">
          <div className="col-lg-6 mb-10 mb-lg-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1 w-8 bg-primary rounded-full"></span>
              <span className="text-primary font-bold uppercase text-xs tracking-widest">Por que a Gridd360?</span>
            </div>
            <h2 className="font-display font-black text-4xl lg:text-5xl leading-tight text-[#101663] dark:text-white mb-6">
              Execução sem ruído. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                Comunicação com padrão.
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
              Transformamos complexidade em processos claros. Do planejamento à execução final, garantimos que sua marca seja vista exatamente como deve ser.
            </p>

            <div className="bg-[#101663] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="font-display font-bold text-2xl text-white mb-3">Pronto para elevar o nível?</h3>
                <p className="text-blue-100 mb-6 font-medium">Fale com nossos especialistas e descubra o padrão Gridd360.</p>
                <button
                  onClick={onContactClick}
                  className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <span>Começar Agora</span>
                  <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="space-y-4 ps-lg-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group bg-white dark:bg-[#151B75] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-50 dark:bg-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                      <span className="material-icons text-primary text-3xl">{benefit.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xl text-[#101663] dark:text-white mb-2">{benefit.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyGridd360Section;
