import React, { useState } from 'react';
import { BRAND } from '../constants';
import { TargetAudienceSection } from '../components/TargetAudienceSection';
import { LeadCaptureModal } from '../components/LeadCaptureModal';
import { LogoCarousel } from '../components/LogoCarousel';
import HowItWorksSection from '../components/HowItWorksSection';
import ServicesSection from '../components/ServicesSection';
import WhyGridd360Section from '../components/WhyGridd360Section';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToPortfolio: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToPortfolio }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ backgroundColor: BRAND.secondaryColor }}>
        <div className="container-fluid px-4">
          <a className="navbar-brand fw-bold fs-5 d-flex align-items-center gap-2" href="#">
            <div className="p-2 rounded" style={{ backgroundColor: BRAND.primaryColor }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>G</span>
            </div>
            GRID<span style={{ color: BRAND.primaryColor }}>360</span>
          </a>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
            <div className="navbar-nav ms-auto gap-3">
              <a className="nav-link" href="#features">Soluções</a>
              <a className="nav-link" href="#portfolio" onClick={() => onNavigateToPortfolio()}>Portfólio</a>
              <button className="nav-link bg-transparent border-0" onClick={() => setIsLeadModalOpen(true)}>Contato</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="py-5 py-lg-7 text-white position-relative"
        style={{ 
          backgroundImage: 'url("/images/hero-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Dark Overlay for contrast */}
        <div 
          className="position-absolute inset-0 w-100 h-100" 
          style={{ 
            backgroundColor: 'rgba(16, 22, 99, 0.7)',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        ></div>

        <div className="container-lg px-4 position-relative" style={{ zIndex: 2 }}>
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <div className="badge mb-3" style={{ backgroundColor: 'rgba(255,107,38,0.3)' }}>
                <span style={{ color: BRAND.primaryColor }}>🚀 AGÊNCIA FULL STACK</span>
              </div>
              <h1 className="display-3 fw-bold mb-4" style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.5)' }}>
                Gridd360: Sua Parceria Estratégica em <span style={{ color: BRAND.primaryColor }}>Marketing 360</span>
              </h1>
              <p className="lead mb-5 text-light fs-4" style={{ textShadow: '1px 1px 5px rgba(0,0,0,0.5)' }}>
                Compreendemos seus desafios e co-criamos soluções personalizadas para cada etapa do seu negócio, do planejamento à celebração do sucesso.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button 
                  className="btn btn-lg px-5 py-3 fw-bold text-white shadow-lg"
                  style={{ backgroundColor: BRAND.primaryColor }}
                  onClick={() => setIsLeadModalOpen(true)}
                >
                  <i className="bi bi-chat-dots me-2"></i>Fale com a gente
                </button>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos Carousel */}
      <LogoCarousel />

      {/* Target Audience Section */}
      <TargetAudienceSection onContactClick={() => setIsLeadModalOpen(true)} />


      <ServicesSection onContactClick={() => setIsLeadModalOpen(true)} />

      <HowItWorksSection />

      <WhyGridd360Section onContactClick={() => setIsLeadModalOpen(true)} />

      {/* CTA Section */}
      <section className="py-5 py-lg-6" style={{ backgroundColor: `${BRAND.primaryColor}10` }}>
        <div className="container-lg px-4 text-center">
          <h2 className="display-5 fw-bold mb-4">Pronto para começar?</h2>
          <p className="lead mb-4 text-secondary">
            Junte-se a centenas de empresas que confiam na Gridd360
          </p>
          <button 
            className="btn btn-lg fw-bold text-white"
            style={{ backgroundColor: BRAND.primaryColor }}
            onClick={() => setIsLeadModalOpen(true)}
          >
            Quero Conhecer
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 border-top">
        <div className="container-lg px-4">
          <div className="row">
            <div className="col-md-6">
              <p className="fw-bold">© 2025 Gridd360-HN Performance Digital. Todos os direitos reservados.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex gap-3 justify-content-md-end align-items-center">
                <a href="#" className="text-decoration-none text-secondary">Privacidade</a>
                <a href="#" className="text-decoration-none text-secondary">Termos</a>
                <a href="#" className="text-decoration-none text-secondary">Contato</a>
                <span className="text-secondary opacity-25">|</span>
                <button 
                  onClick={onNavigateToLogin}
                  className="btn btn-link p-0 text-decoration-none text-secondary opacity-50 hover-opacity-100 transition"
                  style={{ fontSize: '0.75rem' }}
                >
                  Área Administrativa
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <LeadCaptureModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />

      <style>{`
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }
        .card {
          transition: all 0.3s ease;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
