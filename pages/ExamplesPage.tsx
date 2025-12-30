/**
 * Exemplo de Implementação de Error Handling e Loading States
 * Mostra como usar toda a infraestrutura de erro e carregamento
 */

import React from 'react';
import logger from '../utils/logger';
import errorHandler, { ErrorCategory } from '../utils/errorHandler';
import LoadingIndicator, { LoadingVariant } from '../components/LoadingIndicator';
import { useAsyncOperation, useAsync } from '../hooks/useAsyncOperation';
import { useToast, ToastType } from '../components/ToastNotification';
import { apiGet, apiPost } from '../utils/apiRequest';

// ============================================================================
// EXEMPLO 1: Usar useAsyncOperation para Operação Manual
// ============================================================================

export function ExampleManualOperation() {
  const { data, loading, error, execute, reset } = useAsyncOperation(
    async () => {
      logger.info('Iniciando download de dados', undefined, 'ExampleManualOperation');
      const response = await apiGet('/api/data');

      if (!response.success) {
        throw new Error(response.error || 'Falha ao carregar dados');
      }

      return response.data;
    },
    {
      module: 'ExampleManualOperation',
      showToast: true,
      successMessage: 'Dados carregados com sucesso!',
    }
  );

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Operação Manual</h5>

        <LoadingIndicator isLoading={loading} message="Carregando dados...">
          {data && (
            <div>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </LoadingIndicator>

        {error && (
          <div className="alert alert-danger mt-3">
            <strong>Erro:</strong> {error.userMessage}
            <br />
            {process.env.NODE_ENV === 'development' && (
              <small className="d-block mt-2">{error.message}</small>
            )}
          </div>
        )}

        <div className="mt-3 gap-2 d-flex">
          <button className="btn btn-primary" onClick={execute} disabled={loading}>
            {loading ? 'Carregando...' : 'Carregar Dados'}
          </button>
          <button className="btn btn-secondary" onClick={reset} disabled={loading}>
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Usar useAsync para Carregamento Automático
// ============================================================================

export function ExampleAutomatic() {
  const { data, loading, error } = useAsync(
    async () => {
      logger.info('Carregando dados automaticamente', undefined, 'ExampleAutomatic');
      const response = await apiGet('/api/dashboard');

      if (!response.success) {
        throw new Error(response.error || 'Falha ao carregar dashboard');
      }

      return response.data;
    },
    [], // dependencies
    {
      module: 'ExampleAutomatic',
      showToast: false, // Não mostrar toast para carregamento automático
    }
  );

  return (
    <LoadingIndicator
      isLoading={loading}
      variant={LoadingVariant.SKELETON}
      message="Carregando dashboard..."
    >
      {error ? (
        <div className="alert alert-danger">
          <h6>Erro ao carregar dashboard</h6>
          <p>{error.userMessage}</p>
        </div>
      ) : (
        data && <div>{JSON.stringify(data)}</div>
      )}
    </LoadingIndicator>
  );
}

// ============================================================================
// EXEMPLO 3: Tratamento Manual de Erros com Logger
// ============================================================================

export function ExampleManualErrorHandling() {
  const { addToast } = useToast();
  const [result, setResult] = React.useState<any>(null);

  const handleFetch = async () => {
    try {
      logger.debug('Iniciando fetch com tratamento manual', undefined, 'ExampleManualErrorHandling');

      const response = await fetch('/api/users');

      if (!response.ok) {
        logger.warn(`API retornou ${response.status}`, undefined, 'ExampleManualErrorHandling');
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      logger.info('Fetch bem-sucedido', { count: data.length }, 'ExampleManualErrorHandling');

      setResult(data);

      addToast({
        message: `Carregados ${data.length} usuários`,
        type: ToastType.SUCCESS,
      });
    } catch (error) {
      // Usar errorHandler para categorizar e processar erro
      const appError = errorHandler.handle(
        error,
        ErrorCategory.NETWORK,
        { operation: 'fetchUsers' }
      );

      // Logger automático, mas podemos adicionar contexto extra
      logger.error('Erro ao buscar usuários', error, {
        errorId: appError.id,
        retryable: appError.retryable,
      });

      addToast({
        message: appError.userMessage,
        type: ToastType.ERROR,
      });
    }
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={handleFetch}>
        Buscar Usuários
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: Upload com Progress Bar
// ============================================================================

export function ExampleUploadWithProgress() {
  const { addToast } = useToast();
  const [progress, setProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setProgress(0);

    try {
      logger.info('Iniciando upload', { filename: file.name, size: file.size }, 'ExampleUploadWithProgress');

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
          logger.debug(`Upload progress: ${percentComplete.toFixed(0)}%`, undefined, 'ExampleUploadWithProgress');
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          logger.info('Upload concluído com sucesso', undefined, 'ExampleUploadWithProgress');

          addToast({
            message: 'Arquivo enviado com sucesso!',
            type: ToastType.SUCCESS,
          });

          setProgress(0);
          setIsLoading(false);
        } else {
          throw new Error(`HTTP ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        const appError = errorHandler.handle(
          new Error('Erro ao fazer upload'),
          ErrorCategory.NETWORK,
          { filename: file.name }
        );

        logger.error('Upload falhou', appError.originalError, { filename: file.name });

        addToast({
          message: appError.userMessage,
          type: ToastType.ERROR,
        });

        setIsLoading(false);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (error) {
      const appError = errorHandler.handle(error, ErrorCategory.NETWORK);
      logger.error('Erro na inicialização do upload', error);

      addToast({
        message: appError.userMessage,
        type: ToastType.ERROR,
      });

      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
        disabled={isLoading}
      />

      <LoadingIndicator
        isLoading={isLoading}
        variant={LoadingVariant.PROGRESS}
        progress={progress}
        message={`Enviando arquivo... ${progress}%`}
      />
    </div>
  );
}

// ============================================================================
// EXEMPLO 5: Combinar com Google Photos API
// ============================================================================

export function ExampleGooglePhotos() {
  const { data, loading, error, execute } = useAsyncOperation(
    async () => {
      try {
        logger.info('Buscando álbuns do Google Photos', undefined, 'ExampleGooglePhotos');

        // Simular chamada à API Google Photos
        const response = await fetch('https://photoslibrary.googleapis.com/v1/albums');

        if (!response.ok) {
          throw new Error(`Google Photos API error: ${response.status}`);
        }

        const albums = await response.json();

        logger.info('Álbuns carregados', { count: albums.albums?.length || 0 }, 'ExampleGooglePhotos');

        return albums;
      } catch (error) {
        logger.error('Erro ao buscar Google Photos', error, undefined, 'ExampleGooglePhotos');
        throw errorHandler.handle(error, ErrorCategory.GOOGLE_PHOTOS);
      }
    },
    {
      module: 'ExampleGooglePhotos',
      showToast: true,
      successMessage: 'Álbuns carregados com sucesso!',
    }
  );

  return (
    <div className="card">
      <div className="card-header">
        <h5>Álbuns Google Photos</h5>
      </div>

      <LoadingIndicator
        isLoading={loading}
        variant={LoadingVariant.DOTS}
        message="Conectando ao Google Photos..."
      >
        <div className="card-body">
          {error ? (
            <div className="alert alert-danger">
              <h6>{error.category}</h6>
              <p>{error.userMessage}</p>
              {error.suggestedAction && <small>Sugestão: {error.suggestedAction}</small>}
            </div>
          ) : data ? (
            <ul>
              {data.albums?.map((album: any) => (
                <li key={album.id}>{album.title}</li>
              ))}
            </ul>
          ) : null}

          <button className="btn btn-primary mt-3" onClick={execute} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </LoadingIndicator>
    </div>
  );
}

// ============================================================================
// EXEMPLO 6: Logging Estruturado
// ============================================================================

export function ExampleLogging() {
  const handleComplexOperation = async () => {
    const operationId = `OP-${Date.now()}`;

    try {
      logger.info(`[${operationId}] Iniciando operação complexa`, undefined, 'ExampleLogging');

      logger.debug(`[${operationId}] Validando dados`, { step: 1 });

      // Simular trabalho
      await new Promise((resolve) => setTimeout(resolve, 1000));

      logger.debug(`[${operationId}] Enviando para servidor`, { step: 2 });

      const response = await fetch('/api/complex');

      if (!response.ok) {
        throw new Error(`Servidor retornou ${response.status}`);
      }

      logger.info(`[${operationId}] Operação concluída`, { duration: 'X segundos' });
    } catch (error) {
      logger.error(
        `[${operationId}] Erro na operação`,
        error,
        { operationId, step: 'unknown' },
        'ExampleLogging'
      );
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5>Exemplo de Logging</h5>
        <p>Abra o console (F12) para ver os logs estruturados</p>
        <button className="btn btn-primary" onClick={handleComplexOperation}>
          Executar Operação Complexa
        </button>
      </div>
    </div>
  );
}

export default function ExamplesPage() {
  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">Exemplos de Error Handling e Loading</h1>

      <div className="row gap-4">
        <div className="col-lg-6">
          <ExampleManualOperation />
        </div>
        <div className="col-lg-6">
          <ExampleAutomatic />
        </div>
        <div className="col-lg-6">
          <ExampleManualErrorHandling />
        </div>
        <div className="col-lg-6">
          <ExampleUploadWithProgress />
        </div>
        <div className="col-lg-6">
          <ExampleGooglePhotos />
        </div>
        <div className="col-lg-6">
          <ExampleLogging />
        </div>
      </div>
    </div>
  );
}
