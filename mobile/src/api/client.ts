import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_API_URL = 'https://dem-worth-thinks-rain.trycloudflare.com/api/v1';
export const LOCAL_API_URL = 'http://172.22.33.148:8000/api/v1';
export const OFFICIAL_PROD_URL = 'https://matchabaobei.stei.fun/api/v1';

const TOKEN_KEY = '@nusajalur_jwt_token';
const API_URL_KEY = '@nusajalur_api_url';

export async function getActiveApiUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(API_URL_KEY);
    // If the saved URL is an expired temporary trycloudflare URL, automatically update to active one
    if (saved && saved.includes('trycloudflare.com') && saved !== DEFAULT_API_URL) {
      await AsyncStorage.setItem(API_URL_KEY, DEFAULT_API_URL);
      return DEFAULT_API_URL;
    }
    return saved || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setActiveApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_URL_KEY, url.trim().replace(/\/+$/, ''));
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = await getActiveApiUrl();
  const token = await getAuthToken();

  const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errCode = data?.error?.code || `HTTP_${response.status}`;
      const errMsg = data?.error?.message || response.statusText || 'Terjadi kesalahan pada server';
      throw new ApiError(errCode, errMsg, response.status);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('NETWORK_ERROR', err?.message || 'Tidak dapat terhubung ke server backend NusaJalur.', 0);
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),
  post: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
};
