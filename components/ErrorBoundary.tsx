/**
 * Error Boundary Component
 * Captura erros em componentes filhos e exibe fallback UI
 */

import React, { ReactNode, ErrorInfo } from 'react';
import logger from '../utils/logger';
import errorHandler, { ErrorCategory, AppError } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  appError?: AppError;
  errorCount: number;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorCount: 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = errorHandler.handle(
      error,
      ErrorCategory.UNKNOWN,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    this.setState((prev) => ({
      appError,
      errorCount: prev.errorCount + 1,
    }));

    logger.error(
      `Erro capturado por ErrorBoundary: ${error.message}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      'ErrorBoundary'
    );

    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      appError: undefined,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.appError) {
      return (
        this.props.fallback || (
          <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
              <div className="row">
                <div className="col-lg-6 mx-auto">
                  <div className="card border-danger shadow-lg">
                    <div className="card-body p-5">
                      <div className="text-center mb-4">
                        <div
                          className="display-1 text-danger"
                          style={{ fontSize: '4rem' }}
                        >
                          ⚠️
                        </div>
                        <h2 className="card-title text-danger mt-3">Algo deu Errado</h2>
                      </div>

                      <p className="card-text text-muted mb-4">
                        Desculpe, a aplicação encontrou um erro inesperado. Nossa equipe foi
                        notificada e estamos trabalhando para resolver.
                      </p>

                      {process.env.NODE_ENV === 'development' && (
                        <div className="alert alert-warning mb-4">
                          <h6 className="alert-heading">Detalhes de Desenvolvimento</h6>
                          <hr />
                          <p className="mb-2">
                            <strong>ID do Erro:</strong> <code>{this.state.appError.id}</code>
                          </p>
                          <p className="mb-2">
                            <strong>Categoria:</strong> {this.state.appError.category}
                          </p>
                          <p className="mb-2">
                            <strong>Severidade:</strong> {this.state.appError.severity}
                          </p>
                          <p className="mb-0">
                            <strong>Mensagem:</strong>
                          </p>
                          <pre
                            className="mt-2 p-2 bg-light rounded"
                            style={{
                              fontSize: '0.85rem',
                              maxHeight: '200px',
                              overflowY: 'auto',
                            }}
                          >
                            {this.state.appError.message}
                          </pre>
                        </div>
                      )}

                      <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                        <button
                          className="btn btn-primary btn-lg"
                          onClick={this.reset}
                        >
                          Tentar Novamente
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-lg"
                          onClick={() => (window.location.href = '/')}
                        >
                          Voltar ao Início
                        </button>
                      </div>

                      {this.state.errorCount > 3 && (
                        <div className="alert alert-danger mt-4">
                          <small>
                            Múltiplos erros detectados. Por favor, recarregue a página ou
                            contacte suporte@example.com
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
