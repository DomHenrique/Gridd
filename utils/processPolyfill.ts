/**
 * Polyfill para process global (evita "process is not defined" em produção)
 * Este arquivo deve ser importado ANTES de qualquer outro código
 */

// Verificar se process já existe
if (typeof process === 'undefined') {
  // Criar um objeto process vazio com propriedades de segurança
  (window as any).process = {
    env: {
      NODE_ENV: 'production',
    },
    versions: {
      node: undefined,
    },
    exit: (code?: number) => {
      // Em browser, não podemos fazer exit real
      console.error(`[Process Exit] Código: ${code || 0}`);
      // Redirecionar para página de erro, etc.
    },
  };
}

// Garantir que process.env existe
if (!(window as any).process.env) {
  (window as any).process.env = {};
}

// Garantir que process.versions existe
if (!(window as any).process.versions) {
  (window as any).process.versions = {
    node: undefined,
  };
}

// Função helper para acessar variáveis de ambiente com segurança
export function getProcessEnv(key: string, defaultValue?: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key as keyof typeof process.env] as string || defaultValue || '';
  }
  return defaultValue || '';
}

// Export para verificar se estamos em desenvolvimento
export const isDevelopment = typeof process !== 'undefined' 
  ? (process.env.NODE_ENV === 'development') 
  : false;

export const isProduction = typeof process !== 'undefined' 
  ? (process.env.NODE_ENV === 'production') 
  : true; // Assume produção se não conseguir determinar
