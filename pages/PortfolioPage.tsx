import React, { useState, useEffect } from 'react';
import { BRAND } from '../constants';
import { PORTFOLIO_ITEMS } from '../services/mockDb';
import { DataService } from '../services/dataService';
import { PortfolioItem } from '../types';

interface PortfolioPageProps {
  onBack: () => void;
}

const PortfolioPage: React.FC<PortfolioPageProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await DataService.getPortfolio();
        setPortfolio(data);
      } catch (error) {
        console.error('Erro ao buscar portfólio:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const categories = ['Todos', 'Eventos', 'Campanhas', 'Branding'];

  const filteredPortfolio = activeFilter === 'Todos' 
    ? portfolio 
    : portfolio.filter(item => item.category === activeFilter);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ backgroundColor: BRAND.secondaryColor }}>
        <div className="container-fluid px-4">
          <button 
            className="btn btn-link text-white text-decoration-none d-flex align-items-center gap-2 me-3"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Voltar</span>
          </button>

          <div className="navbar-text text-white ms-auto d-flex align-items-center gap-3">
            <div>
              <h5 className="mb-0 fw-bold">Portfólio</h5>
              <small className="opacity-75">{filteredPortfolio.length} projetos</small>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-bottom py-5">
        <div className="container-lg px-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-3">Nossos Projetos</h1>
              <p className="lead text-secondary">
                Conheça os projetos que desenvolvemos com dedicação e expertise, transformando ideias em realidade.
              </p>
            </div>
            <div className="col-lg-4 text-end d-none d-lg-block">
              <div 
                className="rounded p-4"
                style={{ backgroundColor: `${BRAND.primaryColor}10` }}
              >
                <i 
                  className="bi bi-briefcase-fill" 
                  style={{ fontSize: '3rem', color: BRAND.primaryColor }}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-bottom py-4">
        <div className="container-lg px-4">
          <div className="d-flex gap-2 overflow-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`btn ${activeFilter === category ? 'btn-primary' : 'btn-outline-primary'} fw-bold whitespace-nowrap`}
                style={{
                  backgroundColor: activeFilter === category ? BRAND.primaryColor : 'transparent',
                  borderColor: BRAND.primaryColor,
                  color: activeFilter === category ? 'white' : BRAND.primaryColor,
                }}
                onClick={() => setActiveFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="container-lg px-4 py-5">
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : filteredPortfolio.length > 0 ? (
          <div className="row g-4">
            {filteredPortfolio.map((item) => (
              <div key={item.id} className="col-12 col-md-6 col-lg-4">
                <div 
                  className="card border-0 shadow-sm overflow-hidden h-100 transition-transform"
                  style={{
                    cursor: 'pointer',
                    transform: 'translateY(0)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Image Placeholder */}
                  <div 
                    className="position-relative overflow-hidden"
                    style={{
                      height: '200px',
                      backgroundColor: `${BRAND.primaryColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div 
                      className="rounded-circle p-5 d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: `${BRAND.primaryColor}30` }}
                    >
                      <i 
                        className={`bi ${
                          item.category === 'Eventos' ? 'bi-calendar-event' :
                          item.category === 'Campanhas' ? 'bi-megaphone' :
                          'bi-palette'
                        }`}
                        style={{ fontSize: '3rem', color: BRAND.primaryColor }}
                      ></i>
                    </div>
                  </div>

                  <div className="card-body">
                    {/* Badge */}
                    <div className="mb-3">
                      <span 
                        className="badge"
                        style={{
                          backgroundColor: `${BRAND.primaryColor}20`,
                          color: BRAND.primaryColor,
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.8rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h5 className="card-title fw-bold mb-2">{item.title}</h5>

                    {/* Description */}
                    <p className="card-text text-secondary mb-4">
                      {item.description}
                    </p>

                    {/* Meta Info */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <small className="text-secondary">
                        <i className="bi bi-calendar-check me-1"></i>
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </small>
                      <small className="text-secondary">
                        <i className="bi bi-person me-1"></i>
                        {item.client}
                      </small>
                    </div>

                    {/* Action Button */}
                    <button 
                      className="btn w-100 fw-bold text-white"
                      style={{ backgroundColor: BRAND.primaryColor }}
                    >
                      <i className="bi bi-arrow-right me-2"></i>Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div 
              className="rounded-circle p-5 mb-4 d-inline-block"
              style={{ backgroundColor: `${BRAND.primaryColor}10` }}
            >
              <i 
                className="bi bi-inbox"
                style={{ fontSize: '3rem', color: BRAND.primaryColor }}
              ></i>
            </div>
            <h4 className="fw-bold mb-2">Nenhum projeto encontrado</h4>
            <p className="text-secondary">
              Nenhum projeto corresponde ao filtro selecionado
            </p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div 
        className="py-5"
        style={{ backgroundColor: BRAND.secondaryColor, color: 'white' }}
      >
        <div className="container-lg px-4 text-center">
          <h2 className="fw-bold mb-3">Pronto para seu próximo projeto?</h2>
          <p className="lead mb-4 opacity-75">
            Entre em contato conosco e vamos transformar sua ideia em realidade
          </p>
          <button 
            className="btn btn-light fw-bold px-5 py-3"
            onClick={onBack}
          >
            <i className="bi bi-envelope-fill me-2"></i>Solicitar Cotação
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <div className="container-lg px-4">
          <div className="row">
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h5 className="fw-bold mb-3">GRID360</h5>
              <p className="opacity-75 small">
                Transformando ideias em soluções digitais inovadoras
              </p>
            </div>
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h6 className="fw-bold mb-3">Links Rápidos</h6>
              <ul className="list-unstyled small opacity-75">
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Sobre</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Serviços</a></li>
                <li className="mb-2"><a href="#" className="text-white text-decoration-none">Contato</a></li>
              </ul>
            </div>
            <div className="col-lg-4">
              <h6 className="fw-bold mb-3">Siga-nos</h6>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-facebook"></i>
                </button>
                <button className="btn btn-sm btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-twitter"></i>
                </button>
                <button className="btn btn-sm btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-linkedin"></i>
                </button>
              </div>
            </div>
          </div>
          <hr className="my-4 opacity-25" />
          <div className="text-center small opacity-75">
            <p>&copy; 2024 GRID360. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .whitespace-nowrap {
          white-space: nowrap;
        }
        .transition-transform {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default PortfolioPage;
