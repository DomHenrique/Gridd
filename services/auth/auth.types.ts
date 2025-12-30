/**
 * Tipos de Autenticação - Gmail + Sistema Local
 * Super User e Usuários Regulares
 */

export enum UserRole {
  SUPERUSER = 'superuser',
  CLIENT = 'client',
  EMPLOYEE = 'employee',
}

export enum AuthProvider {
  GOOGLE = 'google',
  LOCAL = 'local',
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  hd?: string; // Hosted domain (for workspace)
}

export interface LocalUser {
  id: string;
  email: string;
  password?: string; // Hash apenas
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  picture?: string;
  role: UserRole;
  provider: AuthProvider;
  googleId?: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  permissions?: string[];
  settings?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface AuthSession {
  user: User;
  token: AuthToken;
  isAuthenticated: boolean;
  provider: AuthProvider;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: AuthToken;
  message?: string;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface SuperAdminConfig {
  email: string;
  name: string;
  superAdminCode: string; // Código para criar primeiro super admin
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: (code: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SessionData {
  user: User;
  token: AuthToken;
  loginTime: number;
  expiresAt: number;
}
