export type AuthProvider = 'google' | 'github' | 'email';

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: AuthProvider;
}

export interface AuthCallbackResult {
  success: boolean;
  userId?: string;
  error?: string;
  code?: string;
}

export interface DeviceLinkResult {
  deviceId: string;
  userId: string;
  linkedAt: string;
}
