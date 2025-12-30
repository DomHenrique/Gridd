/**
 * Loading Indicator Component
 * Componente versátil para exibir estados de carregamento
 */

import React from 'react';

export enum LoadingVariant {
  SPINNER = 'spinner',
  SKELETON = 'skeleton',
  PROGRESS = 'progress',
  DOTS = 'dots',
  PULSE = 'pulse',
}

export enum LoadingSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

interface LoadingIndicatorProps {
  isLoading: boolean;
  variant?: LoadingVariant;
  size?: LoadingSize;
  message?: string;
  progress?: number; // 0-100 para progress bar
  fullScreen?: boolean;
  centered?: boolean;
  overlay?: boolean;
  children?: React.ReactNode;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  variant = LoadingVariant.SPINNER,
  size = LoadingSize.MEDIUM,
  message,
  progress,
  fullScreen = false,
  centered = true,
  overlay = false,
  children,
}) => {
  if (!isLoading && !overlay) {
    return <>{children}</>;
  }

  const spinnerSize = {
    [LoadingSize.SMALL]: 'spinner-border-sm',
    [LoadingSize.MEDIUM]: '',
    [LoadingSize.LARGE]: '',
  };

  const containerClass = [
    fullScreen && 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center',
    !fullScreen && centered && 'd-flex align-items-center justify-content-center',
    fullScreen && 'bg-dark bg-opacity-75',
  ]
    .filter(Boolean)
    .join(' ');

  const renderSpinner = () => (
    <div className={containerClass} style={{ minHeight: fullScreen ? '100vh' : '200px' }}>
      <div className="text-center">
        <div className={`spinner-border text-primary ${spinnerSize[size]}`} role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        {message && <p className="mt-3 text-muted">{message}</p>}
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={containerClass} style={{ minHeight: fullScreen ? '100vh' : '300px' }}>
      <div className="container">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="placeholder-glow mb-3"
          >
            <span
              className="placeholder col-12"
              style={{ height: '20px' }}
            />
            <span
              className="placeholder col-10 mt-2"
              style={{ height: '15px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className={containerClass} style={{ minHeight: fullScreen ? '100vh' : '200px' }}>
      <div
        style={{
          width: fullScreen ? '50%' : '100%',
          maxWidth: '500px',
        }}
      >
        <div className="progress mb-3" style={{ height: '8px' }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: `${progress || 0}%` }}
            aria-valuenow={progress || 0}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {message && (
          <p className="text-muted text-center">
            {message} {progress && `(${progress}%)`}
          </p>
        )}
      </div>
    </div>
  );

  const renderDots = () => (
    <div className={containerClass} style={{ minHeight: fullScreen ? '100vh' : '200px' }}>
      <div className="text-center">
        <style>{`
          @keyframes dot-bounce {
            0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
            40% { opacity: 1; transform: scale(1.2); }
          }
          .dot {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #0d6efd;
            margin: 0 4px;
            animation: dot-bounce 1.4s infinite ease-in-out both;
          }
          .dot:nth-child(1) { animation-delay: -0.32s; }
          .dot:nth-child(2) { animation-delay: -0.16s; }
        `}</style>
        <div className="mb-3">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {message && <p className="text-muted mt-3">{message}</p>}
      </div>
    </div>
  );

  const renderPulse = () => (
    <div className={containerClass} style={{ minHeight: fullScreen ? '100vh' : '200px' }}>
      <style>{`
        @keyframes pulse-opacity {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-element {
          display: inline-block;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: pulse-opacity 2s ease-in-out infinite;
        }
      `}</style>
      <div className="text-center">
        <div className="pulse-element mb-3"></div>
        {message && <p className="text-muted mt-3">{message}</p>}
      </div>
    </div>
  );

  const renderLoading = () => {
    switch (variant) {
      case LoadingVariant.SKELETON:
        return renderSkeleton();
      case LoadingVariant.PROGRESS:
        return renderProgress();
      case LoadingVariant.DOTS:
        return renderDots();
      case LoadingVariant.PULSE:
        return renderPulse();
      case LoadingVariant.SPINNER:
      default:
        return renderSpinner();
    }
  };

  if (overlay && !isLoading && children) {
    return <>{children}</>;
  }

  if (overlay && isLoading) {
    return (
      <div className="position-relative">
        <div
          className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-25 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1000, borderRadius: 'inherit' }}
        >
          {renderLoading()}
        </div>
        {children}
      </div>
    );
  }

  return isLoading ? renderLoading() : <>{children}</>;
};

export default LoadingIndicator;
