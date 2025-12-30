/**
 * Toast Notification System
 * Sistema de notificações flutuantes para erros, sucesso, info e avisos
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remover após duração
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const bgClass = {
    [ToastType.SUCCESS]: 'bg-success',
    [ToastType.ERROR]: 'bg-danger',
    [ToastType.INFO]: 'bg-info',
    [ToastType.WARNING]: 'bg-warning',
  }[toast.type];

  const icons = {
    [ToastType.SUCCESS]: '✓',
    [ToastType.ERROR]: '✕',
    [ToastType.INFO]: 'ℹ',
    [ToastType.WARNING]: '⚠',
  };

  return (
    <div
      className={`toast align-items-center text-white ${bgClass} border-0 mb-2`}
      role="alert"
      style={{
        minWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div className="d-flex">
        <div className="toast-body d-flex align-items-center">
          <span style={{ fontSize: '1.2em', marginRight: '12px' }}>
            {icons[toast.type]}
          </span>
          <div className="flex-grow-1">
            {toast.title && <div className="fw-bold">{toast.title}</div>}
            <div>{toast.message}</div>
          </div>
          {toast.action && (
            <button
              type="button"
              className="btn btn-sm btn-light ms-2"
              onClick={() => {
                toast.action!.onClick();
                onClose();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          onClick={onClose}
          aria-label="Fechar"
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '500px',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Hook auxiliar para integração com ErrorHandler
export const useErrorToast = () => {
  const { addToast } = useToast();

  return useCallback(
    (message: string, type: ToastType = ToastType.ERROR, duration?: number) => {
      addToast({
        message,
        type,
        duration,
      });
    },
    [addToast]
  );
};

// Hook para sucesso
export const useSuccessToast = () => {
  const { addToast } = useToast();

  return useCallback(
    (message: string, duration?: number) => {
      addToast({
        message,
        type: ToastType.SUCCESS,
        duration,
      });
    },
    [addToast]
  );
};
