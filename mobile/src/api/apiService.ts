import { api } from './client';
import {
  User,
  Trail,
  PricingCalculation,
  PassDetail,
  UserTripHistory,
  CheckinResult,
} from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const apiService = {
  // Health
  checkHealth: async () => {
    return api.get<{ status: string }>('/health');
  },

  // Auth
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', { email, password });
  },

  register: async (email: string, password: string, full_name: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/register', { email, password, full_name });
  },

  // Trails
  getTrails: async (params?: {
    theme?: string;
    max_duration_min?: number;
    lat?: number;
    lon?: number;
  }): Promise<{ total: number; trails: Trail[] }> => {
    const query = new URLSearchParams();
    if (params?.theme) query.append('theme', params.theme);
    if (params?.max_duration_min) query.append('max_duration_min', params.max_duration_min.toString());
    if (params?.lat !== undefined) query.append('lat', params.lat.toString());
    if (params?.lon !== undefined) query.append('lon', params.lon.toString());

    const qs = query.toString();
    return api.get<{ total: number; trails: Trail[] }>(`/trails${qs ? `?${qs}` : ''}`);
  },

  getTrailDetail: async (trailId: string): Promise<Trail> => {
    return api.get<Trail>(`/trails/${trailId}`);
  },

  getTrailPricing: async (trailId: string, visitTime?: string): Promise<PricingCalculation> => {
    const qs = visitTime ? `?visit_time=${encodeURIComponent(visitTime)}` : '';
    return api.get<PricingCalculation>(`/trails/${trailId}/pricing${qs}`);
  },

  // Passes & Checkins
  purchasePass: async (payload: {
    trail_id: string;
    visit_date?: string;
    visit_time?: string;
  }): Promise<PassDetail> => {
    return api.post<PassDetail>('/passes', payload);
  },

  verifyCheckin: async (
    passId: string,
    payload: {
      waypoint_id: string;
      user_lat: number;
      user_lon: number;
    }
  ): Promise<CheckinResult> => {
    return api.post<CheckinResult>(`/passes/${passId}/checkins`, payload);
  },

  // User Trips & Stats
  getMyTrips: async (): Promise<UserTripHistory> => {
    return api.get<UserTripHistory>('/users/me/trips');
  },
};
