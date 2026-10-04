const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('auraos_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.code ?? 'UNKNOWN_ERROR',
      errorBody.message ?? response.statusText
    );
  }

  return response.json();
}

// ─── Auth ──────────────────────────────────────────────────
export const authApi = {
  getSession: () => request<{ user: unknown; token: string }>('/auth/me'),
  refresh: () => request<{ token: string }>('/auth/refresh'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  signIn: (email: string, password: string) =>
    request<{ user: unknown; token: string }>('/auth/sign-in/email', {
      method: 'POST',
      body: { email, password },
    }),
  signUp: (email: string, password: string, name?: string) =>
    request<{ user: unknown; token: string }>('/auth/sign-up/email', {
      method: 'POST',
      body: { email, password, name },
    }),
};

// ─── Users ─────────────────────────────────────────────────
export const usersApi = {
  getMe: () => request<{ id: string; email: string; name?: string }>('/users/me'),
  updateMe: (data: { name?: string; email?: string }) =>
    request<{ id: string; email: string; name?: string }>('/users/me', {
      method: 'PATCH',
      body: data,
    }),
};

// ─── Devices ───────────────────────────────────────────────
export const devicesApi = {
  list: () => request<Array<{ id: string; deviceName: string; platform: string; lastSeenAt: string }>>('/devices'),
  register: (data: { deviceName: string; platform: string; architecture: string; osVersion: string; appVersion: string }) =>
    request<{ id: string; userId: string }>('/devices', { method: 'POST', body: data }),
  update: (id: string, data: { deviceName?: string }) =>
    request<{ id: string }>(`/devices/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => request<void>(`/devices/${id}`, { method: 'DELETE' }),
};

// ─── Scenes ────────────────────────────────────────────────
export const scenesApi = {
  list: () => request<Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    visual?: Record<string, unknown>;
    audio?: Record<string, unknown>;
    widgets?: Array<Record<string, unknown>>;
    behavior?: Record<string, unknown>;
    isBuiltIn: boolean;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
  }>>('/scenes'),
  get: (id: string) => request<{ id: string; name: string }>(`/scenes/${id}`),
  create: (data: Record<string, unknown>) =>
    request<{ id: string }>('/scenes', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, unknown>) =>
    request<{ id: string }>(`/scenes/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => request<void>(`/scenes/${id}`, { method: 'DELETE' }),
  setFavorite: (id: string, favorite: boolean) =>
    request<{ id: string; isFavorite: boolean }>(`/scenes/${id}/favorite`, {
      method: 'PATCH',
      body: { isFavorite: favorite },
    }),
};

// ─── Rules ─────────────────────────────────────────────────
export const rulesApi = {
  list: () => request<Array<{
    id: string;
    name: string;
    description?: string;
    conditions: Array<Record<string, unknown>>;
    conditionOperator: string;
    action: Record<string, unknown>;
    priority: number;
    cooldownMs?: number;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
  }>>('/rules'),
  get: (id: string) => request<{ id: string; name: string }>(`/rules/${id}`),
  create: (data: Record<string, unknown>) =>
    request<{ id: string }>('/rules', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, unknown>) =>
    request<{ id: string }>(`/rules/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => request<void>(`/rules/${id}`, { method: 'DELETE' }),
};

// ─── Presets ───────────────────────────────────────────────
export const presetsApi = {
  list: (visibility?: 'BUILTIN' | 'PUBLIC' | 'UNLISTED') =>
    request<Array<{ id: string; name: string; authorId: string; thumbnailUrl?: string; downloads: number; likes: number }>>(
      `/presets${visibility ? `?visibility=${visibility}` : ''}`
    ),
  get: (id: string) => request<{ id: string; name: string; sceneConfig: Record<string, unknown> }>(`/presets/${id}`),
  download: (id: string) =>
    request<{ downloaded: boolean }>(`/presets/${id}/download`, { method: 'POST' }),
};

// ─── Sync ──────────────────────────────────────────────────
export const syncApi = {
  status: () => request<{ online: boolean; lastSyncAt: string | null; pendingChanges: number }>('/sync'),
  push: (changes: Array<{ id: string; type: string; version: number; updatedAt: string; deviceId: string; data: Record<string, unknown> }>) =>
    request<{ synced: number; conflicts: Array<Record<string, unknown>> }>('/sync/push', {
      method: 'POST',
      body: { changes, timestamp: Date.now() },
    }),
  pull: () => request<{ entities: Array<Record<string, unknown>>; serverTimestamp: string; conflicts: Array<Record<string, unknown>> }>('/sync/pull'),
};

// ─── Health ────────────────────────────────────────────────
export const healthApi = {
  check: () => request<{ status: string; version: string; uptime: number }>('/health'),
};

export { API_BASE };
