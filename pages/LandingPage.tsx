import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BRAND } from '../constants';
import { TargetAudienceSection } from '../components/TargetAudienceSection';
import { LeadCaptureModal } from '../components/LeadCaptureModal';
import { LogoCarousel } from '../components/LogoCarousel';
import HowItWorksSection from '../components/HowItWorksSection';
import ServicesSection from '../components/ServicesSection';
import WhyGridd360Section from '../components/WhyGridd360Section';
import PlansSection from '../components/PlansSection';
import HubSection from '../components/HubSection';
import SEO from '../components/SEO';
import { ArrowRight, Menu, X, Rocket, ShieldCheck, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const location = useLocation();

  // Scroll to section based on path for better SEO indexing
  useEffect(() => {
    if (location.pathname === '/servicos') {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    } else if (location.pathname === '/planos') {
      document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      <SEO />
      
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom sticky-top bg-white/80 backdrop-blur-md" style={{ zIndex: 1000 }}>
        <div className="container-fluid px-4">
          <Link className="navbar-brand fw-black fs-4 d-flex align-items-center gap-2" to="/">
            <div className="p-1 px-2 rounded-2" style={{ backgroundColor: BRAND.primaryColor }}>
              <span className="text-white">G</span>
            </div>
            <span style={{ color: BRAND.secondaryColor }}>GRID</span>
            <span style={{ color: BRAND.primaryColor }}>360</span>
          </Link>
          
          <button 
            className="navbar-toggler border-0 shadow-none" 
            type="button" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
            <div className="navbar-nav ms-auto gap-lg-4 py-3 py-lg-0 align-items-center">
              <Link className="nav-link fw-bold text-secondary" to="/servicos">Estratégia</Link>
              <Link className="nav-link fw-bold text-secondary" to="/planos">Planos</Link>
              <Link className="nav-link fw-bold text-secondary" to="/portfolio">Portfólio</Link>
              <button 
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                onClick={() => setIsLeadModalOpen(true)}
              >
                Falar com Especialista
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="py-5 py-lg-8 border-bottom overflow-hidden position-relative"
        style={{ 
          background: `linear-gradient(135deg, ${BRAND.secondaryColor} 0%, #0d0d35 100%)`,
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="container-lg px-4 position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-7 text-white text-center text-lg-start">
              <div className="d-inline-flex align-items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-pill px-3 py-2 mb-4">
                <span className="badge bg-primary rounded-pill">NOVO</span>
                <span className="small fw-bold">Especialistas em Redes de Material de Construção</span>
              </div>
              
              <h1 className="display-2 fw-black mb-4 lh-1 tracking-tighter">
                Sua Marca no Centro do <br />
                <span className="text-primary italic">Varejo 360</span>
              </h1>
              
              <p className="lead mb-5 text-white/80 fs-4 fw-medium max-w-2xl">
                Marketing organizado, eficiente e estratégico para o setor de material de construção. 
                Deixe o amadorismo para trás e tenha soluções sob medida.
              </p>
              
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                <button 
                  className="btn btn-primary btn-lg px-5 py-3 fw-black rounded-pill shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                  onClick={() => setIsLeadModalOpen(true)}
                >
                  ACELERAR MEU NEGÓCIO
                  <ArrowRight className="ms-2" size={20} />
                </button>
                <Link 
                  to="/portfolio"
                  className="btn btn-outline-light btn-lg px-5 py-3 fw-bold rounded-pill hover-bg-white hover-text-dark transition-all"
                >
                  VER RESULTADOS
                </Link>
              </div>

              <div className="mt-5 d-flex gap-4 justify-content-center justify-content-lg-start opacity-75">
                <div className="d-flex align-items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  <span className="small fw-bold">Foco em Performance</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Zap size={20} className="text-primary" />
                  <span className="small fw-bold">Execução Ágil</span>
                </div>
              </div>
            </div>
            
            <div className="col-lg-5 d-none d-lg-block">
              <div className="position-relative">
                <div className="position-absolute top-50 left-50 translate-middle w-100 h-100 bg-primary/20 blur-3xl rounded-circle"></div>
                <img 
                  src="/images/hero-bg.png" 
                  alt="Gridd360 Dashboards" 
                  className="img-fluid rounded-4 shadow-2xl border border-white/10 relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <div className="bg-light py-4 border-bottom">
        <div className="container px-4 text-center">
          <p className="text-uppercase small fw-black text-muted mb-3 tracking-widest">Empresas que confiam na Gridd360</p>
          <LogoCarousel />
        </div>
      </div>

      {/* Matcon Focus Section */}
      <section className="py-24">
        <div className="container px-4 text-center mb-16">
          <h2 className="display-5 fw-black text-[#101663] mb-4">Vantagens de ser <span className="text-primary">GRIDD</span></h2>
          <p className="lead text-secondary max-w-3xl mx-auto">
            Enquanto outras assessorias entregam soluções genéricas, aqui o trabalho é 100% especializado no seu segmento.
          </p>
        </div>
        <TargetAudienceSection onContactClick={() => setIsLeadModalOpen(true)} />
      </section>

      {/* Pillars of Service */}
      <ServicesSection onContactClick={() => setIsLeadModalOpen(true)} />

      {/* Plans */}
      <PlansSection onContactClick={() => setIsLeadModalOpen(true)} />

      {/* Hub of Services */}
      <HubSection />

      <HowItWorksSection />

      <WhyGridd360Section onContactClick={() => setIsLeadModalOpen(true)} />

      {/* CTA Section */}
      <section className="py-24 bg-primary position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10">
          <Rocket className="position-absolute top-0 end-0 m-n5 opacity-20" size={400} />
        </div>
        <div className="container-lg px-4 text-center position-relative z-10">
          <h2 className="display-4 fw-black text-white mb-4">Crescimento com base sólida.</h2>
          <p className="lead mb-5 text-white/90 max-w-2xl mx-auto fw-medium">
            Sua empresa estruturada para o sucesso no mercado de Matcon. <br />
            Vamos conversar sobre sua estratégia?
          </p>
          <button 
            className="btn btn-light btn-lg px-5 py-4 fw-black text-primary rounded-pill shadow-xl active:scale-95 transition-all text-uppercase tracking-wider"
            onClick={() => setIsLeadModalOpen(true)}
          >
            Falar com Consultor Gridd
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0d35] text-white py-5">
        <div className="container-lg px-4">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="fw-black fs-4 mb-3">
                <span className="text-white">GRID</span>
                <span className="text-primary">360</span>
              </div>
              <p className="text-white/60 small">
                Estratégia, Conteúdo e Performance para o varejo de material de construção.
              </p>
              <div className="d-flex gap-3 mt-4">
                <a href="#" className="text-white/60 hover-text-white transition-all" title="Instagram"><i className="bi bi-instagram fs-5"></i></a>
                <a href="#" className="text-white/60 hover-text-white transition-all" title="LinkedIn"><i className="bi bi-linkedin fs-5"></i></a>
                <a href="#" className="text-white/60 hover-text-white transition-all" title="Facebook"><i className="bi bi-facebook fs-5"></i></a>
              </div>
            </div>
            <div className="col-lg-2 ms-lg-auto">
              <h4 className="h6 fw-bold mb-3">Navegação</h4>
              <ul className="list-unstyled space-y-2 small">
                <li><Link to="/servicos" className="text-white/60 text-decoration-none">Estratégia</Link></li>
                <li><Link to="/planos" className="text-white/60 text-decoration-none">Planos</Link></li>
                <li><Link to="/portfolio" className="text-white/60 text-decoration-none">Portfólio</Link></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h4 className="h6 fw-bold mb-3">Contato</h4>
              <ul className="list-unstyled space-y-2 small">
                <li className="text-white/60">(51) 98609.2024</li>
                <li className="text-white/60">griddmkt360@gmail.com</li>
                <li className="text-white/60">griddmkt360.com.br</li>
              </ul>
            </div>
          </div>
          <div className="pt-5 mt-5 border-top border-white/10 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <p className="text-white/40 small mb-0">© 2026 Gridd360-HN Performance Digital. Todos os direitos reservados.</p>
            <div className="d-flex gap-4">
              <Link to="/login" className="text-white/20 hover-text-white transition-all small text-decoration-none">Área Administrativa</Link>
            </div>
          </div>
        </div>
      </footer>

      <LeadCaptureModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />

      <style>{`
        .bg-white\/80 { background-color: rgba(255, 255, 255, 0.8); }
        .backdrop-blur-md { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .fw-black { font-weight: 900; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .tracking-widest { letter-spacing: 0.1em; }
        .hover-bg-white:hover { background-color: white !important; }
        .hover-text-dark:hover { color: ${BRAND.secondaryColor} !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .space-y-2 > li + li { margin-top: 0.5rem; }
        .space-y-4 > li + li { margin-top: 1rem; }
        .btn-primary { background-color: ${BRAND.primaryColor}; border-color: ${BRAND.primaryColor}; }
        .btn-primary:hover { background-color: #e65a1d; border-color: #e65a1d; }
        .navbar-brand { letter-spacing: -1px; }
      `}</style>
    </div>
  );
};

export default LandingPage;
