/**
 * useAsyncOperation Hook
 * Gerencia estado de operação assíncrona com loading, erro e sucesso
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import logger from '../utils/logger';
import errorHandler from '../utils/errorHandler';
import { useToast, ToastType } from '../components/ToastNotification';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
  success: boolean;
  errorMessage?: string;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showToast?: boolean;
  successMessage?: string;
  module?: string;
}

/**
 * Hook para gerenciar operações assíncronas
 */
export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options?: UseAsyncOperationOptions
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const isMountedRef = useRef(true);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      logger.debug(
        'Iniciando operação assíncrona',
        undefined,
        options?.module || 'useAsyncOperation'
      );

      const result = await operation();

      if (isMountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
          success: true,
        });

        logger.info(
          'Operação assíncrona concluída com sucesso',
          undefined,
          options?.module || 'useAsyncOperation'
        );

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        if (options?.showToast && options?.successMessage) {
          addToast({
            message: options.successMessage,
            type: ToastType.SUCCESS,
            duration: 3000,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error(
        'Erro na operação assíncrona',
        error,
        undefined,
        options?.module || 'useAsyncOperation'
      );

      const appError = errorHandler.handle(error, undefined, {
        operation: operation.name || 'unknown',
      });

      if (isMountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: appError,
          success: false,
          errorMessage: appError.userMessage,
        });

        if (options?.onError) {
          options.onError(appError);
        }

        if (options?.showToast) {
          addToast({
            message: appError.userMessage,
            type: ToastType.ERROR,
            duration: 5000,
          });
        }
      }

      throw appError;
    }
  }, [operation, options, addToast]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook para operações assíncronas que executam automaticamente
 */
export function useAsync<T = any>(
  operation: () => Promise<T>,
  dependencies?: React.DependencyList,
  options?: UseAsyncOperationOptions
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: true,
    error: null,
    success: false,
  });

  const isMountedRef = useRef(true);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const execute = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        logger.debug(
          'Iniciando operação assíncrona automática',
          undefined,
          options?.module || 'useAsync'
        );

        const result = await operation();

        if (!cancelled && isMountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            success: true,
          });

          logger.info(
            'Operação assíncrona automática concluída',
            undefined,
            options?.module || 'useAsync'
          );

          if (options?.onSuccess) {
            options.onSuccess(result);
          }
        }
      } catch (error) {
        logger.error(
          'Erro na operação assíncrona automática',
          error,
          undefined,
          options?.module || 'useAsync'
        );

        const appError = errorHandler.handle(error, undefined, {
          operation: operation.name || 'unknown',
        });

        if (!cancelled && isMountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: appError,
            success: false,
            errorMessage: appError.userMessage,
          });

          if (options?.onError) {
            options.onError(appError);
          }

          if (options?.showToast) {
            addToast({
              message: appError.userMessage,
              type: ToastType.ERROR,
              duration: 5000,
            });
          }
        }
      }
    };

    execute();

    return () => {
      cancelled = true;
    };
  }, dependencies || [operation, addToast, options]);

  return state;
}

/**
 * Hook para múltiplas operações paralelas
 */
export function useMultipleAsync<T extends Record<string, () => Promise<any>>>(
  operations: T,
  options?: UseAsyncOperationOptions
) {
  const [states, setStates] = useState<
    Record<keyof T, AsyncOperationState<any>>
  >(() => {
    const initialState: any = {};
    Object.keys(operations).forEach((key) => {
      initialState[key] = {
        data: null,
        loading: true,
        error: null,
        success: false,
      };
    });
    return initialState;
  });

  const isMountedRef = useRef(true);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const executeAll = async () => {
      const promises = Object.entries(operations).map(([key, fn]) =>
        (fn() as Promise<any>)
          .then((data) => ({ key, data, error: null }))
          .catch((error) => ({ key, data: null, error }))
      );

      try {
        const results = await Promise.all(promises);

        if (isMountedRef.current) {
          const newStates: any = { ...states };

          results.forEach(({ key, data, error }) => {
            if (error) {
              logger.error(
                `Erro na operação paralela: ${key}`,
                error,
                undefined,
                options?.module || 'useMultipleAsync'
              );

              const appError = errorHandler.handle(error);
              newStates[key] = {
                data: null,
                loading: false,
                error: appError,
                success: false,
                errorMessage: appError.userMessage,
              };

              if (options?.showToast) {
                addToast({
                  message: `Erro em ${key}: ${appError.userMessage}`,
                  type: ToastType.ERROR,
                });
              }
            } else {
              logger.info(`Operação paralela concluída: ${key}`, undefined, options?.module);

              newStates[key] = {
                data,
                loading: false,
                error: null,
                success: true,
              };
            }
          });

          setStates(newStates);
        }
      } catch (error) {
        logger.critical('Erro crítico em operações paralelas', error, undefined, options?.module);
      }
    };

    executeAll();
  }, [operations, options, addToast]);

  return states;
}
